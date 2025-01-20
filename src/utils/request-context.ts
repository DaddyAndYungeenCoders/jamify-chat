import {AsyncLocalStorage} from "node:async_hooks";

/**
 * Class to manage request context using AsyncLocalStorage.
 * This allows storing and retrieving context-specific data (e.g., Bearer token)
 * across asynchronous operations.
 */
export class RequestContext {
    private static instance: RequestContext;
    private storage = new AsyncLocalStorage<{ token: string }>();

    /**
     * Get the singleton instance of RequestContext.
     * @returns {RequestContext} The singleton instance.
     */
    static getInstance(): RequestContext {
        if (!RequestContext.instance) {
            RequestContext.instance = new RequestContext();
        }
        return RequestContext.instance;
    }

    middleware() {
        return (req: any, res: any, next: any) => {
            // Initialise le contexte pour toute la durée de la requête
            this.storage.run({ token: '' }, () => {
                next();
            });
        };
    }

    /**
     * Set the context with a given token.
     * @param {string} token - The Bearer token to be stored in the context.
     */
    setToken(token: string) {
        const store = this.storage.getStore();
        if (store) {
            store.token = token;
        }
    }

    /**
     * Retrieve the token from the current context.
     * @returns {string | undefined} The Bearer token if available, otherwise undefined.
     */
    getToken(): string | undefined {
        return this.storage.getStore()?.token;
    }

    /**
     * Clear the current context.
     */
    clear() {
        this.storage.disable();
    }
}