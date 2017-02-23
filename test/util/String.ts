import { endsWith } from "../../src/util/String";
import { describe, expect, it } from "../lib";

describe("String", function () {
    it("endsWith", function () {
        expect(endsWith("abcdef", "f")).true;
        expect(endsWith("abcdef", "ef")).true;
        expect(endsWith("abcdef", "def")).true;
        expect(endsWith("abcdef", "deff")).false;
        expect(endsWith("", "")).true;
        expect(endsWith("", "x")).false;
    });
});
