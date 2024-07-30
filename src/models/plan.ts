import {Document, model, Schema} from 'mongoose';

interface Plan extends Document {
    price: number;
    duration: string;
}

const planSchema = new Schema<Plan>({
    price: {type: Number, required: true},
    duration: {type: String, required: true},
}, {versionKey: false});

const plan = model<Plan>('Plan', planSchema);

export default plan;