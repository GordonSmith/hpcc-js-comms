import { expect } from "chai";
import { ESPConnection } from "../src/comms"

describe("ESPConnection", function () {
    it("basic", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
            return response;
        });
    });
    it("basic-cors", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
            return response;
        });
    });
    it("basic-auth", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        espConnection.userID = "gosmith";
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", {}).then((response) => {
            expect(response).to.be.not.null;
            expect(response.NumWUs).to.be.not.null;
            expect(response.NumWUs).to.be.greaterThan(-1);
            return response;
        });
    });
});

describe.skip("ESPConnection-dataland", function () {
    it("basic", function () {
        var espConnection = new ESPConnection("http://10.241.12.207:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        espConnection.userID = "gosmith";
        espConnection.userPW = "???";
        return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.null;
            expect(response.hasContent()).to.be.true;
            return response;
        });
    });
});

describe.only("ESPConnection-vm", function () {
    it("basic", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.null;
            expect(response.__exceptions).to.be.undefined;
        });
    });
    it("exception", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUInfo", { MissingWUID: "" }).then((response) => {
            expect(response).to.be.not.null;
            expect(response.__exceptions).to.be.not.undefined;
        });
    });
});

