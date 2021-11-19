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

import { SentMessages } from "./models/";

import EmbedWatcher from "./EmbedWatcher";

client.on("ready", () => {
  logger.info("Started!");
});

async function deleteMessage(msg: Message | PartialMessage) {
  if (client.user && msg.author?.id === client.user.id) {
    await SentMessages.destroy({
      where: {
        guildId: msg.guildId,
        channelId: msg.channelId,
        messageId: msg.id,
      }
    });
  } else {
    const target = await SentMessages.findOne({
      where: {
        guildId: msg.guildId,
        channelId: msg.channelId,
        originMessageId: msg.id,
      }
    });
    if (target) {
      const targetMsg = await msg.channel.messages.fetch(target.messageId).catch(() => undefined);
      targetMsg && targetMsg.deletable && await targetMsg.delete();
    }
    await SentMessages.destroy({
      where: {
        guildId: msg.guildId,
        channelId: msg.channelId,
        originMessageId: msg.id,
      }
    });
  }
  msg.deletable && msg.delete();
  logger.debug(`deleted:${msg.id}`);
}


client.on("messageCreate", onMessage);
client.on("messageUpdate", async (before, after) => {
  if (!client.user || after.author?.id === client.user.id) {
    return;
  }
  if (before.content === after.content) {
    return;
  }
  const msg = await after.fetch();
  const sm = await SentMessages.findOne({
    where: {
      guildId: msg.guildId,
      channelId: msg.channelId,
      originMessageId: msg.id,
    }
  });
  let embedmsg: Message | null = null;
  if (sm) {
    logger.debug(`messageUpdate:${sm.messageId}->${msg.id}`);
    try {
      const textChannel = await msg.channel.fetch() as TextChannel;
      embedmsg = await textChannel.messages.fetch(sm.messageId);
    } catch { }
  }
  msg.suppressEmbeds(false);
  onMessage(msg, embedmsg);
});
client.on("messageDelete", msg => {
  if (client.user && msg.author?.id === client.user.id) return;
  deleteMessage(msg);
});

async function onMessage(msg: Message, placeHolder?: Message | null) {
  if (placeHolder === null) {
    //messageUpdateかつボットが送信したEmbedが存在しない
    return;
  }


  if (msg.author.bot) return;

  if (msg.embeds.length === 0) {
    await EmbedWatcher.attach(msg).waitForEmbed();
  }

  const embeds = msg.embeds;


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
    すべてのEmbedがデフォルトを流用する状態になっている場合
    はデフォルトのEmbedを使い、ボットによる追加はしない
  */
  if (PromiseArray.every((p: any) => p === false)) {
    if (typeof placeHolder !== "undefined") {
      const phMessage = await placeHolder;
      phMessage.deletable && deleteMessage(phMessage);
    }
    return;
  } else {
    if (typeof placeHolder === "undefined") {
      msg.suppressEmbeds(true);
      placeHolder = await msg.channel.send({
        embeds: placeHolderEmbeds
      });
    } else {
      msg.suppressEmbeds(true);
      placeHolder.edit({
        embeds: placeHolderEmbeds
      });
    }
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



  if (embeds.length === 0 || !isEmbedNeeded) {
    msg.suppressEmbeds(false);
    deleteMessage(placeHolder);
  } else {
    msg.suppressEmbeds(true);
    placeHolder.edit({ embeds: resultEmbeds });
    SentMessages.upsert({
      guildId: placeHolder.guildId,
      channelId: placeHolder.channelId,
      messageId: placeHolder.id,
      originMessageId: msg.id,
      originUserId: msg.author.id,
      originCreatedAt: msg.createdAt,
      originUpdatedAt: msg.editedAt
    });
  }

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
      if (msg) {
        const origMessage = await channel.messages.fetch(msg.originMessageId);
        origMessage.suppressEmbeds(false);
      }
      deleteMessage(reaction.message);
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
