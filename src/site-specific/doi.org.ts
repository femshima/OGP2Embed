import got from "got";
const cache = require("../cache");

import { WorksMessage } from "crossRefAPI";

import libxmljs from "libxmljs2";
export const hostname = "doi.org";
export async function handle(origurl: URL, before: Function, after: Function) {
    const crefResponse = await got(
        {
            url: "https://api.crossref.org/works" + origurl.pathname,
            headers: {
                'user-agent': process.env.UserAgent,
                "cache-control": 'no-cache',
            },
            cache: cache,
            responseType: "json"
        }
    );
    console.log(crefResponse.isFromCache);
    const cref = crefResponse.body as WorksMessage;
    if (cref.status !== "ok") return;
    let title, url, desc;
    desc = getAbstract(cref.message.abstract);
    url = cref.message.URL;
    title = cref.message.title[0];

    let containerTitle = cref.message["container-title"];
    let issued = cref.message.issued["date-parts"][0];
    let page = cref.message.page ?? "";
    let volume = cref.message.volume ?? "";
    let issue = cref.message.issue ?? "";

    let fields = [
        {
            name: cref.message.author.reduce((str: any, a: any) => {
                let suffix = a.suffix ?? "";
                let prefix = a.prefix ?? "";
                let given = a.given ?? "";
                let family = a.family;
                let sequence = a.sequence;
                let name = "";
                if (sequence === "first") {
                    name = `${prefix} ${given} ${family} ${suffix}`;
                } else if (sequence === "additional") {
                    name = `${prefix} ${family} ${given} ${suffix}`;
                } else {
                    console.log("seq:" + sequence + ";");
                    name = `${prefix} ${given} ${family} ${suffix}`;
                }
                if (str === "") {
                    return name;
                } else {
                    return str + "," + name;
                }
            }, ""),
            value: `*${containerTitle},(${issued}),${page},${volume}(${issue})*`
        }
    ]
    return after({ title, url, desc, fields });
};
function getAbstract(desc: any) {
    if (typeof desc !== "string") {
        return desc;
    }
    try {
        const doc = libxmljs.parseXml(`<abstract>${desc}</abstract>`);
        const root = doc.root();
        if (root === null) {
            return desc;
        } else {
            return root.text();
        }
    } catch (e) {
        console.debug(e);
        return desc;
    }
}