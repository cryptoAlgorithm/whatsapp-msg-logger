import parseUID from '../utils/parseUID';
import downloadMedia, { mediaTypes } from '../utils/downloadMedia';
import { proto } from '@adiwajshing/baileys';
import IWebMessageInfo = proto.IWebMessageInfo;
import IMessage = proto.IMessage;
import IStickerMessage = proto.IStickerMessage;
import IDocumentMessage = proto.IDocumentMessage;
import IVideoMessage = proto.IVideoMessage;
import IImageMessage = proto.IImageMessage;
import IAudioMessage = proto.IAudioMessage;
import mime = require('mime-types');
import { db } from '../db';
import { IMessageDoc } from './types';

/**
 * Handles *one* message event, doing required actions and
 * writing the appropriate data to the database
 * @returns {boolean} - True if message was parsed, false if message type is currently unsupported
 */
export default async function(
    msg: IWebMessageInfo,
    msgType: keyof IMessage,
    usrUID: string
): Promise<boolean> {
    let baseDoc: IMessageDoc = {
        _id: msg.key.id + ',' + msg.key.remoteJid,
        timestamp: Number(msg.messageTimestamp),
        from: msg.key.participant ? parseUID(msg.key.participant) : msg.key.remoteJid,
        in: msg.key.remoteJid // Ends with @s... if a single chat, @g... if group chat
    }

    if (Object.keys(mediaTypes).includes(msgType)) {
        const
            mm = msg.message[msgType] as
                IImageMessage |
                IAudioMessage |
                IVideoMessage |
                IStickerMessage |
                IDocumentMessage;
        if (typeof mm === 'string') return false; // This will never happen
        let downloadFailed = false;

        // Attempt to download media, but download/decryption errors
        // might occur and crashing the whole program isn't desirable
        const ext = mime.extension(mm.mimetype);
        try { await downloadMedia(msgType, mm, msg.key.id, ext); }
        catch (e) {
            downloadFailed = true;
            console.log('Failed to download file');
        }

        baseDoc = {
            media: {
                mimetype: mm.mimetype,
                fileExt: ext,
                gone: downloadFailed,
                fileName: 'title' in mm ? mm.title : null
            },
            ...baseDoc
        };
        if ('caption' in mm) baseDoc = {caption: mm.caption, ...baseDoc}
    }
    else if (msgType === 'conversation') baseDoc = {textMsg: msg.message?.conversation, ...baseDoc};
    else if (msgType === 'extendedTextMessage') {
        baseDoc = { textMsg: msg.message?.extendedTextMessage.text, ...baseDoc }
        // contextInfo.stanzaId is the quoted message's ID (if present)
        if (
            msg.message?.extendedTextMessage?.contextInfo
            && 'stanzaId' in msg.message?.extendedTextMessage?.contextInfo
        ) baseDoc = {quotedID: msg.message.extendedTextMessage.contextInfo.stanzaId, ...baseDoc}
        else baseDoc = {
            extData: {
                font: msg.message?.extendedTextMessage?.font,
                textColor: msg.message?.extendedTextMessage?.textArgb,
                backgroundColor: msg.message?.extendedTextMessage?.backgroundArgb
            }, ...baseDoc
        }
    }
    else if (
        msgType === 'protocolMessage'
        && msg.message.protocolMessage.type === proto.ProtocolMessage.ProtocolMessageType.REVOKE
    ) {
        // A message has been deleted
        // Edit document to show the message is deleted
        await db.collection(usrUID).updateOne(
            {_id: msg.message.protocolMessage.key.id + ',' + msg.message.protocolMessage.key.remoteJid},
            { $set: {deleted: true} } // Mark this message as deleted
        )
        return true;
    }
    // Ignore these types of messages
    else return msgType === 'messageContextInfo' || msgType === 'senderKeyDistributionMessage';

    // Insert the message if it's not already present, else update it
    await db.collection<IMessageDoc>(usrUID).updateOne(
        {_id: baseDoc._id},
        {$set: baseDoc},
        {upsert: true}
    );

    return true;
}