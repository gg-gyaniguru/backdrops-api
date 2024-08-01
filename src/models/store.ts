import {Document, model, Schema} from 'mongoose';

interface Store extends Document {
    key: number,
    unique: string
}

const StoreSchema = new Schema<Store>({
    key: {type: Number, required: true},
    unique: {type: String, required: true},
}, {versionKey: false});

const Store = model<Store>('Store', StoreSchema);

export default Store;