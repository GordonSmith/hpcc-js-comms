import { Promise } from "es6-promise";
import { exists } from "../connections/ESPConnection";
import { DFULogicalFile } from "../connections/WsDFU";
import { ECLResult, ECLSchemas, WUResultRequest } from "../connections/WsWorkunits";
import { parseXSD, XSDSchema } from "../util/SAXParser";
import { ESPStateObject } from "./ESPStateObject";
import { Workunit } from "./Workunit";

export class Result {
    wu: Workunit;
    private _espResult: ESPStateObject<ECLResult & DFULogicalFile, ECLResult | DFULogicalFile> = new ESPStateObject<ECLResult & DFULogicalFile, ECLResult | DFULogicalFile>();
    xsdSchema: XSDSchema;

    get properties(): ECLResult { return this._espResult.get(); }
    get Wuid(): string { return this.wu.Wuid; }
    get Name(): string { return this._espResult.get("Name"); }
    get Sequence(): number { return this._espResult.get("Sequence"); }
    get Value(): string { return this._espResult.get("Value"); }
    get Link(): string { return this._espResult.get("Link"); }
    get FileName(): string { return this._espResult.get("FileName"); }
    get IsSupplied(): boolean { return this._espResult.get("IsSupplied"); }
    get ShowFileContent(): boolean { return this._espResult.get("ShowFileContent"); }
    get Total(): number { return this._espResult.get("Total"); }
    get ECLSchemas(): ECLSchemas { return this._espResult.get("ECLSchemas"); }
    get NodeGroup(): string { return this._espResult.get("NodeGroup"); }

    constructor(wu: Workunit, eclResult: ECLResult) {
        this.wu = wu;
        this._espResult.set(eclResult);
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
        return this.wu.connection.WUResult(request).then((response) => {
            return response;
        });
    }
}
