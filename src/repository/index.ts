import {prisma} from "../lib/prisma.js";
import { UserRepository } from "./user.repository.js";
import { ProductRepository } from "./product.repository.js";
import { CartRepository } from "./cart.repository.js";
import { OrderRepository } from "./order.repository.js";
import { InventoryLogRepository } from "./inventoryLog.repository.js";


export const userRepository = new UserRepository(prisma);
export const productRepository = new ProductRepository(prisma);
export const cartRepository = new CartRepository(prisma)
export const orderRepository = new OrderRepository(prisma)
export const inventoryLogRepository = new InventoryLogRepository(prisma)

