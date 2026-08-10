import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireAdmin } from '../middlewares/require-admin.js';

import { updateUserRoleSchema } from '../contracts/user.contract.js';

import * as userController from "../controller/user.controller.js";

const router = Router();

router.get('/me', authenticate, userController.getMe);
router.delete('/me', authenticate, userController.deleteMe);
router.patch(
  '/:id/role',
  authenticate,
  requireAdmin,
  validate(updateUserRoleSchema),
  userController.updateUserRole
);

export default router;



