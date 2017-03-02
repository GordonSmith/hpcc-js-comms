import { ITransport, ResponseType, Transport } from "../../comms/transport";

export function isArray(arg: any) {
    return Object.prototype.toString.call(arg) === "[object Array]";
};

export interface Exception {
    Code: number;
    Message: string;
}

export interface Exceptions {
    Source: string;
    Exception: Exception[];
}

export class ESPExceptions extends Error implements Exceptions {
    readonly isESPExceptions = true;
    action: string;
    request: string;
    Source: string;
    Exception: Exception[];

    constructor(action: string, request: any, exceptions: Exceptions) {
        super("ESPException:  " + exceptions.Source);
        this.action = action;
        this.request = request;
        this.Source = exceptions.Source;
        this.Exception = exceptions.Exception;
    }
}

export class ESPTransport extends Transport {
    private _transport: ITransport;
    private _service: string;
    private _version: string;

    constructor(transport: ITransport, service: string, version: string) {
        super("");
        this._transport = transport;
        this._service = service;
        this._version = version;
    }

    toESPStringArray(target: any, arrayName: string): Object {
        if (isArray(target[arrayName])) {
            for (let i = 0; i < target[arrayName].length; ++i) {
                target[arrayName + "_i" + i] = target[arrayName][i];
            }
            delete target[arrayName];
        }
        return target;
    }

    send(action: string, _request: any = {}, responseType: ResponseType = "json"): Promise<any> {
        const request = { ..._request, ...{ ver_: this._version } };
        const serviceAction = this.joinUrl(this._service, action + ".json");
        return this._transport.send(serviceAction, request, responseType).then((response) => {
            if (responseType === "json") {
                if (response.Exceptions) {
                    throw new ESPExceptions(action, request, response.Exceptions);
                }
                const retVal = response[`${action === "WUCDebug" ? "WUDebug" : action}Response`];
                if (!retVal) {
                    throw new ESPExceptions(action, request, {
                        Source: "ESPConnection.transmit",
                        Exception: [{ Code: 0, Message: "Missing Response" }]
                    });
                }
                return retVal;
            }
            return response;
        });
    }
}
