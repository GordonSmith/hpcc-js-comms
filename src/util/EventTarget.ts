export interface IChangedProperty {
    id: string;
    oldValue: any;
    newValue: any;
}

export class EventListenerHandle<T extends string> {
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
        throw new Error("Deprecated use release");
    }
}

export class EventTarget<T extends string> {
    private _eventObservers: { [eventID: string]: Function[] } = {};

    constructor(...args: T[]) {
    }

    addEventListener(eventID: T, callback: Function): EventListenerHandle<T> {
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

declare function expect(...args);
export function unitTest() {
    describe("EventTarget", function () {
        it("reference counter", function () {
            function echoEvent(...args: any[]) {
                // console.log(JSON.stringify(args));
            }
            const et = new EventTarget("aaa", "bbb", "zzz");
            expect(et.hasEventListener()).is.false;
            et.addEventListener("aaa", echoEvent);
            expect(et.hasEventListener()).is.true;
            expect(et.hasEventListener("aaa")).is.true;
            expect(et.hasEventListener("bbb")).is.false;
            et.addEventListener("bbb", echoEvent);
            const h = et.addEventListener("bbb", echoEvent);
            expect(et.hasEventListener()).is.true;
            expect(et.hasEventListener("aaa")).is.true;
            expect(et.hasEventListener("bbb")).is.true;
            et.removeEventListener("aaa", echoEvent);
            expect(et.hasEventListener()).is.true;
            expect(et.hasEventListener("aaa")).is.false;
            expect(et.hasEventListener("bbb")).is.true;
            h.release();
            expect(et.hasEventListener()).is.false;
            expect(et.hasEventListener("aaa")).is.false;
            expect(et.hasEventListener("bbb")).is.false;
        });
        it("message dispatch", function () {
            const et = new EventTarget("aaa", "bbb", "zzz");
            et.addEventListener("aaa", (a, b, c, d) => {
                expect(a).to.equal(1);
                expect(b).to.equal(2);
                expect(c).to.equal(3);
                expect(d).to.be.undefined;
            });
            et.dispatchEvent("aaa", 1, 2, 3);
        });
    });
}
