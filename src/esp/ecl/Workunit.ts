import { Cache, IEvent, StateCallback, StateEvents, StateObject, StatePropCallback } from "../../collections/stateful";
import { logger } from "../../util/Logging";
import { IObserverHandle } from "../../util/observer";
import { PrimativeValueMap, XMLNode } from "../../util/SAXParser";
import { ESPExceptions } from "../comms/transport";
import { ActiveWorkunit } from "../services/WsSMC";
import * as WsTopology from "../services/WsTopology";
import * as WsWorkunits from "../services/WsWorkunits";
import { createXGMMLGraph, Graph, GraphCache, IECLDefintion, XGMMLGraph } from "./Graph";
import { Resource } from "./Resource";
import { Result, ResultCache } from "./Result";
import { SourceFile } from "./SourceFile";
import { Timer } from "./Timer";

export const WUStateID = WsWorkunits.WUStateID;

export class WorkunitCache extends Cache<{ Wuid: string }, Workunit> {
    constructor() {
        super((obj) => {
            return obj.Wuid;
        });
    }
}
const _workunits = new WorkunitCache();

export interface DebugState {
    sequence: number;
    state: string;
    [key: string]: any;
}

export interface IWorkunit {
    ResultViews: any[];
    HelpersCount: number;
}

export interface IDebugWorkunit {
    DebugState?: DebugState;
}

export type WorkunitEvents = "completed" | StateEvents;
export type UWorkunitState = WsWorkunits.ECLWorkunit & WsWorkunits.Workunit & ActiveWorkunit & IWorkunit & IDebugWorkunit;
export type IWorkunitState = WsWorkunits.ECLWorkunit | WsWorkunits.Workunit | ActiveWorkunit | IWorkunit | IDebugWorkunit;
export class Workunit extends StateObject<UWorkunitState, IWorkunitState> implements WsWorkunits.Workunit {
    connection: WsWorkunits.Service;
    topologyConnection: WsTopology.Service;

