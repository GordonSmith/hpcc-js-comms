import { expect } from "chai";
import { espTime2Seconds } from "../../src/util/esp";

describe("ESPTransport", function () {
    it("espTime2SecondsTests", function () {
        const tests = [
            { str: "1.1s", expected: 1.1 },
            { str: "2.2ms", expected: 0.0022 },
            { str: "4.4", expected: 4.4 },
            { str: "5:55.5", expected: 355.5 },
            { str: "6:06:06.6", expected: 21966.6 },
            { str: "6:06:6.6", expected: 21966.6 },
            { str: "6:6:6.6", expected: 21966.6 },
            { str: "7 days 7:07:7.7", expected: 630427.7 }
        ];
        tests.forEach(function (test) {
            expect(espTime2Seconds(test.str)).to.equals(test.expected);
        }, this);
        expect(espTime2Seconds("3.3ns")).to.be.closeTo(0.0000000033, 0.00000000001);
    });
});
