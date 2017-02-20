import { Connection, ECLSourceFile, Options } from "../connections/WsWorkunits";
import { ESPStateObject } from "./ESPStateObject";

export interface ECLSourceFileEx extends ECLSourceFile {
    Wuid: string;
}

export class SourceFile extends ESPStateObject<ECLSourceFileEx, ECLSourceFileEx> implements ECLSourceFileEx {
    protected connection: Connection;

    get properties(): ECLSourceFile { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get FileCluster(): string { return this.get("FileCluster"); }
    get Name(): string { return this.get("Name"); }
    get Count(): number { return this.get("Count"); }

    constructor(href: string, wuid: string, eclSourceFile: ECLSourceFile, opts: Options) {
        super();
        this.connection = new Connection(href, opts);

        this.set({
            Wuid: wuid,
            ...eclSourceFile
        });
    }
}
