import {NextFunction, Request, Response} from 'express';
import {ChatMessage} from "../models/interfaces/chat-message.interface";
import logger from "../config/logger";

export function validateMessage(req: Request, res: Response, next: NextFunction) {
    const message: ChatMessage = req.body;

    if (!message.senderId || !message.content || (!message.roomId && !message.destId)) {
        logger.error(`Missing required fields : ${message}`);
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }

    if (message.senderId === message.destId) {
        logger.error(`Sender and destination cannot be the same : ${message}`);
        return res.status(400).json({
            error: 'Sender and destination cannot be the same'
        });
    }

    if (message.content.length > 1000) {
        return res.status(400).json({
            error: 'Message content is too long'
        });
    }

    next();
}
