import {Router} from 'express';
import {validateMessage} from "../middleware/validators";
import {MessageService} from "../services/message.service";
import {ChatMessage} from "../models/interfaces/chat-message.interface";
import {WebSocketManager} from "../config/websocket.config";
import {config} from "../config/config";
import {RoomService} from "../services/room.service";
import logger from "../config/logger";

/**
 * Defines the message routes for the application.
 * @param wsManager - The WebSocket manager instance.
 * @param roomService - The room service instance.
 * @returns The configured router.
 */
export const messageRoutes = (wsManager: WebSocketManager, roomService: RoomService) => {
    const router = Router();
    const messageService = MessageService.getInstance(config, wsManager, roomService);

    /**
     * Route to handle posting a new message.
     * Validates the message and then sends it using the MessageService.
     */
    router.post('/send', (req, res, next) => {
        validateMessage(req, res, (err) => {
            if (err) {
                return next(err);
            }
            next();
        });
    }, async (req, res, next) => {
        logger.info(`Received HTTP message request with body: ${req.body}`);
        try {
            const message: ChatMessage = {
                ...req.body,
            };
            await messageService.sendQueueMessage(message);

            res.status(202).json({
                status: 'accepted',
                messageId: message.id
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};