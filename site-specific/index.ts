let domainTree = {};
require("fs").readdirSync("site-specific").forEach(function (file) {
    if (file === "index.js") return;
    if (file === "default.js") return;
    const site = require("./" + file);
    if (typeof site.hostname !== "string") return;
    let currentTree = domainTree;
    site.hostname.split(".").reverse().forEach((domain, i, arr) => {
        if (i === arr.length - 1) {
            currentTree[domain] = site.handle;
        }
        if (typeof currentTree[domain] === "undefined") {
            currentTree[domain] = {};
        }
        currentTree = currentTree[domain];
    });

});

const defaultFunctions = require("./default");

console.log(domainTree);

module.exports = function (url_s) {
    let url = new URL(url_s);
    let currentTree = domainTree;
    url.hostname.split(".").reverse().some(domain => {
        currentTree = currentTree[domain];
        if (typeof currentTree === "function" || typeof currentTree === "undefined") {
            return true;
        }
        return false;
    });
    if (currentTree instanceof Function) {
        return currentTree(url, defaultFunctions.before, defaultFunctions.after);
    } else {
        return defaultFunctions.defaultHandler(url, defaultFunctions.before, defaultFunctions.after);
    }
}