import ogs, { OpenGraphImage } from "open-graph-scraper";
import { MessageEmbed } from "discord.js";
export async function before(url: URL) {
    const ogpResult = await ogs({ url: url.href });
    if (ogpResult.error) {
        Promise.reject("OGS Failed");
        return;
    }
    const { error, result, response } = ogpResult;
    const sendURL = new URL(result.ogUrl ?? url);
    const ogImage = result.ogImage;
    let imageUrl = null;
    if (typeof ogImage === "string") {
        imageUrl = ogImage;
    } else if (Array.isArray(ogImage)) {
        imageUrl = (ogImage as OpenGraphImage[])[0].url;
    } else if (typeof ogImage === "object") {
        imageUrl = (ogImage as OpenGraphImage).url;
    }
    let data = {
        title: result.ogTitle,
        url: sendURL,
        desc: result.ogDescription ?? "",
        image: imageUrl && new URL(imageUrl, sendURL.origin),
        fields: null,
        footer: null,
        _ogresult: result,
        _ogresponse: response
    };
    return data;
}
export function after(data: any) {
    let embed = new MessageEmbed()
        .setColor("#0099ff")
        .setURL(data.url);
    data.image && embed.setThumbnail(data.image);
    data.title && embed.setTitle(data.title);
    data.desc && embed.setDescription(data.desc);
    data.fields && embed.addFields(data.fields);
    data.footer && embed.setFooter(data.footer);
    return embed;
}
export async function defaultHandler(origurl: URL, before: Function, after: Function) {
    const data = await before(origurl);
    return after(data);
}
export default {
    before,
    after,
    defaultHandler
}