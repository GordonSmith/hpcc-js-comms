import { Promise } from "es6-promise";
import { ESPExceptions } from "../connections/ESPConnection";
import { WsTopology } from "../connections/WsTopology";
import * as WsWorkunits from "../connections/WsWorkunits";
import { IChangedProperty } from "../util/EventTarget";
import { logger } from "../util/Logging";
import { Cache, ESPStateEvents, ESPStateObject } from "./ESPStateObject";
import { Graph, GraphCache } from "./Graph";
import { Resource } from "./Resource";
import { Result, ResultCache } from "./Result";
import { SourceFile } from "./SourceFile";
import { Timer } from "./Timer";

export const WUStateID = WsWorkunits.WUStateID;

export class WorkunitCache extends Cache<{ Wuid: string }, Workunit>{
    constructor() {
        super((obj) => {
            return obj.Wuid;
        });
    }
}
const _workunits = new WorkunitCache();

interface XXX {
    ResultViews: any[];
    HelpersCount: number;
}

type WorkunitEvents = "completed" | ESPStateEvents;
type UWorkunitState = WsWorkunits.ECLWorkunit & WsWorkunits.Workunit & XXX;
type IWorkunitState = WsWorkunits.ECLWorkunit | WsWorkunits.Workunit | XXX;
export class Workunit extends ESPStateObject<UWorkunitState, IWorkunitState> implements WsWorkunits.Workunit {
    href: string;
    connection: WsWorkunits.Connection;
    topologyConnection: WsTopology;

    private _submitAction: WsWorkunits.WUAction;
    private _monitorHandle: any;
    private _monitorTickCount: number = 0;

