import { createTransport, ITransport } from "../../comms/index";
import { ESPTransport } from "../comms/transport";

export interface DFULogicalFile {
    Prefix: string;
    NodeGroup: string;
    Directory: string;
    Description?: any;
    Parts: string;
    Name: string;
    Owner: string;
    Totalsize: string;
    RecordCount: string;
    Modified: string;
    LongSize?: any;
    LongRecordCount?: any;
    isSuperfile: boolean;
    isDirectory: boolean;
    Replicate: boolean;
    IntSize: number;
    IntRecordCount: number;
    FromRoxieCluster?: any;
    BrowseData: boolean;
    IsCompressed: boolean;
    ContentType: string;
    CompressedFileSize?: any;
    SuperOwners?: any;
    Persistent: boolean;
    IsProtected: boolean;
}

export interface DFULogicalFiles {
    DFULogicalFile: DFULogicalFile[];
}

export interface DFUQueryResponse {
    DFULogicalFiles: DFULogicalFiles;
    Prefix?: any;
    NodeGroup?: any;
    LogicalName?: any;
    Description?: any;
    Owner?: any;
    StartDate?: any;
    EndDate?: any;
    FileType?: any;
    FileSizeFrom: number;
    FileSizeTo: number;
    FirstN: number;
    PageSize: number;
    PageStartFrom: number;
    LastPageFrom: number;
    PageEndAt: number;
    PrevPageFrom: number;
    NextPageFrom: number;
    NumFiles: number;
    Sortby?: any;
    Descending: boolean;
    BasicQuery: string;
    ParametersForPaging: string;
    Filters: string;
    CacheHint: number;
    IsSubsetOfFiles?: any;
    Warning?: any;
}

export interface RootObject {
    DFUQueryResponse: DFUQueryResponse;
}

export class Service {
    private _transport: ESPTransport;

    constructor(transport: ITransport | string) {
        if (typeof transport === "string") {
            transport = createTransport(transport);
        }
        this._transport = new ESPTransport(transport, "WsDFU", "1.35");
    }
}
