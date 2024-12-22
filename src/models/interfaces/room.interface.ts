import {RoomType} from "../enums/room-type.enum";

export interface Room {
    id: string;
    type: RoomType;
    metadata: Record<string, any>;
}
