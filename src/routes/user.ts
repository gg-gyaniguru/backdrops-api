import express from 'express';
import nodemailer from 'nodemailer';
import {create, existsBy_id, existsByEmail, existsByUsername, type SignUp} from "../queries/user.ts";
import {isValidEmail, isValidUsername} from "../validations/user.ts";
import {compare, encrypt} from "../utils/bcrypt.ts";
import User from "../models/user.ts";
import type {CustomRequest} from "../types/CustomRequest.ts";
import {createSrc, removeSrc} from "./drop.ts";
import {Types} from "mongoose";
import {verify} from "../middlewares/user.ts";
import {generateAccessToken} from "../utils/jwt.ts";
import Drop from "../models/drop.ts";
import Comment from "../models/comment.ts";
import Notification from "../models/notification.ts";

const {GMAIL_ID, GMAIL_PASSWORD} = process.env;

const router = express.Router();

router.post('/otp', async (request, response) => {
    try {
        const {email, otp} = request.body;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GMAIL_ID,
                pass: GMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: GMAIL_ID,
            to: email,
            subject: 'backdrops verification',
            text: otp
        }

        await transporter.sendMail(mailOptions);

        return response.status(201).json({message: 'otp send success'});

    } catch (error) {
        return response.status(500).json({message: 'internal error'});
    }
});

router.post('/signup', async (request, response) => {

    try {

        const {username, email, password} = request.body;

        if (!username || !email || !password) {
            return response.status(400).json({message: 'all fields are required'});
        }
        if (username.length < 5) {
            return response.status(400).json({message: 'username must be at least 5 characters'});
        }
        if (!isValidUsername(username)) {
            return response.status(400).json({message: 'invalid username'});
        }
        if (await existsByUsername(username)) {
            return response.status(400).json({message: 'username already exists'});
        }
        if (!isValidEmail(email)) {
            return response.status(400).json({message: 'invalid email'});
        }
        if (await existsByEmail(email)) {
            return response.status(400).json({message: 'email already exists'});
        }

        const encryptPassword = await encrypt(password);

        const user: SignUp = {username: username, email: email, password: encryptPassword};
        const createUser = await create(user);

        const accessToken = generateAccessToken(`${createUser._id}`);

        return response.status(201).json({
            _id: createUser._id,
            username: createUser.username,
            accessToken: accessToken
        });
        // return response.status(201).json({_id: createUser._id, username: createUser.username});

    } catch (error) {

        return response.status(500).json({message: 'internal error'});
    }
})

router.post('/signin', async (request, response) => {
    try {
        const {email, password} = request.body;

        if (!email || !password) {
            return response.status(400).json({message: 'all fields are required'});
        }

        const user = await User.findOne({email}).select(['username', 'password']).exec();

        if (!user) {
            return response.status(400).json({message: 'invalid email or password'});
        }

        if (!await compare(password, user.password)) {
            return response.status(400).json({message: 'invalid email or password'});
        }

        const accessToken = generateAccessToken(`${user._id}`);

        return response.status(200).json({_id: user._id, username: user.username, accessToken: accessToken});

        // return response.status(200).json({_id: user._id, username: user.username});

    } catch (error) {
        return response.status(500).json({message: 'internal error'});
    }
})

router.use(verify);

router.post('/upload', async (request: CustomRequest, response) => {

    try {

        const _id = request._id;

        const user = await User.findOne({_id}).select(['src']);

        if (!user) {
            return response.status(404).json({message: 'user not found'});
        }

        if (user.src) {
            await removeSrc(user.src);
        }

        const files = request.files as { image: any };
        const image = files.image;

        if (!image) {
            return response.status(404).json({message: 'image not found'});
        }

        const src = await createSrc(image);

        await User.findOneAndUpdate({_id}, {$set: {src: `${src}`}}, {new: true}).exec();

        return response.status(202).json({message: 'upload success'});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }

});

