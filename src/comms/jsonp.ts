import { ITransport, Transport } from "./transport";

export class JSONPTransport extends Transport implements ITransport {
    timeout: number;

    constructor(baseUrl: string, timeout: number = 60) {
        super(baseUrl);
        this.timeout = timeout;
    }

    send(action: string, request: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let respondedTimeout = this.timeout * 1000;
            const respondedTick = 5000;
            const callbackName = "jsonp_callback_" + Math.round(Math.random() * 999999);
            window[callbackName] = function (response) {
                respondedTimeout = 0;
                doCallback();
                resolve(response);
            };
            const script = document.createElement("script");
            let url = this.joinUrl(action);
            url += url.indexOf("?") >= 0 ? "&" : "?";
            script.src = url + "jsonp=" + callbackName + "&" + this.serialize(request);
            document.body.appendChild(script);
            const progress = setInterval(function () {
                if (respondedTimeout <= 0) {
                    clearInterval(progress);
                } else {
                    respondedTimeout -= respondedTick;
                    if (respondedTimeout <= 0) {
                        clearInterval(progress);
                        // console.log("Request timeout:  " + script.src);
                        doCallback();
                        reject(Error("Request timeout:  " + script.src));
                    } else {
                        // console.log("Request pending (" + respondedTimeout / 1000 + " sec):  " + script.src);
                    }
                }
            }, respondedTick);

            function doCallback() {
                delete window[callbackName];
                document.body.removeChild(script);
            }
        });
    };
}