    private _debugMode: boolean = false;
    private _debugAllGraph: any;
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
                return new Result(this.connection, this.Wuid, eclResult, this.ResultViews);
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
            return new Timer(this.connection, this.Wuid, eclTimer);
        });
    }

    private _graphCache = new GraphCache();
    get GraphCount(): number { return this.get("GraphCount", 0); }
    get Graphs(): WsWorkunits.Graphs { return this.get("Graphs", { ECLGraph: [] }); }
    get CGraphs(): Graph[] {
        return this.Graphs.ECLGraph.map((eclGraph) => {
            return this._graphCache.get(eclGraph, () => {
                return new Graph(this.connection, this.Wuid, eclGraph, this.CTimers);
            });
        });
    }
    get ThorLogList(): WsWorkunits.ThorLogList { return this.get("ThorLogList"); }
    get ResourceURLCount(): number { return this.get("ResourceURLCount", 0); }
    get ResourceURLs(): WsWorkunits.ResourceURLs { return this.get("ResourceURLs", { URL: [] }); }
    get CResourceURLs(): Resource[] {
        return this.ResourceURLs.URL.map((url) => {
            return new Resource(this.connection, this.Wuid, url);
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
            return new SourceFile(this.connection, this.Wuid, eclSourceFile);
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
    get DebugState(): DebugState { return this.get("DebugState", {} as DebugState); }

    //  Factories  ---
    static create(href: string): Promise<Workunit>;
    static create(connection: WsWorkunits.Service | string, topologyConnection?: WsTopology.Service | string): Promise<Workunit>;
    static create(connection: WsWorkunits.Service | string, topologyConnection?: WsTopology.Service | string): Promise<Workunit> {
        const retVal: Workunit = new Workunit(connection, topologyConnection);
        return retVal.connection.WUCreate().then((response) => {
            _workunits.set(retVal);
            retVal.set(response.Workunit);
            return retVal;
        });
    }

    static attach(href: string, wuid: string, state?: WsWorkunits.ECLWorkunit | WsWorkunits.Workunit): Workunit;
    static attach(connection: WsWorkunits.Service, topologyConnection: WsTopology.Service, wuid: string, state?: WsWorkunits.ECLWorkunit | WsWorkunits.Workunit): Workunit;
    static attach(arg0: string | WsWorkunits.Service, arg1: string | WsTopology.Service, arg2?: WsWorkunits.ECLWorkunit | WsWorkunits.Workunit | string, state?: WsWorkunits.ECLWorkunit | WsWorkunits.Workunit): Workunit {
        let retVal: Workunit;
        if (arg0 instanceof WsWorkunits.Service && arg1 instanceof WsTopology.Service) {
            retVal = _workunits.get({ Wuid: arg2 as string }, () => {
                return new Workunit(arg0, arg1, arg2 as string);
            });
        } else {
            retVal = _workunits.get({ Wuid: arg1 as string }, () => {
                return new Workunit(arg0 as string, arg1 as string);
            });
            state = arg2 as WsWorkunits.ECLWorkunit | WsWorkunits.Workunit;
        }
        if (state) {
            retVal.set(state);
        }
        return retVal;
    }

    static exists(wuid: string): boolean {
        return _workunits.has({ Wuid: wuid });
    }

    //  ---  ---  ---
    protected constructor(connection: WsWorkunits.Service | string, topologyConnection: WsTopology.Service | string, wuid?: string) {
        super();
        if (connection instanceof WsWorkunits.Service) {
            this.connection = connection;
        } else {
            this.connection = new WsWorkunits.Service(connection);
        }
        if (topologyConnection instanceof WsTopology.Service) {
            this.topologyConnection = topologyConnection;
        } else {
            this.topologyConnection = new WsTopology.Service(topologyConnection || connection as string);
        }
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

        this._debugMode = false;
        if (action === WsWorkunits.WUAction.Debug) {
            action = WsWorkunits.WUAction.Run;
            this._debugMode = true;
        }

        return clusterPromise.then((cluster) => {
            return this.connection.WUUpdate({
                Wuid: this.Wuid,
                Action: action,
                ResultLimit: resultLimit
            }, {}, { Debug: this._debugMode }).then((response) => {
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
            case WUStateID.NotFound:
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

    isDebugging() {
        switch (this.StateID) {
            case WUStateID.DebugPaused:
            case WUStateID.DebugRunning:
                return true;
            default:
        }
        return false;
    }

    isRunning(): boolean {
        switch (this.StateID) {
            case WUStateID.Compiled:
            case WUStateID.Running:
            case WUStateID.Aborting:
            case WUStateID.Blocked:
            case WUStateID.DebugPaused:
            case WUStateID.DebugRunning:
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
        const refreshPromise: Promise<WsWorkunits.WUInfoResponse | WsWorkunits.WUQueryResponse> = full ? this.WUInfo() : this.WUQuery();
        const debugPromise = this.debugStatus();
        return Promise.all([
            refreshPromise,
            debugPromise
        ]).then(() => {
            return this;
        });
    }

    fetchResults(): Promise<Result[]> {
        return this.WUInfo({ IncludeResults: true }).then(() => {
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
            const refreshPromise: Promise<any> = this.hasEventListener() ? this.refresh(true) : Promise.resolve(null);
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
    on(eventID: WorkunitEvents, propIDorCallback: StateCallback | keyof UWorkunitState, callback?: StatePropCallback): Workunit {
        if (this.isCallback(propIDorCallback)) {
            switch (eventID) {
                case "completed":
                    super.on("propChanged", "StateID", (changeInfo: IEvent) => {
                        if (this.isComplete()) {
                            propIDorCallback([changeInfo]);
                        }
                    });
                    break;
                case "changed":
                    super.on(eventID, propIDorCallback);
                    break;
                default:
            }
        } else {
            switch (eventID) {
                case "changed":
                    super.on(eventID, propIDorCallback, callback);
                    break;
                default:
            }
        }
        this._monitor();
        return this;
    }

    watch(callback: StateCallback, triggerChange: boolean = true): IObserverHandle {
        if (typeof callback !== "function") {
            throw new Error("Invalid Callback");
        }
        if (triggerChange) {
            setTimeout(() => {
                const props: any = this.properties;
                const changes: IEvent[] = [];
                for (const key in props) {
                    if (props.hasOwnProperty(props)) {
                        changes.push({ id: key, newValue: props[key], oldValue: undefined });
                    }
                }
                callback(changes);
            }, 0);
        }
        const retVal = super.on("changed", callback);
        this._monitor();
        return retVal;
    }

    watchUntilComplete(callback?: StateCallback): Promise<this> {
        return new Promise((resolve, _) => {
            const watchHandle = this.watch((changes) => {
                if (callback) {
                    callback(changes);
                }
                if (this.isComplete()) {
                    watchHandle.release();
                    resolve(this);
                }
            });
        });
    }

    watchUntilRunning(callback?: StateCallback): Promise<this> {
        return new Promise((resolve, _) => {
            const watchHandle = this.watch((changes) => {
                if (callback) {
                    callback(changes);
                }
                if (this.isComplete() || this.isRunning()) {
                    watchHandle.release();
                    resolve(this);
                }
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
                throw e;
            }
            return {};
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
            IncludeResultsViewNames: includeResults,
            SuppressResultSchemas: false
        }).then((response) => {
            if (response.Workunit.ResourceURLCount) {
                response.Workunit.ResourceURLCount = response.Workunit.ResourceURLCount - 1;
            }
            if (response.Workunit.ResourceURLs && response.Workunit.ResourceURLs.URL) {
                response.Workunit.ResourceURLs.URL = response.Workunit.ResourceURLs.URL.filter((_, idx) => {
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
                throw e;
            }
            return {};
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

    protected WUCDebug(command: string, opts: Object = {}): Promise<XMLNode> {
        let optsStr = "";
        for (const key in opts) {
            if (opts.hasOwnProperty(key)) {
                optsStr += ` ${key}='${opts[key]}'`;
            }
        }
        return this.connection.WUCDebug({
            Wuid: this.Wuid,
            Command: `<debug:${command} uid='${this.Wuid}'${optsStr}/>`
        }).then((response) => {
            return response;
        });
    }

    debug(command: string, opts?: Object): Promise<XMLNode> {
        if (!this.isDebugging()) {
            return Promise.resolve(null);
        }
        return this.WUCDebug(command, opts).then((response: XMLNode) => {
            return response.children.filter((xmlNode) => {
                return xmlNode.name === command;
            })[0];
        }).catch((_) => {
            // console.log(e);
            return Promise.resolve(null);
        });
    }

    debugStatus(): Promise<XMLNode> {
        if (!this.isDebugging()) {
            return Promise.resolve<any>({
                DebugState: { state: "unknown" }
            });
        }
        return this.debug("status").then((response) => {
            response = response || new XMLNode("null");
            const debugState = { ...this.DebugState, ...response.attributes };
            this.set({
                DebugState: debugState
            });
            return response;
        });
    }

    debugContinue(mode = ""): Promise<XMLNode> {
        return this.debug("continue", {
            mode
        });
    }

    debugStep(mode): Promise<XMLNode> {
        return this.debug("step", {
            mode
        });
    }

    debugPause(): Promise<XMLNode> {
        return this.debug("interrupt");
    }

    debugQuit(): Promise<XMLNode> {
        return this.debug("quit");
    }

    debugDeleteAllBreakpoints(): Promise<XMLNode> {
        return this.debug("delete", {
            idx: 0
        });
    }

    protected debugBreakpointResponseParser(rootNode) {
        return rootNode.children.map((childNode) => {
            if (childNode.name === "break") {
                return childNode.attributes;
            }
        });
    }

    debugBreakpointAdd(id, mode, action): Promise<XMLNode> {
        return this.debug("breakpoint", {
            id,
            mode,
            action
        }).then((rootNode) => this.debugBreakpointResponseParser(rootNode));
    }

    debugBreakpointList(): Promise<any[]> {
        return this.debug("list").then((rootNode) => {
            return this.debugBreakpointResponseParser(rootNode);
        });
    }

    debugGraph(): Promise<XGMMLGraph> {
        if (this._debugAllGraph && this.DebugState["_prevGraphSequenceNum"] === this.DebugState["graphSequenceNum"]) {
            return Promise.resolve(this._debugAllGraph);
        }
        return this.debug("graph", { name: "all" }).then((response) => {
            this.DebugState["_prevGraphSequenceNum"] = this.DebugState["graphSequenceNum"];
            this._debugAllGraph = createXGMMLGraph(this.Wuid, response);
            return this._debugAllGraph;
        });
    }

    debugBreakpointValid(path): Promise<IECLDefintion[]> {
        return this.debugGraph().then((graph) => {
            return graph.breakpointLocations(path);
        });
    }

    debugPrint(edgeID: string, startRow: number = 0, numRows: number = 10): Promise<PrimativeValueMap[]> {
        return this.debug("print", {
            edgeID,
            startRow,
            numRows
        }).then((response: XMLNode) => {
            return response.children.map((rowNode) => {
                const retVal: PrimativeValueMap = {};
                rowNode.children.forEach((cellNode) => {
                    retVal[cellNode.name] = cellNode.content;
                });
                return retVal;
            });
        });
    }
}
