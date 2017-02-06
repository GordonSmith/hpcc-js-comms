import { unitTest as utEventTarget } from "../src/util/EventTarget";
import { unitTest as utLogging } from "../src/util/Logging";
import { unitTest as utWorkunit } from "../src/ECL/Workunit";

import { expect } from "chai";
(global || window)["expect"] = expect;

utEventTarget();
utLogging();
utWorkunit();

/*
describe("EventTarget", function () {
    it("unitTest", function () {
        return utEventTarget();
    });
});

describe("Logging", function () {
    it("unitTest", function () {
        return utLogging();
    });
});
*/