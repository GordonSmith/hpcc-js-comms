import { expect } from "chai";
import { Promise } from "es6-promise";
import * as xhr from "request";
import { } from "../../src/connections/Connection";

describe("ESPConnection", function () {
    it("GeoDecode", function () {
        return new Promise((resolve, reject) => {
            xhr({
                //method: "POST",
                //body: "address=33487",//JSON.stringify({ address: 33487 }),
                uri: "http://maps.googleapis.com/maps/api/geocode/json?address=33487",
                headers: {
                    //"Content-Type": "application/json"
                }
            }, function (err, resp, body) {
                resolve();
                let d = 0;
                // check resp.statusCode 
            });
        });
    });
});

