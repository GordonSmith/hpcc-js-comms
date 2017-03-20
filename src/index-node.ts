// DOM Parser polyfill  ---
import { DOMParser } from "xmldom";
import { root } from "./util/platform";
root.DOMParser = DOMParser;

//  XHR polyfill  ---
import * as nodeRequest from "request";
import { initNodeRequest } from "./comms/connection";
initNodeRequest(nodeRequest);

//  btoa polyfill  ---
import { Buffer } from "safe-buffer";
if (typeof btoa === "undefined") {
    (global as any).btoa = function (str) {
        return Buffer.from(str || "", "utf8").toString("base64");
    };
}

export * from "./index-common";

//  Client Tools  ---
export { locateAllClientTools, locateClientTools, IECLError } from "./clienttools/eclcc";
export { attachWorkspace, qualifiedIDBoundary, ECLScope } from "./clienttools/eclMeta";
