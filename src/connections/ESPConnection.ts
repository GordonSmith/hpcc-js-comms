import { Promise } from "es6-promise";
import { logger } from "../Util/Logging";
import { Connection, ConnectionError, VERB } from "./Connection";

export function inner(prop: string, obj: Object): any {
    if (prop === void 0 || obj === void 0) return void 0;
    for (let item of prop.split(".")) {
        if (obj[item] === undefined) {
            return undefined;
        }
        obj = obj[item];
    }
    return obj;
}

export function exists(prop: string, obj: Object): boolean {
    return inner(prop, obj) !== undefined;
};

export function mixin(target: any, ...args: any[]) {
    if (target == null) {
        throw new TypeError("Cannot convert undefined or null to object");
    }

    let to = Object(target);
    for (let nextSource of args) {
        if (nextSource != null) { // Skip over if undefined or null
            for (let nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
};

export function isArray(arg) {
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

    constructor(action: string, request: any, exceptions: Exceptions, extInfo?: any) {
        super("ESPException:  " + exceptions.Source);
        this.action = action;
        this.request = request;
        this.Source = exceptions.Source;
        this.Exception = exceptions.Exception;
    }
}

export enum ResponseType {
    JSON,
    TEXT
}

export class ESPConnection extends Connection {
    readonly href: string;

    constructor(href: string) {
        super();
        this.href = href;
    }

    protected transmit(verb: VERB, action: string, form: any, responseType: ResponseType = ResponseType.JSON): Promise<any> {
        return super.transmit(verb, this.href + "/" + action + ".json", form).then((_response) => {
            switch (responseType) {
                case ResponseType.JSON:
                    let response;
                    try {
                        response = JSON.parse(_response);
                    } catch (e) {
                        throw new ESPExceptions(action, form, {
                            Source: "ESPConnection.transmit",
                            Exception: [{ Code: 0, Message: "Invalid JSON" }]
                        });
                    }
                    if (response.Exceptions) {
                        throw new ESPExceptions(action, form, response.Exceptions);
                    }
                    let retVal = response[`${action}Response`];
                    if (!retVal) {
                        throw new ESPExceptions(action, form, {
                            Source: "ESPConnection.transmit",
                            Exception: [{ Code: 0, Message: "Missing Response" }]
                        });
                    }
                    return retVal;
                case ResponseType.TEXT:
                default:
                    return _response;
            }
        }).catch((e) => {
            if (e.isESPExceptions) {
                throw e;
            }
            if (e instanceof ConnectionError) {
                throw new ESPExceptions(action, form, {
                    Source: "Connection.transmit",
                    Exception: [{ Code: 0, Message: "ConnectionError" }]
                }, e.info);
            }
            throw new ESPExceptions(action, form, {
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
        return this.transmit(this.defaultMode, href, form, responseType);
    }

    toESPStringArray(target: Object, arrayName: string): Object {
        if (isArray(target[arrayName])) {
            for (let i = 0; i < target[arrayName].length; ++i) {
                target[arrayName + "_i" + i] = target[arrayName][i];
            }
            delete target[arrayName];
        }
        return target;
    }
}
