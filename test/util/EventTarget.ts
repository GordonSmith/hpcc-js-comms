import { expect } from "chai";
import { EventTarget } from "../../src/util/EventTarget";

describe("EventTarget", function () {
    it("reference counter", function () {
        function echoEvent(...args: any[]) {
            // console.log(JSON.stringify(args));
        }
        const et = new EventTarget("aaa", "bbb", "zzz");
        expect(et.hasEventListener()).is.false;
        et.addEventListener("aaa", echoEvent);
        expect(et.hasEventListener()).is.true;
        expect(et.hasEventListener("aaa")).is.true;
        expect(et.hasEventListener("bbb")).is.false;
        et.addEventListener("bbb", echoEvent);
        const h = et.addEventListener("bbb", echoEvent);
        expect(et.hasEventListener()).is.true;
        expect(et.hasEventListener("aaa")).is.true;
        expect(et.hasEventListener("bbb")).is.true;
        et.removeEventListener("aaa", echoEvent);
        expect(et.hasEventListener()).is.true;
        expect(et.hasEventListener("aaa")).is.false;
        expect(et.hasEventListener("bbb")).is.true;
        h.release();
        expect(et.hasEventListener()).is.false;
        expect(et.hasEventListener("aaa")).is.false;
        expect(et.hasEventListener("bbb")).is.false;
    });
    it("message dispatch", function () {
        const et = new EventTarget("aaa", "bbb", "zzz");
        et.addEventListener("aaa", (a, b, c, d) => {
            expect(a).to.equal(1);
            expect(b).to.equal(2);
            expect(c).to.equal(3);
            expect(d).to.be.undefined;
        });
        et.dispatchEvent("aaa", 1, 2, 3);
    });
});
