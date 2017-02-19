import { Promise } from "es6-promise";
import * as xhr from "request";
import { EventTarget } from "../util/EventTarget";

export class ConnectionError extends Error {
    info: any;
    constructor(msg: string, info: any) {
        super(msg);
        this.info = info;
    }
};

export type VERB = "GET" | "POST" | "JSONP";
export class Connection {
    userID: string = "";
    userPW: string = "";
    defaultMode: VERB = "POST";

    eventTarget = new EventTarget();

    constructor() {
    }

    on(_: string, callback: Function) {
        this.eventTarget.addEventListener(_, callback);
        return this;
    }

    serialize(obj: any) {
        const str: string[] = [];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
            }
        }
        return str.join("&");
    }

    protected jsonpTransmit(url: string, request: any, timeout: number = 60): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let respondedTimeout = timeout * 1000;
            const respondedTick = 5000;
            const callbackName = "jsonp_callback_" + Math.round(Math.random() * 999999);
            window[callbackName] = function (response) {
                debugger;
                respondedTimeout = 0;
                doCallback();
                resolve(response);
            };
            const script = document.createElement("script");
            script.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "jsonp=" + callbackName + "&" + this.serialize(request);
            document.body.appendChild(script);
            const progress = setInterval(function () {
                if (respondedTimeout <= 0) {
                    clearInterval(progress);
                } else {
                    respondedTimeout -= respondedTick;
                    if (respondedTimeout <= 0) {
                        clearInterval(progress);
                        console.log("Request timeout:  " + script.src);
                        doCallback();
                        reject(Error("Request timeout:  " + script.src));
                    } else {
                        console.log("Request pending (" + respondedTimeout / 1000 + " sec):  " + script.src);
                    }
                }
            }, respondedTick);

            function doCallback() {
                delete window[callbackName];
                document.body.removeChild(script);
            }
        });
    };

    protected transmit(verb: VERB, href: string, _request: Object): Promise<any> {
        this.eventTarget.dispatchEvent("progress", "preSend");
        return new Promise((resolve, reject) => {
            const options: any = {
                method: verb,
                uri: href,
                auth: {
                    user: this.userID,
                    pass: this.userPW,
                    sendImmediately: true
                },
                username: this.userID,
                password: this.userPW
            };
            switch (verb) {
                case "GET":
                    options.uri += "?" + this.serialize(_request);
                    break;
                case "POST":
                    options.headers = {
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-Type": "application/x-www-form-urlencoded"
                    };
                    options.rejectUnauthorized = true;
                    break;
                default:
            }
            xhr(options, (err, resp, body) => {
                if (err) {
                    reject(new ConnectionError("Transmit error", err));
                }
                if (resp && resp.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(new ConnectionError("Status !== 200", resp.responseText));
                }
            });
            this.eventTarget.dispatchEvent("progress", "postSend");
        });
    }

    get(href: string, form: any): Promise<any> {
        return this.transmit("GET", href, form);
    }

    post(href: string, form: any): Promise<any> {
        return this.transmit("POST", href, form);
    }

    send(href: string, form: any = {}): Promise<any> {
        return this.transmit(this.defaultMode, href, form);
    }
}

export class JSONConnection extends Connection {
    href: string;
    constructor(href: string) {
        super();
        this.href = href;
    }

    transmit(verb: VERB, href: string, request: any): Promise<any> {
        if (verb === "JSONP") {
            return this.jsonpTransmit(href, request);
        }
        return super.transmit(verb, href, request).then((response) => {
            return JSON.parse(response);
        });
    }

    get(form: any = {}): Promise<any> {
        return this.transmit("GET", this.href, form);
    }

    post(form: any = {}): Promise<any> {
        return this.transmit("POST", this.href, form);
    }

    jsonp(form: any = {}): Promise<any> {
        return this.transmit("JSONP", this.href, form);
    }
}
