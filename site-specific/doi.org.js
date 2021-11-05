const axios = require("axios");
const libxmljs = require("libxmljs2");
exports.hostname = "doi.org";
exports.handle = async (origurl,before,after) => {
    const cref = await axios.get(
        "https://api.crossref.org/works" + origurl.pathname,
        { headers: { 'User-Agent': process.env.UserAgent } }
    );
    console.log(JSON.stringify(cref.data.message));
    if (cref.data.status !== "ok") return;
    let title, url, desc;
    desc = getAbstract(cref.data.message.abstract);
    url = cref.data.message.URL;
    title = cref.data.message.title[0];

    let containerTitle = cref.data.message["container-title"];
    let issued = cref.data.message.issued["date-parts"][0];
    let page = cref.data.message.page ?? "";
    let volume = cref.data.message.volume ?? "";
    let issue = cref.data.message.issue ?? "";

    let fields = [
        {
            name: cref.data.message.author.reduce((str, a) => {
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
function getAbstract(desc) {
    const doc = libxmljs.parseXml(desc);
    return doc.root().text();
}