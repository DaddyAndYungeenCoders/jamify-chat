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
        queues: {
            incoming: process.env.QUEUE_INCOMING || 'jamify.app.save-and-repub',
            outgoing: process.env.QUEUE_OUTGOING || 'jamify.chat.send-message'
        }
    },
    ws: {
        messageChannel: 'new-message',
    },
    jwt: {
        publicKey: process.env.JWT_PUBLIC_KEY || '-----BEGIN PUBLIC KEY-----\n' +
            'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoeGB4cUuLCz+4qf8fPbW\n' +
            'EXEy/34nwJZVUdj1pqhKpW+t+RvpkM6YQBKWZ0KPzZMthwMKdqH1pBK6TD+8Reup\n' +
            '1vc+kPms5Fjom39nr2/FoFmO0lJzhdq7Pgz0CByluoq6gObNOaXbs0ZxRB7RcBfO\n' +
            'pdDqUzAztq011rglOVE/DhrUS68+gkFSAh8wURZEU2vOKAB3k22VqIWTHtdBXuHy\n' +
            'PbO0xlAEZUQe6lfNwSYGwv38b2HytAPlsLD/ISBPXd2OhWgBek3e/LTskfHgZusm\n' +
            'iVo+/leHNI+njHzfeDsJZVx9rBlHJMu+BIwS5/wWTM4+yrx7onT26Jb8mblWh1ZN\n' +
            'CwIDAQAB\n' +
            '-----END PUBLIC KEY-----\n',
        algorithms: ['RS256'] as Algorithm[]
    }

};