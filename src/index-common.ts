export const version = "0.0.1";

//  Comms transport - Should be its own package?
import * as connecton from "./comms/connection";
export const Connecton = connecton;

//  Raw Services  ---
export { Service as WsWorkunits, WUAction } from "./esp/services/wsWorkunits";
export { Service as WsTopology } from "./esp/services/wsTopology";
export { Service as WsSMC } from "./esp/services/wsSMC";
export { Service as WsDFU } from "./esp/services/wsDFU";

//  OO Wrappers  ---
export { Workunit } from "./esp/ecl/workunit";
export { Result } from "./esp/ecl/result";
export { SourceFile } from "./esp/ecl/sourceFile";
export { Resource } from "./esp/ecl/resource";
export { Timer } from "./esp/ecl/timer";

//  Utils  - Should be its own package?
export { IObserverHandle } from "./util/observer";
export { espTime2Seconds } from "./util/esp";

// export { Test } from "./test";
