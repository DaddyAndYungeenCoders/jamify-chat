import { connect, Client } from 'stompit';
import { Config } from "../models/interfaces/config.interface";
import { WebSocketManager } from "../config/websocket.config";
import { ConnectOptions } from "../models/interfaces/connect-options.interface";
import { ChatMessage } from "../models/interfaces/chat-message.interface";

export class QueueService {
    private publishClient: Client | null = null;
    private subscribeClient: Client | null = null;
    private readonly config: Config;
    private readonly wsManager: WebSocketManager;

    // Singleton instance
    private static instance: QueueService;

    // Private constructor to prevent direct instantiation
    private constructor(config: Config, wsManager: WebSocketManager) {
        this.config = config;
        this.wsManager = wsManager;
    }

    // Public method to get the singleton instance
    public static getInstance(config: Config, wsManager: WebSocketManager): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService(config, wsManager);
        }
        return QueueService.instance;
    }

    public async connect(): Promise<void> {
        const connectOptions: ConnectOptions = {
            host: this.config.activemq.host,
            port: this.config.activemq.port,
            connectHeaders: {
                host: '/',
                login: this.config.activemq.username,
                passcode: this.config.activemq.password
            }
        };

        try {
            this.publishClient = await this.createClient(connectOptions);
            this.subscribeClient = await this.createClient(connectOptions);
            await this.setupConsumer();
            console.log('Successfully connected to ActiveMQ');
        } catch (error) {
            console.error('Failed to connect to ActiveMQ:', error);
            throw error;
        }
    }

    private createClient(options: ConnectOptions): Promise<Client> {
        return new Promise((resolve, reject) => {
            connect(options, (error: Error | null, client: Client) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(client);
                }
            });
        });
    }

    public async publishMessage(message: ChatMessage): Promise<void> {
        if (!this.publishClient) {
            throw new Error('Publisher not connected');
        }

        return new Promise((resolve, reject) => {
            const headers = {
                destination: `/queue/${this.config.activemq.queues.incoming}`,
                'content-type': 'application/json'
            };

            if (this.publishClient) {
                const frame = this.publishClient.send(headers);
                frame.write(JSON.stringify(message));
                frame.end();
                resolve();
            } else {
                reject(new Error('Publish client is null'));
            }
        });
    }

    private async setupConsumer(): Promise<void> {
        if (!this.subscribeClient) {
            throw new Error('Subscriber not connected');
        }

        const subscribeHeaders = {
            destination: `/queue/${this.config.activemq.queues.outgoing}`,
            ack: 'client-individual'
        };

        this.subscribeClient.subscribe(subscribeHeaders, (error: Error | null, message) => {
            if (error) {
                console.error('Subscribe error:', error);
                return;
            }

            message.readString('utf-8', (error: Error | null, body?: string) => {
                if (error || !body) {
                    console.error('Read message error:', error);
                    if (this.subscribeClient) {
                        this.subscribeClient.nack(message);
                    }
                    return;
                }

                try {
                    const messageData = JSON.parse(body) as ChatMessage;
                    this.handleProcessedMessage(messageData);
                    if (this.subscribeClient) {
                        this.subscribeClient.ack(message);
                    }
                } catch (error) {
                    console.error('Process message error:', error);
                    if (this.subscribeClient) {
                        this.subscribeClient.nack(message);
                    }
                }
            });
        });
    }

    private async handleProcessedMessage(message: ChatMessage): Promise<void> {
        try {
            if (this.wsManager && typeof this.wsManager.broadcastToRoom === 'function') {
                await this.wsManager.broadcastToRoom(message.roomId, 'new-message', message);
            } else {
                throw new Error('broadcastToRoom method not found in WebSocketManager');
            }
        } catch (error) {
            console.error('Error broadcasting message:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            if (this.publishClient) {
                this.publishClient.disconnect();
            }
            if (this.subscribeClient) {
                this.subscribeClient.disconnect();
            }
        } catch (error) {
            console.error('Error disconnecting from ActiveMQ:', error);
            throw error;
        }
    }
}