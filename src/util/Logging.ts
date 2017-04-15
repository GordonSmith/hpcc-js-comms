//  TODO switch to propper logger  ---

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
}

export const logger = new Logging();
