import { ITransport, XHRGetTransport } from "../comms/index";

export class GoogleMapsWebService {
    private _transport: ITransport;

    constructor(transport: ITransport = new XHRGetTransport("https://maps.googleapis.com/maps/api")) {
        this._transport = transport;
    }

    geocode(address: string): Promise<any> {
        return this._transport.send("geocode/json", { address });
    }
}
