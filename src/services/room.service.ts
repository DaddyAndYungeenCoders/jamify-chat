import {RedisService} from "./redis.service";
import {Room} from "../models/room.model";
import { RoomType } from "../models/enums/room-type.enum";

export class RoomService {
    redisService: RedisService;

    constructor(redisService: RedisService) {
        this.redisService = redisService;
    }

    async createRoom(type: RoomType, metadata: {} | undefined) {
        const room = new Room(this.generateRoomId(type), type, metadata);
        // await this.saveRoom(room);
        return room;
    }

    // async saveRoom(room: Room) {
    //     // Implementation to save the room
    //     await this.roomService.saveRoom(room);
    // }

    async joinRoom(roomId: string, userId: string) {
        await this.redisService.addUserToRoom(roomId, userId);
    }

    async leaveRoom(roomId: string, userId: string) {
        await this.redisService.removeUserFromRoom(roomId, userId);
    }

    async getRoomMembers(roomId: string) {
        return await this.redisService.getRoomUsers(roomId);
    }

    async getUserRooms(userId: string) {
        return await this.redisService.getUserRooms(userId);
    }

    generateRoomId(type: RoomType) {
        return `${type}-room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}