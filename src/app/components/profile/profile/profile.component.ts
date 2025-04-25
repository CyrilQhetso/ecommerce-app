import { Component, OnInit } from '@angular/core';
import { User } from '../../../models/user';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Order } from '../../../models/order';
import { AuthService } from '../../../services/auth/auth.service';
import { UserService } from '../../../services/user/user.service';
import { OrderService } from '../../../services/order/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  currentUser: User | null = null;
  profileForm: FormGroup;
  orders: Order[] = [];
  isLoading = true;
  isEditing = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private orderService: OrderService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
      this.currentUser = this.authService.currentUserValue;

      if (this.currentUser) {
        this.profileForm.patchValue({
          name: this.currentUser.name,
          email: this.currentUser.email
        });

        this.loadUserOrders();
      }

      this.isLoading = false;

      this.route.fragment.subscribe(fragment => {
        if (fragment) {
          const element = document.getElementById(fragment);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth'});
          }
        }
      });
  }

  loadUserOrders(): void {
    if (this.currentUser?.id) {
      this.orderService.getUserOrders(this.currentUser.id.toString()).subscribe(
        orders => {
          this.orders = orders.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          this.isLoading = false;
        },
        error => {
          console.error('Error fetching orders:', error);
          this.snackBar.open('Failed to load orders. Please try again later.', 'Close', {
            duration: 3000
          });

          this.isLoading = false;
        }
      );
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (!this.isEditing && this.currentUser) {
      this.profileForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.currentUser) {
      return;
    }

    const updatedUser: User = {
      ...this.currentUser,
      name: this.profileForm.value.name,
      email: this.profileForm.value.email
    };

    this.isLoading = true;
    this.userService.updateUser(updatedUser).subscribe(
      user => {
        this.currentUser = user;

        this.authService.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));

        this.snackBar.open('Profile updated successfully!', 'Close', {
          duration: 300
        });
        this.isEditing = false;
        this.isLoading = false;
      },
      error => {
        console.error('Error updating profile:', error);
        this.snackBar.open('Failed to update profile. Please try again.', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    );
  }

  cancelOrder(orderId: string): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.isLoading =  true;

      this.orderService.cancelOrder(orderId).subscribe(() => {
        this.snackBar.open('Order cancelled!', 'Close', {
          duration: 3000
        });
        this.loadUserOrders();
      }, error => {
        console.error('Error cancelling order', error);
        this.snackBar.open('Failed to cancel order. Please try again.', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      });
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      default: return '';
    }
  }
}
