import { all, failedWUQuery } from "./ECLWorkunit";

describe("ECLWorkunit", function () {
    this.timeout(10000);
    it("createSubmit", function () {
        return failedWUQuery().then((response) => {
            return response;
        });
    });
})