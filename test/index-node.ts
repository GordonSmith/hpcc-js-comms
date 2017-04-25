//  Set logging level  ---
import { Level, logger } from "../src/util/logging";
import { isTravis } from "./testLib";
if (!isTravis()) {
    logger.level(Level.debug);
}

//  Load tests  ---
import "../src/index-node";
import "./clienttools/eclcc";
import "./index-common";
