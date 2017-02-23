import { Timer } from "../../src/ECL/Timer";
import { describe, expect, it } from "../lib";

describe.skip("Timer", function () {
    it("basic", function () {
        expect(Timer).is.function;
    });
});
