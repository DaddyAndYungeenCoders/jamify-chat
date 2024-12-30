import {IApi} from "../interfaces/api.interface";

export const API: IApi = {
    WS: {
        BASE: 'http://localhost:3333/api',
        PRIVATE_ROOM: '/rooms/private',
        ADD_USERS_TO_PRIVATE_ROOM: '/rooms/private/add-users',
    },

} as const;