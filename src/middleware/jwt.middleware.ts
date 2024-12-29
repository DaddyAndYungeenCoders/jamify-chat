import {NextFunction, Request, RequestHandler, Response} from 'express';
import jwt, {JwtPayload} from 'jsonwebtoken';
import logger from '../config/logger';
import {config} from "../config/config";

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

/**
 * Middleware to authenticate requests using JWT.
 *
 * @param {AuthRequest} req - The request object, extended to include a user property.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const authMiddleware: RequestHandler = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {

    const publicKey = config.jwt.publicKey;
    const algorithms = config.jwt.algorithms;
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        logger.warn('Authentication failed: No Bearer token provided');
        res.status(401).json({message: 'Token manquant ou format invalide'});
        return;
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, publicKey, {algorithms: algorithms}, (error, decoded) => {
        if (error) {
            logger.error(`JWT verification failed: ${error.message}`);

            if (error.name === 'TokenExpiredError') {
                res.status(401).json({message: 'Token expiré'});
                return;
            }
            if (error.name === 'JsonWebTokenError') {
                res.status(401).json({message: 'Token invalide'});
                return;
            }

            res.status(500).json({message: 'Erreur lors de la vérification du token'});
            return;
        }

        req.user = decoded as JwtPayload;
        next();
    });
};