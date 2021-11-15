
import Base, { BaseConstructable, isBaseConstructable, getFalse } from "./default";

interface DomainTree {
    [s: string]: DomainTree | BaseConstructable,
}
let domainTree: DomainTree = {};

import fs from "fs";
import path from "path";

function addSite(site: BaseConstructable) {
    if (typeof site.hostname !== "string") return;
    let currentTree: DomainTree = domainTree;
    site.hostname.split(".").reverse().forEach((domain: string, i: number, arr: string[]) => {
        if (i === arr.length - 1) {
            currentTree[domain] = site;
        }
        if (typeof currentTree[domain] === "undefined") {
            currentTree[domain] = {};
        }
        currentTree = currentTree[domain] as DomainTree;
    });
}

import blacklist from "./blacklist";
blacklist.forEach((black: string) => {
    const falsesite = getFalse(black);
    if (isBaseConstructable(falsesite)) {
        addSite(falsesite);
    }
});

const searchPath = path.join(__dirname, "sites");
fs.readdirSync(searchPath).forEach(function (file: string) {
    let fileNameArray = file.split(".");
    fileNameArray.pop();
    const fileNameWithoutExt = fileNameArray.join(".");
    if (fileNameWithoutExt.length === 0) {
        return;
    }
    if (fileNameWithoutExt === "index") return;
    if (fileNameWithoutExt === "default") return;
    const site = require(path.join(searchPath, fileNameWithoutExt)).default;
    if (!isBaseConstructable(site)) return;
    addSite(site);
});

console.log(domainTree);



export default function (url_s: string) {
    let url = new URL(url_s);
    let currentTree: DomainTree | BaseConstructable | undefined = domainTree;
    url.hostname.split(".").reverse().some(domain => {
        if (isBaseConstructable(currentTree) || typeof currentTree === "undefined") {
            return true;
        }
        currentTree = currentTree[domain];
        return false;
    });
    if (isBaseConstructable(currentTree)) {
        const t = new currentTree(url);
        return t.fetch();
    } else {
        const base = new Base(url);
        return base.fetch();
    }
}