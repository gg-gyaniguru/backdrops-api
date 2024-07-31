import mongoose from "mongoose";

const connection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        // await mongoose.connect('mongodb://localhost:27017/backdrops');

    } catch (error) {
        throw new Error('error in connecting to database');
    }
}

export default connection;