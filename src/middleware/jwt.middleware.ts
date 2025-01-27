import {NextFunction, Request, RequestHandler, Response} from 'express';
import jwt, {JwtPayload, VerifyErrors} from 'jsonwebtoken';
import logger from '../config/logger';
import jwksClient from 'jwks-rsa';
import {config} from "../config/config";
import {StatusCodes} from "http-status-codes";
import {RequestContext} from "../utils/request-context";

export interface AuthRequest extends Request {
    user?: JwtPayload;
}

const jwks = jwksClient({
    jwksUri: config.jwt.jwksUri, // Public key URL
    cache: true,
    cacheMaxEntries: 5,          // Maximum number of entries in cache
    cacheMaxAge: 10 * 60 * 1000, // 10 minutes
});

/**
 * Retrieves the public key from the JWKs.
 *
 * @param {jwt.JwtHeader} header - JWT header containing the kid.
 * @param {function(Error|null, string=): void} callback - Function to return the public key.
 */
const getKey = (header: jwt.JwtHeader, callback: (err: Error | null, key?: string) => void): void => {

    jwks.getSigningKey(header.kid, (err, key) => {
        if (!header.kid) {
            logger.error('No kid found in JWT header');
            return callback(new Error('No kid found in JWT header'));
        }

        if (err) {
            logger.error(`Failed to get signing key: ${err.message}`);
            return callback(err);
        }

        if (!key) {
            logger.error('No key found');
            return callback(new Error('No key found'));
        }
        const publicKey = key.getPublicKey();
        callback(null, publicKey);
    });
};

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
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        logger.warn('Authentication failed: No Bearer token provided');
        res.status(StatusCodes.UNAUTHORIZED).json({message: 'Token manquant ou format invalide'});
        return;
    }

    const token = authHeader.split(' ')[1];

    if (token) {
        // Set the token in the request context
        const requestContext = RequestContext.getInstance()
        requestContext.setToken(token);

        // Verify the token with the public key served by the JWKS endpoint
        jwt.verify(
            token,
            getKey, // Get the public key
            {algorithms: config.jwt.algorithms, issuer: "https://jamify.daddyornot.xyz/jamify-uaa"}, // Only allow the specified algorithms
            (error: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
                if (error) {
                    logger.error(`JWT verification failed for ${token} : ${error.message}`);

                    if (error.name === 'TokenExpiredError') {
                        res.status(StatusCodes.UNAUTHORIZED).json({message: 'Token expiré'});
                        return;
                    }
                    if (error.name === 'JsonWebTokenError') {
                        res.status(StatusCodes.UNAUTHORIZED).json({message: 'Token invalide'});
                        return;
                    }

                    res.status(StatusCodes.UNAUTHORIZED).json({message: 'Erreur lors de la vérification du token'});
                    return;
                }

                // Check if the decoded payload is a JwtPayload object
                if (typeof decoded === 'string' || !decoded) {
                    logger.error('Invalid token payload: Expected JwtPayload');
                    res.status(StatusCodes.UNAUTHORIZED).json({message: 'Payload du token invalide'});
                    return;
                }

                req.user = decoded;
                next();
            }
        );
    }
};