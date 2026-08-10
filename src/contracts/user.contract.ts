import {email, z} from "zod";
import { Role } from "../generated/prisma/enums.js";

export const registerSchema = z.object({
  email: z
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"), 
});

export type RegisterCredentialsContract = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentialsContract = z.infer<typeof loginSchema> ;

export interface UserResponseContract {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponseContract {
  accessToken: string;
  user: UserResponseContract;
}

export interface UserPayloadContract {
  id: string;
  email: string;
  role: Role;
  
}

export const updateUserRoleSchema = z.object({
  role: z.enum(Role),
});

export type UpdateUserRoleContract = z.infer<typeof updateUserRoleSchema>;
