import {ChatMessage} from "../models/interfaces/chat-message.interface";
import {MessageQueryOptions} from "../models/interfaces/message-query.options";

export interface IMessageRepository {
    save(message: ChatMessage): Promise<ChatMessage>;
    findById(messageId: string): Promise<ChatMessage | null>;
    findByRoomId(roomId: string, options?: MessageQueryOptions): Promise<ChatMessage[]>;
    findByUsers(userAId: string, userBId: string, options?: MessageQueryOptions): Promise<ChatMessage[]>;
    findByUser(userId: string): Promise<ChatMessage[]>;
    delete(messageId: string): Promise<boolean>;
}