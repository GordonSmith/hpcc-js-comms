import { expect } from "chai";

import { ESPTransport } from "../../../src/esp/comms/transport";

describe("ESPTransport", function () {
    it("basic", function () {
        expect(ESPTransport).to.be.a("function");
    });
});
