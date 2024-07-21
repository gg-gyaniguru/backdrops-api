import jwt from 'jsonwebtoken';
import random from "./random.ts";
// import random from "./random.ts";

const secret = 'secret-key';

const generateAccessToken = (_id: string) => {
    return jwt.sign({_id}, secret, {expiresIn: '5d'});
}

const verifyAccessToken = (accessToken: string) => {
    return jwt.verify(accessToken, secret);
}

export {generateAccessToken, verifyAccessToken};