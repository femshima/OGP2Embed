// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'libxmljs'.
const libxmljs = require("libxmljs2");
exports.hostname = "wikipedia.org";
exports.handle = async (origurl: any, before: any, after: any) => {
    let { title, url, desc, image, _ogresponse } = await before(origurl);
    const doc = libxmljs.parseXml(_ogresponse.rawBody);
    desc = doc.get('//*[@id="mw-content-text"]/div[1]/p[1]').text();
    return after({ title, url, desc, image });
};