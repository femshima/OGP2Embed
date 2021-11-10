"use strict";
exports.__esModule = true;
var domainTree = {};
require("fs").readdirSync("site-specific").forEach(function (file) {
    if (file === "index.js")
        return;
    if (file === "default.js")
        return;
    var site = require("./" + file);
    if (typeof site.hostname !== "string")
        return;
    var currentTree = domainTree;
    site.hostname.split(".").reverse().forEach(function (domain, i, arr) {
        if (i === arr.length - 1) {
            currentTree[domain] = site.handle;
        }
        if (typeof currentTree[domain] === "undefined") {
            currentTree[domain] = {};
        }
        currentTree = currentTree[domain];
    });
});
var default_1 = require("./default");
console.log(domainTree);
function default_2(url_s) {
    var url = new URL(url_s);
    var currentTree = domainTree;
    url.hostname.split(".").reverse().some(function (domain) {
        if (typeof currentTree === "function" || typeof currentTree === "undefined") {
            return true;
        }
        currentTree = currentTree[domain];
        return false;
    });
    if (currentTree instanceof Function) {
        return currentTree(url, default_1["default"].before, default_1["default"].after);
    }
    else {
        return default_1["default"].defaultHandler(url, default_1["default"].before, default_1["default"].after);
    }
}
exports["default"] = default_2;
