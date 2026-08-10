import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import * as orderController from "../controller/order.controller.js";
import { rateLimit } from '../middlewares/rateLimit.js';

const router = Router();

router.use(authenticate); 

router.post('/',rateLimit({windowSeconds : 60 , maxRequests : 5 , keyPrefix: "checkout" }) ,
 orderController.checkout);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);

export default router;

