import { expect } from "chai";

import { logger } from "../../src/util/logging";

describe("Logging", function () {
    it("unitTest", function () {
        expect(logger).exist;
    });
});
