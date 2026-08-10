import { PrismaClient, Product, Prisma } from "../generated/prisma/client.js";

export class ProductRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    return this.db.product.findUnique({
      where: { id },
    });
  }

  async findMany(params: {
    skip: number;
    take: number;
    isActive?: boolean | undefined;
  }): Promise<Product[]> {
    return this.db.product.findMany({
      where:
        params.isActive !== undefined
          ? { isActive: params.isActive }
          : undefined,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    });
  }

  async count(isActive?: boolean): Promise<number> {
    return this.db.product.count({
      where: isActive !== undefined ? { isActive } : undefined,
    });
  }

  async create(data: {
    name: string;
    description: string;
    price: number;
    stock: number;
  }): Promise<Product> {
    return this.db.product.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      isActive: boolean;
    }>,
  ): Promise<Product> {
    return this.db.product.update({ where: { id }, data });
  }

  async deleteById(id: string): Promise<Product> {
    return this.db.product.delete({ where: { id } });
  }

  async decrementStockWithVersion(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    expectedVersion: number,
  ): Promise<Product> {
    const result = await tx.product.updateMany({
      where: {
        id: productId,
        version: expectedVersion,
        stock: { gte: quantity },
      },
      data: {
        stock: { decrement: quantity },
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new Error("STOCK_CONFLICT");
    }

    return tx.product.findUniqueOrThrow({ where: { id: productId } });
  }

  async restock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
  ): Promise<Product> {
    return tx.product.update({
      where: { id: productId },
      data: {
        stock: { increment: quantity },
        version: { increment: 1 },
      },
    });
  }
}
