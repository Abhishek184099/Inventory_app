import { Request , Response ,NextFunction } from "express";
import { authService } from "../services/index.js";
import { RegisterCredentialsContract ,LoginCredentialsContract } from "../contracts/user.contract.js";
import { success } from "zod";

export const register = async(req : Request , res : Response , next : NextFunction ) => {
     try{
        const data = req.body as RegisterCredentialsContract;
         const result = await authService.register(data);  
        console.log("RESULT:", result);
         res.status( 200 ).json({success :true , data : result});
         
     }
     catch(err){
         next(err);
     }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body as LoginCredentialsContract;
    console.log("pass =", data.password);
    const result = await authService.login(data);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};


