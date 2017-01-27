import { expect } from "chai";
import { Promise } from "es6-promise";
import { Workunit, WUStateID } from "../src/ECL/Workunit";
import { Server } from "../src/ECL/WorkunitServer";

declare var process: any;

const VM_HOST: string = "http://192.168.3.22:8010";
//  const VM_URL: string = "http://192.168.3.22:8010/WsWorkunits";
// const PUBLIC_URL: string = "http://52.51.90.23:8010/WsWorkunits";

let server: Server = Server.attach(VM_HOST);
export function createSubmit(): Promise<Workunit> {
    return server.create().then((wu) => {
        expect(wu.wuid).is.not.undefined;
        wu.on("StateIDChanged.logger", (stateID: WUStateID) => {
            console.log(wu.wuid + "-" + wu.state);
        });
        return wu;
    }).then((wu) => {
        return wu.ecl(testECL);
    }).then((wu) => {
        expect(wu.ecl()).equals(testECL);
        return wu.submit("hthor");
    }).then((wu) => {
        return new Promise((resolve, reject) => {
            if (wu.isComplete()) {
                resolve(true);
            } else {
                wu.on("StateIDChanged", (stateID: WUStateID) => {
                    if (wu.isComplete()) {
                        resolve();
                    }
                });
            }
        });
    });
};

export function failedWUQuery() {
    return server.get("WXXX-YYY").then((wu) => {
        debugger;
    });
}

export function all() {
    return Promise.all([/*createSubmit(), */failedWUQuery()]);
}

/*
describe.only("ECLWorkunitServer", function () {
    it.only("create", function () {
        myTest();
    });
    it("fetch", function () {
        return server.fetch().then((workunits) => {
            debugger;
        });
    });
});

describe("ESPConnection", function () {
    it("basic-post", function () {
        var espConnection = new ESPConnection(PUBLIC_URL);
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it("basic-get", function () {
        var espConnection = new ESPConnection(PUBLIC_URL);
        expect(espConnection).to.be.not.null;
        return espConnection.get("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it("basic-progress", function () {
        var espConnection = new ESPConnection(PUBLIC_URL)
            .on("progress", function (_) {
            });
        expect(espConnection).to.be.not.null;
        return espConnection.get("WUQuery", { PageSize: 2 }).then((response) => {
            expect(response).to.be.not.undefined;
        });
    });
    it("basic-auth", function () {
        var espConnection = new ESPConnection(PUBLIC_URL);
        espConnection.userID = "gosmith";
        espConnection.userPW = "???";
        expect(espConnection).to.be.not.null;
        return espConnection.post("WUQuery", {}).then((response) => {
            expect(response).to.be.not.undefined;
            expect(response.NumWUs).to.be.not.null;
            expect(response.NumWUs).to.be.greaterThan(-1);
            return response;
        });
    });
});

if (!TRAVIS) {
    describe.skip("ESPConnection-dataland", function () {
        it("basic", function () {
            var espConnection = new ESPConnection("http://10.241.12.207:8010/WsWorkunits");
            expect(espConnection).to.be.not.null;
            espConnection.userID = "gosmith";
            espConnection.userPW = "???";
            return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
                expect(response).to.be.not.undefined;
                expect(response.hasContent()).to.be.true;
                return response;
            });
        });
    });

    describe("ESPConnection-vm", function () {
        it("basic", function () {
            var espConnection = new ESPConnection(VM_URL);
            expect(espConnection).to.be.not.null;
            return espConnection.post("WUQuery", { PageSize: 2 }).then((response) => {
                expect(response).to.be.not.undefined;
                expect(response.__exceptions).to.be.undefined;
            });
        });

        it("exception", function () {
            var espConnection = new ESPConnection(VM_URL);
            expect(espConnection).to.be.not.null;
            return espConnection.post("WUInfo", { MissingWUID: "" }).then((response) => {
                expect(response).to.be.not.undefined;
                expect(response.__exceptions).to.be.not.undefined;
            });
        });
    });
}
*/
const testECL: string = `
ParentRec := RECORD
    INTEGER1  NameID;
    STRING20  Name;
END;
ChildRec := RECORD
    INTEGER1  NameID;
    STRING20  Addr;
END;
DenormedRec := RECORD
    ParentRec;
		INTEGER1 NumRows;
    DATASET(ChildRec) Children {MAXCOUNT(5)};
END;

NamesTable := DATASET([ {1,'Gavin'},
                        {2,'Liz'},
												{3,'Mr Nobody'},
												{4,'Anywhere'}], 
											ParentRec);            
NormAddrs := DATASET([{1,'10 Malt Lane'},	
			                {2,'10 Malt Lane'},	
			                {2,'3 The cottages'},	
			                {4,'Here'},	
			                {4,'There'},	
			                {4,'Near'},	
			                {4,'Far'}],
										 ChildRec);	

DenormedRec ParentLoad(ParentRec L) := TRANSFORM
    SELF.NumRows := 0;
		SELF.Children := [];
    SELF := L;
END;
//Ptbl := TABLE(NamesTable,DenormedRec);
Ptbl := PROJECT(NamesTable,ParentLoad(LEFT));
OUTPUT(Ptbl,NAMED('ParentDataReady'));

DenormedRec DeNormThem(DenormedRec L, ChildRec R, INTEGER C) := TRANSFORM
    SELF.NumRows := C;
    SELF.Children := L.Children + R;
    SELF := L;
END;

DeNormedRecs := DENORMALIZE(Ptbl, NormAddrs,
				    LEFT.NameID = RIGHT.NameID,
				    DeNormThem(LEFT,RIGHT,COUNTER));

OUTPUT(DeNormedRecs,NAMED('NestedChildDataset'));

// *******************************

ParentRec ParentOut(DenormedRec L) := TRANSFORM
    SELF := L;
END;

Pout := PROJECT(DeNormedRecs,ParentOut(LEFT));
OUTPUT(Pout,NAMED('ParentExtracted'));

// /* Using Form 1 of NORMALIZE */
ChildRec NewChildren(DenormedRec L, INTEGER C) := TRANSFORM
  SELF := L.Children[C];
END;
NewChilds := NORMALIZE(DeNormedRecs,LEFT.NumRows,NewChildren(LEFT,COUNTER));


// /* Using Form 2 of NORMALIZE */
// ChildRec NewChildren(ChildRec L) := TRANSFORM
  // SELF := L;
// END;

// NewChilds := NORMALIZE(DeNormedRecs,LEFT.Children,NewChildren(RIGHT));

// /* Using Form 2 of NORMALIZE with inline TRANSFORM*/
 //NewChilds := NORMALIZE(DeNormedRecs,LEFT.Children,TRANSFORM(RIGHT));

OUTPUT(NewChilds,NAMED('ChildrenExtracted'));
`;

