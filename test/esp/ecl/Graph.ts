import { expect } from "chai";

import { ECLGraph } from "../../../src/esp/ecl/graph";

describe("Graph", function () {
    it("basic", function () {
        expect(ECLGraph).to.be.a("function");
    });
});
