import { proto } from '@adiwajshing/baileys';
import IMessage = proto.IMessage;
import { join } from 'path';
import { downloadContentFromMessage } from '@adiwajshing/baileys'
import { writeFile } from 'fs/promises'
import IImageMessage = proto.IImageMessage;
import IVideoMessage = proto.IVideoMessage;
import IAudioMessage = proto.IAudioMessage;
import IStickerMessage = proto.IStickerMessage;
import IDocumentMessage = proto.IDocumentMessage; // Lol when was this a thing

const mediaTypes = {
    imageMessage: 'image',
    audioMessage: 'audio',
    videoMessage: 'video',
    stickerMessage: 'sticker',
    documentMessage: 'document',
} // Types of messages that can be downloaded (for now)

export { mediaTypes };

/**
 *
 * @param msgType
 * @param media
 * @param id - A id to identify the file when downloaded
 * @param ext - File extension
 */
export default async function (
    msgType: keyof IMessage,
    media: IImageMessage | IAudioMessage | IVideoMessage | IStickerMessage | IDocumentMessage,
    id: string,
    ext: string | false
) {
    const stream = await downloadContentFromMessage(media, mediaTypes[msgType])
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
    // Save to file with file ID
    await writeFile(join(__dirname, '../..', 'media', id + (ext ? `.${ext}` : '')), buffer);
}
