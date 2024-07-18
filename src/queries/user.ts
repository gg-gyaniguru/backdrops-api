import User from "../models/user.ts";

type SignUp = {
    username: string;
    email: string;
    password: string;
}

const create = async (user: SignUp) => {
    return await new User(user).save();
}

const existsBy_id = async (_id: string) => {
    return await User.exists({_id}).exec();
}

const existsByUsername = async (username: string) => {
    return await User.exists({username}).exec();
}

const existsByEmail = async (email: string) => {
    return await User.exists({email}).exec();
}

const getByUsername = async (username: string) => {
    return await User.findOne({username}).select('-password').exec();
}

const getByEmail = async (email: string) => {
    return await User.findOne({email}).select('-password').exec();
}

export type {SignUp};
export {create, existsBy_id, existsByUsername, existsByEmail, getByUsername, getByEmail};
