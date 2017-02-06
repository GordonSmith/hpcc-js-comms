export class EventTarget<T extends string> {
    private _eventObservers: { [eventID: string]: Function[] } = {};

    constructor(...args: T[]) {
    }

    addEventListener(eventID: T, callback) {
        let eventObservers = this._eventObservers[eventID];
        if (!eventObservers) {
            eventObservers = [];
            this._eventObservers[eventID] = eventObservers;
        }
        eventObservers.push(callback);
        return this;
    }

    removeEventListener(eventID: T, callback) {
        let eventObservers = this._eventObservers[eventID];
        if (eventObservers) {
            for (let i = eventObservers.length - 1; i >= 0; --i) {
                if (eventObservers[i] === callback) {
                    eventObservers.splice(i, 1);
                }
            }
        }
        return this;
    }

    dispatchEvent(eventID: T, ...args) {
        let eventObservers = this._eventObservers[eventID];
        if (eventObservers) {
            for (let observer of eventObservers) {
                observer(args);
            }
        }
        return this;
    }

    private _hasEventListener(eventID: string): boolean {
        let eventObservers = this._eventObservers[eventID];
        for (let observer in eventObservers) {
            if (eventObservers[observer]) {
                return true;
            }
        }
        return false;
    }

    hasEventListener(_eventID?: string): boolean {
        if (_eventID !== void 0) {
            return this._hasEventListener(_eventID);
        }
        for (let eventID in this._eventObservers) {
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
        it("basic", function () {
            function echoEvent(...args: any[]) {
                // console.log(JSON.stringify(args));
            }
            let et = new EventTarget("aaa", "bbb", "zzz");
            expect(et.hasEventListener()).is.false;
            et.addEventListener("aaa", echoEvent);
            et.dispatchEvent("zzz");
            et.dispatchEvent("aaa", "Woohoo aaa!");
            expect(et.hasEventListener()).is.true;
            et.addEventListener("bbb", echoEvent);
            et.addEventListener("bbb", echoEvent);
            et.dispatchEvent("bbb", "Woohoo bbb!");
            expect(et.hasEventListener()).is.true;
            et.removeEventListener("aaa", echoEvent);
            expect(et.hasEventListener()).is.true;
            expect(et.hasEventListener("aaa")).is.false;
            et.dispatchEvent("aaa", "Should not show");
            et.dispatchEvent("bbb", "Woohoo bbb - 2!");
            et.removeEventListener("bbb", echoEvent);
            expect(et.hasEventListener()).is.false;
            et.dispatchEvent("bbb", "Should not show");
        });
    });
}
