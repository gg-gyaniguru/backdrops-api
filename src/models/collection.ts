import {Document, model, Schema, Types} from 'mongoose';

interface Collection extends Document {
    src: string;
    name: string;
    drops: [{ type: Types.ObjectId, ref: 'Drop' }];
}

const CollectionSchema = new Schema<Collection>({
    src: {type: String, default: null},
    name: {type: String, required: true},
    drops: {type: [{type: Types.ObjectId, ref: 'Drop'}], default: []},
}, {versionKey: false});

const Collection = model<Collection>('Collection', CollectionSchema);

export default Collection;