import { Promise } from "es6-promise";
import * as request from "request";
import * as URLParser from "url-parse";

const os = {
    EOL: "\n"
};

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
        if (postResponse && postResponse.statusCode === 200) {
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
    set href(_: string) {
        this.url = new URLParser(_);
    }
    get href(): string {
        return this.url.href;
    }
    user: string = "";
    pw: string = "";

    constructor(href: string) {
        this.url = new URLParser(href);
    }

    post(action: string, form: Object): Promise<any> {
        let context = this;
        return new Promise<ESPPostResponse>((resolve, reject) => {
            let requestInfo = {
                uri: this.href + '/' + action + '.json',
                json: true,
                form: form
            };
            if (this.user) {
                requestInfo["auth"] = {
                    user: this.user,
                    pass: this.pw,
                    sendImmediately: true
                };
            }

            request.post(requestInfo, (error, response, body) => {
                resolve(new ESPPostResponse(action, form, error, response, body));
            });
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
}


