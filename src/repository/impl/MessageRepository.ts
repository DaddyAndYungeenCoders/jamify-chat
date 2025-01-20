import {IMessageRepository} from "../IMessageRepository";
import {ChatMessage} from "../../models/interfaces/chat-message.interface";
import {IPrivateMessage, PrivateMessage} from "../../models/schemas/privateMessage.schema";
import logger from "../../config/logger";
import {Query} from "mongoose";
import {v4 as uuidv4} from "uuid";
import {MessageQueryOptions} from "../../models/interfaces/MessageQueryOptions";

export class MessageRepository implements IMessageRepository {
    private static instance: MessageRepository;

    private constructor() {}

    public static getInstance(): MessageRepository {
        if (!MessageRepository.instance) {
            MessageRepository.instance = new MessageRepository();
        }
        return MessageRepository.instance;
    }

    async save(message: ChatMessage): Promise<ChatMessage> {
        try {
            const privateMessage = new PrivateMessage({
                id: MessageRepository.generateMessageId(),
                roomId: message.roomId,
                userAId: message.senderId,
                userBId: message.destId,
                content: message.content,
                metadata: message.metadata,
                timestamp: message.timestamp
            });

            const savedMessage = await privateMessage.save();
            return this.mapToChatMessage(savedMessage);
        } catch (error) {
            logger.error('Error saving message:', error);
            throw new Error('Failed to save message');
        }
    }

    async findById(messageId: string): Promise<ChatMessage | null> {
        try {
            const message = await PrivateMessage.findOne({ id: messageId });
            return message ? this.mapToChatMessage(message) : null;
        } catch (error) {
            logger.error('Error finding message by ID:', error);
            throw new Error('Failed to find message');
        }
    }

    async findByRoomId(roomId: string, options: MessageQueryOptions = {}): Promise<ChatMessage[]> {
        try {
            const query = PrivateMessage.find({ roomId });
            const messages = await this.applyQueryOptions(query, options);
            return messages.map((msg: IPrivateMessage) => this.mapToChatMessage(msg));
        } catch (error) {
            logger.error('Error finding messages by room ID:', error);
            throw new Error('Failed to find messages');
        }
    }

    async findByUsers(userAId: string, userBId: string, options: MessageQueryOptions = {}): Promise<ChatMessage[]> {
        try {
            const query = PrivateMessage.find({
                $or: [
                    { userAId, userBId },
                    { userAId: userBId, userBId: userAId }
                ]
            });

            const messages = await this.applyQueryOptions(query, options);
            return messages.map((msg: IPrivateMessage) => this.mapToChatMessage(msg));
        } catch (error) {
            logger.error('Error finding messages between users:', error);
            throw new Error('Failed to find messages');
        }
    }

    async update(messageId: string, update: Partial<ChatMessage>): Promise<ChatMessage | null> {
        try {
            const updatedMessage = await PrivateMessage.findOneAndUpdate(
                { id: messageId },
                { $set: update },
                { new: true }
            );
            return updatedMessage ? this.mapToChatMessage(updatedMessage) : null;
        } catch (error) {
            logger.error('Error updating message:', error);
            throw new Error('Failed to update message');
        }
    }

    async delete(messageId: string): Promise<boolean> {
        try {
            const result = await PrivateMessage.deleteOne({ id: messageId });
            return result.deletedCount > 0;
        } catch (error) {
            logger.error('Error deleting message:', error);
            throw new Error('Failed to delete message');
        }
    }

    private mapToChatMessage(privateMessage: IPrivateMessage): ChatMessage {
        return {
            id: privateMessage.id.toString(),
            senderId: privateMessage.userAId,
            destId: privateMessage.userBId,
            roomId: privateMessage.roomId,
            content: privateMessage.content,
            timestamp: privateMessage.timestamp.toISOString(),
            metadata: privateMessage.metadata
        };
    }

    private applyQueryOptions(
        query: Query<IPrivateMessage[], IPrivateMessage>,
        options: MessageQueryOptions
    ): Query<IPrivateMessage[], IPrivateMessage> {
        const { before, after, limit } = options;

        if (before) {
            const beforeDate = new Date(before);
            query = query.where('timestamp').lt(beforeDate.getTime());
        }

        if (after) {
            const afterDate = new Date(after);
            query = query.where('timestamp').gt(afterDate.getTime());
        }

        if (limit) {
            query = query.limit(limit);
        }

        return query.sort({ timestamp: -1 });
    }

    /**
     * Generates a unique message ID.
     * @returns A unique message ID.
     */
    public static generateMessageId(): string {
        return `msg_${Date.now()}_${uuidv4().toString()}`;
    }
}