import { Promise } from "es6-promise";
import * as xhr from "request";
import { endsWith } from "../util/String";

export type ResponseType = "json" | "text";

export type TransportOptions = {
    baseUrl: string,
    userID?: string,
    password?: string,
    [key: string]: any
};
export interface ITransport {
    send(action: string, request: any, responseType?: ResponseType): Promise<any>;
    opts(_: TransportOptions): this;
    opts(): TransportOptions;
}

export class Transport {
    protected _opts: TransportOptions;

    constructor(baseUrl: string) {
        this.opts({ baseUrl });
    }

    opts(_: TransportOptions): this;
    opts(): TransportOptions;
    opts(_?: TransportOptions): this | TransportOptions {
        if (arguments.length === 0) return this._opts;
        this._opts = { ...this._opts, ..._ };
        return this;
    }

    protected serialize(obj: any) {
        const str: string[] = [];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
            }
        }
        return str.join("&");
    }

    deserialize(body: string) {
        return JSON.parse(body);
    }

    stripSlashes(str: string) {
        while (str.indexOf("/") === 0) {
            str = str.substring(1);
        }
        while (endsWith(str, "/")) {
            str = str.substring(0, str.length - 1);
        }
        return str;
    }

    joinUrl(...args: string[]) {
        return this.stripSlashes(this._opts.baseUrl) + "/" + args.map((arg) => {
            return this.stripSlashes(arg);
        }).join("/");
    }
}

export class JSONPTransport extends Transport implements ITransport {
    timeout: number;

    constructor(baseUrl: string, timeout: number = 60) {
        super(baseUrl);
        this.timeout = timeout;
    }

    send(action: string, request: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let respondedTimeout = this.timeout * 1000;
            const respondedTick = 5000;
            const callbackName = "jsonp_callback_" + Math.round(Math.random() * 999999);
            window[callbackName] = function (response) {
                respondedTimeout = 0;
                doCallback();
                resolve(response);
            };
            const script = document.createElement("script");
            let url = this.joinUrl(action);
            url += url.indexOf("?") >= 0 ? "&" : "?";
            script.src = url + "jsonp=" + callbackName + "&" + this.serialize(request);
            document.body.appendChild(script);
            const progress = setInterval(function () {
                if (respondedTimeout <= 0) {
                    clearInterval(progress);
                } else {
                    respondedTimeout -= respondedTick;
                    if (respondedTimeout <= 0) {
                        clearInterval(progress);
                        // console.log("Request timeout:  " + script.src);
                        doCallback();
                        reject(Error("Request timeout:  " + script.src));
                    } else {
                        // console.log("Request pending (" + respondedTimeout / 1000 + " sec):  " + script.src);
                    }
                }
            }, respondedTick);

            function doCallback() {
                delete window[callbackName];
                document.body.removeChild(script);
            }
        });
    };
}

class XHRTransport extends Transport implements ITransport {
    timeout: number;
    verb: "GET" | "POST";
    userID: string;
    password: string;
    rejectUnauthorized: boolean;

    constructor(baseUrl: string, verb: "GET" | "POST", userID: string = "", password: string = "", rejectUnauthorized: boolean = true) {
        super(baseUrl);
        this.verb = verb;
        this.userID = userID;
        this.password = password;
        this.rejectUnauthorized = rejectUnauthorized;
    }

    send(action: string, request: any, responseType: ResponseType = "json"): Promise<any> {
        return new Promise((resolve, reject) => {
            const options: any = {
                method: this.verb,
                uri: this.joinUrl(action),
                auth: {
                    user: this.userID,
                    pass: this.password,
                    sendImmediately: true
                },
                username: this.userID,
                password: this.password
            };
            switch (this.verb) {
                case "GET":
                    options.uri += "?" + this.serialize(request);
                    break;
                case "POST":
                    options.headers = {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/x-www-form-urlencoded"
                    };
                    options.rejectUnauthorized = this.rejectUnauthorized;
                    options.body = this.serialize(request);
                    break;
                default:
            }
            xhr(options, (err, resp, body) => {
                if (err) {
                    reject(new Error(err));
                }
                if (resp && resp.statusCode === 200) {
                    resolve(responseType === "json" ? this.deserialize(body) : body);
                } else {
                    reject(new Error(body));
                }
            });
        });
    }
}

export class XHRGetTransport extends XHRTransport implements ITransport {
    constructor(baseUrl: string, userID: string = "", password: string = "", rejectUnauthorized: boolean = true) {
        super(baseUrl, "GET", userID, password, rejectUnauthorized);
    }
}
export class XHRPostTransport extends XHRTransport implements ITransport {
    constructor(baseUrl, userID: string = "", password: string = "", rejectUnauthorized: boolean = true) {
        super(baseUrl, "POST", userID, password, rejectUnauthorized);
    }
}

export type ITransportFactory = (baseUrl: string) => ITransport;
export let createTransport: ITransportFactory = function (baseUrl: string, opts?: TransportOptions): ITransport {
    const retVal = new XHRPostTransport(baseUrl);
    if (opts) {
        retVal.opts(opts);
    }
    return retVal;
};

export function setTransportFactory(newFunc: ITransportFactory): ITransportFactory {
    const retVal = createTransport;
    createTransport = newFunc;
    return retVal;
}
