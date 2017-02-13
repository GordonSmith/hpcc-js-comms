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

export type VERB = "GET" | "POST";
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

    protected transmit(verb: VERB, href: string, _request: Object, jsonContent: boolean = true): Promise<any> {
        this.eventTarget.dispatchEvent("progress", "preSend");
        return new Promise((resolve, reject) => {
            const request = jsonContent ? _request : this.serialize(_request);
            xhr({
                url: href,
                json: jsonContent,
                body: request,
                method: verb,
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                rejectUnauthorized: true,
                useXDR: true,
                auth: {
                    user: this.userID,
                    pass: this.userPW,
                    sendImmediately: true
                },
                username: this.userID,
                password: this.userPW
            }, (err, resp, body) => {
                if (err) {
                    reject(new ConnectionError("Transmit error", err));
                }
                if (resp && resp.statusCode === 200) {
                    resolve(body);
                } else {
                    reject(new ConnectionError("Status !== 200", resp.responseText));
                }
            });
            /*
            const formStr = this.serialize(form);
            request(href + (verb === "GET" ? "?" + formStr : ""))
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .user(this.userID)
                .password(this.userPW)
                .on("beforesend.nodejs", (_) => { })
                .on("progress", (_) => {
                    this.eventTarget.dispatchEvent("progress", _);
                })
                .on("load", (response: XMLHttpRequest) => {
                    if (response && response.status === 200) {
                        resolve(response.responseText);
                    } else {
                        reject(new ConnectionError("Status !== 200", response.responseText));
                    }
                })
                .on("error", (response) => {
                    reject(new ConnectionError("Unknown", response));
                })
                .send(verb, formStr);
                */
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
