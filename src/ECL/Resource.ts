import { Connection, Options } from "../connections/WsWorkunits";
import { ESPStateObject } from "./ESPStateObject";

export interface ResourceEx {
    Wuid: string;
    URL: string;
    DisplayName: string;
    DisplayPath: string;
}

export class Resource extends ESPStateObject<ResourceEx, ResourceEx> implements ResourceEx {
    protected connection: Connection;

    get properties(): ResourceEx { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get URL(): string { return this.get("URL"); }
    get DisplayName(): string { return this.get("DisplayName"); }
    get DisplayPath(): string { return this.get("DisplayPath"); }

    constructor(href: string, wuid: string, url: string, opts: Options) {
        super();
        this.connection = new Connection(href, opts);

        const cleanedURL = url.split("\\").join("/");
        const urlParts = cleanedURL.split("/");
        const matchStr = "res/" + wuid + "/";
        let displayPath = "";
        let displayName = "";

        if (cleanedURL.indexOf(matchStr) === 0) {
            displayPath = cleanedURL.substr(matchStr.length);
            displayName = urlParts[urlParts.length - 1];
        }

        this.set({
            Wuid: wuid,
            URL: url,
            DisplayName: displayName,
            DisplayPath: displayPath
        });
    }
}
