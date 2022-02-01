import express from 'express';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { join } from 'path';
import { MongoClient } from 'mongodb';
import MongoStore = require('connect-mongo');
import authRouter from './routes/authRouter';
import createError = require('http-errors');
import indexRouter from './routes/indexRouter';
import apiRouter from './routes/apiRouter';
const next = require('next');

export default class ApiServer {
    private readonly next;
    private readonly port: number;

    constructor(mongoClient: MongoClient, dbName: string, port = 8080) {
        this.next = next({ dev: process.env.NODE_ENV !== 'production' });
        const handle = this.next.getRequestHandler();

        const app = express();

        // Disable x-powered-by header
        app.disable('x-powered-by');

        // Configure express app
        app.set('view engine', 'ejs');
        app.set('views', join(__dirname, 'views'));

        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));
        app.use(cookieParser());
        app.use(session({
            secret: 'aqnX003IFpPw1ol2tGaWTiNjAGbs8ER/NMz8UnYAb8g=',
            resave: false, // don't save session if unmodified
            saveUninitialized: false, // don't create session until something stored
            store: MongoStore.create({
                client: mongoClient,
                dbName: dbName
            })
        }));
        app.use(passport.authenticate('session'));
        app.use(csrf());
        app.use((
            req,
            res,
            next
        ) => {
            // @ts-ignore
            res.locals.csrfToken = req.csrfToken();
            res.locals.appName = 'WhatsApp Message Logger';
            next();
        });

        app.use(express.static(join(__dirname, 'public')));
        // app.use('/', indexRouter);
        app.use('/', authRouter);
        app.use('/api/v0', apiRouter);

        this.port = port;
        this.registerRoutes(app);

        this.next.prepare().then(() => {
            // Next.js pages
            app.get('*', (req, res) => handle(req, res));

            // Error handlers
            // Catch 404 and forward to next error handler
            app.use((
                req,
                res,
                next
            ) => next(createError(404)));
            // Handle errors and render a error page
            app.use((
                err,
                req,
                res,
                _ // 4 arguments are required for error handlers
            ) => {
                // set locals, only providing error in development
                res.locals.message = err.message;
                res.locals.error = req.app.get('env') === 'development' ? err : {};

                // render the error page
                res.status(err.status || 500);
                res.render('error');
            });

            app.listen(this.port, () => console.log(`Listening on port ${this.port}`));
        });
    }

    registerRoutes(app: express.Express) {
        app.get('/ping', (req, res) => {
            res.send((+new Date()).toString() + '');
        });
    }
}