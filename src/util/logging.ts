import { Stack } from "../collections/stack";

export enum Level {
    debug,
    info,
    notice,
    warning,
    error,
    critical,
    alert,
    emergency
}

export class Logging {
    private static _instance: Logging;
    private _levelStack = new Stack<Level>();
    private _level = Level.error;

    public static Instance() {
        return this._instance || (this._instance = new this());
    }

    private constructor() {
    }

    private stringify(obj: object): string {
        const cache: any[] = [];
        return JSON.stringify(obj, function (_key, value) {
            if (typeof value === "object" && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    return;
                }
                cache.push(value);
            }
            return value;
        });
    }

    log(level: Level, msg: string | object) {
        if (level < this._level) return;

        const d = new Date();
        const n = d.toISOString();
        if (typeof msg !== "string") {
            msg = this.stringify(msg);
        }
        // tslint:disable-next-line:no-console
        console.log(`${n} <${Level[level]}>:  ${msg}`);
    }

    debug(msg: string | object) {
        this.log(Level.debug, msg);
    }

    info(msg: string | object) {
        this.log(Level.info, msg);
    }

    notice(msg: string | object) {
        this.log(Level.notice, msg);
    }

    warning(msg: string | object) {
        this.log(Level.warning, msg);
    }

    error(msg: string | object) {
        this.log(Level.error, msg);
    }

    critical(msg: string | object) {
        this.log(Level.critical, msg);
    }

    alert(msg: string | object) {
        this.log(Level.alert, msg);
    }

    emergency(msg: string | object) {
        this.log(Level.emergency, msg);
    }

    level(): Level;
    level(_: Level): this;
    level(_?: Level): Level | this {
        if (!arguments.length) return this._level;
        this._level = _;
        return this;
    }

    pushLevel(_: Level): this {
        this._levelStack.push(this._level);
        this._level = _;
        return this;
    }

    popLevel(_: Level): this {
        this._level = this._levelStack.pop();
        return this;
    }
}

export const logger = Logging.Instance();
