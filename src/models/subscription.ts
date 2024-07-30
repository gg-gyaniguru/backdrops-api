import {Document, model, Schema, Types} from 'mongoose';

interface Subscription extends Document {
    plan: [{ type: Types.ObjectId, ref: 'Plan' }],

}

const SubscriptionSchema = new Schema<Subscription>({

}, {versionKey: false});

const Subscription = model<Subscription>('Subscription', SubscriptionSchema);

export default Subscription;