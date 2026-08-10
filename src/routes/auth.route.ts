import { Router   } from "express";
import { validate } from "../middlewares/validate.js";
import { registerSchema,loginSchema } from "../contracts/user.contract.js";
import * as authController from "../controller/auth.controller.js";
import { rateLimit } from "../middlewares/rateLimit.js";

const router = Router();

router.post('/register',
    rateLimit({windowSeconds : 60 , maxRequests : 5 , keyPrefix: "register" }) ,
     validate(registerSchema),authController.register)

router.post("/login",
    rateLimit({windowSeconds : 60 , maxRequests : 7 , keyPrefix: "login" }), 
    validate(loginSchema),authController.login)

export default router;
