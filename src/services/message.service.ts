import { ChatMessage } from "../models/interfaces/chat-message.interface";
import { QueueService } from "./queue.service";
import { Config } from "../models/interfaces/config.interface";
import { WebSocketManager } from "../config/websocket.config";

export class MessageService {
    private static instance: MessageService;
    private queueService: QueueService;

    // Private constructor to prevent direct instantiation
    private constructor(config: Config, wsManager: WebSocketManager) {
        this.queueService = QueueService.getInstance(config, wsManager);
    }

    // Public method to get the singleton instance
    public static getInstance(config: Config, wsManager: WebSocketManager): MessageService {
        if (!MessageService.instance) {
            MessageService.instance = new MessageService(config, wsManager);
        }
        return MessageService.instance;
    }

    async sendMessage(message: ChatMessage, roomId: string) {
        const messageData = {
            id: MessageService.generateMessageId(),
            roomId,
            senderId: message.senderId,
            content: message.content,
            timestamp: new Date().toISOString(),
        };

        await this.queueService.publishMessage(messageData);

        return messageData;
    }

    static generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}