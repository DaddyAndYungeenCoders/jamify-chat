import {v4 as uuidv4} from 'uuid';
import {Config} from "../models/interfaces/config.interface";

export const config: Config = {
    port: parseInt(process.env.PORT || '3000'),
    serverId: process.env.SERVER_ID || uuidv4(),
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    },
    activemq: {
        host: process.env.ACTIVEMQ_HOST || 'localhost',
        port: parseInt(process.env.ACTIVEMQ_PORT || '61613'),
        username: process.env.ACTIVEMQ_USERNAME || 'admin',
        password: process.env.ACTIVEMQ_PASSWORD || 'admin',
        queues: {
            incoming: 'chat.incoming',
            outgoing: 'chat.outgoing'
        }
    }
};