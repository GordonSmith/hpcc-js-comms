export const version = "0.0.1";

//  Util/Collections  - Should be its own package?
export { logger } from "./util/logging";
export { IObserverHandle } from "./util/observer";
export { espTime2Seconds } from "./util/esp";
export { Graph, IGraphItem } from "./collections/graph";

//  Comms transport - Should be its own package?
import * as connecton from "./comms/connection";
export const Connecton = connecton;

//  Raw Services  ---
export { Service as WsWorkunits, WUAction } from "./esp/services/wsWorkunits";
export { Service as WsTopology } from "./esp/services/wsTopology";
export { Service as WsSMC } from "./esp/services/wsSMC";
export { Service as WsDFU } from "./esp/services/wsDFU";

//  OO Wrappers  ---
export { ECLGraph } from "./esp/ecl/graph";
export { Resource } from "./esp/ecl/resource";
export { Result } from "./esp/ecl/result";
export { SourceFile } from "./esp/ecl/sourceFile";
export { Timer } from "./esp/ecl/timer";
export { Workunit } from "./esp/ecl/workunit";

// export { Test } from "./test";
