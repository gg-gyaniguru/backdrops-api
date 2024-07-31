import {Document, model, Schema} from 'mongoose';

interface Store extends Document {

}

const StoreSchema = new Schema<Store>({

}, {versionKey: false});

const Store = model<Store>('Store', StoreSchema);

export default Store;