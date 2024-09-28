import express from 'express';
import {verify} from "../middlewares/user.ts";
import type {CustomRequest} from "../types/CustomRequest.ts";
import User from "../models/user.ts";
import {Types} from "mongoose";
import Collection from "../models/collection.ts";
import Drop from "../models/drop.ts";

const router = express.Router();

router.use(verify);

router.post('/create', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;
        const {name} = request.body;

        if (!name) {
            return response.status(400).json({message: 'collection name are required'});
        }

        const user = await User.findOne({_id}).select('collections').exec();

        if (!user) {
            return response.status(404).json({message: 'user not found'});
        }

        const data = await User.aggregate([
            {
                $match: {_id: new Types.ObjectId(_id)},
            },
            {
                $lookup: {
                    from: 'collections',
                    localField: 'collections',
                    foreignField: '_id',
                    as: 'collections',
                }
            },
            {
                $project: {
                    _id: 0,
                    collections: 1
                }
            }
        ]);

        if (data[0].collections.filter((collection: {
            name: string
        }) => collection.name.toLowerCase() === name.toLowerCase()).length === 1) {
            return response.status(400).json({message: 'collection name already exists'});
        }

        const newCollection = new Collection({
            name
        });

        const createCollection = await newCollection.save();

        user.collections.push(createCollection._id as { type: Types.ObjectId, ref: 'Collection' });

        await user.save();

        return response.status(201).json({message: 'collection create'});
    } catch (error) {
        console.log(error)
        return response.status(500).json({message: 'internal error'});
    }
});

router.post('/drops/add', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;

        const {collection_id, drops} = request.body;

        const user = await User.findOne({_id}).select('collections').exec();

        if (!user) {
            return response.status(404).json({message: 'user not found'});
        }

        if (!user.collections.includes(collection_id as any)) {
            return response.status(400).json({message: `you can't add`});
        }

        const collection = await Collection.findOne({_id: collection_id}).exec();

        if (!collection) {
            return response.status(404).json({message: 'collection not found'});
        }
        // await User.updateOne({_id: _id}, {$push: {following: following_id}}).exec();

        if (!collection.src) {
            const drop = await Drop.findOne({_id: drops[0]}).exec();
            await Collection.findOneAndUpdate({_id: collection_id}, {$set: {src: `${drop?.src}`}}, {new: true}).exec();
        }


        for (const drop of drops as string[]) {
            if (!collection.drops.includes(drop as any)) {
                await Collection.updateOne({_id: collection_id}, {$push: {drops: drop}}).exec();
            }
        }

        // collection.drops.push(...drops);
        //
        // await collection.save();

        return response.status(201).json({message: 'drop add'});
    } catch (error) {
        console.log(error)
        return response.status(500).json({message: 'internal error'});
    }
});

router.get('/get', async (request: CustomRequest, response) => {
    try {
        // const collections = await Collection.find();
        // return response.status(200).json({data: collections});
    } catch (error) {
        console.log(error)
        return response.status(500).json({message: 'internal error'});
    }
});

router.get('/get/:username', async (request: CustomRequest, response) => {
    try {
        // const _id = request._id;
        const {username} = request.params;

        const page = parseInt(`${request?.query?.page}`) || 1;
        const limit = parseInt(`${request?.query?.limit}`) || 10;
        const skip = (page - 1) * limit;

        // const collection = await User.findOne({username}).select('collections').populate('collections').exec();

        const collections = await User.aggregate([
            {
                $match: {username: username}
            },
            {
                $addFields: {
                    allCollections: {$size: '$collections'}
                }
            },
            {
                $lookup: {
                    from: 'collections',
                    localField: 'collections',
                    foreignField: '_id',
                    as: 'collections',
                    pipeline: [
                        {$sort: {_id: 1}},
                        {$skip: skip},
                        {$limit: limit},
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    collections: 1,
                    allCollections: 1
                }
            }
        ]);

        // if (collections.length === 0) {
        //     return response.status(404).json({message: 'user not found'});
        // }

        return response.status(200).json({data: collections[0]});
    } catch (error) {
        console.log(error)
        return response.status(500).json({message: 'internal error'});
    }
});

router.get('/drops/get/:collection_id', async (request: CustomRequest, response) => {
    try {
        const _id = request._id;
        const {collection_id} = request.params;

        const page = parseInt(`${request?.query?.page}`) || 1;
        const limit = parseInt(`${request?.query?.limit}`) || 10;
        const skip = (page - 1) * limit;

        const drops = await Collection.aggregate([
            {$match: {_id: new Types.ObjectId(collection_id)}},
            {
                $addFields: {
                    allDrops: { $size: '$drops' }
                }
            },
            {
                $lookup: {
                    from: 'drops',
                    localField: 'drops',
                    foreignField: '_id',
                    as: 'drops',
                    pipeline: [
                        {$sort: {_id: 1}},
                        {$skip: skip},
                        {$limit: limit},
                    ]
                }
            },
            {
                $unwind: {
                    path: '$drops',
                    preserveNullAndEmptyArrays: true
                }
            },
            // {
            //     $sort: {
            //         'drops._id': 1
            //     }
            // },
            // {$skip: skip},
            // {$limit: limit},
            {
                $group: {
                    _id: '$_id',
                    drops: {
                        $push: {
                            _id: '$drops._id',
                            src: '$drops.src',
                        }
                    },
                    allDrops: { $first: '$allDrops' }
                }
            },
            {
                $project: {
                    drops: {
                        _id: 1,
                        src: 1,
                    },
                    allDrops: 1
                }
            }
        ]);

        return response.status(200).json({data: drops[0]});

    } catch (error) {
        console.log(error)
        return response.status(500).json({message: 'internal error'});
    }
});


export default router;