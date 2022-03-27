import makeWASocket, {
    DisconnectReason, GroupMetadata, proto,
    useSingleFileAuthState,
    WASocket
} from '@adiwajshing/baileys';
import log from '../utils/logger';
import { Boom } from '@hapi/boom';
import parseUID from '../utils/parseUID';
import handleMsgEvt from './handleMsgEvt';
import IMessage = proto.IMessage;
import { db } from '../db';

// Save WA multi device information
const { state, saveState } = useSingleFileAuthState('./auth_info.json')

/**
 * Implements reconnection and event handling logic
 * for the WA Multi-device sock
 */
export default class WASockHandler {
    private sock: WASocket;
    private uid: string;
    private lockWriting = true; // Lock writing when db is in an unknown state

    constructor() {
        this.sock = this.createSock();
        this.listenEvents().then();
    }

    async listenEvents() {
        this.sock.ev.on('messages.upsert', async m => {
            if (this.lockWriting) return;

            if (!m || !m.messages) return;
            try {
                for (const msg of m.messages) {
                    if (m.type === 'notify' || m.type === 'append') {
                        if (!msg.message) return;
                        for (const mt of Object.keys(msg.message)) {
                            if (!await handleMsgEvt(msg, mt as keyof IMessage, this.uid))
                                console.log('Unsupported message:\n', JSON.stringify(m, undefined, 2));
                        }
                    }
                    else console.log(m.type, JSON.stringify(m, undefined, 2));
                }
            } catch (e) {
                console.error(e);
            }
        })

        this.sock.ev.on('connection.update', update => {
            const { connection, lastDisconnect } = update
            switch (connection) {
                case 'close':
                    this.lockWriting = true;
                    // Reconnect if not logged out
                    if ((lastDisconnect.error as Boom)?.output?.statusCode === DisconnectReason.loggedOut) {
                        console.log('WhatsApp logged out');
                        process.exit(9);
                        return;
                    }
                    this.sock = this.createSock();
                    this.listenEvents();
                    break;
                case 'open':
                    // Check and create db collection if not already present
                    this.uid = parseUID(this.sock.user.id);
                    db.listCollections({name: this.uid})
                        .next(async (e, info) => {
                        if (!info && !e) {
                            await db.createCollection(this.uid);
                            this.lockWriting = false;
                        }
                        else this.lockWriting = false
                    });
                    break;
                default:
                    break;
            }

            if (connection) console.log('Connection state update:', connection)
        })

        // Save updated credentials
        this.sock.ev.on('creds.update', saveState);
    }

    createSock(): WASocket {
        return makeWASocket({
            printQRInTerminal: true,
            logger: log,
            browser: ['WhatsApp Message Logger', 'Chrome', '0.1.0'],
            auth: state
        });
    }

    async getGroupMeta(jid: string): Promise<GroupMetadata | null> {
        try {
            return await this.sock.groupMetadata(jid);
        } catch (e) {
            return null;
        }
    }

    async getGroupAvatar(jid: string): Promise<string | null> {
        try {
            return await this.sock.profilePictureUrl(jid);
        } catch (e) {
            console.log(e)
            return null;
        }
    }
}