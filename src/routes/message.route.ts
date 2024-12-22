import { Router } from 'express';
import { validateMessage } from "../middleware/validators";
import { MessageService } from "../services/message.service";
import { ChatMessage } from "../models/interfaces/chat-message.interface";
import { QueueService } from "../services/queue.service";
import { WebSocketManager } from "../config/websocket.config";
import { config } from "../config/config";

export const messageRoutes = (wsManager: WebSocketManager) => {
    const router = Router();
    const queueService = QueueService.getInstance(config, wsManager);

    router.post('/messages', (req, res, next) => {
        validateMessage(req, res, (err) => {
            if (err) {
                return next(err);
            }
            next();
        });
    }, async (req, res, next) => {
        try {
            const message: ChatMessage = {
                id: MessageService.generateMessageId(),
                senderId: req.body.senderId,
                roomId: req.body.roomId,
                content: req.body.content,
                timestamp: new Date().toISOString()
            };
            // Use the message service to publish the message
            await queueService.publishMessage(message);

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