import type {NextFunction, Request, Response} from "express";

const secret = (request: Request, response: Response, next: NextFunction) => {

    const secret = request.header('Secret');

    if (!secret) {
        return response.status(401).json({message: 'access denied'});
    }
    if (secret !== process.env.SECRET_KEY) {
        return response.status(401).json({message: 'access denied'});
    }

    next();
}

export {secret}