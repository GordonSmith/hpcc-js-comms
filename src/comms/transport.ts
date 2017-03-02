import { endsWith } from "../util/string";

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
