import request from 'supertest';
import express from 'express';
import {StatusCodes} from 'http-status-codes';
import {messageRoutes} from '../message.route';
import {validateMessage} from '../../middleware/validators';
import {MessageService} from '../../services/message.service';
import {ChatMessage} from '../../models/interfaces/chat-message.interface';

jest.mock('../../middleware/validators');
jest.mock('../../services/message.service', () => ({
    MessageService: {
        getInstance: jest.fn().mockReturnValue({
            sendQueueMessage: jest.fn()
        })
    }
}));

const app = express();
app.use(express.json());
app.use('/api/messages', messageRoutes());

describe('Message Routes', () => {
    let messageServiceInstance: jest.Mocked<MessageService>;

    beforeEach(() => {
        jest.clearAllMocks();
        messageServiceInstance = {
            sendQueueMessage: jest.fn()
        } as unknown as jest.Mocked<MessageService>;

        (MessageService.getInstance as jest.Mock).mockReturnValue(messageServiceInstance);
    });

    it('should return Messages API on GET /', async () => {
        const response = await request(app).get('/api/messages/');
        expect(response.status).toBe(StatusCodes.OK);
        expect(response.body).toBe('Messages API');
    });

    it('should send a new message and return accepted status', async () => {

        const message: ChatMessage = {
            id: 'msg_123',
            content: 'Hello',
            senderId: 'user1',
            timestamp: new Date().toString()
        };
        (validateMessage as jest.Mock).mockImplementation((req, res, next) => next());
        messageServiceInstance.sendQueueMessage.mockResolvedValue(message);

        const response = await request(app)
            .post('/api/messages/send')
            .send(message);

        expect(response.status).toBe(StatusCodes.ACCEPTED);
        expect(response.body).toEqual({
            status: 'accepted',
            messageId: message.id
        });
    });

    it('should return validation error if message is invalid', async () => {
        (validateMessage as jest.Mock).mockImplementation((req, res, next) => {
            res.status(StatusCodes.BAD_REQUEST).json({error: 'Invalid message'});
        });

        const response = await request(app)
            .post('/api/messages/send')
            .send({});

        expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        expect(response.body).toEqual({error: 'Invalid message'});
    });

});