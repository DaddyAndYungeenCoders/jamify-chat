import {Router} from 'express';
import {validateMessage} from "../middleware/validators";
import {MessageService} from "../services/message.service";
import {ChatMessage} from "../models/interfaces/chat-message.interface";
import {config} from "../config/config";
import logger from "../config/logger";
import {StatusCodes} from "http-status-codes";

/**
 * Defines the message routes for the application.
 * @returns The configured router.
 */
export const messageRoutes = () => {
    const router = Router();
    const messageService = MessageService.getInstance(config);

    router.get('/', (req, res) => {
        logger.info("Messages API");
        res.json("Messages API");
    });

    /**
     * Route to handle posting a new message.
     * Validates the message and then sends it using the MessageService.
     * @swagger
     * /api/messages/send:
     *   post:
     *     summary: Send a new message.
     *     tags:
     *       - Messages
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ChatMessage'
     *     responses:
     *       202:
     *         description: Accepted
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: accepted
     *                 messageId:
     *                   type: string
     *                   example: "msg_1631533200000_123e4567-e89b-12d3-a456-426614174000"
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

            res.status(StatusCodes.ACCEPTED).json({
                status: 'accepted',
                messageId: message.id
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};