import { CartRepository } from "../repository/cart.repository.js";
import { ProductRepository } from "../repository/product.repository.js";
import type {
  AddCartItemContract,
  UpdateCartItemContract,
  CartResponseContract,
} from "../contracts/cart.contract.js";
import { NotFoundError, ConflictError } from "../utils/error.js";

export class CartService {
  constructor(
    private readonly carts: CartRepository,
    private readonly products: ProductRepository,
  ) {}

  async getCart(userId: string): Promise<CartResponseContract> {
    const cart = await this.carts.findOrCreateForUser(userId);
    return this.toResponse(cart);
  }

  async addItem(
    userId: string,
    data: AddCartItemContract,
  ): Promise<CartResponseContract> {
    const product = await this.products.findById(data.productId);
    if (!product || !product.isActive) {
      throw new NotFoundError("Product not found");
    }
    if (product.stock < data.quantity) {
      throw new ConflictError("Not enough stock available");
    }

    const cart = await this.carts.findOrCreateForUser(userId);
    await this.carts.addItem(cart.id, data.productId, data.quantity);

    const updated = await this.carts.findByUserId(userId);
    return this.toResponse(updated!);
  }

  async updateItem(
    userId: string,
    productId: string,
    data: UpdateCartItemContract,
  ): Promise<CartResponseContract> {
    const cart = await this.carts.findByUserId(userId);
    if (!cart) {
      throw new NotFoundError("Cart Not found");
    }

    const item = await this.carts.findItem(cart.id, productId);
    if (!item) {
      throw new NotFoundError("Item not in cart");
    }

    await this.carts.updateItemQuantity(cart.id, productId, data.quantity);

    const updated = await this.carts.findByUserId(userId);
    return this.toResponse(updated!);
  }

  async removeItem(
    userId: string,
    productId: string,
  ): Promise<CartResponseContract> {
    const cart = await this.carts.findByUserId(userId);
    if (!cart) {
      throw new NotFoundError("Cart not found");
    }

    const item = await this.carts.findItem(cart.id, productId);
    if (!item) {
      throw new NotFoundError("Item not in cart");
    }

    await this.carts.removeItem(cart.id, productId);

    const updated = await this.carts.findByUserId(userId);
    return this.toResponse(updated!);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.carts.findByUserId(userId);
    if (!cart) return;
    await this.carts.clearCart(cart.id);
  }

  private toResponse(cart: {
    id: string;
    items: {
      id: string;
      productId: string;
      quantity: number;
      product: { name: string; price: any };
    }[];
  }): CartResponseContract {
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      unitPrice: Number(item.product.price),
      quantity: item.quantity,
      subtotal: Number(item.product.price) * item.quantity,
    }));

    return {
      id: cart.id,
      items,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: items.reduce((sum, i) => sum + i.subtotal, 0),
    };
  }
}
