const ogs = require("open-graph-scraper");
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'MessageEmb... Remove this comment to see the full error message
const { MessageEmbed } = require("discord.js");
exports.before = async function before(url: any) {
    const { error, result, response } = await ogs({ url: url.href });
    if (error) Promise.reject("OGS Failed");
    const sendURL = new URL(result.ogUrl ?? url);
    let data = {
        title: result.ogTitle,
        url: sendURL,
        desc: result.ogDescription ?? "",
        image: new URL(result.ogImage?.url, sendURL.origin),
        fields: null,
        footer: null,
        _ogresult: result,
        _ogresponse: response
    };
    return data;
}
exports.after = function after(data: any) {
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
exports.defaultHandler = async function defaultHandler(origurl: any, before: any, after: any) {
    const data = await before(origurl);
    return after(data);
}