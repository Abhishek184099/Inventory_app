import { error } from "node:console";
import {z} from "zod";

export const addCartItemSchema = z.object({
    productId : z.uuid("Invalid product Id"),
  quantity: z.number().int().positive("Quantity must be at least 1").max(999),
})

export type AddCartItemContract = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1").max(999),
});

export type UpdateCartItemContract = z.infer<typeof updateCartItemSchema>;

export const cartItemParamsSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export type CartItemParamsContract = z.infer<typeof cartItemParamsSchema>;

export interface CartItemResponseContract {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponseContract {
  id: string;
  items: CartItemResponseContract[];
  totalItems: number;
  totalPrice: number;
}
