import { Component, OnInit } from '@angular/core';
import { Order } from '../../../models/order';
import { Product } from '../../../models/product';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product/product.service';
import { UserService } from '../../../services/user/user.service';
import { OrderService } from '../../../services/order/order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {

  totalProducts = 0;
  totalOrders = 0;
  totalUsers = 0;
  totalRevenue = 0;
  
  // Recent data
  recentOrders: Order[] = [];
  lowStockProducts: Product[] = [];
  
  isLoading = true;
  activeLink = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private productService: ProductService,
    private orderService: OrderService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    
    // Determine active link based on current route
    this.setActiveLink();

    this.loadDashboardData();
  }

  setActiveLink(): void {
    const url = this.router.url;
    if (url.includes('/admin/products')) {
      this.activeLink = 'products';
    } else if (url.includes('/admin/orders')) {
      this.activeLink = 'orders';
    } else {
      this.activeLink = 'dashboard';
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Get all products
    this.productService.getProducts().subscribe(
      products => {
        this.totalProducts = products.length;
        this.lowStockProducts = products
          .filter(p => p.stock < 5)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5);
      },
      error => console.error('Error loading products:', error)
    );
    
    // Get all orders
    this.orderService.getOrders().subscribe(
      orders => {
        this.totalOrders = orders.length;
        this.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        this.recentOrders = orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        this.isLoading = false;
      },
      error => {
        console.error('Error loading orders:', error);
        this.isLoading = false;
      }
    );
    
    // Get all users
    this.userService.getUsers().subscribe(
      users => {
        this.totalUsers = users.filter(u => !u.isAdmin).length;
      },
      error => console.error('Error loading users:', error)
    );
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

  navigateToProductManagement(): void {
    this.router.navigate(['/admin/products']);
  }

  navigateToOrderManagement(): void {
    this.router.navigate(['/admin/orders']);
  }
}
