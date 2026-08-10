import bcrypt from "bcrypt";
import { UserRepository } from "../repository/user.repository.js";
import {
  RegisterCredentialsContract,
  LoginCredentialsContract,
  AuthResponseContract,
  UserResponseContract,
  UserPayloadContract,
} from "../contracts/user.contract.js";
import { signAccessToken } from "../utils/jwt.js";
import { ConflictError,UnAuthorizedError } from "../utils/error.js";
import { User } from "../generated/prisma/client.js";

const SALT_ROUNDS = 10;

export class AuthService {
    constructor(private readonly users: UserRepository) {}

    async register (data : RegisterCredentialsContract) : Promise<AuthResponseContract>  {
        const existing = await this.users.findByEmail(data.email);
        if (existing) {
            throw new ConflictError("Email is already registered");
        }
        const passwordHash = await bcrypt.hash(data.password , SALT_ROUNDS);
        const user = await this.users.create({email : data.email , passwordHash})
        
       const accessToken = signAccessToken({id : user.id,email : user.email , role :user.role })
       return {
        accessToken,
        user : this.toUserResponse(user)
       }

    }

   async login (data : LoginCredentialsContract) : Promise<AuthResponseContract> {
       const user = await this.users.findByEmail(data.email);
       if(!user){
        throw new UnAuthorizedError();
       }

       const isValid = await bcrypt.compare(data.password , user.passwordHash )
       if(!isValid){
        throw new UnAuthorizedError();
       }
     
     const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });

     return {
        accessToken,
        user : this.toUserResponse(user)
     }

   }


   async getCurrentUser (userId : string) : Promise<UserResponseContract> {
    const user = await this.users.findById(userId);

    if(!user){
        throw new UnAuthorizedError("User doesnot exist");
    }
    return this.toUserResponse(user);

   }

    private toUserResponse(user: User): UserResponseContract {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };}

}
