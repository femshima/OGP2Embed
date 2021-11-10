
interface DomainTree {
    [s: string]: DomainTree | Function,
}
let domainTree: DomainTree = {};

import fs from "fs";
import path from "path";

fs.readdirSync(path.join(__dirname)).forEach(function (file: string) {
    let fileNameArray = file.split(".");
    fileNameArray.pop();
    const fileNameWithoutExt = fileNameArray.join(".");
    if (fileNameWithoutExt.length === 0) {
        return;
    }
    if (fileNameWithoutExt === "index") return;
    if (fileNameWithoutExt === "default") return;
    const site = require("./" + fileNameWithoutExt);
    if (typeof site.hostname !== "string") return;
    let currentTree: DomainTree = domainTree;
    site.hostname.split(".").reverse().forEach((domain: string, i: number, arr: string[]) => {
        if (i === arr.length - 1) {
            currentTree[domain] = site.handle;
        }
        if (typeof currentTree[domain] === "undefined") {
            currentTree[domain] = {};
        }
        currentTree = currentTree[domain] as DomainTree;
    });

});

import defaultFunctions from "./default";

console.log(domainTree);

export default function (url_s: string) {
    let url = new URL(url_s);
    let currentTree: DomainTree | Function = domainTree;
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