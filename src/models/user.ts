import {Document, model, Schema, Types} from 'mongoose';

interface User extends Document {
    src: string;
    username: string;
    email: string;
    password: string;
    drops: [{ type: Types.ObjectId, ref: 'Drop' }];
    collections: [{ type: Types.ObjectId, ref: 'Collection' }];
    likes: [{ type: Types.ObjectId, ref: 'Drop' }];
    following: [{ type: Types.ObjectId, ref: 'User' }];
    followers: [{ type: Types.ObjectId, ref: 'User' }];
    comments: [{ type: Types.ObjectId, ref: 'Comment' }];
    verified: boolean;
    subscriptions: [{ type: Types.ObjectId, ref: 'Subscription' }];
    notifications: [{ type: Types.ObjectId, ref: 'Notification' }];
}

const UserSchema = new Schema<User>({
    src: {type: String, default: null},
    username: {type: String, required: true, unique: true, trim: true},
    email: {type: String, required: true, unique: true, trim: true},
    password: {type: String, required: true, trim: true},
    drops: {type: [{type: Types.ObjectId, ref: 'Drop'}], default: []},
    collections: {type: [{type: Types.ObjectId, ref: 'Collection'}], default: []},
    likes: {type: [{type: Types.ObjectId, ref: 'Drop'}], default: []},
    following: {type: [{type: Types.ObjectId, ref: 'User'}], default: []},
    followers: {type: [{type: Types.ObjectId, ref: 'User'}], default: []},
    comments: {type: [{type: Types.ObjectId, ref: 'Comment'}], default: []},
    verified: {type: Boolean, default: false},
    subscriptions: {type: [{type: Types.ObjectId, ref: 'Subscription'}], default: []},
    notifications: {type: [{type: Types.ObjectId, ref: 'Notification'}], default: []},
}, {versionKey: false});

const User = model<User>('User', UserSchema);

export type {User};

export default User;