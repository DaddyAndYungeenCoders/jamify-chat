import {Server, Socket} from 'socket.io';
import {RedisService} from "../services/redis.service";
import logger from "./logger";

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
        logger.info('New client connected:', socket.id);

        socket.on('register', async (userId: string) => {
            try {
                await this.redisService.addUserConnection(userId, socket.id, this.serverId);
                await this.handleUserRooms(socket, userId);
                logger.info(`User ${userId} registered with socket ${socket.id}`);
            } catch (error) {
                logger.error('Registration error:', error);
            }
        });

        socket.on('disconnect', async () => {
            try {
                const userId = await this.redisService.getUserIdFromSocket(socket.id);
                if (userId) {
                    await this.redisService.removeUserConnection(userId, socket.id);
                    logger.info(`User ${userId} disconnected (socket: ${socket.id})`);
                }
            } catch (error) {
                logger.error('Disconnect error:', error);
            }
        });
    }

    public async broadcastToRoom(roomId: string, event: string, data: any): Promise<void> {
        this.io.to(roomId).emit(event, data);
        logger.info(`Broadcasted to room ${roomId}:`, data);
    }

    private async handleUserRooms(socket: Socket, userId: string): Promise<void> {
        try {
            const userRooms = await this.redisService.getUserRooms(userId);
            for (const roomId of userRooms) {
                socket.join(roomId);
            }
        } catch (error) {
            logger.error('Error joining user rooms:', error);
        }
    }

}