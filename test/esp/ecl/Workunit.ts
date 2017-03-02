import { expect } from "chai";

import { Workunit } from "../../../src/esp/ecl/Workunit";
import { ESP_URL } from "../../lib";

describe("Workunit", function () {
    let wuid: string;
    describe("simple life cycle", function () {
        let wu1: Workunit;
        it("creation", function () {
            return Workunit.create(ESP_URL).then((wu) => {
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
                return wu1.CResults[0].fetchXMLSchema().then((schema) => {
                    expect(schema.root).exist;
                    return schema;
                });
            });
        });
        it("delete", function () {
            return wu1.delete().then(function (response) {
                expect(wu1.isComplete()).is.true;
                expect(wu1.isDeleted()).is.true;
                return response;
            });
        });
    });
});
