import { GoogleMapsWebService } from "../../../src/comms/google/maps";
import { describe, expect, it } from "../../lib";

describe("GoogleMaps", function () {
    it("Geocode", function () {
        const gmaps = new GoogleMapsWebService();

        return gmaps.geocode("FL, 33487, USA").then((response) => {
            expect(response.status).equals("OK");
            return response;
        });
    });
});
