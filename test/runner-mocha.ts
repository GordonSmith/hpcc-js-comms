import { createSubmit } from "./ECLWorkunit"

describe.only("ECLWorkunit", function () {
    this.timeout(10000);
    it("createSubmit", function () {
        return createSubmit().then((response) => {
            return response;
        });
    });
})