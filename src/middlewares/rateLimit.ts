import { Request ,Response , NextFunction } from "express";
import {redis} from "../lib/redis.js";
import { AppError } from "../utils/error.js";

interface RateLimitOptions{
    windowSeconds : number;
    maxRequests : number;
    keyPrefix : string;
}

export const rateLimit = (options : RateLimitOptions) => {
    return async(req : Request ,Response : Response ,next :NextFunction)=>{
     try {
        const identifier = req.user?.id ?? req.ip;
        const key = `ratelimit:${options.keyPrefix}:${identifier}`;

        const current = await redis.incr(key);

        if(current === 1){
            await redis.expire(key , options.windowSeconds);
        }

        if(current > options.maxRequests){
            throw new AppError("Too many request please try again later" , 405)
        }
         
        next();

     } catch (err) {
        next(err);
     }
}
}