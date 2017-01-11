import { Promise } from "es6-promise";
import { request } from "d3-request";

const os = {
    EOL: "\n"
};

type VERB = "GET" | "POST";

class ESPPostResponse {
    protected action: string;
    protected form: Object;
    protected error: any;
    protected exceptions: any;
    protected _content: Object;

    constructor(action: string, form: Object, error?, postResponse?, body?) {
        this.action = action;
        this.form = form;
        this.error = error;
        if (postResponse && postResponse.status === 200) {
            for (let key in body) {
                switch (key) {
                    case 'Exceptions':
                        this.exceptions = body[key];
                        return;
                    default:
                        if (this._content) {
                            throw 'Two responses';
                        }
                        this._content = body[key];
                        break;
                }
            }
        }
    }

    hasContent(): boolean {
        return this._content !== undefined;
    }

    content() {
        return this._content;
    }

    hasPostErrors(): boolean {
        return this.error;
    }

    postErrorsMessage() {
        return this.error.message;
    }

    hasExceptions(): boolean {
        return this.exceptions && this.exceptions.Exception.length;
    }

    exceptionsMessage(): string {
        let retVal: string = `${os.EOL}${this.action}(` + JSON.stringify(this.form) + `))${os.EOL}ESP Exception:  ${this.exceptions.Source}`;
        this.exceptions.Exception.forEach(function (exception) {
            if (retVal) retVal += os.EOL;
            retVal += exception.Code + ':  ' + exception.Message;
        });
        return retVal;
    }
}

export class ESPConnection {
    protected url;
    href: string = "";
    userID: string = "";
    userPW: string = "";

    constructor(href: string) {
        this.href = href;
    }

    serialize(obj) {
        var str = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
            }
        }
        return str.join("&");
    }

    send(verb: VERB, action: string, form: any): Promise<any> {
        let context = this;
        return new Promise<ESPPostResponse>((resolve, reject) => {
            let formStr = this.serialize(form);
            request(this.href + '/' + action + '.json' + (verb === "GET" ? "?" + formStr : ""), null)
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .mimeType("application/json")
                .user(this.userID)
                .password(this.userPW)
                .send(verb, formStr, (error, response: any) => {
                    resolve(new ESPPostResponse(action, form, error, response, response && response.responseText ? JSON.parse(response.responseText) : null));
                })
                ;
        }).then(postResponse => {
            if (postResponse.hasPostErrors()) {
                throw new Error(postResponse.postErrorsMessage());
            }
            if (postResponse.hasExceptions()) {
                throw new Error(postResponse.exceptionsMessage());
            }
            return postResponse.content();
        }).catch(e => {
            debugger;
        });
    }

    get(action: string, form: any): Promise<any> {
        return this.send("GET", action, form);
    }

    post(action: string, form: any): Promise<any> {
        return this.send("POST", action, form);
    }
}


