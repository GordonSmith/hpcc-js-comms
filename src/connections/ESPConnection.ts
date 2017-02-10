import { Promise } from "es6-promise";
import { logger } from "../util/Logging";
import { Connection, ConnectionError, VERB } from "./Connection";

export function inner(prop: string, obj: any): any {
    if (prop === void 0 || obj === void 0) return void 0;
    for (const item of prop.split(".")) {
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

export function isArray(arg: any) {
    return Object.prototype.toString.call(arg) === "[object Array]";
};

export function espTime2Seconds(duration) {
    if (!duration) {
        return 0;
    } else if (!isNaN(duration)) {
        return parseFloat(duration);
    }
    //  GH:  <n>ns or <m>ms or <s>s or [<d> days ][<h>:][<m>:]<s>[.<ms>]
    const nsIndex = duration.indexOf("ns");
    if (nsIndex !== -1) {
        return parseFloat(duration.substr(0, nsIndex)) / 1000000000;
    }
    const msIndex = duration.indexOf("ms");
    if (msIndex !== -1) {
        return parseFloat(duration.substr(0, msIndex)) / 1000;
    }
    const sIndex = duration.indexOf("s");
    if (sIndex !== -1 && duration.indexOf("days") === -1) {
        return parseFloat(duration.substr(0, sIndex));
    }

    const dayTimeParts = duration.split(" days ");
    const days = parseFloat(dayTimeParts.length > 1 ? dayTimeParts[0] : 0.0);
    const time = dayTimeParts.length > 1 ? dayTimeParts[1] : dayTimeParts[0];
    let secs = 0.0;
    const timeParts = time.split(":").reverse();
    for (let j = 0; j < timeParts.length; ++j) {
        secs += parseFloat(timeParts[j]) * Math.pow(60, j);
    }
    return (days * 24 * 60 * 60) + secs;
}

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
    private readonly href: string;

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
                    const retVal = response[`${action}Response`];
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

//  Unit Tests ---
declare function expect(...args): any;
export function unitTest() {
    describe("ESPConnection", function () {
        it("espTime2SecondsTests", function () {
            const tests = [
                { str: "1.1s", expected: 1.1 },
                { str: "2.2ms", expected: 0.0022 },
                { str: "3.3ns", expected: 0.0000000033 },
                { str: "4.4", expected: 4.4 },
                { str: "5:55.5", expected: 355.5 },
                { str: "6:06:06.6", expected: 21966.6 },
                { str: "6:06:6.6", expected: 21966.6 },
                { str: "6:6:6.6", expected: 21966.6 },
                { str: "7 days 7:07:7.7", expected: 630427.7 }
            ];
            tests.forEach(function (test, idx) {
                expect(espTime2Seconds(test.str)).equals(test.expected);
            }, this);
        });
    });
}
