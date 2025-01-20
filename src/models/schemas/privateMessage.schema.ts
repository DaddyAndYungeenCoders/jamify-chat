import mongoose from 'mongoose';

const privateMessageSchema = new mongoose.Schema({
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

export const PrivateMessage = mongoose.model('PrivateMessage', privateMessageSchema);
