import { expect } from "chai";
import { ESPConnection } from "../src/comms"

declare var process: any;

const VM_URL = "http://192.168.3.22:8010/WsWorkunits";
const PUBLIC_URL = "http://52.51.90.23:8010/WsWorkunits";

describe("ESPConnection", function () {
    it("basic-post", function () {
        var espConnection = new ESPConnection(PUBLIC_URL);
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it("basic-get", function () {
        var espConnection = new ESPConnection(PUBLIC_URL);
        expect(espConnection).to.be.not.null;
        return espConnection.get("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it("basic-progress", function () {
        var espConnection = new ESPConnection(PUBLIC_URL)
            .on("progress", function (_) {
            });
        expect(espConnection).to.be.not.null;
        return espConnection.get("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it("basic-auth", function () {
        var espConnection = new ESPConnection(PUBLIC_URL);
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

if (!process.env.TRAVIS) {
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
            var espConnection = new ESPConnection(VM_URL);
            expect(espConnection).to.be.not.null;
            return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
                expect(response).to.be.not.undefined;
                expect(response.__exceptions).to.be.undefined;
            });
        });

        it("exception", function () {
            var espConnection = new ESPConnection(VM_URL);
            expect(espConnection).to.be.not.null;
            return espConnection.post("WUInfo", { MissingWUID: "" }).then((response) => {
                expect(response).to.be.not.undefined;
                expect(response.__exceptions).to.be.not.undefined;
            });
        });
    });
}

