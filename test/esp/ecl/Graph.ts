import { expect } from "chai";

import { Graph } from "../../../src/esp/ecl/graph";

describe("Graph", function () {
    it("basic", function () {
        expect(Graph).to.be.a("function");
    });
});
