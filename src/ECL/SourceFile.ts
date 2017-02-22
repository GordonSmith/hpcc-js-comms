import { ECLSourceFile, Service, } from "../comms/esp/WsWorkunits";
import { ESPStateObject } from "./ESPStateObject";

export interface ECLSourceFileEx extends ECLSourceFile {
    Wuid: string;
}

export class SourceFile extends ESPStateObject<ECLSourceFileEx, ECLSourceFileEx> implements ECLSourceFileEx {
    protected connection: Service;

    get properties(): ECLSourceFile { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get FileCluster(): string { return this.get("FileCluster"); }
    get Name(): string { return this.get("Name"); }
    get Count(): number { return this.get("Count"); }

    constructor(connection: Service | string, wuid: string, eclSourceFile: ECLSourceFile) {
        super();
        if (connection instanceof Service) {
            this.connection = connection;
        } else {
            this.connection = new Service(connection);
        }

        this.set({
            Wuid: wuid,
            ...eclSourceFile
        });
    }
}
