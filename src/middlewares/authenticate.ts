import { Request ,Response ,NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { UnAuthorizedError } from "../utils/error.js";
import { Role } from "../generated/prisma/enums.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try{
        const authHeader = req.headers.authorization;


        if(!authHeader || !authHeader.startsWith("Bearer")){
            throw new UnAuthorizedError("No token provided");
        }
        
        const token = authHeader.split(" ")[1];

        if(!token) {
                  throw new UnAuthorizedError('No token provided');
        }


        const payload = verifyAccessToken(token);
        req.user = payload;

        next();
    }

    catch(err){
        console.log('AUTH ERROR:', err); 
        next(new UnAuthorizedError('Invalid or expired token'));
    }
}

