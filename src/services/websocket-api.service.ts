import {API} from '../models/enums/api.enum';

/**
 * Service for handling WebSocket API calls.
 */
export class WebsocketApiService {

    // Singleton instance
    private static instance: WebsocketApiService;

    // Private constructor to enforce singleton pattern
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
        const response = await fetch(`${API.WS.BASE}${API.WS.PRIVATE_ROOM}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
        const response = await fetch(`${API.WS.BASE}${API.WS.ADD_USERS_TO_PRIVATE_ROOM}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({roomId, usersId}),
        });

        if (!response.ok) {
            throw new Error('Failed to add users to private room');
        }
    }
}