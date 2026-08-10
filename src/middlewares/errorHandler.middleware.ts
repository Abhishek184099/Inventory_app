import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { isAppError } from '../utils/helper.js';

export const errorHandler = (
    err: Error,
    req : Request,
    res : Response,
    next : NextFunction
) => {
     logger.error(err.message , {
        method : req.method,
        path : req.path
     })
     
     const statusCode = isAppError(err) ? err.statusCode : 500;

     const message = isAppError(err) ? err.message : "Internal server error";

     return res.status(statusCode).json({
        success : false,
        message ,
        path : req.path,
        method : req.method,
     })
    
}