import {
  PrismaClient,
  InventoryLog,
  InventoryChangeType,
  Prisma,
} from "../generated/prisma/client.js";

export class InventoryLogRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(
    tx: Prisma.TransactionClient,
    data: {
      productId: string;
      orderId?: string;
      changeType: InventoryChangeType;
      quantityDelta: number;
      previousStock: number;
      newStock: number;
    },
  ): Promise<InventoryLog> {
    return tx.inventoryLog.create({ data });
  }

  async findByProductId(productId: string): Promise<InventoryLog[]> {
    return this.db.inventoryLog.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
    });
  }

  async sumDeltaForProduct(productId: string): Promise<number> {
    const result = await this.db.inventoryLog.aggregate({
      where: { productId },
      _sum: { quantityDelta: true },
    });

    return result._sum.quantityDelta ?? 0;
  }
}
