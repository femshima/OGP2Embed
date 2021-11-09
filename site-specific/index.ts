let domainTree = {};
require("fs").readdirSync("site-specific").forEach(function (file: any) {
    if (file === "index.js") return;
    if (file === "default.js") return;
    const site = require("./" + file);
    if (typeof site.hostname !== "string") return;
    let currentTree = domainTree;
    site.hostname.split(".").reverse().forEach((domain: any, i: any, arr: any) => {
        if (i === arr.length - 1) {
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            currentTree[domain] = site.handle;
        }
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        if (typeof currentTree[domain] === "undefined") {
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            currentTree[domain] = {};
        }
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        currentTree = currentTree[domain];
    });

});

const defaultFunctions = require("./default");

console.log(domainTree);

module.exports = function (url_s: any) {
    let url = new URL(url_s);
    let currentTree = domainTree;
    url.hostname.split(".").reverse().some(domain => {
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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