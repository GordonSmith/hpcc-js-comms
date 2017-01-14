import { Promise } from "bluebird";
import { request } from "d3-request";
import { dispatch } from "d3-dispatch";

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

type VERB = "GET" | "POST";
export class Connection {
    userID: string = "";
    userPW: string = "";
    defaultMode: VERB = "GET";

    event = dispatch("progress");

    constructor() {
    }

    on(_: string, callback?: Function) {
        var value = this.event.on.apply(this.event, arguments);
        return value === this.event ? this : value;
    }

    serialize(obj) {
        var str: string[] = [];
        for (var key in obj) {
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

export class ESPConnection extends Connection {
    readonly href: string;

    constructor(href: string) {
        super();
        this.href = href;
    }

    protected transmit(verb: VERB, action: string, form: any): Promise<ESPresponse> {
        return super.transmit(verb, this.href + '/' + action + '.json', form).then((response) => {
            let body;
            try {
                body = JSON.parse(response);
            } catch (e) {
                throw new ConnectionError('Invalid JSON', response);
            }
            let exceptions: any | null = null;
            let content: any | null = null;

            for (let key in body) {
                switch (key) {
                    case 'Exceptions':
                        exceptions = body[key];
                        break;
                    default:
                        if (content) {
                            throw new ConnectionError('ESP:  Two Responses', body);
                        }
                        content = body[key];
                        break;
                }
            }
            content = content || {};
            if (exceptions) {
                content.__exceptions = exceptions;
            }
            return content;
        });
    }
}

