import { Component, OnInit } from '@angular/core';
import { Order } from '../../../models/order';
import { MatTableDataSource } from '@angular/material/table';
import { User } from '../../../models/user';
import { OrderService } from '../../../services/order/order.service';
import { UserService } from '../../../services/user/user.service';
import { ProductService } from '../../../services/product/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-order-management',
  standalone: false,
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.scss'
})
export class OrderManagementComponent implements OnInit {

  orders: Order[] = [];
  displayedColumns: string[] = ['id', 'userId', 'userName', 'items', 'total', 'status', 'date', 'actions'];
  dataSource = new MatTableDataSource<Order>();
  users: Map<number, User> = new Map();
  statusOptions: ('pending'| 'processing' | 'shipped' | 'delivered')[] = ['pending', 'processing' , 'shipped', 'delivered'];

  constructor(
    private orderService: OrderService,
    private userService: UserService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
      this.loadOrders();
      this.loadUsers();
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe(orders => {
      this.orders = orders;
      this.dataSource.data = this.orders;
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(users => {
      users.forEach(user => {
        this.users.set(user.id!, user)
      });
    });
  }

  getUserName(userId: number): string {
    const user = this.users.get(userId);
    return user ? user.name: `User #${userId}`;
  }

  updateStatus(order: Order, newStatus: 'pending' | 'processing' | 'shipped' | 'delivered'): void {
    this.orderService.updateOrderStatus(order.id!.toString(), newStatus).subscribe(
      () => {
        const index = this.orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          this.orders[index].status = newStatus;
          this.dataSource.data = [...this.orders];
        }

        if (newStatus === 'delivered') {
          this.productService.refreshProductList();
        }
        this.snackBar.open(`Order #${order.id} status updated to ${newStatus}`, 'Close', {
          duration: 3000
        });
      },
      error => {
        this.snackBar.open(`Error updating order status: ${newStatus}`, 'Close', {
          duration: 5000
        });
      }
    );
  }

  getTotalRevenue(): number {
    return this.orders.reduce((sum, order) => sum + order.total, 0);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
