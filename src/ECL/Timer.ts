import { espTime2Seconds } from "../comms/esp/ESPConnection";
import { ECLTimer, Service } from "../comms/esp/WsWorkunits";
import { ESPStateObject } from "./ESPStateObject";

export interface ECLTimerEx extends ECLTimer {
    Wuid: string;
    Seconds: number;
    HasSubGraphId: boolean;
}

export class Timer extends ESPStateObject<ECLTimerEx, ECLTimerEx> implements ECLTimerEx {
    protected connection: Service;

    get properties(): ECLTimer { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get Name(): string { return this.get("Name"); }
    get Value(): string { return this.get("Value"); }
    get Seconds(): number { return this.get("Seconds"); }
    get GraphName(): string { return this.get("GraphName"); }
    get SubGraphId(): number { return this.get("SubGraphId"); }
    get HasSubGraphId(): boolean { return this.get("HasSubGraphId"); }
    get count(): number { return this.get("count"); }

    constructor(connection: Service | string, wuid: string, eclTimer: ECLTimer) {
        super();
        if (connection instanceof Service) {
            this.connection = connection;
        } else {
            this.connection = new Service(connection);
        }

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
