import express, {Application} from 'express';
import cors from 'cors';
import {createServer, Server as HttpServer} from 'http';
import {Server as SocketServer} from 'socket.io';
import {messageRoutes} from './routes/message.route';
import {errorHandler} from './middleware/error-handler';
import {Config} from './models/interfaces/config.interface';
import {QueueService} from './services/queue.service';
import logger from './config/logger';

export class App {
    public app: Application;
    public server: HttpServer;
    public io: SocketServer;
    private queueService: QueueService;

    constructor(config: Config) {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new SocketServer(this.server, {
            cors: {
                origin: 'http://localhost:5173',
                methods: ['GET', 'POST'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            }
        });

        this.queueService = QueueService.getInstance(config);

        this.initializeServices();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private async initializeServices(): Promise<void> {
        try {
            await this.queueService.connect();
            logger.info('Queue service initialized successfully');
        } catch (error) {
            logger.error(`Error initializing queue service: ${error}`);
            throw error;
        }
    }

    private initializeMiddlewares(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(cors({
            origin: 'http://localhost:5173',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
    }

    private initializeRoutes(): void {
        this.app.use('/api/messages', messageRoutes());
    }

    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    public getServer(): HttpServer {
        return this.server;
    }
}