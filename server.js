const http = require("http");
const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  partials: ["MESSAGE"]
});

const ogs = require("open-graph-scraper");
const libxmljs = require("libxmljs");

client.on("ready", message => {
  console.log("Bot準備完了～");
  /*client.user.setPresence({
    activities: [{ name: "!helpでヘルプを参照できます", type: "PLAYING" }],
    status: "online"
  });*/
});

client.on("messageCreate", onMessage);

const UrlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?!&//=]*)/;

function onMessage(msg) {
  if (msg.author.bot) return;
  msg.suppressEmbeds(true);
  const m = msg.content.match(UrlRegex);
  if (m === null) return;
  const embed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle(decodeURI(m[0]));
  const sentmsg = msg.channel.send({ embeds: [embed] });
  console.log(m[0]);
  let url = new URL(m[0]);
  ogs({ url: m[0] }, (error, results, response) => {
    msg.suppressEmbeds(true);
    if (error) return;
    let desc = results.ogDescription ?? "";
    if (
      desc === "" &&
      (url.hostname.endsWith(".wikipedia.org") ||
        url.hostname === "wikipedia.org")
    ) {
      const doc = libxmljs.parseXml(response.rawBody);
      desc = doc.get('//*[@id="mw-content-text"]/div[1]/p[1]').text();
    }
    embed
      .setTitle(results.ogTitle)
      .setURL(results.ogUrl)
      .setDescription(desc)
      .setThumbnail(results.ogImage?.url);
    sentmsg.then(d => d.edit({ embeds: [embed] }));
  });
}

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
