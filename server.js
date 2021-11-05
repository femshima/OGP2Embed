const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  partials: ["MESSAGE"]
});

if (process.env.NODE_ENV === "development") {
  require('dotenv').config();
}
const siteSpecific = require("./site-specific/index");

client.on("ready", () => {
  console.log("Bot準備完了～");
});

client.on("messageCreate", onMessage);

const UrlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?!&//=]*)/g;

function onMessage(msg) {
  if (msg.author.bot) return;
  let defaultEmbedsDict = {};
  AddEmbeds(defaultEmbedsDict, msg.embeds);
  msg.suppressEmbeds(true);

  const m = [...msg.content.matchAll(UrlRegex)];
  if (m.length === 0) return;

  const urls = m.filter(match => match.length > 0).map(match => match[0]);
  const placeHolderEmbeds = urls.map(url => {
    return new MessageEmbed()
      .setColor("#0099ff")
      .setURL(url)
      .setTitle(decodeURI(url));
  });

  let placeHolderEmbedsDict = {};
  AddEmbeds(placeHolderEmbedsDict, placeHolderEmbeds);
  defaultEmbedsDict = { ...placeHolderEmbedsDict, ...defaultEmbedsDict };

  const placeHolder = msg.channel.send({
    embeds: placeHolderEmbeds
  });

  const PromiseArray = urls.map(url => siteSpecific(url));
  Promise.allSettled(PromiseArray).then(res => {
    AddEmbeds(defaultEmbedsDict, msg.embeds);
    msg.suppressEmbeds(true);
    let isEmbedNeeded = false;
    const embeds = res.map((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        isEmbedNeeded = true;
        return r.value;
      } else {
        if (r.reason) console.log(r.reason);
        const embed = defaultEmbedsDict[urls[i]];
        return embed.setTitle(decodeURI(embed.url));
      }
    });
    if (embeds.length === 0 || !isEmbedNeeded) {
      msg.suppressEmbeds(false);
      placeHolder.then(phMessage => {
        phMessage.delete();
      });
    } else {
      placeHolder.then(phMessage => {
        msg.suppressEmbeds(true);
        phMessage.edit({ embeds });
      });
    }
  });
}



function AddEmbeds(EmbedDict, embeds) {
  embeds.forEach(embed => {
    EmbedDict[embed.url] = embed;
  });
}

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
