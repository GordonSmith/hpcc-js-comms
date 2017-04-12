import { expect } from "chai";

import { Dictionary } from "../../src/collections/dictionary";

describe("Dictionary", function () {
    it("basic", function () {
        const dict = new Dictionary<string>();
        expect(dict.exists("aaa")).is.false;
        dict.set("aaa", "hello");
        expect(dict.exists("aaa")).is.true;
        expect(dict.get("aaa")).is.equal("hello");
        dict.set("bbb", "world");
        expect(dict.exists("aaa")).is.true;
        expect(dict.exists("bbb")).is.true;
        expect(dict.exists("ccc")).is.false;
        expect(dict.get("bbb")).is.equal("world");
        dict.set("aaa", "bonjour");
        expect(dict.exists("aaa")).is.true;
        expect(dict.exists("bbb")).is.true;
        expect(dict.exists("ccc")).is.false;
        expect(dict.keys()).to.deep.equal(["aaa", "bbb"]);
        expect(dict.values()).to.deep.equal(["bonjour", "world"]);
        dict.remove("aaa");
        expect(dict.exists("aaa")).is.false;
        expect(dict.exists("bbb")).is.true;
        expect(dict.exists("ccc")).is.false;
        dict.remove("bbb");
        expect(dict.exists("aaa")).is.false;
        expect(dict.exists("bbb")).is.false;
        expect(dict.exists("ccc")).is.false;
    });
});
