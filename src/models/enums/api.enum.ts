import {IApi} from "../interfaces/api.interface";

export const API: IApi = {
    WS: {
        BASE: 'http://localhost:3000',
        PRIVATE_ROOM: '/api/rooms/private',
        ADD_USERS_TO_PRIVATE_ROOM: '/api/rooms/private/add-users',
    },

} as const;