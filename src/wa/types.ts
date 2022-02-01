import { proto } from '@adiwajshing/baileys';
import ExtendedTextMessageFontType = proto.ExtendedTextMessage.ExtendedTextMessageFontType;

export interface IMessageMedia {
    mimetype: string,
    fileExt: string,
    gone: boolean,
    fileName: string | null,
}
export interface IExtendedMessageData {
    textColor: number,
    backgroundColor: number,
    font: ExtendedTextMessageFontType,
}

export interface IMessageDoc {
    _id: string;
    timestamp: number,
    from: string,
    in: string,
    media?: IMessageMedia,
    caption?: string,
    textMsg?: string,
    quotedID?: string,
    deleted?: boolean,
    extData?: Partial<IExtendedMessageData>,
}