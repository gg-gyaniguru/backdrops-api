import express from "express";
import type {CustomRequest} from "../types/CustomRequest.ts";
import User from "../models/user.ts";
import Drop from "../models/drop.ts";
import Comment from "../models/comment.ts";
import {verify} from "../middlewares/user.ts";
import Notification from "../models/notification.ts";

const router = express.Router();

router.use(verify);

router.post('/reply', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;
        const {reply, drop_id} = request.body;

        const user = await User.findOne({_id}).select(['_id']).exec();
        const drop = await Drop.findOne({_id: drop_id}).exec();

        if (!user) {
            return response.status(404).json({message: 'user not found'});
        }
        if (!drop) {
            return response.status(404).json({message: 'drop not found'});
        }

        const comment = new Comment({
            reply,
            user: user.id,
            drop: drop.id,
        });

        await user.updateOne({$push: {comments: comment._id}}).exec();
        await drop.updateOne({$push: {comments: comment._id}}).exec();

        const newComment = await comment.save();

        if (_id !== drop?.user?._id.toString()) {

            const notification = new Notification({
                reference: 'comment',
                user: _id,
                comment: newComment._id,
            });

            const newNotification = await notification.save();

            await User.updateOne({_id: `${drop?.user?._id}`}, {$push: {notifications: `${newNotification._id}`}}).exec();
        }

        return response.status(201).json({message: 'comment'});

    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

router.put('/edit', async (request: CustomRequest, response) => {
    try {
        const {reply_id, reply} = request.body;

        const comment = await Comment.findOne({_id: reply_id}).select(['_id']).exec();

        if (!comment) {
            return response.status(404).json({message: 'comment not found'});
        }

        await Comment.updateOne({_id: reply_id}, {reply: reply}).exec();

        return response.status(202).json({message: 'edit comment'});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

router.get('/get', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;
        const comments = await Comment.find({user: _id}).exec();
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
})

router.delete('/remove/:_id', async (request: CustomRequest, response) => {
    try {

        const {_id} = request.params;

        await User.updateOne({comments: _id}, {$pull: {comments: _id}}).exec();
        await Drop.updateOne({comments: _id}, {$pull: {comments: _id}}).exec();

        await Comment.deleteOne({_id}).exec();

        return response.status(202).json({message: 'comment remove'});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

export default router;