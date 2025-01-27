import mongoose from 'mongoose';
import {Config} from '../models/interfaces/config.interface';
import logger from "./logger";

export const initializeDatabase = async (config: Config) => {
    try {
        await mongoose.connect(config.mongo.baseUri, {
            authSource: 'admin',
            auth: {
                username: 'root',
                password: 'password',
            },
            dbName: config.mongo.dbName,
        });
        logger.info(`Connected to MongoDB at: ${config.mongo.baseUri}`);
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};