import {NextFunction, Request, Response} from 'express';

export function validateMessage(req: Request, res: Response, next: NextFunction) {
    const {senderId, receiverId, content} = req.body;

    if (!senderId || !receiverId || !content) {
        return res.status(400).json({
            error: 'Missing required fields'
        });
    }

    if (typeof content !== 'string' || content.length > 1000) {
        return res.status(400).json({
            error: 'Invalid content'
        });
    }

    next();
}
