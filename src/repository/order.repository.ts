import type {PrismaClient , Order ,OrderStatus,Prisma} from "../generated/prisma/client.js";

export class OrderRepository{
    constructor(private readonly db:PrismaClient){}

    async findById(id:string) {
        return this.db.order.findUnique({
            where : {id},
            include : {items : true}
        })
    }
 
    async findByUserId(userId:string){
       return this.db.order.findMany({
        where : {userId},
        include : {items : true},
        orderBy : {createdAt: "desc"}
       })
    } 

    async createWithItems(
        tx : Prisma.TransactionClient,
        data : {
            userId : string,
            totalPrice : number,
            items : {productId : string ; quantity:number; priceAtPurchase : number;}[];
        }

    ) : Promise<Order>{
        return tx.order.create({
            data : {
                userId : data.userId,
                totalPrice : data.totalPrice,
                status : "PENDING",
                items : {
                    create : data.items.map((item)=>({
                        productId : item.productId,
                        quantity : item.quantity,   
                        priceAtPurchase : item.priceAtPurchase,
                    })),
                },
            },
            include : {items : true},
        })
    }

  async updateStatus(tx: Prisma.TransactionClient, orderId: string, status: OrderStatus): Promise<Order> {
    return tx.order.update({ where: { id: orderId }, data: { status }  , include : {items : true}});
  }

}
