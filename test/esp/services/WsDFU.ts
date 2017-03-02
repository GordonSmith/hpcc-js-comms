import { expect } from "chai";

import { Service } from "../../../src/esp/services/WsDFU";

describe("WsFU", function () {
    it("basic", function () {
        const service = new Service("http://192.168.3.22:8010/");
        expect(service).exist;
    });
});
