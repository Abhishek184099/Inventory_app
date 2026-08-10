import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireAdmin } from '../middlewares/require-admin.js';
import { createProductSchema ,updateProductSchema,
  restockProductSchema,   listProductsQuerySchema,
 } from '../contracts/product.contract.js';

 import * as productController from '../controller/product.controller.js';

const router = Router();



 router.get('/', validate(listProductsQuerySchema, 'query'), productController.list);
router.get('/:id', productController.getById);

router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createProductSchema),
  productController.create
);
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validate(updateProductSchema),
  productController.update
);

router.delete('/:id', authenticate, requireAdmin, productController.remove);
router.post(
  '/:id/restock',
  authenticate,
  requireAdmin,
  validate(restockProductSchema),
  productController.restock
);

export default router;

