import { Cache } from "../../collections/cache";
import { Graph as Digraph, ISubgraph } from "../../collections/graph";
import { Stack } from "../../collections/stack";
import { StateObject } from "../../collections/stateful";
import { IConnection, IOptions } from "../../comms/connection";
import { StringAnyMap, XMLNode } from "../../util/SAXParser";
import { ECLGraph, Service } from "../services/WsWorkunits";
import { Scope } from "./Scope";
import { Timer } from "./Timer";

export interface ECLGraphEx extends ECLGraph {
    Wuid: string;
    Time: number;
}
export class Graph extends StateObject<ECLGraphEx, ECLGraphEx> implements ECLGraphEx {
    protected connection: Service;

    get properties(): ECLGraphEx { return this.get(); }
    get Wuid(): string { return this.get("Wuid"); }
    get Name(): string { return this.get("Name"); }
    get Label(): string { return this.get("Label"); }
    get Type(): string { return this.get("Type"); }
    get Complete(): boolean { return this.get("Complete"); }
    get WhenStarted(): Date { return this.get("WhenStarted"); }
    get WhenFinished(): Date { return this.get("WhenFinished"); }
    get Time(): number { return this.get("Time"); }

    constructor(optsConnection: IOptions | IConnection | Service, wuid: string, eclGraph: ECLGraph, eclTimers: Timer[]) {
        super();
        if (optsConnection instanceof Service) {
            this.connection = optsConnection;
        } else {
            this.connection = new Service(optsConnection);
        }
        let duration = 0;
        for (const eclTimer of eclTimers) {
            if (eclTimer.GraphName === eclGraph.Name && !eclTimer.HasSubGraphId) {
                duration = Math.round(eclTimer.Seconds * 1000) / 1000;
                break;
            }
        }
        this.set({ Wuid: wuid, Time: duration, ...eclGraph });
    }
}

export class GraphCache extends Cache<ECLGraph, Graph> {
    constructor() {
        super((obj) => {
            return Cache.hash([obj.Name]);
        });
    }
}

type Callback = (tag: string, attributes: StringAnyMap, children: XMLNode[], _stack: XMLNode[]) => void;
function walkXmlJson(node: XMLNode, callback: Callback, stack?: XMLNode[]) {
    stack = stack || [];
    stack.push(node);
    callback(node.name, node.attributes, node.children, stack);
    node.children.forEach((childNode) => {
        walkXmlJson(childNode, callback, stack);
    });
    stack.pop();
}

function flattenAtt(nodes: XMLNode[]): StringAnyMap {
    const retVal: StringAnyMap = {};
    nodes.forEach((node: XMLNode) => {
        if (node.name === "att") {
            retVal[node.attributes["name"]] = node.attributes["value"];
        }
    });
    return retVal;
}

export function createXGMMLGraph(id: string, graphs: XMLNode): Digraph {
    const graph = new Digraph(id);
    const stack: ISubgraph[] = [graph];
    walkXmlJson(graphs, (tag: string, attributes: StringAnyMap, children: XMLNode[], _stack) => {
        const top = stack[stack.length - 1];
        switch (tag) {
            case "graph":
                break;
            case "node":
                if (children.length && children[0].children.length && children[0].children[0].name === "graph") {
                    const subgraph = graph.createSubgraph(top, `graph${attributes["id"]}`, flattenAtt(children));
                    stack.push(subgraph);
                } else {
                    graph.createVertex(top, attributes["id"], attributes["label"], flattenAtt(children));
                }
                break;
            case "edge":
                graph.createEdge(top, attributes["id"], attributes["source"], attributes["target"], flattenAtt(children));
                break;
            default:
        }
    });
    return graph;
}

interface edgeRef {
    subgraph: ISubgraph;
    edge: Scope;
}

export function createGraph(scope: Scope): Digraph {
    const graph = new Digraph(scope.Id);
    const stack: Stack<ISubgraph> = new Stack<ISubgraph>();
    stack.push(graph);
    const edges: edgeRef[] = [];
    scope.walk({
        start: (scope): boolean => {
            console.log(scope.Id);
            switch (scope.ScopeType) {
                case "subgraph":
                    stack.push(graph.createSubgraph(stack.top(), scope.Id))
                    break;
                case "activity":
                    graph.createVertex(stack.top(), scope.Id, scope.Id);
                    break;
                case "edge":
                    edges.push({ subgraph: stack.top(), edge: scope });
                    break;
                default:
            }
            return false;
        },
        end: (scope): boolean => {
            switch (scope.ScopeType) {
                case "subgraph":
                    stack.pop();
                    break;
                default:
            }
            return false;
        }
    });
    edges.forEach(edgeRef => {
        const source = edgeRef.edge.attr("Source").Formatted;
        const target = edgeRef.edge.attr("Target").Formatted;
        if (source && target) {
            try {
                graph.createEdge(edgeRef.subgraph, edgeRef.edge.Id, "a" + source, "a" + target);
            } catch (e) {

            }
        } else {
            console.log(`Bad edge:  ${edgeRef.edge.Id}`);
        }
    });

    return graph;
}
