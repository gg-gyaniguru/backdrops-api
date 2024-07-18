import {Document, model, Schema, Types} from 'mongoose';

interface Comment extends Document {
    reply: string;
    user: { type: Types.ObjectId, ref: 'User' };
    drop: { type: Types.ObjectId, ref: 'Drop' };
}

const CommentSchema = new Schema<Comment>({
    reply: {type: String, required: true, trim: true},
    user: {type: Types.ObjectId, ref: 'User', required: true},
    drop: {type: Types.ObjectId, ref: 'Drop', required: true},
}, {versionKey: false});

const Comment = model<Comment>('Comment', CommentSchema);

export type {Comment}
export default Comment;