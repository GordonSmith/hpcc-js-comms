//  XHR polyfill  ---
import * as nodeRequest from "request";
import { initNodeRequest } from "./comms/connection";
initNodeRequest(nodeRequest);

export * from "./index-common";
