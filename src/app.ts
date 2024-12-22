import express, {Application} from 'express';
import {Server as SocketServer} from 'socket.io';
import {createServer, Server as HttpServer} from 'http';
import {WebSocketManager} from "./config/websocket.config";
import {RedisService} from "./services/redis.service";
import {messageRoutes} from "./routes/message.route";
import {errorHandler} from "./middleware/error-handler";
import {Config} from "./models/interfaces/config.interface";
import {QueueService} from "./services/queue.service";
import {RoomService} from "./services/room.service";
import logger from "./config/logger";

// Application configuration and initialization of services
export class App {
    public app: Application;
    public server: HttpServer;
    public io: SocketServer;
    private readonly wsManager: WebSocketManager;
    private queueService: QueueService;
    private readonly redisService: RedisService;
    private roomService: RoomService;

    constructor(config: Config) {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new SocketServer(this.server);

        this.redisService = new RedisService({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password
        });

        this.roomService = new RoomService(this.redisService);

        this.wsManager = new WebSocketManager(this.io, {
            serverId: config.serverId,
            redisService: this.redisService
        });

        this.queueService = QueueService.getInstance(config, this.wsManager);

        this.initializeServices();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeWebSocket();
        this.initializeErrorHandling();
    }

    private async initializeServices(): Promise<void> {
        try {
            await this.queueService.connect();
            logger.info('Queue service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize queue service:', error);
            throw error;
        }
    }

    private initializeMiddlewares(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
    }

    private initializeRoutes(): void {
        this.app.use('/api/messages', messageRoutes(this.wsManager));
    }

    private initializeWebSocket(): void {
        this.io.on('connection', (socket) => {
            this.wsManager.handleConnection(socket);
        });
    }

    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    public getServer(): HttpServer {
        return this.server;
    }
}