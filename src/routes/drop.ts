import express from 'express';
import type {CustomRequest} from "../types/CustomRequest.ts";
import Drop from "../models/drop.ts";
import User from "../models/user.ts";
import Store from "../models/store.ts";
import cloudinary from "../utils/cloudinary.ts";
import {unlinkSync} from "node:fs";
import {existsBy_id} from "../queries/user.ts";
import {existsDropBy_id} from "../queries/drop.ts";
import {Types} from "mongoose";
import {verify} from "../middlewares/user.ts";
import Comment from "../models/comment.ts";

const router = express.Router();

const png = (_id: string) => {
    return `${_id}.png`;
}

const createSrc = async (image: any) => {
    try {
        const newStore = new Store();
        const _id = newStore._id;
        image.name = png(`${_id}`);
        const filePath = `public/${image.name}`;
        await image.mv(filePath);
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: 'image'
        });
        unlinkSync(filePath);
        return response.url;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

const removeSrc = (src: string[]) => {
    for (const s of src) {
        unlinkSync(`public/${png(s)}`);
    }
}

router.use(verify);

router.post('/create', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;
        const {description} = request.body;

        const user = await User.findOne({_id}).select('drops').exec();

        if (!user) {
            return response.status(404).json({message: 'user not found'});
        }

        if (description.length < 5) {
            return response.status(400).json({message: 'description must be at least 5 characters'});
        }

        const files = request.files as { image: any };
        const image = files.image;

        const src = [];

        if (!image) {
            return response.status(404).json({message: 'image not found'});
        }

        // if (image.length > 1) {
        //     for (const i of image) {
        //         src.push(await createSrc(i));
        //     }
        // } else {
        src.push(await createSrc(image));
        // }

        const drop = new Drop({
            src: src,
            description: description,
            user: user._id,
        });

        const createDrop = await drop.save();

        // await user.updateOne({$push: {drops: createDrop}});

        user.drops.push(createDrop._id as { type: Types.ObjectId, ref: 'Drop' });
        await user.save();

        return response.status(200).json({message: 'drop create'});
    } catch (error) {
        return response.status(500).json({message: 'internal error'});
    }
});

router.get('/get/:username', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;
        const {username} = request.params;

        const drops = await Drop.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                }
            },
            {$match: {'user.username': username}},
            {
                $unwind: '$user',
            },
            {
                $addFields: {
                    isLike: {
                        $in: [new Types.ObjectId(_id), '$likes']
                    }
                },
            },
            {
                $project: {
                    _id: 1,
                    src: 1,
                    description: 1,
                    user: {
                        _id: 1,
                        src: 1,
                        username: 1,
                        verified: 1
                    },
                    likes: {$size: '$likes'},
                    isLike: 1,
                    comments: {$size: '$comments'},
                },
            }
        ])

        return response.status(200).json({data: drops});
        // return response.status(200).json({data: user?.drops});
    } catch (error) {
        return response.status(500).json({message: error});
    }
});

router.get('/get', async (request: CustomRequest, response) => {

    try {

        const _id = request._id;

        const drops = await Drop.aggregate([
            {$match: {}},
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                }
            },
            {
                $unwind: '$user',
            },
            {
                $addFields: {
                    isLike: {
                        $in: [new Types.ObjectId(_id), '$likes']
                    }
                },
            },
            {
                $project: {
                    _id: 1,
                    src: 1,
                    description: 1,
                    user: {
                        _id: 1,
                        src: 1,
                        username: 1,
                        verified: 1
                    },
                    likes: {$size: '$likes'},
                    isLike: 1,
                    comments: {$size: '$comments'},
                },
            }
        ])

        return response.status(200).json({data: drops});
    } catch (error) {
        return response.status(500).json({message: error});
    }

});

router.get('/search/:description', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;

        const {description} = request.params;

        const drops = await Drop.aggregate([
            {$match: {description: new RegExp(`^${description}`)}},
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user',
                }
            },
            {
                $unwind: '$user',
            },
            {
                $addFields: {
                    isLike: {
                        $in: [new Types.ObjectId(_id), '$likes']
                    }
                },
            },
            {
                $project: {
                    _id: 1,
                    src: 1,
                    description: 1,
                    user: {
                        _id: 1,
                        src: 1,
                        username: 1,
                        verified: 1
                    },
                    likes: {$size: '$likes'},
                    isLike: 1,
                    comments: {$size: '$comments'},
                },
            }
        ])
        return response.status(200).json({data: drops});
    } catch (error) {
        return response.status(500).json({message: error});
    }
});

