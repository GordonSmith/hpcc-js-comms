import { expect } from "chai";

import { Result } from "../../../src/esp/ecl/result";

describe("Result", function () {
    it("basic", function () {
        expect(Result).to.be.a("function");
    });
});
