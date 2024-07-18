import type {NextFunction, Response} from "express";
import {verifyAccessToken} from "../utils/jwt.ts";
import type {CustomRequest} from "../types/CustomRequest.ts";

const verify = (request: CustomRequest, response: Response, next: NextFunction) => {
    try {
        let accessToken = request.header('Authorization');
        if (!accessToken) {
            return response.status(401).json({message: 'access denied'});
        }
        if (!accessToken.startsWith('Bearer ')) {
            return response.status(400).json({message: 'access denied'});
        }
        accessToken = accessToken.replace('Bearer ', '');
        const decode = verifyAccessToken(accessToken) as { _id: string };
        request._id = decode._id;
        next();
    } catch (error) {
        return response.status(401).json({message: 'access denied'});
    }
}

export {verify};