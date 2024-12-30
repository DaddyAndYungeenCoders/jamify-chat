import {AsyncLocalStorage} from "node:async_hooks";

export class RequestContext {
    private static instance: RequestContext;
    private storage = new AsyncLocalStorage<{token: string}>();

    static getInstance(): RequestContext {
        if (!RequestContext.instance) {
            RequestContext.instance = new RequestContext();
        }
        return RequestContext.instance;
    }

    setContext(token: string) {
        this.storage.run({token}, () => {});
    }

    getToken(): string | undefined {
        return this.storage.getStore()?.token;
    }

    clear() {
        this.storage.disable();
    }
}