import Redis from 'ioredis';
import {RedisServiceConfig} from "../models/interfaces/redis-service-config.interface";
import {UserConnection} from "../models/interfaces/user-connection.interface";

export class RedisService {
    private redis: Redis;

    constructor(config: RedisServiceConfig) {
        this.redis = new Redis(config);
    }

    async addUserConnection(userId: string, socketId: string, serverId: string): Promise<void> {
        const connectionData: UserConnection = {
            socketId,
            serverId,
            timestamp: Date.now()
        };

        try {
            await Promise.all([
                // Stocke la connexion dans l'ensemble des connexions de l'utilisateur
                this.redis.sadd(
                    `user:${userId}:connections`,
                    JSON.stringify(connectionData)
                ),
                // Stocke la relation inverse socketId -> userId
                this.redis.set(`socket:${socketId}:user`, userId)
            ]);
        } catch (error) {
            console.error('Error adding user connection:', error);
            throw new Error('Failed to add user connection');
        }
    }

    async removeUserConnection(userId: string, socketId: string): Promise<void> {
        try {
            const connection = await this.getUserConnection(userId, socketId);
            if (connection) {
                await Promise.all([
                    this.redis.srem(
                        `user:${userId}:connections`,
                        JSON.stringify(connection)
                    ),
                    this.redis.del(`socket:${socketId}:user`)
                ]);
            }
        } catch (error) {
            console.error('Error removing user connection:', error);
            throw new Error('Failed to remove user connection');
        }
    }

    async getUserConnection(userId: string, socketId: string): Promise<UserConnection | null> {
        try {
            const connections = await this.redis.smembers(`user:${userId}:connections`);
            const connection = connections
                .map(conn => JSON.parse(conn) as UserConnection)
                .find(conn => conn.socketId === socketId);

            return connection || null;
        } catch (error) {
            console.error('Error getting user connection:', error);
            throw new Error('Failed to get user connection');
        }
    }

    async getUserIdFromSocket(socketId: string): Promise<string | null> {
        try {
            return await this.redis.get(`socket:${socketId}:user`);
        } catch (error) {
            console.error('Error getting userId from socket:', error);
            throw new Error('Failed to get userId from socket');
        }
    }

    async getAllUserConnections(userId: string): Promise<UserConnection[]> {
        try {
            const connections = await this.redis.smembers(`user:${userId}:connections`);
            return connections.map(conn => JSON.parse(conn) as UserConnection);
        } catch (error) {
            console.error('Error getting all user connections:', error);
            throw new Error('Failed to get all user connections');
        }
    }

    async getUserRooms(userId: string): Promise<string[]> {
        try {
            return await this.redis.smembers(`user:${userId}:rooms`);
        } catch (error) {
            console.error('Error getting user rooms:', error);
            throw new Error('Failed to get user rooms');
        }
    }

    async addUserToRoom(userId: string, roomId: string): Promise<void> {
        try {
            await this.redis.sadd(`user:${userId}:rooms`, roomId);
        } catch (error) {
            console.error('Error adding user room:', error);
            throw new Error('Failed to add user room');
        }
    }

    async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
        try {
            await this.redis.srem(`user:${userId}:rooms`, roomId);
        } catch (error) {
            console.error('Error removing user room:', error);
            throw new Error('Failed to remove user room');
        }
    }

    async getRoomUsers(roomId: string): Promise<string[]> {
        try {
            return await this.redis.smembers(`room:${roomId}:users`);
        } catch (error) {
            console.error('Error getting room users:', error);
            throw new Error('Failed to get room users');
        }
    }

}