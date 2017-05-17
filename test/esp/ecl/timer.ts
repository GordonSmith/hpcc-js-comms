import { expect } from "chai";

import { Timer } from "../../../src/esp/ecl/timer";

describe("Timer", function () {
    it("basic", function () {
        expect(Timer).to.be.a("function");
    });
});
