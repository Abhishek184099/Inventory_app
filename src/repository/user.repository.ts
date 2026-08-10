import { Role } from "../generated/prisma/enums.js";
import { User ,PrismaClient  } from "../generated/prisma/client.js";


export class UserRepository {
    constructor(private readonly db : PrismaClient ) {}

    async findById(id : string) : Promise<User | null> {
         return  this.db.user.findUnique({
            where : {id: id}
         })
    }

    async findByEmail(email:string) : Promise<User | null> {
        return  this.db.user.findUnique( {
            where : {email: email}
        })
    }

  async create(data: { email: string; passwordHash: string; role?: Role }): Promise<User> {
    return  this.db.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? Role.USER,
      },
    });
  }

  async updateRole (id : string , role: Role) : Promise<User> {
    return  this.db.user.update({
        where : {id},data: {role}
    })
  }
  async deleteById(id: string): Promise<User> {
    return  this.db.user.delete({ where: { id } });
  }

}


