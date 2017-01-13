import { Promise } from "bluebird"
import { ESPConnection } from "./connection"

export interface IECLWorkunit {
    Cluster: string;
    DateTimeScheduled: string;
    HasArchiveQuery: boolean;
    IsPausing: false;
    Jobname: string;
    Owner: string;
    Protected: boolean;
    State: string;
    StateID: number;
    ThorLCR: boolean;
    TotalClusterTime: string;
    Wuid: string;
}

export interface IWUQueryResponse {
    CacheHint: number;
    NumWUs: number;
    Workunits: IECLWorkunit[];
}

export class WsWorkunits extends ESPConnection {
    constructor(href: string) {
        super(`${href}/WsWorkunits`);
    }

    WUQuery(_?): Promise<IWUQueryResponse> {
        return this.send("WUQuery", _).then((response) => {
            return response;
        });
    }
}
