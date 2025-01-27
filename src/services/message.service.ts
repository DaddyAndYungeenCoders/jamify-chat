import {ChatMessage} from "../models/interfaces/chat-message.interface";
import {QueueService} from "./queue.service";
import {Config} from "../models/interfaces/config.interface";
import logger from "../config/logger";
import {QueueEnum} from "../models/enums/queue.enum";
import {WebsocketApiService} from "./websocket-api.service";
import {IMessageRepository} from "../repository/IMessageRepository";
import {MessageRepository} from "../repository/impl/MessageRepository";
import {MessageQueryOptions} from "../models/interfaces/message-query.options";
import {ConversationDetails} from "../models/interfaces/conversation.details";
import {User} from "../models/interfaces/user/user.types";
import {UserService} from "./user.service";
import assert from "node:assert";

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
    private messageRepository: IMessageRepository;
    private userService: UserService;

    /**
     * Private constructor to enforce singleton pattern.
     * @param config - Configuration object.
     */
    private constructor(config: Config) {
        this.queueService = QueueService.getInstance(config);
        this.websocketApiService = WebsocketApiService.getInstance();
        this.messageRepository = MessageRepository.getInstance();
        this.userService = UserService.getInstance(config);
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
            const messageToPublish = await this.savePrivateMessageToDB(messageData);
            await this.queueService.publishMessage(messageToPublish, QueueEnum.WS_CHAT_MESSAGE);
            return messageToPublish;
        }

        // Handle room creation/verification if necessary
        const messageWithRoom = await this.handleRoomCreation(messageData);
        const messageToPublish = await this.savePrivateMessageToDB(messageWithRoom);
        await this.queueService.publishMessage(messageToPublish, QueueEnum.WS_CHAT_MESSAGE);
        return messageToPublish;
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
            id: "will be replaced in message repository",
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
     * @param messageData - The chat message data to be saved.
     * @returns The saved chat message.
     * @throws Error if saving the message fails.
     */
    async savePrivateMessageToDB(messageData: ChatMessage): Promise<ChatMessage> {
        try {
            return await this.messageRepository.save(messageData);
        } catch (error) {
            logger.error('Error creating message:', error);
            throw error;
        }
    }

    /**
     * Retrieves messages for a specific room.
     * @param roomId - The ID of the room.
     * @param options - Query options for retrieving messages.
     * @returns An array of chat messages for the specified room.
     * @throws Error if retrieving messages fails.
     */
    async getMessagesForRoom(roomId: string, options: MessageQueryOptions): Promise<ChatMessage[]> {
        try {
            return await this.messageRepository.findByRoomId(roomId, options);
        } catch (error) {
            logger.error('Error getting messages:', error);
            throw error;
        }
    }

    /**
     * Retrieves conversations for a specific user.
     * @param userId - The ID of the user.
     * @returns An array of conversation details for the specified user.
     * @throws Error if retrieving conversations fails.
     */
    async getConversationsForUser(userId: string): Promise<ConversationDetails[]> {
        try {
            const messages = await this.messageRepository.findByUser(userId);
            const conversations: ConversationDetails[] = [];
            let currentRoomId = "";
            let currentMessages: ChatMessage[] = [];

            for (const message of messages) {
                assert(message.roomId, 'Message must have a roomId');
                if (currentRoomId !== message.roomId) {
                    if (currentMessages.length > 0) {
                        conversations.push(await this.buildConversationDetails(currentMessages));
                    }
                    currentRoomId = message.roomId;
                    currentMessages = [message];
                } else {
                    currentMessages.push(message);
                }
            }

            if (currentMessages.length > 0) {
                conversations.push(await this.buildConversationDetails(currentMessages));
            }

            return conversations;
        } catch (error) {
            logger.error('Error getting messages:', error);
            throw error;
        }
    }

    /**
     * Retrieves conversation details for a specific room.
     * @param roomId - The ID of the room.
     * @returns The conversation details for the specified room.
     * @throws Error if retrieving conversation details fails.
     */
    public async getConversationForRoom(roomId: string): Promise<ConversationDetails> {
        try {
            const messages = await this.getMessagesForRoom(roomId, {});
            return await this.buildConversationDetails(messages);
        } catch (error) {
            logger.error('Error getting messages:', error);
            throw error;
        }
    }

    /**
     * Builds conversation details from an array of chat messages.
     * @param messages - The array of chat messages.
     * @returns The conversation details.
     * @throws Error if retrieving users fails.
     */
    private async buildConversationDetails(messages: ChatMessage[]): Promise<ConversationDetails> {

        // TODO: better handling....
        if (messages.length === 0 || !messages[0].roomId || !messages[0].timestamp) {
            return {
                id: "",
                messages: [],
                participants: [],
                lastMessageAt: new Date().toISOString(),
            }
        }

        // cache user ids in the future
        const userIds = this.extractUserIdsFromRoomId(messages[0].roomId);
        try {
            console.log("Get user with id " + userIds[0]);
            let user1: User | null = await this.userService.getUserByUserProviderId(userIds[0])
                .then(user => user)
                .catch(error => {
                    logger.error('Failed to fetch user:', error);
                    return null;
                })
            console.log("Get user with id " + userIds[1]);
            const user2: User | null = await this.userService.getUserByUserProviderId(userIds[1])
                .then(user => {
                    console.log("User found: " + user);
                    return user;
                })
                .catch(error => {
                    logger.error('Failed to fetch user:', error);
                    return null;
                });

            const participants: User[] = [user1, user2].filter((user): user is User => user !== null);

            return {
                id: messages[0].roomId,
                messages: messages,
                participants: participants,
                lastMessageAt: messages[0].timestamp,
            }
        } catch (error) {
            logger.error('Error getting users:', error);
            throw error;
        }
    }

    /**
     * Extracts user IDs from a room ID.
     * @param roomId - The ID of the room.
     * @returns An array of user IDs.
     */
    private extractUserIdsFromRoomId(roomId: string): string[] {
        // always start with private-room_ or jam-room_ or event-room_
        const prefix = roomId.split('_')[0];
        const userIds: string[] = [];
        if (prefix === 'private-room') {
            userIds.push(roomId.split('_')[1]);
            userIds.push(roomId.split('_')[2]);
        } else if (prefix === 'jam-room' || prefix === 'event-room') {
            // TODO ?
        }
        return userIds;
    }

}