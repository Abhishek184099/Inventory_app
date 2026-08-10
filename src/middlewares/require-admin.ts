import { Request , Response ,NextFunction } from "express";
import { UnAuthorizedError } from "../utils/error.js";

export const requireAdmin = (req : Request , res : Response , next : NextFunction) =>{
   if(!req.user){
    return next(new UnAuthorizedError("Authication required"));
   }

   if(req.user.role !== "ADMIN"){
            return next(new UnAuthorizedError("Admin access required."));
   }
   next();
}