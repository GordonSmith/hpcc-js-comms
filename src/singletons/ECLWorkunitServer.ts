import { Promise } from "bluebird"
import { WsWorkunits } from "../connections/WsWorkunits"
import { ECLWorkunit } from "./ECLWorkunit"

export class ECLWorkunitServer {
    connection: WsWorkunits;

    constructor(host: string) {
        this.connection = new WsWorkunits(host);
    }

    fetch(): Promise<ECLWorkunit[]> {
        return this.connection.WUQuery().then((response) => {
            if (response.Workunits.ECLWorkunit) {
                return response.Workunits.ECLWorkunit.map((wuQueryWorkunit) => {
                    return new ECLWorkunit().update(wuQueryWorkunit);
                });
            }
            return [];
        });
    }

    create() {
    }
}
