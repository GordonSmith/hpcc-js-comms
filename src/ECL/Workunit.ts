import { dispatch } from "d3-dispatch";
import { IECLWorkunit, WsWorkunits, WUAction, WUStateID } from "../connections/WsWorkunits";
export { WUStateID }

export class Workunit {
    connection: WsWorkunits;
    private _state: IECLWorkunit;
    private _submitAction: WUAction;
    private _events = dispatch("StateIDChanged");
    private _monitorHandle: number;
    private _hasListener: boolean;

    get wuid(): string {
        return this._state.Wuid;
    }
    get state(): string {
        return WUStateID[this._state.StateID ? this._state.StateID : WUStateID.Unknown];
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
    ecl(_: string): Promise<Workunit>;
    ecl(_?: string): string | Promise<Workunit> {
        if (!arguments.length) return this._state.Query ? this._state.Query.Text : "";
        return this.connection.WUUpdate({ Wuid: this.wuid, QueryText: _ }).then((response) => {
            return this.updateState(response);
        });
    }

    submit(cluster: string, action: WUAction = WUAction.Run, resultLimit?: number): Promise<Workunit> {
        return this.connection.WUUpdate({ Wuid: this.wuid, Action: action, ResultLimit: resultLimit }).then((response) => {
            this.updateState(response);
            this._submitAction = action;
            return this.connection.WUSubmit(this.wuid, cluster).then(() => {
                return this;
            });
        });
    }

    isComplete(): boolean {
        switch (this._state.StateID) {
            case WUStateID.Compiled:
                return this._submitAction === WUAction.Compile;
            case WUStateID.Completed:
            case WUStateID.Failed:
            case WUStateID.Aborted:
                return true;
            default:
        }
        return false;
    }

    on(id: string, callback: Function): Workunit {
        this._events.on(id, callback);
        this._hasListener = false;
        for (let key in this._events) {
            if (this._events[key].length) {
                this._hasListener = true;
            }
        }
        this._monitor();
        return this;
    }

    protected _monitor(): void {
        if (this._monitorHandle || this.isComplete()) {
            return;
        }
        this._monitorHandle = setInterval(() => {
            if (this._hasListener) {
                this.refresh();
            }
            if (!this._hasListener || this.isComplete()) {
                clearInterval(this._monitorHandle);
                delete this._monitorHandle;
            }
        }, 500);
    }

    refresh(): Promise<Workunit> {
        return this.connection.WUQuery(this.wuid).then((response) => {
            if (response.length) {
                this.updateState(response[0]);
            } else {
                //  deleted  ---
                this.updateState({
                    Wuid: this.wuid,
                    StateID: WUStateID.NotFound
                });
            }
            return this;
        });
    }

    updateState(_: IECLWorkunit): Workunit {
        if (this.wuid !== _.Wuid) {
            throw new Error("Invalid param");
        }
        for (let key in _) {
            if (this._state[key] !== _[key]) {
                this._state[key] = _[key];
                if (key === "StateID") {
                    this._events.call(key + "Changed", this, this._state[key]);
                }
            }
        }
        return this;
    }
}
