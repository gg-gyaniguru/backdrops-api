import jwt from 'jsonwebtoken';

const {SECRET_KEY} = process.env

const generateAccessToken = (_id: string) => {
    return jwt.sign({_id}, SECRET_KEY as string, {expiresIn: '5d'});
}

const verifyAccessToken = (accessToken: string) => {
    return jwt.verify(accessToken, SECRET_KEY as string);
}

export {generateAccessToken, verifyAccessToken};