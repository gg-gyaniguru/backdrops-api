import express from "express";
import {verify} from "../middlewares/user.ts";
import type {CustomRequest} from "../types/CustomRequest.ts";
import User from "../models/user.ts";

const router = express.Router();

router.use(verify);

router.get('/get', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;

        const user = await User.findOne({_id}).select('notifications')
            .populate({
                path: 'notifications',
                populate: {
                    path: 'user',
                    select: ['src', 'username', 'verified'],
                },
            })
            .populate({
                path: 'notifications',
                populate: {
                    path: 'drop',
                    select: ['src'],
                },
            })
            .populate({
                path: 'notifications',
                populate: {
                    path: 'comment',
                    select: ['reply'],
                    populate: {
                        path: 'drop',
                        select: ['src'],
                    }
                },
            })
            .exec();

        return response.status(200).json({data: user});
    } catch (error) {
        return response.status(500).json({message: error});
    }
});

export default router;