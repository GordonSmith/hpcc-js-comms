import { Promise } from "bluebird"
import { ESPConnection } from "./connection"

export enum WUStateID {
    UNKNOWN = 0,
    COMPILED,
    RUNNING,
    COMPLETED,
    ABORTING,
    ABORTED,
    BLOCKED,
    SUBMITTED,
    WAIT,
    FAILED,
    COMPILING,
    UPLOADING_FILES,
    DEBUGGING,
    DEBUG_RUNNING,
    PAUSED,
    NOT_FOUND
}

export interface IECLWorkunit {
    Wuid: string;
    Query: {
        Text: string;
    }
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
    }
}

export interface IWUCreateResponse {
    Workunit: IECLWorkunit;
}

export class WsWorkunits extends ESPConnection {
    constructor(href: string) {
        super(`${href}/WsWorkunits`);
    }

    WUQuery(): Promise<IECLWorkunit[]> {
        return this.send("WUQuery").then((response: IWUQueryResponse) => {
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

    WUUpdate(wuid: string, ecl: string): Promise<IECLWorkunit> {
        return this.send("WUUpdate", { Wuid: wuid, QueryText: ecl }).then((response: IWUCreateResponse) => {
            return response.Workunit;
        });
    }

    WUSubmit(wuid: string, cluster: string): Promise {
        return this.send("WUSubmit", { Wuid: wuid, Cluster: cluster });
    }
}
