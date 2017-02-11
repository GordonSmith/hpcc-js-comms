import { ECLGraph } from "../connections/WsWorkunits";
import { Connection } from "../connections/WsWorkunits";
import { Cache, ESPStateObject } from "./ESPStateObject";
import { Timer } from "./Timer";

export interface ECLGraphEx extends ECLGraph {
    Wuid: string;
    Time: number;
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
    get Time(): number { return this.get("Time"); }

    constructor(href: string, wuid: string, eclGraph: ECLGraph, eclTimers: Timer[]) {
        super();
        this.connection = new Connection(href);
        let duration = 0;
        for (const eclTimer of eclTimers) {
            if (eclTimer.GraphName === eclGraph.Name && !eclTimer.HasSubGraphId) {
                duration = Math.round(eclTimer.Seconds * 1000) / 1000;
                break;
            }
        }
        this.set({ Wuid: wuid, Time: duration, ...eclGraph });
    }
}

export class GraphCache extends Cache<ECLGraph, Graph>{
    constructor() {
        super((obj) => {
            return Cache.hash([obj.Name]);
        });
    }
}