router.post('/like', async (request: CustomRequest, response) => {
    try {

        const _id = request._id;

        const {drop_id} = request.body;

        if (!await existsBy_id(_id as string) || !await existsDropBy_id(drop_id)) {
            return response.status(404).json({message: 'not found'});
        }

        await Drop.updateOne({_id: drop_id}, {$push: {likes: _id}}).exec();
        await User.updateOne({_id}, {$push: {likes: drop_id}}).exec();

        return response.status(202).json({message: 'like'});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

router.post('/unlike', async (request: CustomRequest, response) => {
    try {

        const _id = request._id;

        const {drop_id} = request.body;

        if (!await User.exists({_id}).exec() || !await Drop.exists({_id: drop_id}).exec()) {
            return response.status(404).json({message: 'not found'});
        }

        await Drop.updateOne({_id: drop_id}, {$pull: {likes: _id}}).exec();
        await User.updateOne({_id}, {$pull: {likes: drop_id}}).exec();

        return response.status(202).json({message: 'unlike'});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

router.get('/likes/:_id', async (request: CustomRequest, response) => {
    try {

        const {_id} = request.params;

        const page = Number(request.query.page) || 1;
        const limit = Number(request.query.limit) || 10;
        const skip = (page - 1) * limit;

        const likes = await Drop.aggregate([
            {$match: {_id: new Types.ObjectId(_id)}},
            {
                $lookup: {
                    from: 'users',
                    localField: 'likes',
                    foreignField: '_id',
                    as: 'likes'
                }
            },
            {
                $addFields: {
                    allUsers: {$size: '$likes'}
                }
            },
            {$skip: skip},
            {$limit: limit},
            {
                $project: {
                    likes: {
                        _id: 1,
                        src: 1,
                        username: 1,
                        verified: 1
                    },
                    allUsers: 1
                }
            }
        ])

        return response.status(200).json({data: likes[0]});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

router.get('/comments/:_id', async (request: CustomRequest, response) => {
        try {
            const {_id} = request.params;

            const page = Number(request.query.page) || 1;
            const limit = Number(request.query.limit) || 10;
            const skip = (page - 1) * limit;

            /* const drop = await Drop.findOne({_id}).select(['comments']).populate({
                 path: 'comments',
                 select: ['-drop'],
                 populate: {path: 'user', select: ['src', 'username', 'verified']}
             });*/

            const drop = await Drop.aggregate([
                {
                    $match: {_id: new Types.ObjectId(_id)}
                },
                {
                    $lookup: {
                        from: 'comments',
                        localField: '_id',
                        foreignField: 'drop',
                        as: 'comments'
                    }
                },
                {
                    $unwind: {
                        path: '$comments',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'comments.user',
                        foreignField: '_id',
                        as: 'comments.userDetails'
                    }
                },
                {
                    $unwind: {
                        path: '$comments.userDetails',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        comments: {
                            $push: {
                                _id: '$comments._id',
                                reply: '$comments.reply',
                                user: {
                                    _id: '$comments.userDetails._id',
                                    src: '$comments.userDetails.src',
                                    username: '$comments.userDetails.username',
                                    verified: '$comments.userDetails.verified'
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        allUsers: {$size: '$comments'}
                    }
                },
                {$skip: skip},
                {$limit: limit},
                {
                    $project: {
                        comments: {
                            _id: 1,
                            reply: 1,
                            user: {
                                _id: 1,
                                src: 1,
                                username: 1,
                                verified: 1
                            }
                        },
                        allUsers: 1
                    }
                }
            ]);

            if (drop[0].comments[0]._id) {
                return response.status(200).json({data: drop[0]});
            }

            return response.status(200).json({data: {comments: []}});
        } catch
            (error) {
            return response.status(500).json({message: 'something went wrong'});
        }
    }
)
;

router.delete('/remove/:_id', async (request: CustomRequest, response) => {

    try {
        const {_id} = request.params;

        const drop = await Drop.findOne({_id}).select(['src', 'comments']).exec();

        if (!drop) {
            return response.status(404).json({message: 'drop not found'});
        }

        for (const comment of drop.comments as any) {
            await User.updateMany({comments: comment._id}, {$pull: {comments: comment._id}}).exec();
        }

        removeSrc(drop.src.map(src => src.toString()));

        await Store.deleteMany({_id: {$in: drop.src}}).exec();

        await User.updateOne({drops: _id}, {$pull: {drops: _id}}).exec();
        await User.updateMany({likes: _id}, {$pull: {likes: _id}}).exec();
        // await User.updateMany({comments: _id}, {$pull: {comments: _id}}).exec();
        await Comment.deleteMany({_id: {$in: drop.comments}}).exec();

        await drop?.deleteOne();

        return response.status(201).json({message: 'remove'});
    } catch (error) {
        return response.status(500).json({message: 'something went wrong'});
    }
});

export {createSrc, removeSrc};
export default router;