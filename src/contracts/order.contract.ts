export interface OrderItemResponseContract{
    id : string;
    productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface OrderResponseContract {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
  totalPrice: number;
  items: OrderItemResponseContract[];
  createdAt: Date;
}