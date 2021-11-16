import { Client, Intents, MessageEmbed, Message, ReactionEmoji, MessageReaction, PartialMessage } from "discord.js";
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
  partials: ["MESSAGE", "REACTION"]
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

    //console.log("onEmbedAdded:", embeds);


    const placeHolderEmbeds = embeds.map(embed => {
      if (
        embed.url &&
        (!embed.title ||
          (embed.title && embed.url.includes(embed.title.replace("...", ""))))
      ) {
        const url = new URL(embed.url);
        let path = url.pathname.split("/").pop() ?? url.pathname ?? url.href;
        embed.setTitle(decodeURIComponent(path));
      }
      if (!embed.description) {
        embed.setDescription("Fetching...");
      }
      return embed;
    });


    const PromiseArray = embeds.map((embed: MessageEmbed) => {
      if (!embed.url) {
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

    const phMessage = await placeHolder;
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

type injectedMessage = Omit<Message, "embeds"> & {
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

async function addWarning(message: Message | PartialMessage) {
  const embeds = message.embeds;
  if (embeds.length > 0) {
    const fieldLength = embeds[embeds.length - 1].fields.length;
    if (fieldLength === 0 ||
      embeds[embeds.length - 1].fields[fieldLength - 1].name !== "Warning") {
      embeds[embeds.length - 1].addField("Warning", "Do you really want to remove this embed?(y|N)");
      await message.edit({ embeds });
    }
  }
}
async function cleanWarning(message: Message | PartialMessage) {
  const embeds = message.embeds;
  if (embeds.length > 0) {
    const fieldLength = embeds[embeds.length - 1].fields.length;
    if (fieldLength > 0 &&
      embeds[embeds.length - 1].fields[fieldLength - 1].name === "Warning") {
      embeds[embeds.length - 1].spliceFields(fieldLength - 1, 1);
      await message.edit({ embeds });
    }
  }
}

client.on("messageReactionAdd", async (reaction, user) => {
  await reaction.message.fetch();
  if (!client.user || reaction.message.author?.id !== client.user.id) {
    return;
  }

  const bomb = "💣";/* Bomb */
  const y = "🇾";
  const n = "🇳";
  const bombR = reaction.message.reactions.cache.get(bomb);
  bombR && await bombR.users.fetch();

  if (reaction.emoji.name === bomb) {
    await Promise.all([
      addWarning(reaction.message),
      reaction.message.react(y),
      reaction.message.react(n),
      reaction.message.react(bomb)
    ]);
    const beforeBombRs = bombR?.count;
    await new Promise(resolve => setTimeout(resolve, 5000));
    await reaction.message.fetch();
    await bombR?.fetch();
    if (!reaction.message.deleted && beforeBombRs === bombR?.count) {
      reaction.message.reactions.removeAll();
      cleanWarning(reaction.message);
    }
  }
  else if (bombR?.me && bombR.users.cache.get(user.id) &&
    (reaction.emoji.name === y || reaction.emoji.name === n)
  ) {
    reaction.message.reactions.removeAll();
    if (reaction.emoji.name === y) {
      reaction.message.delete();
    } else {
      cleanWarning(reaction.message);
    }
  }
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
