/**
 * inner - return inner property of Object
 * Usage:  inner("some.prop.to.locate", obj);
 *
 * @param prop - property to locate
 * @param obj - object to locate property in
 */
export function inner(prop: string, obj: any): any {
    if (prop === void 0 || obj === void 0) return void 0;
    for (const item of prop.split(".")) {
        if (!obj.hasOwnProperty(item)) {
            return undefined;
        }
        obj = obj[item];
    }
    return obj;
}

/**
 * exists - return inner property of Object
 * Usage:  inner("some.prop.to.locate", obj);
 *
 * @param prop - property to locate
 * @param obj - object to locate property in
 */
export function exists(prop: string, obj: Object): boolean {
    return inner(prop, obj) !== undefined;
};
