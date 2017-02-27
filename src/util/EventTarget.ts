export interface IChangedProperty {
    id: string;
    oldValue: any;
    newValue: any;
}

export interface IEventListenerHandle {
    release();
    unwatch();
}

class EventListenerHandle<T extends string> implements IEventListenerHandle {
    private eventTarget: EventTarget<T>;
    private eventID: T;
    private callback: Function;

    constructor(eventTarget: EventTarget<T>, eventID: T, callback: Function) {
        this.eventTarget = eventTarget;
        this.eventID = eventID;
        this.callback = callback;
    }

    release() {
        this.eventTarget.removeEventListener(this.eventID, this.callback);
    }

    unwatch() {
        this.release();
    }
}

export class EventTarget<T extends string> {
    private _eventObservers: { [eventID: string]: Function[] } = {};

    constructor(..._: T[]) {
    }

    addEventListener(eventID: T, callback: Function): IEventListenerHandle {
        let eventObservers = this._eventObservers[eventID];
        if (!eventObservers) {
            eventObservers = [];
            this._eventObservers[eventID] = eventObservers;
        }
        eventObservers.push(callback);
        return new EventListenerHandle<T>(this, eventID, callback);
    }

    removeEventListener(eventID: T, callback: Function): this {
        const eventObservers = this._eventObservers[eventID];
        if (eventObservers) {
            for (let i = eventObservers.length - 1; i >= 0; --i) {
                if (eventObservers[i] === callback) {
                    eventObservers.splice(i, 1);
                }
            }
        }
        return this;
    }

    dispatchEvent(eventID: T, ...args: any[]): this {
        const eventObservers = this._eventObservers[eventID];
        if (eventObservers) {
            for (const observer of eventObservers) {
                observer(...args);
            }
        }
        return this;
    }

    private _hasEventListener(eventID: string): boolean {
        const eventObservers = this._eventObservers[eventID];
        for (const observer in eventObservers) {
            if (eventObservers[observer]) {
                return true;
            }
        }
        return false;
    }

    hasEventListener(_eventID?: T): boolean {
        if (_eventID !== void 0) {
            return this._hasEventListener(_eventID);
        }
        for (const eventID in this._eventObservers) {
            if (this._hasEventListener(eventID)) {
                return true;
            }
        }
        return false;
    }
}
