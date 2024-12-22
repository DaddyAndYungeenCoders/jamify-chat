import { connect, Client } from 'stompit';
import { Config } from "../models/interfaces/config.interface";
import { WebSocketManager } from "../config/websocket.config";
import { ConnectOptions } from "../models/interfaces/connect-options.interface";
import { ChatMessage } from "../models/interfaces/chat-message.interface";
import logger from "../config/logger";

export class QueueService {
    private publishClient: Client | null = null;
    private subscribeClient: Client | null = null;
    private readonly config: Config;
    private readonly wsManager: WebSocketManager;
    private isActiveMqAvailable: boolean = false; // Connection status flag

    private static instance: QueueService;

    private constructor(config: Config, wsManager: WebSocketManager) {
        this.config = config;
        this.wsManager = wsManager;
    }

    public static getInstance(config: Config, wsManager: WebSocketManager): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService(config, wsManager);
        }
        return QueueService.instance;
    }

    public async connect(retries: number = 5, delayMs: number = 3000): Promise<void> {
        const connectOptions: ConnectOptions = {
            host: this.config.activemq.host,
            port: this.config.activemq.port,
            connectHeaders: {
                host: '/',
                login: this.config.activemq.username,
                passcode: this.config.activemq.password
            }
        };

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                this.publishClient = await this.createClient(connectOptions);
                this.subscribeClient = await this.createClient(connectOptions);
                await this.setupConsumer();
                this.isActiveMqAvailable = true;
                logger.info('Successfully connected to ActiveMQ');
                return;
            } catch (error) {
                logger.error(`Failed to connect to ActiveMQ (attempt ${attempt} of ${retries}):`, error);
                if (attempt < retries) {
                    await this.delay(delayMs);
                } else {
                    this.isActiveMqAvailable = false;
                    throw error;
                }
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        if (!this.isActiveMqAvailable) {
            throw new Error('Messaging service is unavailable due to connection issues');
        }

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
                logger.error('Subscribe error:', error);
                return;
            }

            message.readString('utf-8', (error: Error | null, body?: string) => {
                if (error || !body) {
                    logger.error('Read message error:', error);
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
                    logger.error('Process message error:', error);
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
            logger.error('Error broadcasting message:', error);
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
            this.isActiveMqAvailable = false; // Set connection status to false
        } catch (error) {
            logger.error('Error disconnecting from ActiveMQ:', error);
            throw error;
        }
    }
}