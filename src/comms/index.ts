import { JSONPTransport } from "./jsonp";
import { ITransport, TransportOptions } from "./transport";
import { XHRGetTransport, XHRPostTransport } from "./xhr";

export {
    ITransport,
    JSONPTransport,
    XHRPostTransport,
    XHRGetTransport
};

export type ITransportFactory = (baseUrl: string) => ITransport;
export let createTransport: ITransportFactory = function (baseUrl: string, opts?: TransportOptions): ITransport {
    const retVal = new XHRPostTransport(baseUrl);
    if (opts) {
        retVal.opts(opts);
    }
    return retVal;
};

export function setTransportFactory(newFunc: ITransportFactory): ITransportFactory {
    const retVal = createTransport;
    createTransport = newFunc;
    return retVal;
}
