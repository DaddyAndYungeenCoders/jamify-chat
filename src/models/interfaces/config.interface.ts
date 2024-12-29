import {Algorithm} from "jsonwebtoken";

export interface Config {
    mode: string;
    port: number;
    host: string;
    activemq: {
        host: string;
        port: number;
        username: string;
        password: string;
        queues: {
            incoming: string;
            outgoing: string;
        };
    };
    ws: {
        messageChannel: string;
    };
    jwt: {
        publicKey: string;
        algorithms: Algorithm[];
    };
}