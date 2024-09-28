import {Document, model, Schema, Types} from 'mongoose';

interface Drop extends Document {
    src: string;
    description: string;
    user: { type: Types.ObjectId, ref: 'User' };
    likes: [{ type: Types.ObjectId, ref: 'User' }];
    comments: [{ type: Types.ObjectId, ref: 'Comment' }];
}

const DropSchema = new Schema<Drop>({
    src: {type: String, required: true},
    description: {type: String, required: true, trim: true},
    user: {type: Types.ObjectId, ref: 'User', required: true},
    likes: {type: [{type: Types.ObjectId, ref: 'User'}], default: []},
    comments: {type: [{type: Types.ObjectId, ref: 'Comment'}], default: []},
}, {versionKey: false});

const Drop = model<Drop>('Drop', DropSchema);

export type {Drop};
export default Drop;