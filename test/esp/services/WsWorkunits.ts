import { expect } from "chai";

import { JSONPTransport, XHRGetTransport, XHRPostTransport } from "../../../src/comms/index";
import { ECLWorkunit, Service } from "../../../src/esp/services/WsWorkunits";
import { ESP_URL, isBrowser, isTravis } from "../../lib";

describe("WsWorkunits", function () {
    describe("POST", function () {
        const wsWorkunits = new Service(new XHRPostTransport(ESP_URL));
        doTest(wsWorkunits);
    });
    describe("GET", function () {
        const wsWorkunits = new Service(new XHRGetTransport(ESP_URL));
        doTest(wsWorkunits);
    });
    if (isBrowser()) {
        describe("JSONP", function () {
            const wsWorkunits = new Service(new JSONPTransport(ESP_URL));
            doTest(wsWorkunits);
        });
    }
});

function doTest(wsWorkunits: Service) {
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
    if (!isTravis()) {
        it("WUDetails", function () {
            return wsWorkunits.WUDetails({ WUID: wu.Wuid }).then((response) => {
                expect(response).exist;
                expect(response.WUID).to.equal(wu.Wuid);
                return response;
            });
        });
    }
}
