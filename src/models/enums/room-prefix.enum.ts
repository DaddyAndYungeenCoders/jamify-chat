import {RoomType} from "./room-type.enum";

export const enum RoomPrefix {
    PRIVATE = `${RoomType.PRIVATE}-room_`,
    EVENT = `${RoomType.EVENT}-room_`,
    JAM = `${RoomType.JAM}-room_`
}
