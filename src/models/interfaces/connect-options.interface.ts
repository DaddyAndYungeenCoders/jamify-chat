export interface ConnectOptions {
    host: string;
    port: number;
    connectHeaders: {
        host: string;
        login: string;
        passcode: string;
    };
}