import { utcFormat, utcParse } from "d3-time-format";
import { StateObject } from "../../collections/stateful";
import { IConnection, IOptions } from "../../comms/connection";
import { Service, WUDetails } from "../services/WsWorkunits";

const formatter = utcFormat("%Y-%m-%dT%H:%M:%S.%LZ");
const parser = utcParse("%Y-%m-%dT%H:%M:%S.%LZ");

export interface AttributeEx extends WUDetails.Attribute {
    FormattedEnd?: string;
}

export class Attribute extends StateObject<AttributeEx, AttributeEx> implements AttributeEx {
    protected connection: Service;
    readonly scope: Scope;

    get properties(): AttributeEx { return this.get(); }
    get Name(): string { return this.get("Name"); }
    get RawValue(): string { return this.get("RawValue"); }
    get Formatted(): string { return this.get("Formatted"); }
    get FormattedEnd(): string { return this.get("FormattedEnd"); }
    get Measure(): string { return this.get("Measure"); }
    get Creator(): string { return this.get("Creator"); }
    get CreatorType(): string { return this.get("CreatorType"); }

    constructor(optsConnection: IOptions | IConnection | Service, scope: Scope, attribute: WUDetails.Attribute) {
        super();
        if (optsConnection instanceof Service) {
            this.connection = optsConnection;
        } else {
            this.connection = new Service(optsConnection);
        }
        this.scope = scope;
        this.set(attribute);
    }
}

export interface ScopeEx extends WUDetails.Scope {
    Wuid: string;
}

export class Scope extends StateObject<ScopeEx, ScopeEx> implements ScopeEx {
    protected connection: Service;
    protected _attributeMap: { [key: string]: Attribute } = {};
    protected _children: Scope[] = [];

    get properties(): ScopeEx { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get Scope(): string { return this.get("Scope"); }
    get Id(): string { return this.get("Id"); }
    get ScopeType(): string { return this.get("ScopeType"); }
    get Attributes(): WUDetails.Attributes { return this.get("Attributes", { Attribute: [] }); }
    get CAttributes(): Attribute[] {
        //  Match "started" and time elapsed
        const retVal = [];
        const timeElapsed = {
            start: null,
            elapsed: null
        }
        this.Attributes.Attribute.forEach((scopeAttr) => {
            if (scopeAttr.Name === "TimeElapsed") {
                timeElapsed.elapsed = scopeAttr;
            } else if (scopeAttr.Measure === "ts" && scopeAttr.Name.indexOf("Started") >= 0) {
                timeElapsed.start = scopeAttr;
            } else {
                retVal.push(new Attribute(this.connection, this, scopeAttr));
            }
        });
        if (timeElapsed.start && timeElapsed.elapsed) {
            const endTime = parser(timeElapsed.start.Formatted);
            endTime.setMilliseconds(endTime.getMilliseconds() + timeElapsed.elapsed.RawValue / 1000000);
            timeElapsed.start.FormattedEnd = formatter(endTime);
            retVal.push(new Attribute(this.connection, this, timeElapsed.start));
        } else if (timeElapsed.start) {
            retVal.push(new Attribute(this.connection, this, timeElapsed.start));
        } else if (timeElapsed.elapsed) {
            retVal.push(new Attribute(this.connection, this, timeElapsed.elapsed));
        }
        return retVal;
    }

    constructor(optsConnection: IOptions | IConnection | Service, wuid: string, scope: WUDetails.Scope) {
        super();
        if (optsConnection instanceof Service) {
            this.connection = optsConnection;
        } else {
            this.connection = new Service(optsConnection);
        }
        this.set("Wuid", wuid);
        this.update(scope);
    }

    update(scope: WUDetails.Scope) {
        this.set({
            Wuid: this.Wuid,
            ...scope
        });
        this.CAttributes.forEach((attr) => {
            this._attributeMap[attr.Name] = attr;
        });
        this.Attributes.Attribute = [];
        for (const key in this._attributeMap) {
            if (this._attributeMap.hasOwnProperty(key)) {
                this.Attributes.Attribute.push(this._attributeMap[key].properties);
            }
        }
    }

    parentScope(): string {
        const scopeParts = this.Scope.split(":");
        scopeParts.pop();
        return scopeParts.join(":");
    }

    children(): Scope[];
    children(_: Scope[]): Scope;
    children(_?: Scope[]): Scope[] | Scope {
        if (!arguments.length) return this._children;
        this._children = _;
        return this;
    }

    hasAttr(name: string): boolean {
        return this._attributeMap[name] !== undefined;
    }

    attr(name: string): Attribute {
        return this._attributeMap[name];
    }

    attrMeasure(name: string): string {
        return this._attributeMap[name].Measure;
    }
}
