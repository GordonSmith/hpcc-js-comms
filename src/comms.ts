import { Promise } from "bluebird";
import { request } from "d3-request";
import { dispatch } from "d3-dispatch";

const os = {
    EOL: "\n"
};

export class ConnectionError extends Error {
};

type VERB = "GET" | "POST";
export class Connection {
    userID: string = "";
    userPW: string = "";

    constructor() {
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

    protected send(verb: VERB, href: string, form: any): Promise<any> {
        let context = this;
        return new Promise((resolve, reject) => {
            let formStr = this.serialize(form);
            request(href + (verb === "GET" ? "?" + formStr : ""))
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .user(this.userID)
                .password(this.userPW)
                .on("beforesend.nodejs", function (_) {
                    _.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                })
                .on("progress", (_) => { })
                .on("load", (response: XMLHttpRequest) => {
                    if (response && response.status === 200) {
                        resolve(response.responseText);
                    } else {
                        reject(new ConnectionError(response.responseText));
                    }
                })
                .on("error", (response) => {
                    reject(new ConnectionError("Connection error"));
                })
                .send(verb, formStr);
        });
    }

    get(href: string, form: any): Promise<any> {
        return this.send("GET", href, form);
    }

    post(href: string, form: any): Promise<any> {
        return this.send("POST", href, form);
    }
}

export class ESPConnection extends Connection {
    readonly href: string;

    constructor(href: string) {
        super();
        this.href = href;
    }

    protected send(verb: VERB, action: string, form: any): Promise<ESPresponse> {
        return super.send(verb, this.href + '/' + action + '.json', form).then((response) => {
            let body = JSON.parse(response);
            let exceptions: any | null = null;
            let content: any | null = null;

            for (let key in body) {
                switch (key) {
                    case 'Exceptions':
                        exceptions = body[key];
                        break;
                    default:
                        if (content) {
                            throw new Error('ESP:  Two Responses');
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

