import libxmljs, { Element } from "libxmljs2";
export const hostname = "wikipedia.org";
export async function handle(origurl: any, before: any, after: any) {
    let { title, url, desc, image, _ogresponse } = await before(origurl);
    const doc = libxmljs.parseHtml(_ogresponse.rawBody);
    const descNode = doc.get('//*[@id="mw-content-text"]/div[1]/p[1]');
    if (descNode !== null) {
        desc = (descNode as Element).text();
    }
    return after({ title, url, desc, image });
};