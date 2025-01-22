import {IApi} from "../interfaces/api.interface";
import {config} from "../../config/config";

export const API: IApi = {
    WS: {
        BASE: config.ws.uri,
        PRIVATE_ROOM: '/rooms/private',
        ADD_USERS_TO_PRIVATE_ROOM: '/rooms/private/add-users',
    },

} as const;