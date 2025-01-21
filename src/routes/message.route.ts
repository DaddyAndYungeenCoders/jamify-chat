import {Router} from 'express';
import {validateMessage} from "../middleware/validators";
import {MessageService} from "../services/message.service";
import {ChatMessage} from "../models/interfaces/chat-message.interface";
import {config} from "../config/config";
import logger from "../config/logger";
import {StatusCodes} from "http-status-codes";
import {ConversationDetails} from "../models/interfaces/conversation.details";

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
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: header
     *         name: Authorization
     *         schema:
     *           type: string
     *         required: true
     *         description: JWT token
     *         example: Bearer <JWT>
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
        logger.info(`Received HTTP message request with body: ${JSON.stringify(req.body)}`);
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

    router.get('/:roomId', async (req, res, next) => {
        const roomId = req.params.roomId;
        logger.info(`Received HTTP message request for room ${roomId}`);
        try {
            const messages: ChatMessage[] = await messageService.getMessagesForRoom(roomId, {});
            console.log(`Returning ${messages.length} messages for room ${roomId}`);
            res.json(messages);
        } catch (error) {
            next(error);
        }
    });

    router.get('/get/:userId', async (req, res, next) => {
        const userId = req.params.userId;
        logger.info(`Received HTTP get all message request for user ${userId}`);
        try {
            const messages: ConversationDetails[] = await messageService.getConversationsForUser(userId);
            logger.info(`Returning ${messages.length} conversations for user ${userId}`);
            res.json(messages);
        } catch (error) {
            next(error);
        }
    });


    router.get('/conversation/room/:roomId', async (req, res, next) => {
        const roomId = req.params.roomId;
        logger.info(`Received HTTP conversation request for room ${roomId}`);
        try {
            const messages: ConversationDetails = await messageService.getConversationForRoom(roomId);
            console.log(`Returning conversation for room ${roomId}`);
            res.json(messages);
        } catch (error) {
            next(error);
        }

    });

    return router;
};