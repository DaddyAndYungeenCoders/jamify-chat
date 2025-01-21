import {User} from "../models/interfaces/user/user.types";
import {Config} from "../models/interfaces/config.interface";
import {RequestContext} from "../utils/request-context";

export class UserService {

    private static instance: UserService;
    private config: Config;

    private constructor(config: Config) {
        this.config = config;
    }

    /**
     * Returns the singleton instance of UserService.
     * @returns The singleton instance of UserService.
     */
    public static getInstance(config: Config): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService(config);
        }
        return UserService.instance;
    }

    async getUserByUserProviderId(userProviderId: string): Promise<User> {
        // Fetch user from engine
        userProviderId = "1122291430";
        const token = RequestContext.getInstance().getToken();
        return fetch(`${this.config.engine.uri}/users/providerId/${userProviderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }).then(response => response.json())
            .catch(error => {
                throw new Error('Failed to fetch user : ' + error);
            })
    }

}