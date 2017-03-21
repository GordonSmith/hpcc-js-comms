import { ITransport, ResponseType, Transport } from "./transport";

export { ITransport } from "./transport";

let _nodeRequest = null;
export function initNodeRequest(request) {
    _nodeRequest = request;
}

let _d3Request = null;
export function initD3Request(request) {
    _d3Request = request;
}

export class XHRTransport extends Transport implements ITransport {
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

    private nodeRequestSend(action: string, request: any, responseType: ResponseType = "json"): Promise<any> {
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
            _nodeRequest(options, (err, resp, body) => {
                if (err) {
                    reject(new Error(err));
                } else if (resp && resp.statusCode === 200) {
                    resolve(responseType === "json" ? this.deserialize(body) : body);
                } else {
                    reject(new Error(body));
                }
            });
        });
    }

    private d3Send(action: string, request: any, responseType: ResponseType = "json"): Promise<any> {
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
            const xhr = _d3Request(options.uri);
            if (this.verb === "POST") {
                xhr
                    .header("X-Requested-With", "XMLHttpRequest")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("Origin", null)
                    ;
            }
            xhr
                .send(this.verb, options.body, (err, req) => {
                    if (err) {
                        reject(new Error(err));
                    } else if (req && req.status === 200) {
                        resolve(responseType === "json" ? this.deserialize(req.responseText) : req.responseText);
                    } else {
                        reject(new Error(req.responseText));
                    }
                });
        });
    }

    send(action: string, request: any, responseType: ResponseType = "json"): Promise<any> {
        if (_nodeRequest) {
            return this.nodeRequestSend(action, request, responseType);
        } else if (_d3Request) {
            return this.d3Send(action, request, responseType);
        }
        throw new Error("No transport");
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
