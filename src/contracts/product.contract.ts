import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 character").max(200),
  description: z.string().max(200),
  price: z
    .number()
    .positive("price should be grater than zero")
    .multipleOf(0.01, "price can have at most 2 decimal place"),
  stock: z.number().int().nonnegative("stock cannot be negative"),
});

export type CreateProductContract = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive().multipleOf(0.01).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProductContract = z.infer<typeof updateProductSchema>;

export const restockProductSchema = z.object({
  quantity: z
    .number()
    .int()
    .positive("Restock quantity must be greater than 0"),
});

export type RestockProductContract = z.infer<typeof restockProductSchema>;

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z.coerce.boolean().optional(),
});

export type ListProductsQueryContract = z.infer<typeof listProductsQuerySchema>;

export interface ProductResponseContract {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedProductsResponseContract {
  data : ProductResponseContract[];
  meta : {
    page : number;
    limit : number;
    total : number;
    totalPages : number;
  }
}
