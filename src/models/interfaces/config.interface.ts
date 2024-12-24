export interface Config {
    port: number;
    host: string;
    serverId: string;
    redis: {
        host: string;
        port: number;
        password?: string;
    };
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
}