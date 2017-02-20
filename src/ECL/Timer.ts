import { espTime2Seconds } from "../connections/ESPConnection";
import { Connection, ECLTimer, Options } from "../connections/WsWorkunits";
import { ESPStateObject } from "./ESPStateObject";

export interface ECLTimerEx extends ECLTimer {
    Wuid: string;
    Seconds: number;
    HasSubGraphId: boolean;
}

export class Timer extends ESPStateObject<ECLTimerEx, ECLTimerEx> implements ECLTimerEx {
    protected connection: Connection;

    get properties(): ECLTimer { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get Name(): string { return this.get("Name"); }
    get Value(): string { return this.get("Value"); }
    get Seconds(): number { return this.get("Seconds"); }
    get GraphName(): string { return this.get("GraphName"); }
    get SubGraphId(): number { return this.get("SubGraphId"); }
    get HasSubGraphId(): boolean { return this.get("HasSubGraphId"); }
    get count(): number { return this.get("count"); }

    constructor(href: string, wuid: string, eclTimer: ECLTimer, opts: Options) {
        super();
        this.connection = new Connection(href, opts);

        const secs = espTime2Seconds(eclTimer.Value);
        this.set({
            Wuid: wuid,
            Seconds: Math.round(secs * 1000) / 1000,
            HasSubGraphId: eclTimer.SubGraphId !== undefined,
            XXX: true,
            ...eclTimer
        });
    }
}
