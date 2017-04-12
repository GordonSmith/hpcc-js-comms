export class Dictionary<T> {
    private store: { [key: string]: T } = {};

    set(key: string, value: T): T {
        const retVal: T = this.store[key];
        this.store[key] = value;
        return retVal;
    }

    get(key: string): T {
        return this.store[key];
    }

    exists(key: string) {
        return this.store[key] !== undefined;
    }

    remove(key: string) {
        delete this.store[key];
    }

    keys(): string[] {
        const retVal: string[] = [];
        for (const key in this.store) {
            retVal.push(key);
        }
        return retVal;
    }

    values(): T[] {
        const retVal: T[] = [];
        for (const key in this.store) {
            retVal.push(this.store[key]);
        }
        return retVal;
    }
}
