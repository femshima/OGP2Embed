import { Client, Intents, MessageEmbed, Message } from "discord.js";
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  partials: ["MESSAGE"]
});

import { config as dotenvconfig } from 'dotenv';
dotenvconfig();

import siteSpecific from "./site-specific/index";

client.on("ready", () => {
  console.log("Bot準備完了～");
});

client.on("messageCreate", onMessage);

const UrlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?!&//=]*)/g;

function onMessage(msg: Message) {
  if (msg.author.bot) return;
  let processedFlag = false;
  const onMessageEmbedAdd = async (embeds: MessageEmbed[]) => {
    if (processedFlag) return;
    processedFlag = true;

    console.log("onEmbedAdded:", embeds);


    const placeHolderEmbeds = embeds;


    const PromiseArray = embeds.map((embed: MessageEmbed) => {
      if (embed.video || embed.author || !embed.url) {
        return false;
      } else {
        return siteSpecific(embed.url);
      }
    });

    /*
      ・すべてのEmbedがデフォルトを流用する状態になっている場合
      はデフォルトのEmbedを使い、ボットによる追加はしない
    */
    let placeHolder;
    if (PromiseArray.every((p: any) => p === false)) {
      return;
    } else {
      msg.suppressEmbeds(true);
      placeHolder = msg.channel.send({
        embeds: placeHolderEmbeds
      });
    }


    const res = await Promise.allSettled(PromiseArray)
    let isEmbedNeeded = false;
    const resultEmbeds = res.map((r: any, i: number) => {
      if (r.status === "fulfilled" && r.value) {
        isEmbedNeeded = true;
        return r.value;
      } else {
        if (r.reason) console.log(r.reason);
        const embed = embeds[i];
        const urlString = embed.url;
        if (typeof urlString === "string") {
          return embed.setTitle(decodeURI(urlString));
        } else {
          //This should not happen.
          return embed;
        }
      }
    });

    const phMessage = await placeHolder
    if (embeds.length === 0 || !isEmbedNeeded) {
      msg.suppressEmbeds(false);
      phMessage.delete();
    } else {
      msg.suppressEmbeds(true);
      phMessage.edit({ embeds: resultEmbeds });
    }
  }
  if (msg.embeds.length > 0) {
    onMessageEmbedAdd(msg.embeds);
  } else {
    registerOnMessageEmbedAdd(msg, onMessageEmbedAdd);
  }
  return;
}

interface injectedMessage extends Omit<Message, "embeds"> {
  _embeds?: MessageEmbed[],
  embeds?: MessageEmbed[]
}
function registerOnMessageEmbedAdd(msg: injectedMessage, fn: Function) {
  msg._embeds = msg.embeds;
  delete msg.embeds;
  Object.defineProperty(msg, "embeds", {
    set: function (newEmbeds) {
      if (
        (this._embeds.length !== newEmbeds.length) ||
        (this._embeds.length > 0 &&
          !this._embeds.every((embed: MessageEmbed, i: number) =>
            newEmbeds[i] && embed.equals(newEmbeds[i])))
      ) {
        fn(newEmbeds);
      }
      this._embeds = newEmbeds
    },
    get: function () {
      return this._embeds;
    }
  })
}

function AddEmbeds(EmbedDict: any, embeds: any) {
  if (!Array.isArray(embeds)) return;
  embeds.forEach(embed => {
    EmbedDict[embed.url] = embed;
  });
}

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
