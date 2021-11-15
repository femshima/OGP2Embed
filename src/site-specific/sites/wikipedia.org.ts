import libxmljs, { Element } from "libxmljs2";

import { Response } from "got/dist/source";

import Base from "../default";

export default class wikipedia_org extends Base {
    static readonly hostname = "wikipedia.org";
    constructor(url: URL) {
        super(url);
    }
    async fetch() {
        await super.fetch();
        if (!this.ogResult) {
            return this.embed;
        }
        const ogResponse = ((this.ogResult.response as unknown) as Response).rawBody.toString();
        const doc = libxmljs.parseHtml(ogResponse);
        const descNode = doc.get('//*[@id="mw-content-text"]/div[1]/p[1]');
        const descText = descNode !== null && (descNode as Element).text();
        if (descText) {
            this.embed.setDescription(descText);
        }
        return this.embed;
    }
}
