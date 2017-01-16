import { ESPConnection } from "./connection";

export enum WUStateID {
    Unknown = 0,
    Compiled,
    Running,
    Completed,
    Failed,
    Archived,
    Aborting,
    Aborted,
    Blocked,
    Submitted,
    Scheduled,
    Compiling,
    Wait,
    UploadingFiled,
    DebugPaused,
    DebugRunning,
    Paused,
    LAST,
    NotFound = 999
}

export enum WUAction {
    Unknown = 0,
    Compile,
    Check,
    Run,
    ExecuteExisting,
    Pause,
    PauseNow,
    Resume,
    Debug,
    __size
};

export interface IECLWorkunit {
    Wuid: string;
    Query?: {
        Text: string;
    };
    Cluster?: string;
    DateTimeScheduled?: string;
    HasArchiveQuery?: boolean;
    IsPausing?: false;
    Jobname?: string;
    Owner?: string;
    Protected?: boolean;
    State?: string;
    StateID?: WUStateID;
    ThorLCR?: boolean;
    TotalClusterTime?: string;
}

export interface IWUQueryResponse {
    CacheHint: number;
    NumWUs: number;
    Workunits: {
        ECLWorkunit: IECLWorkunit[];
    };
}

export interface IWUCreateResponse {
    Workunit: IECLWorkunit;
}

export interface IWUUpdateRequest {
    Wuid: string;
    QueryText?: string;
    Action?: WUAction;
    ResultLimit?: number;
}

export class WsWorkunits extends ESPConnection {
    constructor(href: string) {
        super(`${href}/WsWorkunits`);
    }

    WUQuery(wuid?): Promise<IECLWorkunit[]> {
        return this.send("WUQuery", { Wuid: wuid }).then((response: IWUQueryResponse) => {
            if (response.Workunits.ECLWorkunit) {
                return response.Workunits.ECLWorkunit;
            }
            throw (new Error("WUQuery:  Missing response"));
        });
    }

    WUCreate(): Promise<IECLWorkunit> {
        return this.send("WUCreate").then((response: IWUCreateResponse) => {
            return response.Workunit;
        });
    }

    WUUpdate(request: IWUUpdateRequest): Promise<IECLWorkunit> {
        return this.send("WUUpdate", request).then((response: IWUCreateResponse) => {
            return response.Workunit;
        });
    }

    WUSubmit(wuid: string, cluster: string): Promise<null> {
        return this.send("WUSubmit", { Wuid: wuid, Cluster: cluster });
    }
}
