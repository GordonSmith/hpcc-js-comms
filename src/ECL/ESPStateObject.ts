import * as sum from "hash-sum";
import { exists, inner } from "../connections/ESPConnection";
import { EventTarget, IChangedProperty } from "../util/EventTarget";

export type ESPStateEvents = "propChanged" | "changed";
export class ESPStateObject<U, I> {
    private _espState: U = <U>{};
    private _espStateCache: { [key: string]: string } = {};
    private _events = new EventTarget<ESPStateEvents>();

    protected clear(newVals?: Partial<I>) {
        this._espState = <U>{};
        this._espStateCache = {};
        if (newVals !== void 0) {
            this.set(<I>newVals);
        }
    }

    protected get(): U;
    protected get<K extends keyof U>(key: K, defValue?: U[K]): U[K];
    protected get<K extends keyof U>(key?: K, defValue?: U[K]): U | U[K] {
        if (key === void 0) {
            return this._espState;
        }
        return this.has(key) ? this._espState[key] : defValue;
    }
    protected innerXXX(qualifiedID: string, defValue?: any) {
        return exists(qualifiedID, this._espState) ? inner(qualifiedID, this._espState) : defValue;
    }

    protected set(newVals: I): IChangedProperty[];
    protected set<K extends keyof U>(key: K, newVal: U[K], batchMode?: boolean): IChangedProperty;
    protected set<K extends keyof U>(keyOrNewVals: K | U, newVal?: U[K], batchMode: boolean = false): IChangedProperty[] | IChangedProperty {
        if (typeof keyOrNewVals === "string") {
            return this.setSingle(keyOrNewVals, newVal, batchMode);
        }
        return this.setAll(<Partial<U>>keyOrNewVals);
    }

    private setSingle<K extends keyof U>(key: K, newVal: U[K], batchMode: boolean): IChangedProperty {
        const oldCacheVal = this._espStateCache[(<string>key)];
        const newCacheVal = sum(newVal);
        if (oldCacheVal !== newCacheVal) {
            this._espStateCache[key] = newCacheVal;
            const oldVal = this._espState[key];
            this._espState[key] = newVal;
            const changedInfo: IChangedProperty = { id: key, oldValue: oldVal, newValue: newVal };
            if (!batchMode) {
                this._events.dispatchEvent("propChanged", changedInfo);
                this._events.dispatchEvent("changed", [changedInfo]);
            }
            return changedInfo;
        }
        return null;
    }

    private setAll(_: Partial<U>): IChangedProperty[] {
        const changed: IChangedProperty[] = [];
        for (const key in _) {
            if (_.hasOwnProperty(key)) {
                const changedInfo: IChangedProperty = this.setSingle(key, _[key], true);
                if (changedInfo) {
                    changed.push(changedInfo);
                }
            }
        }
        if (changed.length) {
            for (const changeInfo of changed) {
                this._events.dispatchEvent(("propChanged"), changeInfo);
            }
            this._events.dispatchEvent(("changed"), changed);
        }
        return changed;
    }

    protected has<K extends keyof U>(key: K): boolean {
        return this._espState[key] !== void 0;
    }

    on(eventID: ESPStateEvents, callback: Function);
    on(eventID: ESPStateEvents, propID: keyof U, callback: Function);
    on(eventID: ESPStateEvents, propIDOrCallback: Function | keyof U, callback?: Function) {
        if (this.isCallback(propIDOrCallback)) {
            switch (eventID) {
                case "changed":
                    return this._events.addEventListener(eventID, propIDOrCallback);
                default:
            }
        } else {
            switch (eventID) {
                case "propChanged":
                    return this._events.addEventListener(eventID, (changeInfo: IChangedProperty) => {
                        if (changeInfo.id === propIDOrCallback) {
                            callback(changeInfo);
                        }
                    });
                default:
            }
        }
        return this;
    }

    protected isCallback(propIDOrCallback: Function | keyof U): propIDOrCallback is Function {
        return (typeof propIDOrCallback === "function");
    }

    protected hasEventListener(): boolean {
        return this._events.hasEventListener();
    }
}

export class Cache<I, C> {
    private _cache: { [id: string]: C } = {};
    private _calcID: (espObj: I | C) => string;

    static hash(...args) {
        return sum(...args);
    }

    constructor(calcID: (espObj: I | C) => string) {
        this._calcID = calcID;
    }

    has(espObj: I): boolean {
        return this._calcID(espObj) in this._cache;
    }

    set(obj: C): C {
        this._cache[this._calcID(obj)] = obj;
        return obj;
    }

    get(espObj: I, factory: () => C): C {
        const retVal = this._cache[this._calcID(espObj)];
        if (!retVal) {
            return this.set(factory());
        }
        return retVal;
    }
}
