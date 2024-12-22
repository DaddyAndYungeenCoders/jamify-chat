import { App } from './app';
import {config} from "./config/config";

const app = new App(config);
const server = app.getServer();

const PORT = config.port || 3000;

// Start the server and handle signals

server.listen(PORT, () => {
    console.log(`Chat microservice is running on port ${PORT}`);
});

// Handle graceful shutdown
const shutdown = async () => {
    console.log('Shutdown signal received');

    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);