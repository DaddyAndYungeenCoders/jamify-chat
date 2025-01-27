import {RoomPrefix} from "../models/enums/room-prefix.enum";

export const getUsersFromPrivateRoomId = (roomId: string): string[] => {
    // roomId is always in the format of "private-room_userId1_userId2" where userId1 < userId2
    const userIds = roomId.replace(RoomPrefix.PRIVATE, "").split('_');
    return userIds;
}
