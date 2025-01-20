import mongoose from 'mongoose';

export interface IPrivateMessage extends Document {
    id: string;
    roomId: string;
    userAId: string;
    userBId: string;
    content: string;
    timestamp: Date;
    metadata?: Map<string, any>;
}

const privateMessageSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        index: true
    },
    roomId: {
        type: String,
        required: true,
        index: true
    },
    userAId: {
        type: String,
        required: true
    },
    userBId: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
});

export const PrivateMessage = mongoose.model<IPrivateMessage>('PrivateMessage', privateMessageSchema);
