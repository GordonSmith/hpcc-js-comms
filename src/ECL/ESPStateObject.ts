import { exists, inner } from "../connections/ESPConnection";
import { EventTarget, IChangedProperty } from "../util/EventTarget";

export type ESPStateEvents = "propChanged" | "changed";
export class ESPStateObject<U, I> {
    private _espState: U = <U>{};
    private _espStateCache: { [key: string]: string } = {};
    private _events = new EventTarget<ESPStateEvents>();

    clear(newVals?: Partial<I>) {
        this._espState = <U>{};
        this._espStateCache = {};
        if (newVals !== void 0) {
            this.set(<I>newVals);
        }
    }

    get(): U;
    get<K extends keyof U>(key: K, defValue?: U[K]): U[K];
    get<K extends keyof U>(key?: K, defValue?: U[K]): U | U[K] {
        if (key === void 0) {
            return this._espState;
        }
        return this.has(key) ? this._espState[key] : defValue;
    }
    inner(qualifiedID: string, defValue?: any) {
        return exists(qualifiedID, this._espState) ? inner(qualifiedID, this._espState) : defValue;
    }

    set(newVals: I): IChangedProperty[];
    set<K extends keyof U>(key: K, newVal: U[K], batchMode?: boolean): IChangedProperty;
    set<K extends keyof U>(keyOrNewVals: K | U, newVal?: U[K], batchMode: boolean = false): IChangedProperty[] | IChangedProperty {
        if (typeof keyOrNewVals === "string") {
            return this.setSingle(keyOrNewVals, newVal, batchMode);
        }
        return this.setAll(<Partial<U>>keyOrNewVals);
    }

    private setSingle<K extends keyof U>(key: K, newVal: U[K], batchMode: boolean): IChangedProperty {
        const oldCacheVal = this._espStateCache[(<string>key)];
        const newCacheVal = JSON.stringify(newVal);
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

    has<K extends keyof U>(key: K): boolean {
        return this._espState[key] !== void 0;
    }

    on(eventID: ESPStateEvents, callback: Function);
    on(eventID: ESPStateEvents, propID: keyof U, callback: Function);
    on(eventID: ESPStateEvents, ...args) {
        switch (eventID) {
            case "changed":
                return this._events.addEventListener(eventID, args[0]);
            case "propChanged":
                return this._events.addEventListener(eventID, (changeInfo: IChangedProperty) => {
                    if (changeInfo.id === args[0]) {
                        args[1](changeInfo);
                    }
                });
            default:
        }
    }

    hasEventListener(): boolean {
        return this._events.hasEventListener();
    }
}

export class ESPSingleton {
    static cache: { [id: string]: ESPSingleton } = {};

    private constructor() {
        if (ESPSingleton.cache[this.uniqueID()]) {
            throw new Error("Error - use Singleton.getInstance()");
        }
    };

    getInstance(uniqueID: string) {
        if (ESPSingleton.cache[uniqueID]) {
            return ESPSingleton.cache[uniqueID];
        }

    }

    uniqueID(): string {
        return "";
    };
}
