import { expect } from "chai";
import { ESPConnection } from "../src/comms"

describe("ESPConnection", function () {
    it("basic-post", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it("basic-get", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.get("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it.only("basic-progress", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits")
            .on("progress", function (_) {
                debugger;
            });
        expect(espConnection).to.be.not.null;
        return espConnection.get("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it("basic-auth", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        espConnection.userID = "gosmith";
        espConnection.userPW = "???";
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", {}).then((response) => {
            expect(response).to.be.not.undefined;
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
            expect(response).to.be.not.undefined;
            expect(response.hasContent()).to.be.true;
            return response;
        });
    });
});

describe("ESPConnection-vm", function () {
    it("basic", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
            expect(response.__exceptions).to.be.undefined;
        });
    });
    it("exception", function () {
        var espConnection = new ESPConnection("http://192.168.3.22:8010/WsWorkunits");
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUInfo", { MissingWUID: "" }).then((response) => {
            expect(response).to.be.not.undefined;
            expect(response.__exceptions).to.be.not.undefined;
        });
    });
});

