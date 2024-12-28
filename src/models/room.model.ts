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
}