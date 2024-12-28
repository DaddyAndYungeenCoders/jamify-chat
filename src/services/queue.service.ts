import {Client, connect} from 'stompit';
import {Config} from "../models/interfaces/config.interface";
import {ConnectOptions} from "../models/interfaces/connect-options.interface";
import {ChatMessage} from "../models/interfaces/chat-message.interface";
import logger from "../config/logger";
import {WebSocketService} from "./websocket.service";

/**
 * Service for managing the connection to ActiveMQ and handling message publishing and subscribing.
 */
export class QueueService {
    private publishClient: Client | null = null;
    private subscribeClient: Client | null = null;
    private readonly config: Config;
    private readonly wsService: WebSocketService;
    private isActiveMqAvailable: boolean = false; // Connection status flag

    private static instance: QueueService;

    /**
     * Private constructor to enforce singleton pattern.
     * @param config - Configuration object.
     * @param webSocketService - WebSocket manager instance.
     */
    private constructor(config: Config, webSocketService: WebSocketService) {
        this.config = config;
        this.wsService = webSocketService;
    }

    /**
     * Returns the singleton instance of QueueService.
     * @param config - Configuration object.
     * @param webSocketService - WebSocket manager instance.
     * @returns The singleton instance of QueueService.
     */
    public static getInstance(config: Config, webSocketService: WebSocketService): QueueService {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService(config, webSocketService);
        }
        return QueueService.instance;
    }

    /**
     * Connects to ActiveMQ with retry logic.
     * @param retries - Number of retry attempts.
     * @param delayMs - Delay between retries in milliseconds.
     * @returns A promise that resolves when the connection is successful.
     */
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

    /**
     * Delays execution for a specified number of milliseconds.
     * @param ms - Number of milliseconds to delay.
     * @returns A promise that resolves after the specified delay.
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Creates a client connection to ActiveMQ.
     * @param options - Connection options.
     * @returns A promise that resolves with the client instance.
     */
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

    /**
     * Publishes a message to the ActiveMQ queue.
     * @param message - The chat message to publish.
     * @returns A promise that resolves when the message is published.
     * @throws Error if the messaging service is unavailable or the publisher is not connected.
     */
    public async publishMessage(message: ChatMessage): Promise<void> {
        logger.info(`Publishing message: ${JSON.stringify(message)}`);
        if (!this.isActiveMqAvailable) {
            logger.error('Messaging service is unavailable due to connection issues');
            throw new Error('Messaging service is unavailable due to connection issues');
        }

        if (!this.publishClient) {
            logger.error('Publisher not connected');
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
                logger.info(`Message published: ${JSON.stringify(message)}`);
                resolve();
            } else {
                reject(new Error('Publish client is null'));
            }
        });
    }

    /**
     * Sets up the consumer to listen for messages from the ActiveMQ queue.
     * @returns A promise that resolves when the consumer is set up.
     * @throws Error if the subscriber is not connected.
     */
    private async setupConsumer(): Promise<void> {
        if (!this.subscribeClient) {
            logger.error('Subscriber not connected');
            throw new Error('Subscriber not connected');
        }

        const subscribeHeaders = {
            destination: `/queue/${this.config.activemq.queues.outgoing}`,
            ack: 'client-individual'
        };

        this.subscribeClient.subscribe(subscribeHeaders, (error: Error | null, message) => {
            if (error) {
                logger.error(`Subscribe error: ${error}`);
                return;
            }

            message.readString('utf-8', (error: Error | null, body?: string) => {
                if (body) {
                    logger.info(`Received message: ${JSON.parse(body) as ChatMessage}`);
                }
                if (error || !body) {
                    logger.error(`Read message error: ${error}`);
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
                    logger.error(`Process message error: ${error}`);
                    if (this.subscribeClient) {
                        this.subscribeClient.nack(message);
                    }
                }
            });
        });
    }

    /**
     * Handles the processed message by broadcasting it to the appropriate WebSocket room.
     * @param message - The chat message to process.
     * @returns A promise that resolves when the message is broadcasted.
     * @throws Error if broadcasting fails.
     */
    private async handleProcessedMessage(message: ChatMessage): Promise<void> {
        logger.info(`Processing message: ${JSON.stringify(message)}`);
        try {
            if (message.roomId) {
                await this.wsService.broadcastToRoom(message.roomId, this.config.ws.messageChannel, message);
            }
        } catch (error) {
            logger.error(`Error broadcasting message: ${error}`);
            throw error;
        }
    }

    /**
     * Disconnects from ActiveMQ.
     * @returns A promise that resolves when the disconnection is complete.
     * @throws Error if disconnection fails.
     */
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