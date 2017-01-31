import { dispatch } from "d3-dispatch";
import { request } from "d3-request";
import { Promise } from "es6-promise";
import { logger } from "../Util/Logging";

const os = {
    EOL: "\n"
};

export class ConnectionError extends Error {
    info;
    constructor(msg, info) {
        super(msg);
        this.info = info;
    }
};

export type VERB = "GET" | "POST";
export class Connection {
    userID: string = "";
    userPW: string = "";
    defaultMode: VERB = "POST";

    event = dispatch("progress");

    constructor() {
    }

    on(_: string, callback?: Function) {
        let value = this.event.on.apply(this.event, arguments);
        return value === this.event ? this : value;
    }

    serialize(obj) {
        let str: string[] = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
            }
        }
        return str.join("&");
    }

    protected transmit(verb: VERB, href: string, form: any): Promise<any> {
        let context = this;
        this.event.call("progress", this, "preSend");
        return new Promise((resolve, reject) => {
            let formStr = this.serialize(form);
            request(href + (verb === "GET" ? "?" + formStr : ""))
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .user(this.userID)
                .password(this.userPW)
                .on("beforesend.nodejs", (_) => { })
                .on("progress", (_) => {
                    this.event.call("progress", this, _);
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
            this.event.call("progress", this, "postSend");
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
