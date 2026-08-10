import {Request , Response, NextFunction } from "express";
import { userService } from "../services/index.js";
import { UpdateUserRoleContract } from "../contracts/user.contract.js";

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.getById(req.user!.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
export const deleteMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.deleteAccount(req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body as UpdateUserRoleContract;
    const result = await userService.updateRole(req.params.id as string, role);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

