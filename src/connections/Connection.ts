import { request } from "d3-request";
import { Promise } from "es6-promise";
import { EventTarget } from "../util/EventTarget";
import { logger } from "../util/Logging";

const os = {
    EOL: "\n"
};

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

    protected transmit(verb: VERB, href: string, form: any): Promise<any> {
        const context = this;
        this.eventTarget.dispatchEvent("progress", "preSend");
        return new Promise((resolve, reject) => {
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
                        reject(new ConnectionError("Statuse !== 200", response.responseText));
                    }
                })
                .on("error", (response) => {
                    reject(new ConnectionError("Unknown", response));
                })
                .send(verb, formStr);
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
