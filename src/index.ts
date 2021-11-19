import { Client, Intents, MessageEmbed, Message, PartialMessage, TextChannel, Permissions } from "discord.js";
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
  partials: ["MESSAGE", "REACTION"]
});

import { config as dotenvconfig } from 'dotenv';
import { CancelError } from "got/dist/source";
dotenvconfig();

import logger from "./log";

logger.info("Starting...");

import siteSpecific from "./site-specific/index";

import Sequelize, { SentMessages } from "./models/";


client.on("ready", () => {
  logger.info("Started!");
});

client.on("messageCreate", onMessage);

function onMessage(msg: Message) {
  if (msg.author.bot) return;
  let processedFlag = false;
  const onMessageEmbedAdd = async (embeds: MessageEmbed[]) => {

    if (processedFlag) return;
    processedFlag = true;

    //logger.debug("onEmbedAdded:", embeds);


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
        if (r.reason) {
          if (!(r.reason instanceof CancelError)) {
            logger.warning(r.reason, { url: embeds[i].url });
          }
        }
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

    SentMessages.create({
      guildId: phMessage.guildId,
      channelId: phMessage.channelId,
      messageId: phMessage.id,
      originMessageId: msg.id,
      originUserId: msg.author.id,
      originCreatedAt: msg.createdAt,
      originUpdatedAt: msg.editedAt
    });

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
  if (embeds.length === 0 ||
    embeds[embeds.length - 1].description !== "Do you really want to remove this embed?(y|N)") {
    embeds.push(new MessageEmbed().setDescription("Do you really want to remove this embed?(y|N)")
      .setColor("RED"));
    await message.edit({ embeds });
  }
}
async function cleanWarning(message: Message | PartialMessage) {
  const embeds = message.embeds;
  if (embeds.length > 0 &&
    embeds[embeds.length - 1].description === "Do you really want to remove this embed?(y|N)") {
    embeds.pop();
    await message.edit({ embeds });
  }
}

client.on("messageReactionAdd", async (reaction, user) => {
  try {
    await reaction.message.fetch();

    const bomb = "💣";/* Bomb */
    const y = "🇾";
    const n = "🇳";

    if (reaction.emoji.name !== bomb) return;
    if (
      !client.user || reaction.message.author?.id !== client.user.id ||
      user.id === client.user.id ||
      reaction.message.deleted) {
      return;
    }

    //TODO: Cleaner type
    const channel = await reaction.message.channel.fetch() as TextChannel;
    const user_f = await user.fetch();
    const msg = await SentMessages.findOne({
      where: {
        guildId: reaction.message.guildId,
        channelId: reaction.message.channelId,
        messageId: reaction.message.id,
      }
    });

    const deletable =
      (msg !== null && msg.originUserId === user.id) ||
      channel.permissionsFor(user_f)?.has(Permissions.FLAGS.MANAGE_MESSAGES, false);
    if (!deletable) {
      return;
    }


    const rP = reaction.message.awaitReactions({
      filter: (reaction, _user) => {
        return (reaction.emoji.name === y || reaction.emoji.name === n)
          && _user.id === user.id;
      }, max: 1, time: 5000
    });

    await Promise.all([
      addWarning(reaction.message),
      reaction.message.react(y),
      reaction.message.react(n),
      reaction.message.react(bomb)
    ]);
    const r = await rP;
    const yR = r.get(y);
    const nR = r.get(n);
    await reaction.message.fetch();
    if (reaction.message.deleted) return;
    if (yR && yR.count > 0 && !(nR && nR.count > 0)) {
      reaction.message.delete();
    } else {
      cleanWarning(reaction.message);
      reaction.message.reactions.removeAll();
    }
  } catch (e) {
    logger.error(e);
  }
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  logger.alert("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
