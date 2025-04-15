import { Injectable } from '@angular/core';
import { CartItem } from '../../models/cart-item';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../../models/product';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems: CartItem[] = [];
  private cartItemSubject =  new BehaviorSubject<CartItem[]>([]);
  private cartTotalSubject = new BehaviorSubject<number>(0);

  cartItems$ = this.cartItemSubject.asObservable();
  cartTotal$ = this.cartTotalSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  addToCart(product: Product): void {
    const existingItem = this.cartItems.find(
      item => item.productId === product.id
    );

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
      }
    } else {
      this.cartItems.push({
        id: this.generateItemId(),
        productId: product.id!,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        stock: product.stock
      });
    }
    this.updateCart();
  }

  removeFromCart(itemId: number): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.updateCart();
  }

  updateQuantity(itemId: number, quantity: number): void {
    const item = this.cartItems.find(item => item.id === itemId);
    if (item) {
      if (quantity <= item.stock) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
          this.removeFromCart(itemId);
        } else {
          this.updateCart();
        }
      } else {
        console.warn('Cannot exceed stock limit');
      }
    }
  }

  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  getCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  private updateCart(): void {
    this.cartItemSubject.next([...this.cartItems]);
    this.cartTotalSubject.next(this.getCartTotal());
    this.saveCart();
  }

  private saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
    this.cartItemSubject.next([...this.cartItems]);
  }

  private loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        this.cartItems = JSON.parse(savedCart);
        this.updateCart();
      } catch (e) {
        console.log('Error parsing cart from localStorage:', e);
        this.cartItems = [];
        this.cartItemSubject.next([]);
      }
    }
  }

  private generateItemId(): number {
    return Math.floor(Math.random() * 1000000);
  }
}
