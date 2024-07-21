import mongoose from "mongoose";

const connection = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/backdrops');
    } catch (error) {
        console.error('error in connecting to database');
    }
}

export default connection;