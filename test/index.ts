import { expect } from "chai";
import { ESPConnection } from "../src/comms"

describe("ESPConnection", function () {
    it("basic", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", {}).then((response) => {
            return response;
        });
    });
    it("basic-auth", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        espConnection.user = "gosmith";
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", {}).then((response) => {
            expect(response).to.be.not.null;
            expect(response.NumWUs).to.be.not.null;
            expect(response.NumWUs).to.be.greaterThan(0);
            return response;
        });
    });
});
