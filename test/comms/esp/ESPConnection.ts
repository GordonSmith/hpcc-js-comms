import { ESPTransport } from "../../../src/comms/esp/ESPConnection";
import { describe, expect, it } from "../../lib";

describe.skip("ESPTransport", function () {
    it("basic", function () {
        expect(ESPTransport).is.function;
    });
});
