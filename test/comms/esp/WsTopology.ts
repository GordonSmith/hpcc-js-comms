import { Service } from "../../../src/comms/esp/WsTopology";
import { describe, expect, it } from "../../lib";

describe.skip("WsTopology", function () {
    it("basic", function () {
        const service = new Service("http://192.168.3.22:8010/");
        expect(service).exist;
    });
});
