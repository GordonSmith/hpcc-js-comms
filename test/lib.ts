export { expect } from "chai";
export const isBrowser = new Function("try {return this===window;}catch(e){ return false;}");
export const isNode = new Function("try {return this===global;}catch(e){return false;}");
const root = new Function("try {return global;}catch(e){return window;}")();
export const describe = root.describe;
export const it = root.it;
