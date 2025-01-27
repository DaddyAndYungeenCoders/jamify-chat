import {Config} from "../models/interfaces/config.interface";
import {Algorithm} from "jsonwebtoken";

export const config: Config = {
    mode: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    activemq: {
        host: process.env.ACTIVEMQ_HOST || 'localhost',
        port: parseInt(process.env.ACTIVEMQ_PORT || '61613'),
        username: process.env.ACTIVEMQ_USERNAME || 'admin',
        password: process.env.ACTIVEMQ_PASSWORD || 'admin',
    },
    ws: {
        uri: process.env.WS_URI || 'https://jamify.daddyornot.xyz/jamify-ws/api',
        messageChannel: 'new-message',
    },
    jwt: {
        algorithms: ['RS256'] as Algorithm[],
        jwksUri: process.env.JWT_JWKS_URI || 'https://jamify.daddyornot.xyz/jamify-uaa/oauth/.well-known/jwks.json'
    },
    mongo: {
        baseUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
        dbName: process.env.MONGO_DB_NAME || 'chat-db',
        username: process.env.MONGO_USERNAME || 'user',
        password: process.env.MONGO_PASSWORD || 'pwd',
    },
    engine: {
        uri: process.env.ENGINE_URI || 'https://jamify.daddyornot.xyz/jamify-engine/api/v1',
        // uri: process.env.ENGINE_URI || 'http://localhost:8082/api/v1',
    }
};