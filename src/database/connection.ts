import mongoose from "mongoose";

const connection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
    } catch (error) {
        throw new Error('error in connecting to database');
    }
}

export default connection;