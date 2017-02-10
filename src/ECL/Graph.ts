import { ECLGraph } from "../connections/WsWorkunits";
import { Connection } from "../connections/WsWorkunits";
import { ESPStateObject } from "./ESPStateObject";

export interface ECLGraphEx extends ECLGraph {
    Wuid: string;
}
export class Graph extends ESPStateObject<ECLGraphEx, ECLGraphEx> implements ECLGraphEx {
    protected connection: Connection;

    get properties(): ECLGraphEx { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get Name(): string { return this.get("Name"); }
    get Label(): string { return this.get("Label"); }
    get Type(): string { return this.get("Type"); }
    get Complete(): boolean { return this.get("Complete"); }
    get WhenStarted(): Date { return this.get("WhenStarted"); }
    get WhenFinished(): Date { return this.get("WhenFinished"); }

    constructor(href: string, wuid: string, eclGraph: ECLGraph) {
        super();
        this.connection = new Connection(href);
        this.set({ Wuid: wuid, ...eclGraph });
    }
}
