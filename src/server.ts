import {App} from './app';
import {config} from "./config/config";
import logger from "./config/logger";

/**
 * Initializes the application and starts the server.
 */
const app = new App(config);
const server = app.getServer();

const PORT = config.port || 3000;
const HOST = config.host || 'localhost';

/**
 * Starts the server and logs the running status.
 */
server.listen(PORT, () => {
    logger.info(`Chat MicroService is running on http://${HOST}:${PORT}`);
    logger.info(`Swagger documentation available on http://${HOST}:${PORT}/api-docs`);
});

/**
 * Handles graceful shutdown of the server.
 */
const shutdown = async () => {
    logger.info('Shutdown signal received');

    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
};

// Listen for termination signals to initiate shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);