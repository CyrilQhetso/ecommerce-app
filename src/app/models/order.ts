import { CartItem } from "./cart-item";

export interface Order {
    id?: number;
    userId: number;
    items: CartItem[];
    total: number;
    shippingAddress: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
    createdAt: Date;
}
