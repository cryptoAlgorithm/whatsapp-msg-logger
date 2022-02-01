import { Router } from 'express';
import { db } from '../../db';
import { UserDoc } from './types';

const router = Router();

declare module 'express-session' {
    export interface SessionData {
        waUser: string;
    }
}

declare global {
    namespace Express {
        interface User {
            username: string;
            id: string;
        }
    }
}

/*router.get('/', async (
    req,
    res,
) => {
    if (!req.user) { return res.render('home'); }
    // Populate session with user data
    const usr = await db.collection<UserDoc>('users').findOne({username: req.user.username});
    req.session.waUser = usr.waUser
    res.render('index', { user: req.user });
});*/

export default router