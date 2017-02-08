
import { parser } from "sax";

export class Element {
    name: string = "";
    attributes: any = {};
    content: string = "";
    constructor(node) {
        this.name = node.name;
    }

    appendAttribute(key: string, val: string) {
        this.attributes[key] = val;
    }

    appendContent(content: string) {
        this.content += content;
    }
}

export class Stack<T> {
    private stack: T[] = [];

    push(e: T) {
        this.stack.push(e);
        return e;
    }

    pop(): T {
        return this.stack.pop();
    }

    top(): T | null {
        return this.stack.length ? this.stack[this.stack.length - 1] : null;
    }

    depth(): number {
        return this.stack.length;
    }
}

export class SAXStackParser {
    parser: any;
    stack: Stack<Element> = new Stack<Element>();

    constructor() {
        this.parser = parser(true);

        const context = this;
        this.parser.onstart = function (text) {
            context.startDocument();
        };
        this.parser.onend = function (text) {
            context.endDocument();
        };
        this.parser.onopentagstart = function (node) {
            context.startElement(node);
        };
        this.parser.onclosetag = function (node) {
            context.endElement(node);
        };
        this.parser.onattribute = function (attr) {
            context.attributes(attr.name, attr.value);
        };
        this.parser.ontext = function (text) {
            context.characters(text);
        };
    }

    parse(xml: string) {
        this.parser.write(xml).close();
    }

    //  Callbacks  ---
    startDocument() {
    }

    endDocument() {
    }

    startElement(node): Element {
        return this.stack.push(new Element(node));
    }

    endElement(node): Element {
        return this.stack.pop();
    }

    attributes(key, val) {
        this.stack.top().appendAttribute(key, val);
    }

    characters(text) {
        this.stack.top().appendContent(text);
    }
}

export class XSDNode {
    protected e?: Element;

    constructor(e: Element) {
        this.e = e;
    }
    fix() {
        delete this.e;
    }
}

export class XSDElement extends XSDNode {
    name: string;
    type: string;
    private children: XSDElement[] = [];

    constructor(e: Element) {
        super(e);
    }

    append(child: XSDElement) {
        this.children.push(child);
    }

    fix() {
        this.name = this.e.attributes.name;
        this.type = this.e.attributes.type;
        for (let i = this.children.length - 1; i >= 0; --i) {
            const row = this.children[i];
            if (row.name === "Row" && row.type === undefined) {
                this.children.push(...row.children);
                this.children.splice(i, 1);
            }
        }
        super.fix();
    }
}

export class XSDSimpleType extends XSDNode {
    name: string;
    type: string;
    maxLength: number;

    protected _restricition?: Element;
    protected _maxLength?: Element;

    constructor(e: Element) {
        super(e);
    }

    append(e: Element) {
        switch (e.name) {
            case "xs:restriction":
                this._restricition = e;
                break;
            case "xs:maxLength":
                this._maxLength = e;
                break;
            default:
        }
    }

    fix() {
        this.name = this.e.attributes.name;
        this.type = this._restricition.attributes.base;
        this.maxLength = this._maxLength.attributes.value;
        delete this._restricition;
        delete this._maxLength;
        super.fix();
    }
}

export class XSDSchema {
    root: XSDElement;
    simpleTypes: { [name: string]: XSDSimpleType } = {};
}

class XSDParser extends SAXStackParser {
    schema: XSDSchema = new XSDSchema();
    simpleType: XSDSimpleType;
    simpleTypes: { [name: string]: XSDSimpleType } = {};

    xsdStack: Stack<XSDElement> = new Stack<XSDElement>();

    startElement(node): Element {
        const e = super.startElement(node);
        switch (e.name) {
            case "xs:element":
                const xsdElement = new XSDElement(e);
                if (!this.schema.root) {
                    this.schema.root = xsdElement;
                } else if (this.xsdStack.depth()) {
                    this.xsdStack.top().append(xsdElement);
                }
                this.xsdStack.push(xsdElement);
                break;
            case "xs:simpleType":
                this.simpleType = new XSDSimpleType(e);
            default:
                break;
        }
        return e;
    }
    endElement(node): Element {
        const e = super.endElement(node);
        switch (e.name) {
            case "xs:element":
                const xsdElement = this.xsdStack.pop();
                xsdElement.fix();
                break;
            case "xs:simpleType":
                this.simpleType.fix();
                this.simpleTypes[this.simpleType.name] = this.simpleType;
                delete this.simpleType;
                break;
            default:
                if (this.simpleType) {
                    this.simpleType.append(e);
                }
        }
        return e;
    }
}

export function parseXSD(xml): XSDSchema {
    const saxParser = new XSDParser();
    saxParser.parse(xml);
    return saxParser.schema;
}

declare function expect(...args): any;
export function unitTest() {
    describe("SAXParser", function () {
        it("basic", function () {
            const p = new SAXStackParser();
            p.parse("<xml>Hello, <who name='world'>world</who>!</xml>");
        });
    });
}
