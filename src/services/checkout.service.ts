import { prisma } from "../lib/prisma.js";
import type { CartRepository } from "../repository/cart.repository.js";
import type { OrderRepository } from "../repository/order.repository.js";
import type { ProductRepository } from "../repository/product.repository.js";
import type { InventoryLogRepository } from "../repository/inventoryLog.repository.js";
import { ConflictError, NotFoundError } from "../utils/error.js";
import { OrderResponseContract } from "../contracts/order.contract.js";
import { cacheKeys } from "../utils/cacheKeys.js";
import { redis } from "../lib/redis.js";

const MAX_RETRIES = 3;

export class CheckOutService {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
    private readonly orders: OrderRepository,
    private readonly inventoryLogs: InventoryLogRepository,
  ) {}

  async checkOut(userId: string): Promise<OrderResponseContract> {
    const cart = await this.carts.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new NotFoundError("Cart \ Items not found.");
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const order = await prisma.$transaction(async (tx) => {
          const orderItems: {
            productId: string;
            quantity: number;
            priceAtPurchase: number;
          }[] = [];
          let totalPrice = 0;

          for (const item of cart.items) {
            const currentProduct = await tx.product.findUniqueOrThrow({
              where: { id: item.productId },
            });

            if (currentProduct.stock < item.quantity) {
              throw new ConflictError(
                `Insufficient stock for ${currentProduct.name}`,
              );
            }

            const previousStock = currentProduct.stock;

            const updatedProduct =
              await this.products.decrementStockWithVersion(
                tx,
                item.productId,
                item.quantity,
                currentProduct.version,
              );

            await this.inventoryLogs.create(tx, {
              productId: item.productId,
              changeType: "ORDER_PLACED",
              quantityDelta: -item.quantity,
              previousStock,
              newStock: updatedProduct.stock,
            });

            const price = Number(currentProduct.price);
            totalPrice += price * item.quantity;

            orderItems.push({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: price,
            });
          }

          const createdOrder = await this.orders.createWithItems(tx, {
            userId,
            totalPrice,
            items: orderItems,
          });

          const confirmedOrder = await this.orders.updateStatus(
            tx,
            createdOrder.id,
            "CONFIRMED",
          );
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

          return confirmedOrder;
        });

        await this.invalidateProductCaches(
          cart.items.map((item) => item.productId),
        );
        return this.toResponse(order);
      } catch (err) {
        const isStockConflict =
          err instanceof Error && err.message === "STOCK_CONFLICT";
        if (isStockConflict && attempt < MAX_RETRIES - 1) {
          continue;
        }
        if (isStockConflict) {
          throw new ConflictError(
            "Insufficient stock — too many concurrent requests, please try again",
          );
        }
        throw err;
      }
    }
    throw new ConflictError("Checkout failed.");
  }

  async getUserOrders(userId: string) {
    return this.orders.findByUserId(userId);
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.orders.findById(orderId);

    if (!order || order.userId !== userId) {
      throw new NotFoundError("Order not found");
    }

    return order;
  }

  private toResponse(order: any): OrderResponseContract {
    return {
      id: order.id,
      status: order.status,
      totalPrice: Number(order.totalPrice),
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: "",
        quantity: item.quantity,
        priceAtPurchase: Number(item.priceAtPurchase),
      })),
      createdAt: order.createdAt,
    };
  }

  private async invalidateProductCaches(productIds: string[]): Promise<void> {
    const productKeys = productIds.map((id) => cacheKeys.productById(id));
    if (productKeys.length > 0) {
      await redis.del(...productKeys);
    }

    const listKeys = await redis.keys(cacheKeys.productListPattern());
    if (listKeys.length > 0) {
      await redis.del(...listKeys);
    }
  }
}
