import { dispatch } from "d3-dispatch";
import { Promise } from "es6-promise";
import { ESPExceptions, exists, mixin } from "../connections/ESPConnection";
import { WsTopology } from "../connections/WsTopology";
import { ECLWorkunit, isECLWorkunit, Workunit as WsWorkunit, WorkunitBase, WsWorkunits, WUAction, WUActionRequest, WUActionResponse, WUActionType, WUInfoRequest, WUInfoResponse, WUQueryRequest, WUQueryResponse, WUResubmitResponse, WUStateID, WUUpdateRequest } from "../connections/WsWorkunits";
import { logger } from "../Util/Logging";
export { WUStateID }

let _workunits: { [key: string]: Workunit } = {};

export type Partial<T> = {
    [P in keyof T]?: T[P];
};

export class Workunit {
    connection: WsWorkunits;
    topologyConnection: WsTopology;
    private _espWorkunit: ECLWorkunit & WsWorkunit;
    private _espWorkunitCache: string[] = [];
    private _espWorkunitCacheID: number = 0;
    private _submitAction: WUAction;
    private _events = dispatch<Workunit>("StateIDChanged", "changed", "completed");
    private _monitorHandle: any;
    private _hasListener: boolean;
    private _monitorTickCount: number = 0;

    //  Accessors  ---
    get Wuid(): string { return this._espWorkunit.Wuid; }
    get Owner(): string { return this._espWorkunit.Owner; }
    get Cluster(): string { return this._espWorkunit.Cluster; }
    get Jobname(): string { return this._espWorkunit.Jobname; }
    get StateID(): WUStateID { return this._espWorkunit.StateID; }
    get State(): string { return WUStateID[this._espWorkunit.StateID ? this._espWorkunit.StateID : WUStateID.Unknown]; }
    get Protected(): boolean { return this._espWorkunit.Protected; }

    //  Factories  ---
    static exists(wuid: string): boolean {
        return !!_workunits[wuid];
    }

    static attach(href: string, wuid: string, state?: ECLWorkunit | WsWorkunit): Workunit {
        if (!_workunits[wuid]) {
            _workunits[wuid] = new Workunit(href, wuid);
        }
        let retVal = _workunits[wuid];
        if (state) {
            retVal._updateState(state);
        }
        return retVal;
    }

    //  ---  ---  ---
    protected constructor(href?: string, wuid?: string) {
        this.connection = new WsWorkunits(href);
        this.topologyConnection = new WsTopology(href);
        this.clearState(wuid);
    }

    clearState(wuid) {
        this._espWorkunit = <ECLWorkunit & WsWorkunit>{
            Wuid: wuid,
            StateID: WUStateID.Unknown
        };
        this._monitorTickCount = 0;
    }

    create() {
        return this.connection.WUCreate().then((response) => {
            _workunits[response.Workunit.Wuid] = this;
            this._espWorkunit.Wuid = response.Workunit.Wuid;
            this._updateState(response.Workunit);
            return this;
        });
    }

    update(request: Partial<WUUpdateRequest>, appData?, debugData?) {
        return this.connection.WUUpdate(mixin({}, request, {
            Wuid: this.Wuid,
            StateOrig: this._espWorkunit.State,
            JobnameOrig: this._espWorkunit.Jobname,
            DescriptionOrig: this._espWorkunit.Description,
            ProtectedOrig: this._espWorkunit.Protected,
            ClusterOrig: this._espWorkunit.Cluster,
            ApplicationValues: appData,
            DebugValues: debugData
        })).then((response) => {
            this._updateState(response.Workunit);
            return this;
        });
    }

    submit(_cluster?: string, action: WUAction = WUAction.Run, resultLimit?: number): Promise<Workunit> {
        let clusterPromise;
        if (_cluster !== void 0) {
            clusterPromise = Promise.resolve(_cluster);
        } else {
            clusterPromise = this.topologyConnection.DefaultTpLogicalClusterQuery().then((response) => {
                return response.Name;
            });
        }

        return clusterPromise.then((cluster) => {
            return this.connection.WUUpdate({
                Wuid: this.Wuid,
                Action: action,
                ResultLimit: resultLimit
            }).then((response) => {
                this._updateState(response.Workunit);
                this._submitAction = action;
                return this.connection.WUSubmit({ Wuid: this.Wuid, Cluster: cluster }).then(() => {
                    return this;
                });
            });
        });
    }

    isComplete(): boolean {
        switch (this._espWorkunit.StateID) {
            case WUStateID.Compiled:
                return this._espWorkunit.ActionEx === "compile" || this._submitAction === WUAction.Compile;
            case WUStateID.Completed:
            case WUStateID.Failed:
            case WUStateID.Aborted:
                return true;
            default:
        }
        return false;
    }

    isFailed() {
        switch (this._espWorkunit.StateID) {
            case WUStateID.Failed:
                return true;
            default:
        }
        return false;
    }

    isDeleted() {
        switch (this._espWorkunit.StateID) {
            case WUStateID.NotFound:
                return true;
            default:
        }
        return false;
    }

    setToFailed() {
        return this.WUAction("SetToFailed");
    }

    pause() {
        return this.WUAction("Pause");
    }

    pauseNow() {
        return this.WUAction("PauseNow");
    }

    resume() {
        return this.WUAction("Resume");
    }

    abort() {
        return this.WUAction("Abort");
    }

    delete() {
        return this.WUAction("Delete");
    }

