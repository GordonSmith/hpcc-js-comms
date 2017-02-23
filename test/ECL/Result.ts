import { Result } from "../../src/ECL/Result";
import { describe, expect, it } from "../lib";

describe.skip("Result", function () {
    it("basic", function () {
        expect(Result).is.function;
    });
});
