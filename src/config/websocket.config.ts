import {Server, Socket} from 'socket.io';
import {RedisService} from "../services/redis.service";

interface WebSocketManagerConfig {
    serverId: string;
    redisService: RedisService;
}

export class WebSocketManager {
    private io: Server;
    private redisService: RedisService;
    private serverId: string;

    constructor(io: Server, config: WebSocketManagerConfig) {
        this.io = io;
        this.redisService = config.redisService;
        this.serverId = config.serverId;
    }

    public handleConnection(socket: Socket): void {
        console.log('New client connected:', socket.id);

        socket.on('register', async (userId: string) => {
            try {
                await this.redisService.addUserConnection(userId, socket.id, this.serverId);
                await this.handleUserRooms(socket, userId);
                console.log(`User ${userId} registered with socket ${socket.id}`);
            } catch (error) {
                console.error('Registration error:', error);
            }
        });

        socket.on('disconnect', async () => {
            try {
                const userId = await this.redisService.getUserIdFromSocket(socket.id);
                if (userId) {
                    await this.redisService.removeUserConnection(userId, socket.id);
                    console.log(`User ${userId} disconnected (socket: ${socket.id})`);
                }
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        });
    }

    public async broadcastToRoom(roomId: string, event: string, data: any): Promise<void> {
        this.io.to(roomId).emit(event, data);
        console.log(`Broadcasted to room ${roomId}:`, data);
    }

    private async handleUserRooms(socket: Socket, userId: string): Promise<void> {
        try {
            const userRooms = await this.redisService.getUserRooms(userId);
            for (const roomId of userRooms) {
                socket.join(roomId);
            }
        } catch (error) {
            console.error('Error joining user rooms:', error);
        }
    }

}