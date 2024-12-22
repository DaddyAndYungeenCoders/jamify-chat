import { App } from './app';
import {config} from "./config/config";
import logger from "./config/logger";

const app = new App(config);
const server = app.getServer();

const PORT = config.port || 3000;
const HOST = config.host || 'localhost';

// Start the server and handle signals

server.listen(PORT, () => {
    logger.info(`Chat MicroService is running on http://${HOST}:${PORT}`);
});

// Handle graceful shutdown
const shutdown = async () => {
    logger.info('Shutdown signal received');

    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);