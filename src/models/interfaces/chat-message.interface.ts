export interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    roomId: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}