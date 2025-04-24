import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../../models/cart-item';
import { CartService } from '../../../services/cart/cart.service';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {

  cartItems: CartItem[] = [];
  cartTotal= 0;
  loading = true;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
      this.cartService.cartItems$.subscribe(items => {
        this.cartItems = items;
        this.loading = false;
      });

      this.cartService.cartTotal$.subscribe(total => {
        this.cartTotal = total;
      });
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.id, newQuantity);
    }
  }

  removeItem(itemId: number): void {
    this.cartService.removeFromCart(itemId);
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart();
    }
  }

  proceedToCheckout(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/checkout']);
    } else {
      localStorage.setItem('redirectAfterLogin', '/checkout');
      this.router.navigate(['/login']);
    }
  }
}
