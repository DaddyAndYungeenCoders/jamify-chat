import {RoomType} from "./enums/room-type.enum";


export class Room {
    id: string;
    type: RoomType;
    metadata: Record<string, any>;

    constructor(id: string, type: RoomType, metadata = {}) {
        this.id = id;
        this.type = type;
        this.metadata = metadata;
    }

    static createPrivateRoom(user1Id: string, user2Id: string) {
        const roomId = `private_${[user1Id, user2Id].sort().join('_')}`;
        return new Room(roomId, RoomType.PRIVATE, {
            participants: [user1Id, user2Id]
        });
    }

    static createEventRoom(eventId: string) {
        return new Room(`event_${eventId}`, RoomType.EVENT, {
            eventId
        });
    }

    static createJamRoom(jamId: string) {
        return new Room(`jam_${jamId}`, RoomType.JAM, {
            jamId
        });
    }
}