    restore() {
        return this.WUAction("Restore");
    }

    deschedule() {
        return this.WUAction("Deschedule");
    }

    reschedule() {
        return this.WUAction("Reschedule");
    }

    refresh(full: boolean = false): Promise<Workunit> {
        let retVal: Promise<WUInfoResponse | WUQueryResponse> = full ? this.WUInfo() : this.WUQuery();
        return retVal.then((response) => {
            return this;
        });
    }

    protected WUQuery(_request?: Partial<WUQueryRequest>): Promise<WUQueryResponse> {
        return this.connection.WUQuery(mixin({}, _request, { Wuid: this.Wuid })).then((response) => {
            this._updateState(response.Workunits.ECLWorkunit[0]);
            return response;
        }).catch((e: ESPExceptions) => {
            //  deleted  ---
            let wuMissing = e.Exception.some((exception) => {
                if (exception.Code === 20081) {
                    this.clearState(this.Wuid);
                    this._espWorkunit.StateID = WUStateID.NotFound;
                    return true;
                }
                return false;
            });
            if (!wuMissing) {
                logger.warning("Unexpected exception:  ");
            }
            throw e;
        });
    }

    protected WUInfo(_request?: Partial<WUInfoRequest>): Promise<WUInfoResponse> {
        return this.connection.WUInfo(mixin({}, _request, { Wuid: this.Wuid })).then((response) => {
            this._updateState(response.Workunit);
            return response;
        }).catch((e: ESPExceptions) => {
            //  deleted  ---
            let wuMissing = e.Exception.some((exception) => {
                if (exception.Code === 20080) {
                    this.clearState(this.Wuid);
                    this._espWorkunit.StateID = WUStateID.NotFound;
                    return true;
                }
                return false;
            });
            if (!wuMissing) {
                logger.warning("Unexpected exception:  ");
            }
            throw e;
        });
    }

    protected WUAction(actionType: WUActionType): Promise<WUActionResponse> {
        return this.connection.WUAction({
            Wuids: [this.Wuid],
            WUActionType: actionType
        }).then((response) => {
            return this.refresh().then(() => {
                this._monitor();
                return response;
            });
        });
    }

    protected WUResubmit(clone: boolean, resetWorkflow: boolean): Promise<WUResubmitResponse> {
        return this.connection.WUResubmit({
            Wuids: [this.Wuid],
            CloneWorkunit: clone,
            ResetWorkflow: resetWorkflow
        }).then((response) => {
            this.clearState(this.Wuid);
            return this.refresh().then(() => {
                this._monitor();
                return response;
            });
        });
    }

    protected _updateState(_: WsWorkunit | ECLWorkunit): Workunit {
        let changed: any[] = [];
        let prevIsComplete = this.isComplete();
        for (let key in _) {
            if (_[key] !== undefined || _[key] !== null) {
                let jsonStr = JSON.stringify(_[key]);
                if (this._espWorkunitCache[key] !== jsonStr) {
                    this._espWorkunitCache[key] = jsonStr;
                    let changedInfo = {
                        key,
                        oldVal: this._espWorkunit[key],
                        newVal: _[key]
                    };
                    changed.push(changedInfo);
                    this._espWorkunit[key] = changedInfo.newVal;
                }
            }
        }
        changed.forEach((changedInfo, idx) => {
            if (idx === 0) {
                ++this._espWorkunitCacheID;
            }
            if (changedInfo.key === "StateID") {
                this._events.call(changedInfo.key + "Changed", this, changedInfo.newVal, changedInfo.oldVal);
            }
            if (changed.length === idx + 1) {
                this._events.call("changed", this, changed);
            }
        });
        if (this.isComplete() && !prevIsComplete) {
            this._events.call("completed", this);
        }
        return this;
    }

    protected _monitor(): void {
        if (this._monitorHandle || this.isComplete()) {
            this._monitorTickCount = 0;
            return;
        }

        this._monitorHandle = setTimeout(() => {
            let refreshPromise: Promise<any> = this._hasListener ? this.WUQuery() : Promise.resolve(null);
            refreshPromise.then(() => {
                this._monitor();
            });
            delete this._monitorHandle;
        }, this._monitorTimeoutDuraction());
    }

    private _monitorTimeoutDuraction(): number {
        ++this._monitorTickCount;
        if (this._monitorTickCount <= 1) {
            return 0;
        } else if (this._monitorTickCount <= 3) {
            return 500;
        } else if (this._monitorTickCount <= 10) {
            return 1000;
        } else if (this._monitorTickCount <= 20) {
            return 3000;
        } else if (this._monitorTickCount <= 30) {
            return 5000;
        }
        return 10000;
    }

    //  Events  ---
    on(id: string, callback): Workunit {
        this._events.on(id, callback);
        this._hasListener = false;
        for (let key in this._events) {
            if (this._events[key].length) {
                this._hasListener = true;
            }
        }
        this._monitor();
        return this;
    }
}

/*
let gID: number = 0;
export class WorkunitMonitor {
    private wu: Workunit;
    private id: string;
    private monitorID: string;

    constructor(wu: Workunit, monitorID: string, callback: Function) {
        this.id = "WorkunitMonitor_" + ++gID;
        this.monitorID = monitorID;
        this.wu = wu;
        this.wu.on(`${monitorID}.${this.id}`, callback);
    }

    dispose() {
        this.wu.on(`${this.monitorID}.${this.id}`, null);
    }
}
*/