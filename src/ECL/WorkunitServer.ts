import { Promise } from "es6-promise";
import { WsWorkunits, WUQueryRequest } from "../connections/WsWorkunits";
import { Workunit } from "./Workunit";

let wuServers: { [key: string]: Server } = {};
export class Server {

    static attach(href: string): Server {
        if (!wuServers[href]) {
            wuServers[href] = new Server(href);
        }
        return wuServers[href];
    }

    href: string;
    connection: WsWorkunits;

    protected constructor(href: string = "") {
        this.href = href;
        this.connection = new WsWorkunits(href);
    }

    create(): Promise<Workunit> {
        return this.connection.WUCreate().then((response) => {
            return Workunit.attach(this.href, response.Workunit.Wuid, response.Workunit);
        });
    }

    get(wuid: string): Promise<Workunit | null> {
        return this.query({ Wuid: wuid }).then((wus) => {
            return wus.length ? wus[0] : null;
        });
    }

    query(request: WUQueryRequest = {}): Promise<Workunit[]> {
        return this.connection.WUQuery(request).then((response) => {
            return response.Workunits.ECLWorkunit.map((eclWorkunit) => {
                return Workunit.attach(this.href, eclWorkunit.Wuid, eclWorkunit);
            });
        });
    }
}
