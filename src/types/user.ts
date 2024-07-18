import mongoose, {Document} from "mongoose";

export interface User extends Document {
    username: string;
    email: string;
    password: string;
    drops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Drop' }];
}

export type SignUp = {
    username: string;
    email: string;
    password: string;
}