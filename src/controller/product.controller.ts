import { Request, Response, NextFunction } from "express";
import { productService } from "../services/index.js";
import {
  CreateProductContract,
  UpdateProductContract,
  RestockProductContract,
  ListProductsQueryContract,
  listProductsQuerySchema,
} from "../contracts/product.contract.js";

export const create = async(req : Request, res : Response, next : NextFunction) => {
    try{
       const data =  req.body as CreateProductContract;
       const result = await productService.create(data);
       res.status(200).json({success : true , data : result});
    }catch(err){
     next(err);
    }
}

export const list = async(req : Request, res : Response, next: NextFunction) => {
    try {
        const query = (req as any).validated.query as ListProductsQueryContract;
        const result = await productService.list(query);
        res.status(200).json({success:true , ...result})

  } catch (err) {
        next(err);
    }

}

export const update = async(req : Request,res : Response, next: NextFunction) => {
    try {
        const data =  req.body as UpdateProductContract;
        const result =  await productService.update( req.params.id as string , data);
        res.status(200).json({success:true , data : result});
    } catch (err) {
        next(err);
    }
} 

export const remove = async(req : Request, res : Response , next: NextFunction) => {
    try {
        await productService.delete(req.params.id as string);
            res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productService.getById(req.params.id as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const restock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body as RestockProductContract;
    const result = await productService.restock(req.params.id as string, data);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};