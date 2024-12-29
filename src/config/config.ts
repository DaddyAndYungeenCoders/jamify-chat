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
        messageChannel: 'new-message',
    },
    jwt: {
        algorithms: ['RS256'] as Algorithm[],
        jwksUri: process.env.JWT_JWKS_URI || 'http://localhost:8081/oauth/.well-known/jwks.json'
    }

};