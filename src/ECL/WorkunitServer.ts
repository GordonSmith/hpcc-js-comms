import { WsWorkunits } from "../connections/WsWorkunits";
import { Workunit } from "./Workunit";

let wuServers: { [key: string]: Server } = {};
export class Server {

    static attach(host: string): Server {
        if (!wuServers[host]) {
            wuServers[host] = new Server(host);
        }
        return wuServers[host];
    }

    connection: WsWorkunits;

    protected constructor(host: string) {
        this.connection = new WsWorkunits(host);
    }

    create(): Promise<Workunit> {
        return this.connection.WUCreate().then((response) => {
            return Workunit.attach(this.connection, response.Wuid).updateState(response);
        });
    }

    fetch(): Promise<Workunit[]> {
        return this.connection.WUQuery().then((response) => {
            return response.map((eclWorkunit) => {
                return Workunit.attach(this.connection, eclWorkunit.Wuid).updateState(eclWorkunit);
            });
        });
    }
}
