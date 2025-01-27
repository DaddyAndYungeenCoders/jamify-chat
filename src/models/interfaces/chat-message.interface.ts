export interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    destId?: string;
    roomId?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
}