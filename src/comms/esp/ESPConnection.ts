import { Promise } from "es6-promise";
import { ITransport, ResponseType, Transport } from "../Transport";

export function inner(prop: string, obj: any): any {
    if (prop === void 0 || obj === void 0) return void 0;
    for (const item of prop.split(".")) {
        if (!obj.hasOwnProperty(item)) {
            return undefined;
        }
        obj = obj[item];
    }
    return obj;
}

export function exists(prop: string, obj: Object): boolean {
    return inner(prop, obj) !== undefined;
};

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

    constructor(transport: ITransport, service: string) {
        super("");
        this._transport = transport;
        this._service = service;
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

    send(action: string, request: any = {}, responseType: ResponseType = "json"): Promise<any> {
        const serviceAction = this.joinUrl(this._service, action + ".json");
        return this._transport.send(serviceAction, request, responseType).then((response) => {
            if (responseType === "json") {
                if (response.Exceptions) {
                    throw new ESPExceptions(action, request, response.Exceptions);
                }
                const retVal = response[`${action === "WUCDebug" ? "WUDebug" : action}Response`];
                if (!retVal) {
                    throw new ESPExceptions(action, request, {
                        Source: "ESPTransport.transmit",
                        Exception: [{ Code: 0, Message: "Missing Response" }]
                    });
                }
                return retVal;
            }
            return response;
        });
    }
}
/*
class ESPConnection extends Connection {
    private readonly href: string;

    constructor(href: string, opts: Options) {
        super(opts);
        this.href = href;
    }

    protected transmit(verb: VERB, action: string, request: Object, jsonContent: boolean = true): Promise<any> {
        return super.transmit(verb, this.href + "/" + action + ".json", request).then((_response) => {
            if (jsonContent) {
                let response;
                try {
                    response = JSON.parse(_response);
                } catch (e) {
                    throw new ESPExceptions(action, request, {
                        Source: "ESPConnection.transmit",
                        Exception: [{ Code: 0, Message: "Invalid JSON" }]
                    });
                }
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
            } else {
                return _response;
            }
        }).catch((e) => {
            if (e.isESPExceptions) {
                throw e;
            }
            if (e instanceof ConnectionError) {
                throw new ESPExceptions(action, request, {
                    Source: "Connection.transmit",
                    Exception: [{ Code: 0, Message: "ConnectionError" }]
                }, e.info);
            }
            throw new ESPExceptions(action, request, {
                Source: "Connection.transmit",
                Exception: [{ Code: 0, Message: "Unknown exception" }]
            }, e);
        }).catch((e: ESPExceptions) => {
            if (!this.espExceptionHandler(e)) {
                throw e;
            }
        });
    }

    espExceptionHandler(e: ESPExceptions): boolean {
        logger.debug(JSON.stringify(e));
        return false;
    }

    send(href: string, form: any = {}, responseType: ResponseType = ResponseType.JSON): Promise<any> {
        return this.transmit(this.defaultMode, href, form, responseType === ResponseType.JSON);
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
}
*/
