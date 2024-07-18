import mongoose from "mongoose";

const connection = async () => {
    try {
        await mongoose.connect(Bun.env.MONGODB_URI as string);
    } catch (error) {
        console.error('error in connecting to database');
    }
}

export default connection;