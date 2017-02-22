import { expect } from "chai";
import { ECLWorkunit, Service } from "../../../src/comms/esp/WsWorkunits";
import { createTransport } from "../../../src/comms/Transport";

describe("WsWorkunits", function () {
    describe("POST", function () {
        const wsWorkunits = new Service(createTransport("http://192.168.3.22:8010/"));
        doTest(wsWorkunits);
    });
    describe("GET", function () {
        const wsWorkunits = new Service(createTransport("http://192.168.3.22:8010/"));
        doTest(wsWorkunits);
    });
});

function doTest(wsWorkunits) {
    let wu: ECLWorkunit;
    it("WUQuery", function () {
        return wsWorkunits.WUQuery().then((response) => {
            expect(response).exist;
            expect(response.Workunits).exist;
            wu = response.Workunits.ECLWorkunit[0];
            return response;
        });
    });
    it("WUInfo", function () {
        return wsWorkunits.WUInfo({ Wuid: wu.Wuid }).then((response) => {
            expect(response).exist;
            expect(response.Workunit).exist;
            return response;
        });
    });
}
