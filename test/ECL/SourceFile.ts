import { SourceFile } from "../../src/ECL/SourceFile";
import { describe, expect, it } from "../lib";

describe.skip("SourceFile", function () {
    it("basic", function () {
        expect(SourceFile).is.function;
    });
});
