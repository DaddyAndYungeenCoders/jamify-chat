import {API} from '../models/enums/api.enum';
import {RequestContext} from "../utils/request-context";

/**
 * Service for handling WebSocket API calls.
 */
export class WebsocketApiService {

    private static instance: WebsocketApiService;

    private constructor() {
    }

    /**
     * Returns the singleton instance of WebsocketApiService.
     * @returns The singleton instance of WebsocketApiService.
     */
    public static getInstance(): WebsocketApiService {
        if (!WebsocketApiService.instance) {
            WebsocketApiService.instance = new WebsocketApiService();
        }
        return WebsocketApiService.instance;
    }

    /**
     * Creates a private room for the given user and destination user.
     * @param userId - The ID of the user creating the room.
     * @param destId - The ID of the destination user.
     * @returns The ID of the created private room.
     * @throws Error if the room creation fails.
     */
    public async createPrivateRoom(userId: string, destId: string): Promise<string> {
        const token = RequestContext.getInstance().getToken();

        const response = await fetch(`${API.WS.BASE}${API.WS.PRIVATE_ROOM}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,

            },
            body: JSON.stringify({userId, destId}),
        });

        if (!response.ok) {
            throw new Error('Failed to create private room');
        }

        const data = await response.json();
        return data.id;
    }

    /**
     * Adds users to an existing private room.
     * @param roomId - The ID of the room.
     * @param usersId - An array of user IDs to be added to the room.
     * @throws Error if adding users to the room fails.
     */
    public async addUsersToPrivateRoom(roomId: string, usersId: string[]): Promise<void> {
        const token = RequestContext.getInstance().getToken();

        const response = await fetch(`${API.WS.BASE}${API.WS.ADD_USERS_TO_PRIVATE_ROOM}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({roomId, usersId}),
        });

        if (!response.ok) {
            throw new Error('Failed to add users to private room');
        }
    }
}