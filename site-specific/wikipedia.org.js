const libxmljs = require("libxmljs2");
exports.hostname = "wikipedia.org";
exports.handle = (base, response) => {
    let { title, url, desc, image } = base;
    const doc = libxmljs.parseXml(response.rawBody);
    desc = doc.get('//*[@id="mw-content-text"]/div[1]/p[1]').text();
    return { title, url, desc, image };
};