import ogs, { OpenGraphImage, SuccessResult } from "open-graph-scraper";
import { MessageEmbed } from "discord.js";

const baseImplSymbol = Symbol();

interface Base {
    fetch(): Promise<MessageEmbed | undefined> | MessageEmbed | Boolean;
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

    private async fetchOGP() {
        const ogpResult = await ogs({ url: this.url.href });
        if (ogpResult.error) {
            return Promise.reject(new Error("OGS Failed"));
        }
        this.ogResult = ogpResult;
        const { error, result, response } = ogpResult;
        const sendURL = new URL(result.ogUrl ?? this.url);
        const ogImage = result.ogImage;
        let imageUrl = null;
        if (typeof ogImage === "string") {
            imageUrl = ogImage;
        } else if (Array.isArray(ogImage)) {
            imageUrl = (ogImage as OpenGraphImage[])[0].url;
        } else if (typeof ogImage === "object") {
            imageUrl = (ogImage as OpenGraphImage).url;
        }
        this.embed.setColor("#0099ff")
            .setURL(sendURL.href);
        imageUrl && this.embed.setThumbnail(new URL(imageUrl, sendURL.origin).href);
        result.ogTitle && this.embed.setTitle(result.ogTitle);
        result.ogDescription && this.embed.setDescription(result.ogDescription);

        return this.embed;
    }

    fetch(): Promise<MessageEmbed | undefined> | MessageEmbed | Boolean {
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