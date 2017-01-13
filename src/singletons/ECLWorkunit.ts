import { IWUQueryResponse } from "../connections/WsWorkunits"

export class ECLWorkunit {
    private wuQueryResponse: IWUQueryResponse;

    constructor() {
    }

    update(_: IWUQueryResponse) {
        this.wuQueryResponse = _;
        debugger;
        return this;
    }
}
