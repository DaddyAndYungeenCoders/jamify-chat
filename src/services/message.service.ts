import {v4 as uuidv4} from "uuid";
import {ChatMessage} from "../models/interfaces/chat-message.interface";
import {QueueService} from "./queue.service";
import {Config} from "../models/interfaces/config.interface";
import logger from "../config/logger";
import {QueueEnum} from "../models/enums/queue.enum";
import {WebsocketApiService} from "./websocket-api.service";
import {PrivateMessage} from "../models/schemas/privateMessage.schema";

interface MessageValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Service for handling chat messages.
 */
export class MessageService {

    static instance: MessageService;
    private queueService: QueueService;
    private websocketApiService: WebsocketApiService;

    /**
     * Private constructor to enforce singleton pattern.
     * @param config - Configuration object.
     */
    private constructor(config: Config) {
        this.queueService = QueueService.getInstance(config);
        this.websocketApiService = WebsocketApiService.getInstance();
    }

    /**
     * Returns the singleton instance of MessageService.
     * @param config - Configuration object.
     * @returns The singleton instance of MessageService.
     */
    public static getInstance(config: Config): MessageService {
        if (!MessageService.instance) {
            MessageService.instance = new MessageService(config);
        }
        return MessageService.instance;
    }

    /**
     * Sends a message to the queue after validation, save and room handling.
     * @param message - The chat message to be sent.
     * @returns The message data that was sent.
     * @throws Error if the message is invalid or room creation fails.
     */
    async sendQueueMessage(message: ChatMessage): Promise<ChatMessage> {
        // Validate the message
        const validationResult = this.validateMessage(message);
        if (!validationResult.isValid) {
            logger.error(`Invalid message data: ${validationResult.error}`);
            throw new Error(validationResult.error || 'Invalid message data');
        }

        // Check if user exists
        // TODO: fetch uaa microservice ?

        // Create the message with base data
        const messageData = this.createBaseMessage(message);

        if (messageData.roomId) {
            await this.savePrivateMessageToDB(messageData);
            await this.queueService.publishMessage(messageData, QueueEnum.WS_CHAT_MESSAGE);
            return messageData;
        }

        // Handle room creation/verification if necessary
        const messageWithRoom = await this.handleRoomCreation(messageData);
        await this.savePrivateMessageToDB(messageWithRoom);
        await this.queueService.publishMessage(messageData, QueueEnum.WS_CHAT_MESSAGE);
        return messageData;
    }

    /**
     * Validates the chat message.
     * @param message - The chat message to be validated.
     * @returns The validation result.
     */
    private validateMessage(message: ChatMessage): MessageValidationResult {
        if (!message.content) {
            return {isValid: false, error: 'Message content is required'};
        }

        if (!message.roomId && !message.destId) {
            return {isValid: false, error: 'Either roomId or destId is required'};
        }

        if (!message.senderId) {
            return {isValid: false, error: 'SenderId is required'};
        }

        return {isValid: true};
    }

    /**
     * Creates the base message data.
     * @param message - The chat message to be processed.
     * @returns The base message data.
     */
    private createBaseMessage(message: ChatMessage): ChatMessage {
        return {
            id: MessageService.generateMessageId(),
            senderId: message.senderId,
            content: message.content,
            timestamp: new Date().toISOString(),
            ...(message.roomId ? {roomId: message.roomId} : {destId: message.destId})
        };
    }

    /**
     * Handles the creation or verification of the room if necessary.
     * @param message - The chat message containing room information.
     * @throws Error if room creation fails.
     */
    private async handleRoomCreation(message: ChatMessage): Promise<ChatMessage> {
        // if message has no roomId and has destId, create private room if not exists
        if (!message.roomId && message.destId) {
            if (!message.roomId && message.destId) {
                try {
                    message.roomId = await this.websocketApiService.createPrivateRoom(message.senderId, message.destId);
                    await this.websocketApiService.addUsersToPrivateRoom(message.roomId, [message.senderId, message.destId]);
                    return message;
                } catch (error) {
                    logger.error(`Error creating private room: ${error}`);
                    throw error;
                }
            }
        }
        return message;
    }

    /**
     * Saves the message to the database.
     * @param messageData
     */
    async savePrivateMessageToDB(messageData: ChatMessage): Promise<any> {
            try {
                const privateMessage = new PrivateMessage({
                    roomId: messageData.roomId,
                    userAId: messageData.senderId,
                    userBId: messageData.destId,
                    content: messageData.content,
                    metadata: messageData.metadata
                });

                return await privateMessage.save();
            } catch (error) {
                logger.error('Error creating message:', error);
                throw error;
            }
        }


    // async getMessagesForRoom(roomId: string, options = {
    //     limit: 50,
    //     before?: Date,
    //     after?: Date
    // }): Promise<any[]> {
    //     try {
    //         // TODO
    //         return await Message.find({roomId})
    //             .sort({timestamp: -1})
    //             .limit(options.limit)
    //             .exec();
    //     } catch (error) {
    //         logger.error('Error getting messages:', error);
    //         throw error;
    //     }
    // }


    /**
     * Generates a unique message ID.
     * @returns A unique message ID.
     */
    public static generateMessageId(): string {
        return `msg_${Date.now()}_${uuidv4().toString()}`;
    }
}