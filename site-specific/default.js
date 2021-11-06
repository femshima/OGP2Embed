const ogs = require("open-graph-scraper");
const { MessageEmbed } = require("discord.js");
exports.before = async function before(url) {
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
exports.after = function after(data) {
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
exports.defaultHandler = async function defaultHandler(origurl, before, after) {
    const data = await before(origurl);
    return after(data);
}