router.get('/get', async (request: CustomRequest, response) => {

    try {
        const _id = request._id;

        const user = await User.findOne({_id}).select(['username']);

        if (!user) {
            return response.status(404).json({message: 'user not found'});
        }

        return response.status(200).json({data: user});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

router.get('/get/:username', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;
        const {username} = request.params;

        // let follower: boolean = false;

        const user = await User.aggregate([
            {$match: {username}},
            {
                $addFields: {
                    isFollowing: {
                        $in: [new Types.ObjectId(_id), '$followers']
                    }
                },
            },
            {
                $project: {
                    _id: 1,
                    src: 1,
                    username: 1,
                    following: {$size: '$following'},
                    followers: {$size: '$followers'},
                    drops: {$size: '$drops'},
                    collections: {$size: '$collections'},
                    isFollowing: 1,
                    verified: 1
                }
            }
        ]);

        return response.status(200).json({data: user[0]});
    } catch (error) {
        return response.status(500).json({message: error});
    }
});

router.get('/search/:username', async (request: CustomRequest, response) => {
    try {
        const {username} = request.params;

        const page = parseInt(`${request?.query?.page}`) || 1;
        const limit = parseInt(`${request?.query?.limit}`) || 10;
        const skip = (page - 1) * limit;

        const allUsers = await User.find({username: {$regex: username, $options: 'i'}}).countDocuments().exec();
        const users = await User.find({
            username: {
                $regex: username,
                $options: 'i'
            }
        }).select(['src', 'username', 'verified']).skip(skip).limit(limit).exec();

        if (!users) {
            return response.status(404).json({message: 'user not found'});
        }

        return response.status(200).json({data: users, allUsers});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

router.post('/follow', async (request: CustomRequest, response) => {

    try {
        const _id = request._id;
        const {following_id} = request.body;

        if (!await existsBy_id(_id as string) || !await existsBy_id(following_id)) {
            return response.status(404).json({message: 'user not found'});
        }

        await User.updateOne({_id: _id}, {$push: {following: following_id}}).exec();
        await User.updateOne({_id: following_id}, {$push: {followers: _id}}).exec();

        const notification = new Notification({
            reference: 'follow',
            user: _id,
        });

        const newNotification = await notification.save();

        await User.updateOne({_id: following_id}, {$push: {notifications: `${newNotification._id}`}}).exec();
        return response.status(202).json({message: 'following'});
    } catch (error) {
        console.log(error)
        return response.status(500).json({message: 'internal error'});
    }
});

router.post('/unfollow', async (request: CustomRequest, response) => {

    try {
        const _id = request._id;
        const {following_id} = request.body;

        if (!await existsBy_id(_id as string) || !await existsBy_id(following_id)) {
            return response.status(404).json({message: 'user not found'});
        }

        await User.updateOne({_id: _id}, {$pull: {following: following_id}}).exec();
        await User.updateOne({_id: following_id}, {$pull: {followers: _id}}).exec();

        return response.status(202).json({message: 'unfollowing'});
    } catch (error) {
        return response.status(500).json({message: 'internal error'});
    }
});

router.get('/following/:_id', async (request: CustomRequest, response) => {

    try {
        const {_id} = request.params;

        const page = Number(request.query.page) || 1;
        const limit = Number(request.query.limit) || 10;

        const skip = (page - 1) * limit;

        const users = await User.aggregate([
            {$match: {_id: new Types.ObjectId(_id)}},
            {
                $lookup: {
                    from: 'users',
                    localField: 'following',
                    foreignField: '_id',
                    as: 'following',
                }
            },
            {
                $addFields: {
                    allUsers: {$size: '$following'}
                }
            },
            {
                $addFields: {
                    followers: {
                        $slice: ['$followers', skip, limit],
                    }
                }
            },
            {
                $project: {
                    following: {
                        _id: 1,
                        src: 1,
                        username: 1,
                        verified: 1
                    },
                    allUsers: 1
                }
            }
        ]);

        /*const users = await User.findOne({_id}).select({following: {$slice: [skip, limit]}}).populate({
            path: 'following',
            select: ['src', 'username', 'verified'],
        }).exec();*/

        if (!users) {
            return response.status(404).json({message: 'users not found'});
        }

        return response.status(200).json({data: users[0]});
    } catch (error) {
        return response.status(500).json({message: error});
    }
});

router.get('/followers/:_id', async (request: CustomRequest, response) => {
    try {
        const {_id} = request?.params;

        const page = parseInt(`${request?.query?.page}`) || 1;
        const limit = parseInt(`${request?.query?.limit}`) || 10;

        const skip = (page - 1) * limit;

        const followers = await User.aggregate([
            {$match: {_id: new Types.ObjectId(_id)}},
            {
                $lookup: {
                    from: 'users',
                    localField: 'followers',
                    foreignField: '_id',
                    as: 'followers',
                }
            },
            {
                $addFields: {
                    allUsers: {$size: '$followers'}
                }
            },
            {
                $addFields: {
                    followers: {
                        $slice: ['$followers', skip, limit],
                    }
                }
            },
            {
                $project: {
                    followers: {
                        _id: 1,
                        src: 1,
                        username: 1,
                        verified: 1
                    },
                    allUsers: 1,
                }
            },
        ]);

        if (!followers) {
            return response.status(404).json({message: 'users not found'});
        }

        return response.status(200).json({data: followers[0]});
    } catch (error) {
        return response.status(500).json({message: error});
    }
});

router.get('/likes', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;

        const page = Number(request.query.page) || 1;
        const limit = Number(request.query.limit) || 10;

        const skip = (page - 1) * limit;

        const likes = await User.aggregate([
            {$match: {_id: new Types.ObjectId(_id)}},
            {
                $lookup: {
                    from: 'drops',
                    localField: 'likes',
                    foreignField: '_id',
                    as: 'drops'
                }
            },
            {
                $unwind: {
                    path: '$drops',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'drops.user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: {
                    'drops._id': -1
                }
            },
            {$skip: skip},
            {$limit: limit},
            {
                $group: {
                    _id: '$_id',
                    drops: {
                        $push: {
                            _id: '$drops._id',
                            src: '$drops.src',
                            description: '$drops.description',
                            user: {
                                _id: '$user._id',
                                src: '$user.src',
                                username: '$user.username',
                                verified: '$user.verified',
                            },
                            likes: {$size: '$drops.likes'},
                            isLike: {
                                $in: [new Types.ObjectId(_id), '$likes']
                            },
                            comments: {$size: '$drops.comments'},
                        }
                    }
                }
            },
            {
                $project: {
                    drops: {
                        _id: 1,
                        src: 1,
                        description: 1,
                        user: {
                            _id: 1,
                            src: 1,
                            username: 1,
                            verified: 1
                        },
                        likes: 1,
                        isLike: 1,
                        comments: 1
                    },
                    likes: {$sum: 1}
                }
            }
        ]);

        return response.status(200).json({data: likes[0]});

    } catch (error) {
        return response.status(500).json({message: error});
    }
})

router.delete('/remove', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;

        const user = await User.findOne({_id}).exec();
        const drops = await Drop.find({user: _id}).exec();
        const comments = await Comment.find({user: _id}).exec();


        if (!user) {
            return response.status(404).json({message: 'user not found'});
        }

        return response.status(202).json({user, drops, comments});

        /*
                if (user.src) {
                    const _id = user.src.toString();
                    await Store.deleteOne({_id});
                    removeSrc([_id]);
                }

                for (const drop of drops as any) {
                    removeSrc(drop.src.map((src: any) => src.toString()));
                    await Store.deleteMany({_id: {$in: drop.src}}).exec();
                    await User.updateOne({drops: drop._id}, {$pull: {drops: drop._id}}).exec();
                    await User.updateMany({likes: drop._id}, {$pull: {likes: drop._id}}).exec();
                    await Store.deleteMany({_id: {$in: drop.src}}).exec();
                    await Comment.deleteMany({_id: {$in: drop.comments}}).exec();
                    await drop?.deleteOne();
                }

                /!*for (const comment of drops as any) {
                    await User.updateMany({comments: comment._id}, {$pull: {comments: comment._id}}).exec();
                }*!/

                for (const drop of drops as any) {
                    for (const comment of drop.comments as any) {
                        await User.updateMany({comments: comment._id}, {$pull: {comments: comment._id}}).exec();
                    }
                }

                await User.updateMany({following: _id}, {$pull: {following: _id}}).exec();
                await User.updateMany({followers: _id}, {$pull: {followers: _id}}).exec();
                await Drops.updateMany({likes: _id}, {$pull: {likes: _id}}).exec();
                await Drops.updateMany({comments: _id}, {$pull: {comments: _id}}).exec();
                await User.deleteMany({user: _id}).exec();



                return response.status(201).json({message: 'removed'});*/
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

router.get('/getAll', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;
        console.log(_id)
        const page = Number(request.query.page) || 1;
        const limit = Number(request.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (_id !== '669bee9eaf94898c4ecff0ad') {
            return response.status(401).json({message: 'access denied'});
        }

        const users = await User.aggregate([
            {$skip: skip},
            {$limit: limit},
            {
                $project: {
                    username: 1,
                    drops: {$size: '$drops'},
                    following: {$size: '$following'},
                    followers: {$size: '$followers'},
                    verified: 1
                }
            }
        ]);

        return response.status(200).json({data: users});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

export default router;