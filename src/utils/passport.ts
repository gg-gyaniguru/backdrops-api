import passport from 'passport';
import {Strategy} from 'passport-google-oauth20';

const {GOOGLE_ID, GOOGLE_SECRET} = process.env;

passport.use(new Strategy({
    clientID: GOOGLE_ID as string,
    clientSecret: GOOGLE_SECRET as string,
    callbackURL: 'http://localhost:9060/google',
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj as any);
});

export default passport;