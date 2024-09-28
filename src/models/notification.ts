import mongoose, {Document, Schema, Types} from 'mongoose';

interface Notification extends Document {
    reference: string;
    user: { type: Types.ObjectId, ref: 'User' };
    drop: { type: Types.ObjectId, ref: 'Drop' };
    comment: { type: Types.ObjectId, ref: 'Comment' };
}

const notificationSchema = new Schema<Notification>({
    reference: {
        type: String,
        enum: ['like', 'comment', 'follow'],
        required: true,
    },
    user: {type: Types.ObjectId, ref: 'User', required: true},
    drop: {type: Types.ObjectId, ref: 'Drop'},
    comment: {type: Types.ObjectId, ref: 'Comment'},
}, {versionKey: false});

const Notification = mongoose.model<Notification>('Notification', notificationSchema);

export default Notification;