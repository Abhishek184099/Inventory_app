import jwt from "jsonwebtoken";
import { UserPayloadContract } from "../contracts/user.contract.js";
import { User } from "../generated/prisma/browser.js";

const JWT_SECRET = process.env.JWT_SECRET!;


if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}

export const signAccessToken = (payload: UserPayloadContract): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

export const verifyAccessToken = (token : string) : UserPayloadContract => {
    return jwt.verify(token,JWT_SECRET) as UserPayloadContract;
}