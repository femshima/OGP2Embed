
interface domainTreeType {
    [s: string]: domainTreeType | Function,
}
let domainTree: domainTreeType = {};
require("fs").readdirSync("site-specific").forEach(function (file: string) {
    if (file === "index.js") return;
    if (file === "default.js") return;
    const site = require("./" + file);
    if (typeof site.hostname !== "string") return;
    let currentTree: domainTreeType = domainTree;
    site.hostname.split(".").reverse().forEach((domain: string, i: number, arr: string[]) => {
        if (i === arr.length - 1) {
            currentTree[domain] = site.handle;
        }
        if (typeof currentTree[domain] === "undefined") {
            currentTree[domain] = {};
        }
        currentTree = currentTree[domain] as domainTreeType;
    });

});

import defaultFunctions from "./default";

console.log(domainTree);

export default function (url_s: string) {
    let url = new URL(url_s);
    let currentTree: domainTreeType | Function = domainTree;
    url.hostname.split(".").reverse().some(domain => {
        if (typeof currentTree === "function" || typeof currentTree === "undefined") {
            return true;
        }
        currentTree = currentTree[domain];
        return false;
    });
    if (currentTree instanceof Function) {
        return currentTree(url, defaultFunctions.before, defaultFunctions.after);
    } else {
        return defaultFunctions.defaultHandler(url, defaultFunctions.before, defaultFunctions.after);
    }
}