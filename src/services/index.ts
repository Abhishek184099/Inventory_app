import { userRepository , productRepository ,inventoryLogRepository, cartRepository, orderRepository } from "../repository/index.js"
import { AuthService } from "./auth.service.js"
import { CartService } from "./cart.service.js";
import { ProductService } from "./product.service.js"
import { CheckOutService } from "./checkout.service.js";
import { UserRepository } from "../repository/user.repository.js";
import { UserService } from "./user.service.js";

export const authService = new AuthService(userRepository);
export const userService = new UserService(userRepository);
export const productService = new ProductService(productRepository , inventoryLogRepository);
export const cartService = new CartService(cartRepository , productRepository );
export const checkOutService = new CheckOutService(cartRepository, productRepository , orderRepository , inventoryLogRepository);
