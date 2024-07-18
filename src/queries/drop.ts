import Drop from "../models/drop.ts";

const create = async (drop: Drop) => {
    return await new Drop(drop).save();
}

/*const existsBy_id = async (_id: string) => {
    return await User.exists({_id}).exec();
}*/

const existsDropBy_id = async (_id: string) => {
    return await Drop.exists({_id}).exec();
}

export {create, existsDropBy_id}