import { Request, Response, NextFunction } from 'express';
import logger from "../config/logger";
import {StatusCodes} from "http-status-codes";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
    logger.error(err.stack);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error',
    });
}