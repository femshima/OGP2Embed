const http = require("http");
const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  partials: ["MESSAGE"]
});

const ogs = require("open-graph-scraper");
if (process.env.NODE_ENV === "development") {
  require('dotenv').config();
}

const libxmljs = require("libxmljs");

client.on("ready", () => {
  console.log("Bot準備完了～");
});

client.on("messageCreate", onMessage);

const UrlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?!&//=]*)/g;

function onMessage(msg) {
  if (msg.author.bot) return;
  msg.suppressEmbeds(true);
  const m = [...msg.content.matchAll(UrlRegex)];
  if (m.length === 0) return;

  const urls = m.filter(match => match.length > 0).map(match => match[0]);
  const placeHolder = msg.channel.send({
    embeds: urls.map(url => {
      return new MessageEmbed()
        .setColor("#0099ff")
        .setTitle(decodeURI(url));
    })
  });
  const PromiseArray = urls.map(url => getResultEmbed(url));
  Promise.all(PromiseArray).then(res => {
    const embeds = res.filter(r => r !== null);
    placeHolder.then(phMessage => {
      msg.suppressEmbeds(true);
      phMessage.edit({ embeds });
    })
  });
}

async function getResultEmbed(url_s) {
  let url = new URL(url_s);
  const { error, result, response } = await ogs({ url: url_s });
  if (error) return null;
  let desc = result.ogDescription ?? "";
  if (
    desc === "" &&
    (url.hostname.endsWith(".wikipedia.org") ||
      url.hostname === "wikipedia.org")
  ) {
    const doc = libxmljs.parseXml(response.rawBody);
    desc = doc.get('//*[@id="mw-content-text"]/div[1]/p[1]').text();
  }
  return new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(result.ogTitle)
    .setURL(result.ogUrl)
    .setDescription(desc)
    .setThumbnail(result.ogImage?.url);
}

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
