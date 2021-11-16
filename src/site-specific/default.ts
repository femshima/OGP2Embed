import ogs, { OpenGraphImage, SuccessResult } from "open-graph-scraper";
import { MessageEmbed } from "discord.js";

const baseImplSymbol = Symbol();

interface Base {
    fetch(): Promise<MessageEmbed | Boolean> | MessageEmbed | Boolean;
}

export interface BaseConstructable extends Base {
    new(url: URL): Base;
    hostname: string;
}

export function isBaseConstructable(arg: any): arg is BaseConstructable {
    return typeof arg === "function" &&
        typeof arg.constructor === "function" &&
        arg.typeId === BaseImpl.typeId;
}


export default class BaseImpl implements Base {
    static readonly typeId = baseImplSymbol;
    static readonly hostname: string | null = null;
    protected embed: MessageEmbed;
    protected ogResult: SuccessResult | null = null;
    protected url: URL;

    constructor(url: URL) {
        this.embed = new MessageEmbed();
        this.url = url;
    }

    private isEmbedValid(embed: MessageEmbed) {
        return (embed.title !== null && embed.title !== "") ||
            (embed.description !== null && embed.description !== "");
    }

    private removeLeadingAt(input: string | undefined) {
        return input ? (input.startsWith("@") ? input.slice(1) : input) : undefined;
    }

    private async fetchOGP() {
        const ogpResult = await ogs({ url: this.url.href });
        if (ogpResult.error) {
            return Promise.reject(new Error("OGS Failed"));
        }
        this.ogResult = ogpResult;
        const { error, result, response } = ogpResult;

        const sendURL = new URL(result.ogUrl ?? this.url);

        const author = this.removeLeadingAt(result.twitterCreator) ??
            result.ogArticleAuthor ??
            result.author ??
            result.articleAuthor ??
            result.bookAuthor ??
            null;

        const footer = this.removeLeadingAt(result.ogSiteName);

        const timestamp = result.publishedTime ??
            result.articlePublishedTime ??
            result.ogArticlePublishedTime ??
            null;

        const ogImage = result.ogImage;
        let imageUrl = null;
        if (typeof result.twitterImage === "string") {
            imageUrl = result.twitterImage;
        } else if (typeof ogImage === "string") {
            imageUrl = ogImage;
        } else if (Array.isArray(ogImage)) {
            imageUrl = (ogImage as OpenGraphImage[])[0].url;
        } else if (typeof ogImage === "object") {
            imageUrl = (ogImage as OpenGraphImage).url;
        }

        this.embed.setColor("#0099ff")
            .setURL(sendURL.href);

        if (result.twitterCard === "summary_large_image") {
            imageUrl && this.embed.setImage(new URL(imageUrl, sendURL.origin).href);
        } else {
            imageUrl && this.embed.setThumbnail(new URL(imageUrl, sendURL.origin).href);
        }

        result.ogTitle && this.embed.setTitle(result.ogTitle);
        result.ogDescription && this.embed.setDescription(result.ogDescription);

        author && this.embed.setAuthor(author);

        footer && this.embed.setFooter(footer);

        try {
            timestamp && this.embed.setTimestamp(new Date(timestamp));
        } catch { }

        return this.isEmbedValid(this.embed) ?
            this.embed : false;
    }

    fetch(): Promise<MessageEmbed | Boolean> | MessageEmbed | Boolean {
        return this.fetchOGP();
    }


}

export function getFalse(hostname: string) {
    return class false_url extends BaseImpl {
        static readonly hostname = hostname;
        fetch() {
            return false;
        }
    }
}