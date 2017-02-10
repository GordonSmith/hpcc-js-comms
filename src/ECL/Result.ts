import { Promise } from "es6-promise";
import { exists } from "../connections/ESPConnection";
import { DFULogicalFile } from "../connections/WsDFU";
import { ECLResult, ECLSchemas, WUResultRequest } from "../connections/WsWorkunits";
import { Connection } from "../connections/WsWorkunits";
import { parseXSD, XSDSchema } from "../util/SAXParser";
import { ESPStateObject } from "./ESPStateObject";

export interface ECLResultEx extends ECLResult {
    Wuid: string;
    ResultViews: any[];
}
export class Result extends ESPStateObject<ECLResultEx & DFULogicalFile, ECLResultEx | DFULogicalFile> implements ECLResultEx {
    protected connection: Connection;
    protected xsdSchema: XSDSchema;

    get properties(): ECLResult { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get Name(): string { return this.get("Name"); }
    get Sequence(): number { return this.get("Sequence"); }
    get Value(): string { return this.get("Value"); }
    get Link(): string { return this.get("Link"); }
    get FileName(): string { return this.get("FileName"); }
    get IsSupplied(): boolean { return this.get("IsSupplied"); }
    get ShowFileContent() { return this.get("ShowFileContent"); }
    get Total(): number { return this.get("Total"); }
    get ECLSchemas(): ECLSchemas { return this.get("ECLSchemas"); }
    get NodeGroup(): string { return this.get("NodeGroup"); }
    get ResultViews(): any[] { return this.get("ResultViews"); }

    constructor(href: string, wuid: string, eclResult: ECLResult, resultViews: any[]) {
        super();
        this.connection = new Connection(href);
        this.set({
            Wuid: wuid,
            ResultViews: resultViews,
            ...eclResult
        });
    }

    fetchXMLSchema(): Promise<XSDSchema> {
        if (this.xsdSchema) {
            return Promise.resolve(this.xsdSchema);
        }
        return this.WUResult().then((response) => {
            if (exists("Result.XmlSchema.xml", response)) {
                this.xsdSchema = parseXSD("<xsd>" + response.Result.XmlSchema.xml + "</xsd>");
                return this.xsdSchema;
            }
            return this;
        });
    }

    fetchResult(): Promise<any[]> {
        return this.WUResult(0, -1, true).then((response) => {
            if (exists("Result.Row", response)) {
                return response.Result.Row;
            }
            return [];
        });
    }

    protected WUResult(start: number = 0, count: number = 1, suppressXmlSchema: boolean = false) {
        const request: WUResultRequest = <WUResultRequest>{};
        if (this.Wuid && this.Sequence !== undefined) {
            request.Wuid = this.Wuid;
            request.Sequence = this.Sequence;
        } else if (this.Name && this.NodeGroup) {
            request.LogicalName = this.Name;
            request.Cluster = this.NodeGroup;
        } else if (this.Name) {
            request.LogicalName = this.Name;
        }
        request.Start = start;
        request.Count = count;
        request.SuppressXmlSchema = suppressXmlSchema;
        return this.connection.WUResult(request).then((response) => {
            return response;
        });
    }
}