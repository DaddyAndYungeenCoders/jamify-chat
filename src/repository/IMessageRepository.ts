import { ChatMessage } from "../models/interfaces/chat-message.interface";
import { MessageQueryOptions } from "../models/interfaces/message-query.options";

/**
 * Interface for message repository.
 */
export interface IMessageRepository {
    /**
     * Saves a chat message.
     * @param message - The chat message to save.
     * @returns A promise that resolves to the saved chat message.
     */
    save(message: ChatMessage): Promise<ChatMessage>;

    /**
     * Finds a chat message by its ID.
     * @param messageId - The ID of the chat message to find.
     * @returns A promise that resolves to the found chat message or null if not found.
     */
    findById(messageId: string): Promise<ChatMessage | null>;

    /**
     * Finds chat messages by room ID.
     * @param roomId - The ID of the room.
     * @param options - Optional query options for retrieving messages.
     * @returns A promise that resolves to an array of chat messages.
     */
    findByRoomId(roomId: string, options?: MessageQueryOptions): Promise<ChatMessage[]>;

    /**
     * Finds chat messages between two users.
     * @param userAId - The ID of the first user.
     * @param userBId - The ID of the second user.
     * @param options - Optional query options for retrieving messages.
     * @returns A promise that resolves to an array of chat messages.
     */
    findByUsers(userAId: string, userBId: string, options?: MessageQueryOptions): Promise<ChatMessage[]>;

    /**
     * Finds chat messages by user ID.
     * @param userId - The ID of the user.
     * @returns A promise that resolves to an array of chat messages.
     */
    findByUser(userId: string): Promise<ChatMessage[]>;

    /**
     * Deletes a chat message by its ID.
     * @param messageId - The ID of the chat message to delete.
     * @returns A promise that resolves to a boolean indicating whether the deletion was successful.
     */
    delete(messageId: string): Promise<boolean>;
}