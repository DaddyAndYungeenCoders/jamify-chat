import {NextFunction, Request, Response} from 'express';
import logger from "../config/logger";
import {StatusCodes} from "http-status-codes";

/**
 * Error handling middleware for Express applications.
 * Logs the error stack and sends a generic internal server error response.
 *
 * @param {Error} err - The error object.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    logger.error(err.stack);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error',
    });
}