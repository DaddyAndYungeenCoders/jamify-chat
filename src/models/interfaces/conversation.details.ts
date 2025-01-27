import {ChatMessage} from "./chat-message.interface";
import {User} from "./user/user.types";

export interface ConversationDetails {
    id: string;
    participants: User[];
    messages: ChatMessage[];
    lastMessageAt: string;
}
