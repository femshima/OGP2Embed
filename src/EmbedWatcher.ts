import { Message, PartialMessage, MessageEmbed } from "discord.js";

type watchedMessage<T> = Omit<T, "embeds"> & {
    _embeds?: MessageEmbed[],
    embeds?: MessageEmbed[],
    embedWatcher?: EmbedWatcher
}
type EmbedHandler = (embeds: MessageEmbed[]) => void;

export default class EmbedWatcher {
    private handlers: EmbedHandler[] = [];
    static attach(message: watchedMessage<Message> | watchedMessage<PartialMessage>) {
        if (!(message.embedWatcher instanceof EmbedWatcher)) {
            message.embedWatcher = new EmbedWatcher(message);
        }
        return message.embedWatcher;
    }
    constructor(message: watchedMessage<Message> | watchedMessage<PartialMessage>) {
        message._embeds = message.embeds;
        delete message.embeds;
        const _this=this;
        Object.defineProperty(message, "embeds", {
            set: function (newEmbeds) {
                const oldEmbeds = this._embeds;
                this._embeds = newEmbeds;
                if (
                    (oldEmbeds.length !== newEmbeds.length) ||
                    (oldEmbeds.length > 0 &&
                        !oldEmbeds.every((embed: MessageEmbed, i: number) =>
                            newEmbeds[i] && embed.equals(newEmbeds[i])))
                ) {
                    _this.handlers.forEach((handler: EmbedHandler) => {
                        handler(oldEmbeds);
                    });
                }
            },
            get: function () {
                return this._embeds;
            }
        })
    }
    public waitForEmbed(): Promise<MessageEmbed[]> {
        return new Promise(resolve => {
            const fn = (embeds: MessageEmbed[]) => {
                this.handlers = this.handlers.filter(h => h !== fn);
                resolve(embeds);
            }
            this.handlers.push(fn);
        });
    }
}