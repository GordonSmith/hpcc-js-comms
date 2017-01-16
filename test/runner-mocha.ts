import { createSubmit } from "./ECLWorkunit"

describe.only("ECLWorkunit", function () {
    it("createSubmit", function () {
        console.log("testStarted");
        return createSubmit().then((response) => {
            console.log("testEnded");
            return response;
        });
    });
})