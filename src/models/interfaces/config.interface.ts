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
    };
    ws: {
        uri: string;
        messageChannel: string;
    };
    jwt: {
        algorithms: Algorithm[];
        jwksUri: string;
    };
    mongo: {
        baseUri: string;
        dbName: string;
        username: string;
        password: string;
    };
    engine: {
        uri: string;
    }
}