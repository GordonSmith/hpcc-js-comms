import { logger } from "../../src/util/Logging";
import { describe, expect, it } from "../lib";

describe("Logging", function () {
    it("unitTest", function () {
        expect(logger).exist;
    });
});
