import {Document, model, Schema, Types} from 'mongoose';

interface User extends Document {
    src: { type: Types.ObjectId, ref: 'Store' };
    username: string;
    email: string;
    password: string;
    drops: [{ type: Types.ObjectId, ref: 'Drop' }];
    likes: [{ type: Types.ObjectId, ref: 'Drop' }];
    following: [{ type: Types.ObjectId, ref: 'User' }];
    followers: [{ type: Types.ObjectId, ref: 'Userc' }];
    comments: [{type: Types.ObjectId, ref: 'Comment'}];
    verified:boolean;
}

const UserSchema = new Schema<User>({
    src: {type: Types.ObjectId, ref: 'Store', default: null},
    username: {type: String, required: true, unique: true, trim: true},
    email: {type: String, required: true, unique: true, trim: true},
    password: {type: String, required: true, trim: true},
    drops: {type: [{type: Types.ObjectId, ref: 'Drop'}], default: []},
    likes: {type: [{type: Types.ObjectId, ref: 'Drop'}], default: []},
    following: {type: [{type: Types.ObjectId, ref: 'User'}], default: []},
    followers: {type: [{type: Types.ObjectId, ref: 'User'}], default: []},
    comments: {type: [{type: Types.ObjectId, ref: 'Comment'}], default: []},
    verified: {type: Boolean, default: false},
}, {versionKey: false});

const User = model<User>('User', UserSchema);

export type {User};

export default User;