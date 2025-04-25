import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../../models/cart-item';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../../services/cart/cart.service';
import { OrderService } from '../../../services/order/order.service';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {

  cartItems: CartItem[] = [];
  cartTotal = 0;
  checkoutForm: FormGroup;
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      paymentMethod: ['credit', [Validators.required]],
      cardName: ['', [Validators.required]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expMonth: ['', [Validators.required, Validators.pattern(/^\d{2}$/)]],
      expYear: ['', [Validators.required, Validators.pattern(/^\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    
    // Populate email from current user
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.checkoutForm.patchValue({
        email: currentUser.email,
        fullName: currentUser.name
      });
    }
    
    // Get cart items
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      
      if (this.cartItems.length === 0) {
        this.router.navigate(['/cart']);
      }
    });
    
    this.cartService.cartTotal$.subscribe(total => {
      this.cartTotal = total;
    });
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      // Mark all fields touched to trigger validation messages
      Object.keys(this.checkoutForm.controls).forEach(key => {
        const control = this.checkoutForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.submitting = true;
    
    const shippingAddress = `
      ${this.checkoutForm.value.fullName},
      ${this.checkoutForm.value.address},
      ${this.checkoutForm.value.city},
      ${this.checkoutForm.value.state} ${this.checkoutForm.value.zipCode},
      Phone: ${this.checkoutForm.value.phone}
    `;
    
    this.orderService.createOrder(shippingAddress)
      .subscribe({
        next: (order) => {
          this.submitting = false;
          this.snackBar.open('Order placed successfully!', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          
          this.router.navigate(['/orders']);
        },
        error: (error) => {
          this.submitting = false;
          console.error('Error creating order:', error);
          this.snackBar.open('Failed to place order. Please try again.', 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
  }
}
