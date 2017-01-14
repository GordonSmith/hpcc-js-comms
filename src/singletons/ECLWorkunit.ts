import { Promise } from "bluebird"
import { WsWorkunits, IECLWorkunit } from "../connections/WsWorkunits"

export class ECLWorkunit {
    connection: WsWorkunits;
    private _state: IECLWorkunit;
    private _ecl;

    get wuid() {
        return this._state.Wuid;
    }

    constructor(connection: WsWorkunits, wuid: string) {
        this.connection = connection;
        this._state = {
            Wuid: wuid,
            Query: {
                Text: ""
            }
        };
    }

    ecl(): string;
    ecl(_): Promise<ECLWorkunit>;
    ecl(_?) {
        if (!arguments.length) return this._state.Query.Text;
        return this.connection.WUUpdate(this.wuid, _).then((response: IECLWorkunit) => {
            return this.updateState(response);
        });
    }

    submit(cluster: string): Promise<ECLWorkunit> {
        return this.connection.WUSubmit(this.wuid, cluster).then(() => {
            return this;
        });
    }

    updateState(_: IECLWorkunit) {
        if (this.wuid !== _.Wuid) {
            throw new Error("Invalid param");
        }
        for (let key in _) {
            this._state[key] = _[key];
        }
        return this;
    }
}
