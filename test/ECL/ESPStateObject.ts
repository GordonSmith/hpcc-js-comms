import { expect } from "chai";
import { Cache, ESPStateObject } from "../../src/ECL/ESPStateObject";

describe("Cache", function () {
    it("basic", function () {
        class MyClass {
            id: string;
            id2: string;

            constructor(id, id2) {
                this.id = id;
                this.id2 = id2;
            }
        }
        const myCache = new Cache<{ id: string }, MyClass>((obj) => {
            return Cache.hash([obj.id]);
        });
        expect(myCache.has({ id: "007" })).is.false;
        const tmp = myCache.get({ id: "007" }, () => {
            return new MyClass("007", "a");
        });
        expect(myCache.has({ id: "007" })).is.true;
        expect(tmp.id2).equals("a");
        const tmp2 = myCache.get({ id: "007" }, () => {
            throw new Error("Should Not Happend");
        });
        expect(tmp2.id2).equals("a");
    });
});

describe("ESPStateObject", function () {
    interface ITest {
        aaa: string;
        bbb: number;
    }
    const stateObj: any = new ESPStateObject<ITest, ITest>();
    stateObj.on("changed", (changes) => {
        console.log(`changed:  ${JSON.stringify(changes)}`);
    });
    it("basic", function () {
        expect(stateObj.has("aaa")).to.be.false;
        expect(stateObj.get("aaa")).not.to.exist;
        stateObj.set("aaa", "abc");
        expect(stateObj.has("aaa")).to.be.true;
        expect(stateObj.get("aaa")).to.exist;
        expect(stateObj.get("aaa")).to.be.string;
        stateObj.set("bbb", 123);
        expect(stateObj.get("bbb")).not.to.be.NaN;
        stateObj.set({ aaa: "hello", bbb: 123 });
        stateObj.set({ aaa: "hello", bbb: 123 });
        stateObj.set({ aaa: "hello", bbb: 123 });
        stateObj.set({ aaa: "hello", bbb: 123 });
    });
});

