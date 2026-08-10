import {Request ,Response , NextFunction} from "express";
import { CartService } from "../services/cart.service.js";
import { AddCartItemContract , UpdateCartItemContract} from "../contracts/cart.contract.js";
import { cartService } from "../services/index.js";

export const getCart = async (req : Request , res : Response , next : NextFunction) => {
    try{
      const result = await cartService.getCart(req.user!.id);
      res.status(200).json(result);
    }catch(err){
         next(err);
    }
}

export const addItem = async(req:Request , res : Response , next : NextFunction) => {
    try {
        const data = req.body  as AddCartItemContract;
        const result = await cartService.addItem(req.user!.id , data)
      res.status(200).json(result);
    } catch (err) {
        next(err);
    }
} 

export const updateItem = async(req:Request , res : Response, next : NextFunction) => {
    try {
        const data = req.body as UpdateCartItemContract;
        const result = await cartService.updateItem(req.user!.id ,req.params.productId as string , data)
        res.status(200).json(result)
    }catch(err){
        next(err);  
    }
}

export const removeItem = async(req : Request , res : Response , next : NextFunction) => {
     try {
        const result = await cartService.removeItem(req.user!.id , req.params.productId as string )
        res.status(200).json(result)
     } catch (err) {
        next(err)
     }
}

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cartService.clearCart(req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};