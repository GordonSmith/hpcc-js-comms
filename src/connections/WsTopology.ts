import { Promise } from "es6-promise";
import { ESPConnection, mixin, ResponseType } from "./ESPConnection";

export interface EclServerQueueRequest {
    EclServerQueue?: string;
}

export interface TpLogicalCluster {
    Name: string;
    Queue?: any;
    LanguageVersion: string;
    Process?: any;
    Type: string;
}

export interface TpLogicalClusters {
    TpLogicalCluster: TpLogicalCluster[];
}

export interface TpLogicalClusterQueryResponse {
    default?: TpLogicalCluster;
    TpLogicalClusters: TpLogicalClusters;
}

export class WsTopology extends ESPConnection {
    constructor(href: string = "") {
        super(`${href}/WsTopology`);
    }

    TpLogicalClusterQuery(request: EclServerQueueRequest = {}): Promise<TpLogicalClusterQueryResponse> {
        return this.send("WUUpdate", request);
    }

    DefaultTpLogicalClusterQuery(request: EclServerQueueRequest = {}): Promise<TpLogicalCluster> {
        return this.TpLogicalClusterQuery(request).then((response) => {
            if (response.default) {
                return response.default;
            }
            let firstHThor;
            let first;
            response.TpLogicalClusters.TpLogicalCluster.some((item, idx) => {
                if (idx === 0) {
                    first = item;
                }
                if (item.Type === "hthor") {
                    firstHThor = item;
                    return true;
                }
                return false;
            });
            return firstHThor || first;
        });
    }
}