    //  Accessors  ---
    get properties(): WsWorkunits.ECLWorkunit & WsWorkunits.Workunit { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get Owner(): string { return this.get("Owner", ""); }
    get Cluster(): string { return this.get("Cluster", ""); }
    get Jobname(): string { return this.get("Jobname", ""); }
    get Description(): string { return this.get("Description", ""); }
    get ActionEx(): string { return this.get("ActionEx", ""); }
    get StateID(): WsWorkunits.WUStateID { return this.get("StateID", WsWorkunits.WUStateID.Unknown); }
    get State(): string { return WsWorkunits.WUStateID[this.StateID]; }
    get Protected(): boolean { return this.get("Protected", false); }
    get Exceptions(): WsWorkunits.Exceptions { return this.get("Exceptions", { ECLException: [] }); }
    get ResultViews(): any[] { return this.get("ResultViews", []); }

    private _resultCache = new ResultCache();
    get ResultCount(): number { return this.get("ResultCount", 0); }
    get Results(): WsWorkunits.Results { return this.get("Results", { ECLResult: [] }); }
    get CResults(): Result[] {
        return this.Results.ECLResult.map((eclResult) => {
            return this._resultCache.get(eclResult, () => {
                return new Result(this.href, this.Wuid, eclResult, this.ResultViews);
            });
        });
    }
    get SequenceResults(): { [key: number]: Result } {
        const retVal = {};
        this.CResults.forEach((result) => {
            retVal[result.Sequence] = result;
        });
        return retVal;
    };
    get Timers(): WsWorkunits.Timers { return this.get("Timers", { ECLTimer: [] }); }
    get CTimers(): Timer[] {
        return this.Timers.ECLTimer.map((eclTimer) => {
            return new Timer(this.href, this.Wuid, eclTimer);
        });
    }

    private _graphCache = new GraphCache();
    get GraphCount(): number { return this.get("GraphCount", 0); }
    get Graphs(): WsWorkunits.Graphs { return this.get("Graphs", { ECLGraph: [] }); }
    get CGraphs(): Graph[] {
        return this.Graphs.ECLGraph.map((eclGraph) => {
            return this._graphCache.get(eclGraph, () => {
                return new Graph(this.href, this.Wuid, eclGraph, this.CTimers);
            });
        });
    }
    get ThorLogList(): WsWorkunits.ThorLogList { return this.get("ThorLogList"); }
    get ResourceURLCount(): number { return this.get("ResourceURLCount", 0); }
    get ResourceURLs(): WsWorkunits.ResourceURLs { return this.get("ResourceURLs", { URL: [] }); }
    get CResourceURLs(): Resource[] {
        return this.ResourceURLs.URL.map((url) => {
            return new Resource(this.href, this.Wuid, url);
        });
    }
    get TotalClusterTime(): string { return this.get("TotalClusterTime", ""); }
    get DateTimeScheduled(): Date { return this.get("DateTimeScheduled"); }
    get IsPausing(): boolean { return this.get("IsPausing"); }
    get ThorLCR(): boolean { return this.get("ThorLCR"); }
    get ApplicationValues(): WsWorkunits.ApplicationValues { return this.get("ApplicationValues", { ApplicationValue: [] }); }
    get HasArchiveQuery(): boolean { return this.get("HasArchiveQuery"); }
    get StateEx(): string { return this.get("StateEx"); }
    get PriorityClass(): number { return this.get("PriorityClass"); }
    get PriorityLevel(): number { return this.get("PriorityLevel"); }
    get Snapshot(): string { return this.get("Snapshot"); }
    get ResultLimit(): number { return this.get("ResultLimit"); }
    get EventSchedule(): number { return this.get("EventSchedule"); }
    get HaveSubGraphTimings(): boolean { return this.get("HaveSubGraphTimings"); }
    get Query(): WsWorkunits.Query { return this.get("Query"); }
    get HelpersCount(): number { return this.get("HelpersCount", 0); }
    get Helpers(): WsWorkunits.Helpers { return this.get("Helpers", { ECLHelpFile: [] }); }
    get DebugValues(): WsWorkunits.DebugValues { return this.get("DebugValues"); }
    get AllowedClusters(): WsWorkunits.AllowedClusters { return this.get("AllowedClusters"); }
    get ErrorCount(): number { return this.get("ErrorCount", 0); }
    get WarningCount(): number { return this.get("WarningCount", 0); }
    get InfoCount(): number { return this.get("InfoCount", 0); }
    get AlertCount(): number { return this.get("AlertCount", 0); }
    get SourceFileCount(): number { return this.get("SourceFileCount", 0); }
    get SourceFiles(): WsWorkunits.SourceFiles { return this.get("SourceFiles", { ECLSourceFile: [] }); }
    get CSourceFiles(): SourceFile[] {
        return this.SourceFiles.ECLSourceFile.map((eclSourceFile) => {
            return new SourceFile(this.href, this.Wuid, eclSourceFile);
        });
    }
    get VariableCount(): number { return this.get("VariableCount", 0); }
    get Variables(): any { return this.get("Variables", { ECLVariable: [] }); }
    get TimerCount(): number { return this.get("TimerCount", 0); }
    get HasDebugValue(): boolean { return this.get("HasDebugValue"); }
    get ApplicationValueCount(): number { return this.get("ApplicationValueCount", 0); }
    get XmlParams(): string { return this.get("XmlParams"); }
    get AccessFlag(): number { return this.get("AccessFlag"); }
    get ClusterFlag(): number { return this.get("ClusterFlag"); }
    get ResultViewCount(): number { return this.get("ResultViewCount", 0); }
    get DebugValueCount(): number { return this.get("DebugValueCount", 0); }
    get WorkflowCount(): number { return this.get("WorkflowCount", 0); }
    get Archived(): boolean { return this.get("Archived"); }

    //  Factories  ---
    static create(href: string): Promise<Workunit> {
        const retVal = new Workunit(href);
        return retVal.connection.WUCreate().then((response) => {
            _workunits.set(retVal);
            retVal.set(response.Workunit);
            return retVal;
        });
    }

    static attach(href: string, wuid: string, state?: WsWorkunits.ECLWorkunit | WsWorkunits.Workunit): Workunit {
        const retVal = _workunits.get({ Wuid: wuid }, () => {
            return new Workunit(href, wuid);
        });
        if (state) {
            retVal.set(state);
        }
        return retVal;
    }

    static exists(wuid: string): boolean {
        return _workunits.has({ Wuid: wuid });
    }

    //  ---  ---  ---
    protected constructor(href: string = "", wuid?: string) {
        super();
        this.href = href;
        this.connection = new WsWorkunits.Connection(href);
        this.topologyConnection = new WsTopology(href);
        this.clearState(wuid);
    }

    clearState(wuid: string) {
        this.clear({
            Wuid: wuid,
            StateID: WUStateID.Unknown
        });
        this._monitorTickCount = 0;
    }

    update(request: Partial<WsWorkunits.WUUpdateRequest>, appData?: any, debugData?: any) {
        return this.connection.WUUpdate({
            ...request, ...{
                Wuid: this.Wuid,
                StateOrig: this.State,
                JobnameOrig: this.Jobname,
                DescriptionOrig: this.Description,
                ProtectedOrig: this.Protected,
                ClusterOrig: this.Cluster,
                ApplicationValues: appData,
                DebugValues: debugData
            }
        }).then((response) => {
            this.set(response.Workunit);
            return this;
        });
    }

    submit(_cluster?: string, action: WsWorkunits.WUAction = WsWorkunits.WUAction.Run, resultLimit?: number): Promise<Workunit> {
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
                this.set(response.Workunit);
                this._submitAction = action;
                return this.connection.WUSubmit({ Wuid: this.Wuid, Cluster: cluster }).then(() => {
                    return this;
                });
            });
        });
    }

    isComplete(): boolean {
        switch (this.StateID) {
            case WUStateID.Compiled:
                return this.ActionEx === "compile" || this._submitAction === WsWorkunits.WUAction.Compile;
            case WUStateID.Completed:
            case WUStateID.Failed:
            case WUStateID.Aborted:
                return true;
            default:
        }
        return false;
    }

    isFailed() {
        switch (this.StateID) {
            case WUStateID.Failed:
                return true;
            default:
        }
        return false;
    }

    isDeleted() {
        switch (this.StateID) {
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
        const retVal: Promise<WsWorkunits.WUInfoResponse | WsWorkunits.WUQueryResponse> = full ? this.WUInfo() : this.WUQuery();
        return retVal.then((response) => {
            return this;
        });
    }

    fetchResults(): Promise<Result[]> {
        return this.WUInfo({ IncludeResults: true }).then((response) => {
            return this.CResults;
        });
    };

    //  Monitoring  ---
    protected _monitor(): void {
        if (this._monitorHandle || this.isComplete()) {
            this._monitorTickCount = 0;
            return;
        }

        this._monitorHandle = setTimeout(() => {
            const refreshPromise: Promise<any> = this.hasEventListener() ? this.WUInfo() : Promise.resolve(null);
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
    on(eventID: WorkunitEvents, propID: Function | keyof UWorkunitState, callback?: Function) {
        if (this.isCallback(propID)) {
            callback = propID;
            switch (eventID) {
                case "completed":
                    super.on("propChanged", "StateID", (changeInfo: IChangedProperty) => {
                        if (this.isComplete()) {
                            callback(changeInfo);
                        }
                    });
                    break;
                case "changed":
                    super.on(eventID, callback);
                    break;
                default:
            }
        } else {
            switch (eventID) {
                case "changed":
                    super.on(eventID, propID, callback);
                    break;
                default:
            }
        }
        this._monitor();
        return this;
    }

    watch(callback: Function) {
        return super.on("changed", (changes: IChangedProperty[]) => {
            changes.forEach((changeInfo) => {
                callback(changeInfo.id, changeInfo.oldValue, changeInfo.newValue);
            });
        });
    }

    //  WsWorkunits passthroughs  ---
    protected WUQuery(_request: Partial<WsWorkunits.WUQueryRequest> = {}): Promise<WsWorkunits.WUQueryResponse> {
        return this.connection.WUQuery({ ..._request, Wuid: this.Wuid }).then((response) => {
            this.set(response.Workunits.ECLWorkunit[0]);
            return response;
        }).catch((e: ESPExceptions) => {
            //  deleted  ---
            const wuMissing = e.Exception.some((exception) => {
                if (exception.Code === 20081) {
                    this.clearState(this.Wuid);
                    this.set("StateID", WUStateID.NotFound);
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

    protected WUCreate() {
        return this.connection.WUCreate().then((response) => {
            this.set(response.Workunit);
            _workunits.set(this);
            return response;
        });
    }

    protected WUInfo(_request: Partial<WsWorkunits.WUInfoRequest> = {}): Promise<WsWorkunits.WUInfoResponse> {
        const includeResults = _request.IncludeResults || _request.IncludeResultsViewNames;
        return this.connection.WUInfo({
            ..._request, Wuid: this.Wuid,
            IncludeResults: includeResults,
            IncludeResultsViewNames: includeResults
        }).then((response) => {
            if (response.Workunit.ResourceURLCount) {
                response.Workunit.ResourceURLCount = response.Workunit.ResourceURLCount - 1;
            }
            if (response.Workunit.ResourceURLs && response.Workunit.ResourceURLs.URL) {
                response.Workunit.ResourceURLs.URL = response.Workunit.ResourceURLs.URL.filter((row, idx) => {
                    return idx > 0;
                });
            }
            this.set(response.Workunit);
            this.set({
                ResultViews: includeResults ? response.ResultViews : [],
                HelpersCount: response.Workunit.Helpers && response.Workunit.Helpers.ECLHelpFile ? response.Workunit.Helpers.ECLHelpFile.length : 0
            });
            return response;
        }).catch((e: ESPExceptions) => {
            //  deleted  ---
            const wuMissing = e.Exception.some((exception) => {
                if (exception.Code === 20080) {
                    this.clearState(this.Wuid);
                    this.set("StateID", WUStateID.NotFound);
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

    protected WUAction(actionType: WsWorkunits.WUActionType): Promise<WsWorkunits.WUActionResponse> {
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

    protected WUResubmit(clone: boolean, resetWorkflow: boolean): Promise<WsWorkunits.WUResubmitResponse> {
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

//  Unit Tests ---
declare function expect(...args): any;
export function unitTest() {
    const VM_HOST: string = "http://192.168.3.22:8010";
    // const VM_URL: string = "http://192.168.3.22:8010/WsWorkunits";
    // const PUBLIC_URL: string = "http://52.51.90.23:8010/WsWorkunits";
    describe("Workunit", function () {
        describe.only("simple life cycle", function () {
            let wu1: Workunit;
            it("creation", function () {
                return Workunit.create(VM_HOST).then((wu) => {
                    expect(wu).is.not.undefined;
                    expect(wu.Wuid).is.not.undefined;
                    wu1 = wu;
                    return wu;
                });
            });
            it("update", function () {
                return wu1.update({ QueryText: "'Hello and Welcome!';" });
            });
            it("submit", function () {
                return wu1.submit("hthor");
            });
            it("complete", function () {
                return new Promise((resolve) => {
                    if (wu1.isComplete()) {
                        resolve();
                    } else {
                        wu1.on("completed", () => {
                            resolve();
                        });
                    }
                });
            });
            it("results", function () {
                return wu1.fetchResults().then((results) => {
                    expect(results.length).equals(1);
                    return wu1.Results[0].fetchXMLSchema().then((result) => {
                        // console.log(JSON.stringify(results));
                        return wu1;
                    });
                    // console.log(JSON.stringify(results));
                });
            });
        });
        describe("XSD Parsing", function () {
            it("basic", function () {
                const wu = Workunit.attach(VM_HOST, "W20170208-123106");
                let result;
                return wu.fetchResults().then(() => {
                    result = wu.Results[2];
                    return result.fetchXMLSchema().then((response) => {
                        // console.log(JSON.stringify(results));
                        return wu;
                    }).then(() => {
                        return result.fetchResult().then((response) => {
                            // console.log(JSON.stringify(results));
                            return wu;
                        });
                    });
                });
            });
        });
    });
}
