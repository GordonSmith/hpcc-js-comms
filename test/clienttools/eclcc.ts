import { expect } from "chai";

import { ClientTools, locateClientTools } from "../../src/clienttools/eclcc";
import { scopedLogger } from "../../src/util/logging";

const logger = scopedLogger("test/eclcc");

describe("eclcc", function () {
    logger.debug(process.cwd());
    let ct: ClientTools;
    it("locateClientTools", function () {
        return locateClientTools().then((clientTools) => {
            expect(clientTools).to.exist;
            logger.debug(clientTools.eclccPath);
            ct = clientTools;
            return clientTools;
        });
    });
    it("createArchive", function () {
        expect(ct).to.exist;
        return ct.createArchive("./test/clienttools/test.ecl").then(archive => {
            expect(archive).to.exist;
            expect(archive.content).to.be.not.empty;
            logger.debug(archive.content);
            return archive;
        });
    });
    it("syntaxCheck", function () {
        expect(ct).to.exist;
        return ct.syntaxCheck("./test/clienttools/syntaxErrors.ecl").then(errors => {
            expect(errors).to.exist;
            logger.debug(errors);
            return errors;
        });
    });
    it("createArchiveFail", function () {
        expect(ct).to.exist;
        return ct.createArchive("./test/clienttools/doesNotExist.ecl").then(archive => {
            expect(archive).to.exist;
            expect(archive.content).to.be.empty;
            expect(archive.err).to.be.not.empty;
            expect(archive.err.length).to.be.greaterThan(0);
            logger.debug(archive.err);
            return archive;
        });
    });
    it("fetchMeta", function () {
        expect(ct).to.exist;
        return ct.fetchMeta("./test/clienttools/GenData.ecl").then(workspace => {
            expect(workspace).to.exist;
            return workspace;
        });
    });
    it("createLocalWU", function () {
        expect(ct).to.exist;
        return ct.createWU("./test/clienttools/test.ecl").then(wu => {
            expect(wu).to.exist;
            return wu;
        });
    });
});
