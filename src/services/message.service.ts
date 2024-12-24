import {v4 as uuidv4} from "uuid";
import {ChatMessage} from "../models/interfaces/chat-message.interface";
import {QueueService} from "./queue.service";
import {RoomService} from "./room.service";
import {Config} from "../models/interfaces/config.interface";
import {WebSocketManager} from "../config/websocket.config";
import logger from "../config/logger";

interface MessageValidationResult {
    isValid: boolean;
    error?: string;
}

export class MessageService {

    static instance: MessageService;
    private queueService: QueueService;
    private roomService: RoomService;

    /**
     * Private constructor to enforce singleton pattern.
     * @param config - Configuration object.
     * @param wsManager - WebSocket manager instance.
     * @param roomService - Room service instance.
     */
    private constructor(config: Config, wsManager: WebSocketManager, roomService: RoomService) {
        this.queueService = QueueService.getInstance(config, wsManager);
        this.roomService = roomService;
    }

    /**
     * Returns the singleton instance of MessageService.
     * @param config - Configuration object.
     * @param wsManager - WebSocket manager instance.
     * @param roomService - Room service instance.
     * @returns The singleton instance of MessageService.
     */
    public static getInstance(config: Config, wsManager: WebSocketManager, roomService: RoomService): MessageService {
        if (!MessageService.instance) {
            MessageService.instance = new MessageService(config, wsManager, roomService);
        }
        return MessageService.instance;
    }


    /**
     * Sends a message to the queue after validation and room handling.
     * @param message - The chat message to be sent.
     * @returns The message data that was sent.
     * @throws Error if the message is invalid or room creation fails.
     */
    async sendQueueMessage(message: ChatMessage): Promise<ChatMessage> {
        // Valider le message
        const validationResult = this.validateMessage(message);
        if (!validationResult.isValid) {
            logger.error(`Invalid message data: ${validationResult.error}`);
            throw new Error(validationResult.error || 'Invalid message data');
        }

        // Check if user exists
        // TODO: fetch uaa microservice ?

        // Créer le message avec les données de base
        const messageData = this.createBaseMessage(message);

        // Gérer la création/vérification de la room si nécessaire
        await this.handleRoomCreation(messageData);

        // Publier le message
        await this.queueService.publishMessage(messageData);
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
    private async handleRoomCreation(message: ChatMessage): Promise<void> {
        // if message has no roomId and has destId, create private room if not exists
        if (!message.roomId && message.destId) {
            // in this case, the room ID must be a combination of the sender and destination IDs
            const roomId = this.roomService.generatePrivateRoomId(message.senderId, message.destId);
            if (!await this.roomService.isRoomExists(roomId)) {
                await this.roomService.createPrivateRoom(message.senderId, message.destId);
                await this.roomService.addUserToRoom(message.senderId, roomId);
                await this.roomService.addUserToRoom(message.destId, roomId);
            }
            // adds the room ID to the message so it will bbe broadcasted to the correct room once the message is saved and read from the queue
            message.roomId = roomId;
            return;
        }
    }

    /**
     * Generates a unique message ID.
     * @returns A unique message ID.
     */
    public static generateMessageId(): string {
        return `msg_${Date.now()}_${uuidv4().toString()}`;
    }
}
