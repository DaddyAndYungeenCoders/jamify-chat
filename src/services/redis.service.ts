import Redis from 'ioredis';
import {RedisServiceConfig} from "../models/interfaces/redis-service-config.interface";
import {UserConnection} from "../models/interfaces/user-connection.interface";
import logger from "../config/logger";
import {Room} from "../models/room.model";

/**
 * Service for managing Redis operations related to user connections and rooms.
 */
export class RedisService {
    private redis: Redis;
    static instance: RedisService;

    /**
     * Constructs a new RedisService instance.
     * @param config - The configuration object for Redis.
     */
    private constructor(config: RedisServiceConfig) {
        this.redis = new Redis(config);
    }

    public static getInstance(config: RedisServiceConfig): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService(config);
        }
        return RedisService.instance;
    }

    /**
     * Adds a user connection to Redis.
     * @param userId - The ID of the user.
     * @param socketId - The socket ID of the connection.
     * @param serverId - The server ID where the connection is established.
     * @returns A promise that resolves when the connection is added.
     * @throws Error if adding the connection fails.
     */
    async addUserConnection(userId: string, socketId: string, serverId: string): Promise<void> {
        const connectionData: UserConnection = {
            socketId,
            serverId,
            timestamp: Date.now()
        };

        try {
            await Promise.all([
                // Store the connection in the user's connections set
                this.redis.sadd(
                    `user:${userId}:connections`,
                    JSON.stringify(connectionData)
                ),
                // Store the reverse relation socketId -> userId
                this.redis.set(`socket:${socketId}:user`, userId)
            ]);
        } catch (error) {
            logger.error(`Error adding user connection: ${error}`);
            throw new Error('Failed to add user connection');
        }
    }

    /**
     * Removes a user connection from Redis.
     * @param userId - The ID of the user.
     * @param socketId - The socket ID of the connection.
     * @returns A promise that resolves when the connection is removed.
     * @throws Error if removing the connection fails.
     */
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
            logger.error(`Error removing user connection: ${error}`);
            throw new Error('Failed to remove user connection');
        }
    }

    /**
     * Retrieves a user connection from Redis.
     * @param userId - The ID of the user.
     * @param socketId - The socket ID of the connection.
     * @returns A promise that resolves with the user connection or null if not found.
     * @throws Error if retrieving the connection fails.
     */
    async getUserConnection(userId: string, socketId: string): Promise<UserConnection | null> {
        try {
            const connections = await this.redis.smembers(`user:${userId}:connections`);
            const connection = connections
                .map(conn => JSON.parse(conn) as UserConnection)
                .find(conn => conn.socketId === socketId);

            return connection || null;
        } catch (error) {
            logger.error(`Error getting user connection: ${error}`);
            throw new Error('Failed to get user connection');
        }
    }

    /**
     * Retrieves the user ID associated with a socket ID from Redis.
     * @param socketId - The socket ID.
     * @returns A promise that resolves with the user ID or null if not found.
     * @throws Error if retrieving the user ID fails.
     */
    async getUserIdFromSocket(socketId: string): Promise<string | null> {
        try {
            return await this.redis.get(`socket:${socketId}:user`);
        } catch (error) {
            logger.error(`Error getting userId from socket: ${error}`);
            throw new Error('Failed to get userId from socket');
        }
    }

    /**
     * Retrieves all connections of a user from Redis.
     * @param userId - The ID of the user.
     * @returns A promise that resolves with an array of user connections.
     * @throws Error if retrieving the connections fails.
     */
    async getAllUserConnections(userId: string): Promise<UserConnection[]> {
        try {
            const connections = await this.redis.smembers(`user:${userId}:connections`);
            return connections.map(conn => JSON.parse(conn) as UserConnection);
        } catch (error) {
            logger.error(`Error getting all user connections: ${error}`);
            throw new Error('Failed to get all user connections');
        }
    }

    /**
     * Retrieves all rooms a user is part of from Redis.
     * @param userId - The ID of the user.
     * @returns A promise that resolves with an array of room IDs.
     * @throws Error if retrieving the rooms fails.
     */
    async getUserRooms(userId: string): Promise<string[]> {
        try {
            return await this.redis.smembers(`user:${userId}:rooms`);
        } catch (error) {
            logger.error(`Error getting user rooms: ${error}`);
            throw new Error('Failed to get user rooms');
        }
    }

    /**
     * Adds a user to a room in Redis.
     * @param userId - The ID of the user.
     * @param roomId - The ID of the room.
     * @returns A promise that resolves when the user is added to the room.
     * @throws Error if adding the user to the room fails.
     */
    async addUserToRoom(userId: string, roomId: string): Promise<void> {
        try {
            await this.redis.sadd(`user:${userId}:rooms`, roomId);
        } catch (error) {
            logger.error(`Error adding user room: ${error}`);
            throw new Error('Failed to add user room');
        }
    }

    /**
     * Removes a user from a room in Redis.
     * @param userId - The ID of the user.
     * @param roomId - The ID of the room.
     * @returns A promise that resolves when the user is removed from the room.
     * @throws Error if removing the user from the room fails.
     */
    async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
        try {
            await this.redis.srem(`user:${userId}:rooms`, roomId);
        } catch (error) {
            logger.error(`Error removing user room: ${error}`);
            throw new Error('Failed to remove user room');
        }
    }

    /**
     * Retrieves all users in a room from Redis.
     * @param roomId - The ID of the room.
     * @returns A promise that resolves with an array of user IDs.
     * @throws Error if retrieving the users fails.
     */
    async getRoomUsers(roomId: string): Promise<string[]> {
        try {
            return await this.redis.smembers(`room:${roomId}:users`);
        } catch (error) {
            logger.error(`Error getting room users: ${error}`);
            throw new Error('Failed to get room users');
        }
    }

    /**
     * Saves a room to Redis.
     * @param room - The room object to save.
     * @returns A promise that resolves when the room is saved.
     * @throws Error if saving the room fails.
     */
    async saveRoom(room: Room) {
        try {
            await this.redis.set(`room:${room.id}`, JSON.stringify(room));
        } catch (error) {
            logger.error(`Error saving room: ${error}`);
            throw new Error('Failed to save room');
        }
    }

    isRoomExists(roomId: string): Promise<number> {
        return this.redis.exists(`room:${roomId}`);

    }
}