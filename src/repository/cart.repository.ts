import strict from "node:assert/strict";
import {PrismaClient , Cart ,CartItem , Prisma} from "../generated/prisma/client.js";

export class CartRepository{
    constructor(private readonly db : PrismaClient){}

    async findByUserId(userId:string){
        return this.db.cart.findUnique({
            where: {userId},
            include:{items : {include:{product : true}}}
        })
    }

    async createForUser(userId : string): Promise<Cart> {
        return this.db.cart.create({data : {userId}})
    }

    async findOrCreateForUser(userId: string) {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    const created = await this.createForUser(userId);
    return { ...created, items: [] };
  }

  async findItem(cartId : string , productId : string ) : Promise<CartItem | null> {
    return this.db.cartItem.findUnique({
        where : {cartId_productId : {cartId , productId}}
    });
  }  

  async addItem(cartId : string , productId : string , quantity : number) : Promise<CartItem> {
    const existing = await this.findItem(cartId , productId);
    if (existing) {
        return this.db.cartItem.update({
            where : {id : existing.id},
            data : {quantity : existing.quantity + quantity}
        })
    }

    return this.db.cartItem.create({
        data : {cartId , productId , quantity}
    })


  }
      async updateItemQuantity(cartId:string,productId:string,quantity:number) : Promise<CartItem> {
        return this.db.cartItem.update({
            where : {cartId_productId : {cartId , productId}},
            data : {quantity},
        })
      }

      async removeItem(cartId : string ,productId : string) : Promise<CartItem> {
        return this.db.cartItem.delete({
            where: {cartId_productId : {cartId , productId}}
        })
      }

      async clearCart(cartId : string) : Promise<Prisma.BatchPayload> {
    return this.db.cartItem.deleteMany({ where: { cartId } });
      }

}