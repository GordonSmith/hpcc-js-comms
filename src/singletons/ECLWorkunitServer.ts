import { Promise } from "bluebird"
import { WsWorkunits, IECLWorkunit } from "../connections/WsWorkunits"
import { ECLWorkunit } from "./ECLWorkunit"

let wuServers: { [key: string]: ECLWorkunitServer } = {}
export class ECLWorkunitServer {
    connection: WsWorkunits;

    protected constructor(host: string) {
        this.connection = new WsWorkunits(host);
    }

    static attach(host) {
        if (!wuServers[host]) {
            wuServers[host] = new ECLWorkunitServer(host);
        }
        return wuServers[host];
    }

    create(): Promise<ECLWorkunit> {
        return this.connection.WUCreate().then((response: IECLWorkunit) => {
            return new ECLWorkunit(this.connection, response.Wuid).updateState(response);
        });
    }

    fetch(): Promise<ECLWorkunit[]> {
        return this.connection.WUQuery().then((response: IECLWorkunit[]) => {
            return response.map((eclWorkunit) => {
                return new ECLWorkunit(this.connection, eclWorkunit.Wuid).updateState(eclWorkunit);
            });
        });
    }

}


