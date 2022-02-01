import express from 'express';
import passport from 'passport';
import { Strategy as LocalPassword } from 'passport-local';
import * as argon2 from 'argon2';
import { db } from '../../db';
import { UserDoc } from './types';

const router = express.Router();

/**
 * Configure password-local strategy. The 'verify' function is
 * called with username, password and callback parameters. It will
 * search the database for the user (if present), hash the provided
 * password, and check if it matches the one in the database.
 */
passport.use(new LocalPassword(async (usr, pwd, cb) => {
    const doc = await db.collection<UserDoc>('users').findOne({username: usr});
    if (!doc) { return cb(null, false, { message: 'Incorrect username or password.' }); }

    try {
        const pwValid = await argon2.verify(doc.pwHash, pwd);
        if (!pwValid) return cb(null, false, { message: 'Incorrect username or password.' });
        return cb(null, doc);
    } catch (e) { return cb(e) }
}));

/**
 * Configure session management
 *
 */
passport.serializeUser((user, cb) => {
    process.nextTick(() => {
        // @ts-ignore
        cb(null, { id: user.id, username: user.username });
    });
});
passport.deserializeUser((user, cb) => {
    process.nextTick(() => {
        return cb(null, user as Express.User);
    });
});

/**
 * Renders the login page with a form
 */
/*router.get('/login', (req, res) => {
    res.render('login');
});*/

/**
 * Render signup form
 */
/*router.get('/signup', (
    req,
    res,
) => {
    res.render('signup');
});*/

/**
 * This route logs the user out
 */
router.post('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

/**
 * This route handles signup form submissions.
 *
 * Hashes the provided password, and inserts a new
 * document with the provided username and password
 * hash. If signup succeeds, the user is then logged in.
 */
router.post('/signup', async (
    req,
    res,
    next
) => {
    try {
        const dbRes = await db.collection('users').insertOne({
            pwHash: await argon2.hash(req.body.password),
            username: req.body.username,
            created: +new Date(),
        });
        req.login({
            id: dbRes.insertedId.toHexString(),
            username: req.body.username,
        }, (err) => {
            if (err) { return next(err); }
            res.redirect('/');
        });
    } catch(e) { return next(e) }
});

router.post('/login/password', passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login',
    failureMessage: true
}));

export default router;