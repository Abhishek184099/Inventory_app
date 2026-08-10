import type { UserRepository } from "../repository/user.repository.js";
import { UserResponseContract } from "../contracts/user.contract.js";
import type { Role,User } from "../generated/prisma/client.js";
import { NotFoundError,ConflictError,UnAuthorizedError  } from "../utils/error.js";

export class UserService{
     constructor(private readonly users: UserRepository) {}

     async getById (id:string)  :Promise<UserResponseContract>{
        const user = await this.users.findById(id);
        if(!user){
            throw new NotFoundError("User Not Found.");
        }
        return this.toResponse(user);
     }

     async updateRole(targetUserId : string , role : Role) : Promise<UserResponseContract>{
        const user = await this.users.findById(targetUserId);
        if(!user){
            throw new NotFoundError("User Not Found");
        }

        const updated = await this.users.updateRole(targetUserId , role);
        return this.toResponse(updated);
     }

    async deleteAccount(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    await this.users.deleteById(userId);
  }


     async toResponse(user : User) :Promise<UserResponseContract> {
        return {
            id : user.id,
            email : user.email,
            role: user.role,
           createdAt: user.createdAt,
           updatedAt: user.updatedAt,
        }
     }

}