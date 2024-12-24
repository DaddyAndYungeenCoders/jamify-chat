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
import {roomRoutes} from "./routes/room.route";
import cors from 'cors';

/**
 * Main application class for initializing and configuring the Express server,
 * WebSocket server, and various services.
 */
export class App {
    public app: Application;
    public server: HttpServer;
    public io: SocketServer;
    private readonly wsManager: WebSocketManager;
    private queueService: QueueService;
    private readonly redisService: RedisService;
    private readonly roomService: RoomService;

    /**
     * Constructs a new App instance.
     * @param config - The configuration object for the application.
     */
    constructor(config: Config) {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new SocketServer(this.server, {
            cors: {
                origin: 'http://localhost:5173',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            }
        });

        this.redisService = RedisService.getInstance(config.redis);

        this.roomService = RoomService.getInstance(this.redisService);

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

    /**
     * Initializes the services required by the application.
     * @throws Error if the queue service fails to connect.
     */
    private async initializeServices(): Promise<void> {
        try {
            await this.queueService.connect();
            logger.info('Queue service initialized successfully');
        } catch (error) {
            logger.error(`Error initializing queue service: ${error}`);
            throw error;
        }
    }

    /**
     * Initializes the middlewares for the Express application.
     */
    private initializeMiddlewares(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(cors({
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Upgrade'],
        }));
    }

    /**
     * Initializes the routes for the Express application.
     */
    private initializeRoutes(): void {
        this.app.use('/api/messages', messageRoutes(this.wsManager, this.roomService));
        this.app.use('/api/rooms', roomRoutes(this.roomService));
    }

    /**
     * Initializes the WebSocket server and handles new connections.
     */
    private initializeWebSocket(): void {
        this.io.on('connection', (socket) => {
            this.wsManager.handleConnection(socket);
        });
    }

    /**
     * Initializes the error handling middleware for the Express application.
     */
    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    /**
     * Returns the HTTP server instance.
     * @returns The HTTP server instance.
     */
    public getServer(): HttpServer {
        return this.server;
    }
}