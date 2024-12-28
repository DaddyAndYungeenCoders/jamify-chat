import {Config} from "../models/interfaces/config.interface";

export const config: Config = {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    activemq: {
        host: process.env.ACTIVEMQ_HOST || 'localhost',
        port: parseInt(process.env.ACTIVEMQ_PORT || '61613'),
        username: process.env.ACTIVEMQ_USERNAME || 'admin',
        password: process.env.ACTIVEMQ_PASSWORD || 'admin',
        queues: {
            incoming: process.env.QUEUE_INCOMING || 'jamify.app.save-and-repub',
            outgoing: process.env.QUEUE_OUTGOING || 'jamify.chat.send-message'
        }
    },
    ws: {
        messageChannel: 'new-message',
    }
};