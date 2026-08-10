import { prisma } from "../lib/prisma.js";
import type { ProductRepository } from "../repository/product.repository.js";
import {
  CreateProductContract,
  UpdateProductContract,
  RestockProductContract,
  ListProductsQueryContract,
  ProductResponseContract,
  PaginatedProductsResponseContract,
} from "../contracts/product.contract.js";
import { InventoryLogRepository } from "../repository/inventoryLog.repository.js";
import type { Product } from "../generated/prisma/client.js";
import { NotFoundError } from "../utils/error.js";
import { cacheKeys } from "../utils/cacheKeys.js";
import { getOrSetCache } from "../utils/cache.js";
import { redis } from "../lib/redis.js";

export class ProductService {
  constructor(
    private readonly products: ProductRepository,
    private readonly inventoryLogs: InventoryLogRepository,
  ) {}

  async create(data: CreateProductContract): Promise<ProductResponseContract> {
    const product = await this.products.create(data);
    await this.invalidateListCache();
    return this.toResponse(product);
  }

  async getById(id: string): Promise<ProductResponseContract> {
    return getOrSetCache(cacheKeys.productById(id), async () => {
      const product = await this.products.findById(id);
      if (!product) {
        throw new NotFoundError("Product Not Found.");
      }
      return this.toResponse(product);
    });
  }

  async list(
    query: ListProductsQueryContract,
  ): Promise<PaginatedProductsResponseContract> {
    const cacheKey = cacheKeys.productsList(
      query.page,
      query.limit,
      query.isActive,
    );

    return getOrSetCache<PaginatedProductsResponseContract>(
      cacheKey,
      async () => {
        const skip = (query.page - 1) * query.limit;

        const [products, total] = await Promise.all([
          this.products.findMany({
            skip,
            take: query.limit,
            isActive: query.isActive,
          }),
          this.products.count(query.isActive),
        ]);

        return {
          data: products.map((p) => this.toResponse(p)),
          meta: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
          },
        };
      },
    );
  }
  async update(
    id: string,
    data: UpdateProductContract,
  ): Promise<ProductResponseContract> {
    const existing = await this.products.findById(id);
    if (!existing) {
      throw new NotFoundError("Product not found");
    }
    const updated = await this.products.update(id, data);

    await this.invalidateProductCache(id);
    return this.toResponse(updated);
  }

  async restock(
    id: string,
    data: RestockProductContract,
  ): Promise<ProductResponseContract> {
    const existing = await this.products.findById(id);
    if (!existing) {
      throw new NotFoundError("Products not found error.");
    }

    const previousStock = existing.stock;

    const updated = await prisma.$transaction(async (tx) => {
      const product = await this.products.restock(tx, id, data.quantity);

      await this.inventoryLogs.create(tx, {
        productId: id,
        changeType: "RESTOCK",
        quantityDelta: data.quantity,
        previousStock,
        newStock: product.stock,
      });

      return product;
    });

    await this.invalidateProductCache(id);
    return this.toResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.products.findById(id);
    if (!existing) {
      throw new NotFoundError("Product not found");
    }

    await this.products.deleteById(id);
    await this.invalidateProductCache(id);
  }

  private toResponse(product: Product): ProductResponseContract {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private async invalidateProductCache(id: string): Promise<void> {
    await redis.del(cacheKeys.productById(id));
  }

  private async invalidateListCache(): Promise<void> {
    const keys = await redis.keys(cacheKeys.productListPattern());
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
  