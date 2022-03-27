import { Router } from 'express';
import { ensureLoggedIn } from 'connect-ensure-login';
import { db } from '../../db';
import { IMessageDoc } from '../../wa/types';
import { sockHandler } from '../../app';
import { join } from 'path';

const router = Router();

const loggedIn = ensureLoggedIn()

router.get('/chats', loggedIn, (
    req,
    res,
) => {
    db.collection(req.session.waUser).distinct('in').then(c => res.send(c.join(',')))
});

router.get('/chats/:chatID/messages', loggedIn, async (
    req,
    res,
) => {
    const before = Number(req.query.before);
    const messages = await db.collection<IMessageDoc>(req.session.waUser).find({
        in: req.params.chatID,
        ...(before ? {timestamp: { $lt: before }}: {}),
    }).sort({
        timestamp: -1,
    }).limit(Math.min(Number(req.query.count ?? 10), 100)).toArray();

    res.send(messages.map(m => {
        return {
            msgID: m._id.split(',')[0],
            time: m.timestamp,
            from: m.from,
            in: m.in,
            text: m.textMsg,
            media: m.media,
            quotedMsg: m.quotedID,
            caption: m.caption,
            deleted: m.deleted,
            extData: m.extData,
        };
    }));
});

router.get('/chats/:chatID/metadata', loggedIn, async (
    req,
    res,
    next
) => {
    const meta = await sockHandler.getGroupMeta(req.params.chatID);
    if (meta) {
        try {
            const avatarURL = await sockHandler.getGroupAvatar(req.params.chatID);
            console.log(avatarURL);
        }catch(e){console.error(e)}
        res.send({
            jid: meta.id,
            title: meta.subject,
            desc: Buffer.from(meta.desc).toString(),
            created: meta.creation,
            owner: meta.owner,
            participants: meta.participants,
            // avatarThumbnail: avatarURL,
        });
    } else {
        res.status(404);
        next();
    }
});

router.get('/chats/:chatID/messages/:msgID/media', loggedIn, async (
    req,
    res,
    next
) => {
    const msg = await db.collection<IMessageDoc>(req.session.waUser).findOne({
        _id: req.params.msgID + ',' + req.params.chatID,
        in: req.params.chatID,
    });
    if (msg && msg.media && !msg.media.gone) {
        res.sendFile(
            join(__dirname, '..', '..', '..', 'media', msg._id.split(',')[0] + '.' + msg.media.fileExt)
        );
    } else {
        res.status(404);
        next();
    }
});


export default router