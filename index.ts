import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import session from 'express-session';

const app = express();
const port = 5000;

//typically with env variables
const BITBADGES_CLIENT_ID = process.env.BITBADGES_CLIENT_ID ?? '';
const BITBADGES_CLIENT_SECRET = process.env.BITBADGES_CLIENT_SECRET ?? '';

app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user as any);
});

passport.use(
    new OAuth2Strategy(
        {
            authorizationURL: 'https://bitbadges.io/auth/codegen',
            tokenURL: 'https://api.bitbadges.io/api/v0/siwbbRequest/fetch',
            clientID: BITBADGES_CLIENT_ID,
            clientSecret: BITBADGES_CLIENT_SECRET,
            callbackURL: `http://localhost:${port}/auth/bitbadges/callback`,
        },
        function (
            accessToken: string,
            refreshToken: string,
            profile: any,
            cb: any
        ) {
            const address = accessToken;
            const user = { address, id: address };
            console.log('user', user);
            return cb(null, user);
        }
    )
);

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/auth/bitbadges', passport.authenticate('oauth2'));

app.get(
    '/auth/bitbadges/callback',
    passport.authenticate('oauth2', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/profile');
    }
);

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).send('Unauthorized');
}

//Authenticated route
app.get('/profile', ensureAuthenticated, (req, res) => {
    return res.send(req.user);
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
