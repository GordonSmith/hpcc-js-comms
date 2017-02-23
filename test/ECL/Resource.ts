import { Resource } from "../../src/ECL/Resource";
import { describe, expect, it } from "../lib";

describe.skip("Resource", function () {
    it("basic", function () {
        expect(Resource).is.function;
    });
});
