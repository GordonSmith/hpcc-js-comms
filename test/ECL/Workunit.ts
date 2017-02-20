import { expect } from "chai";
import { Promise } from "es6-promise";
import { Workunit } from "../../src/ECL/Workunit";

const VM_HOST: string = "http://192.168.3.22:8010";
// const VM_URL: string = "http://192.168.3.22:8010/WsWorkunits";
// const PUBLIC_URL: string = "http://52.51.90.23:8010/WsWorkunits";
describe("Workunit", function () {
    let wuid: string;
    describe("simple life cycle", function () {
        let wu1: Workunit;
        it("creation", function () {
            return Workunit.create(VM_HOST).then((wu) => {
                expect(wu).exist;
                expect(wu.Wuid).exist;
                wu1 = wu;
                wuid = wu.Wuid;
                return wu;
            });
        });
        it("update", function () {
            return wu1.update({ QueryText: "'Hello and Welcome!';" });
        });
        it("submit", function () {
            return wu1.submit("hthor");
        });
        it("complete", function () {
            return new Promise((resolve) => {
                if (wu1.isComplete()) {
                    resolve();
                } else {
                    wu1.on("completed", () => {
                        resolve();
                    });
                }
            });
        });
        it("results", function () {
            return wu1.fetchResults().then((results) => {
                expect(results.length).equals(1);
                return wu1.CResults[0].fetchXMLSchema().then((result) => {
                    // console.log(JSON.stringify(results));
                    return wu1;
                });
                // console.log(JSON.stringify(results));
            });
        });
    });
    describe("XSD Parsing", function () {
        it("basic", function () {
            const wu = Workunit.attach(VM_HOST, wuid);
            let result;
            return wu.fetchResults().then((response) => {
                result = wu.CResults[0];
                return result.fetchXMLSchema().then((response2) => {
                    // console.log(JSON.stringify(results));
                    return wu;
                }).then(() => {
                    /*
                    return result.fetchResult().then((response) => {
                        // console.log(JSON.stringify(results));
                        return wu;
                    });
                    */
                });
            });
        });
    });
});
