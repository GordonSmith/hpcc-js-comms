import { Service } from "../../../src/comms/esp/WsDFU";
import { describe, expect, it } from "../../lib";

describe.skip("WsFU", function () {
    it("basic", function () {
        const service = new Service("http://192.168.3.22:8010/");
        expect(service).exist;
    });
});
