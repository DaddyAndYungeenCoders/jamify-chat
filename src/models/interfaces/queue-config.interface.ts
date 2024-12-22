export interface QueueConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    queues: {
        incoming: string;
        outgoing: string;
    };
}