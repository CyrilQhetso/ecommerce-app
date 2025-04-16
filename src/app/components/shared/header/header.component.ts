import { Component, OnInit } from '@angular/core';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth/auth.service';
import { CartService } from '../../../services/cart/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  currentUser: User | null = null;
  isAdmin = false;
  isLoggedIn = false;
  cartItemCount = 0;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
      this.authService.currentUser.subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !user;
        this.isAdmin = user?.isAdmin || false;

      });

      this.cartService.cartItems$.subscribe(items => {
        this.cartItemCount = items.reduce((count, item) => count + item.quantity, 0);
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  gotToProfile(): void {
    this.authService.isLoggedIn();
    this.router.navigate(['/profile']);
  }
}
