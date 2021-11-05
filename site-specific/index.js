let domainTree = {};
require("fs").readdirSync("site-specific").forEach(function (file) {
    if (file === "index.js") return;
    const site = require("./" + file);
    if (typeof site.hostname !== "string") return;
    let currentTree = site.handle;
    site.hostname.split(".").forEach(domain => {
        currentTree = { [domain]: currentTree };
    });
    domainTree = { ...domainTree, ...currentTree };
});
console.log(domainTree);
module.exports = function (hostname, base, response) {
    let currentTree = domainTree;
    hostname.split(".").reverse().some(domain => {
        currentTree = currentTree[domain];
        if (typeof currentTree === "function" || typeof currentTree === "undefined") {
            return true;
        }
        return false;
    });
    if (typeof currentTree === "function") {
        return currentTree(base, response);
    } else {
        return base;
    }
}