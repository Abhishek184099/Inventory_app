import { Request, Response, NextFunction } from 'express';
import { checkOutService } from '../services/index.js';
import { orderRepository } from '../repository/index.js';
export const checkout = async(req:Request , res : Response , next:NextFunction) => {
    try{
        const result = await checkOutService.checkOut(req.user!.id);
            res.status(201).json({ success: true, data: result });
    }catch(err){
        next(err);
    }
}

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderRepository.findByUserId(req.user!.id);
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await checkOutService.getOrderById(req.params.id as string, req.user!.id);
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err); 
  }
};

