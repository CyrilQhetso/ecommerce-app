import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CartService } from '../cart/cart.service';
import { AuthService } from '../auth/auth.service';
import { ProductService } from '../product/product.service';
import { catchError, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { Order } from '../../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private apiUrl = 'http://localhost:3000/orders';

  constructor(
    private http: HttpClient,
    private cartService: CartService,
    private authService: AuthService,
    private productService: ProductService
  ) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl).pipe(
      tap(_ => console.log('Fetched orders')),
      catchError(this.handleError<Order[]>('getOrders', []))
    );
  }
  
  getUserOrders(userId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}?userId=${userId}`).pipe(
      tap(_ => console.log(`Fetched orders for user id=${userId}`)),
      catchError(this.handleError<Order[]>('getUserOrders', []))
    );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`).pipe(
      tap(_ => console.log(`Fetched order id=${id}`)),
      catchError(this.handleError<Order>(`getOrder id=${id}`))
    );
  }

  createOrder(shippingAddress: string): Observable<Order> {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      throw new Error('User must be logged in to create an order');
    }

    const cartItems = this.cartService.getCartItems();
    const total = this.cartService.getCartTotal();

    const newOrder: Order = {
      userId: currentUser.id!,
      items: cartItems,
      total: total,
      shippingAddress: shippingAddress,
      status: 'pending',
      createdAt: new Date()
    };

    return this.http.post<Order>(this.apiUrl, newOrder).pipe(
      tap((order: Order) => {
        console.log(`Created order w/ id=${order.id}`);
        this.cartService.clearCart();
      }),
      catchError(this.handleError<Order>('createOrder'))
    );
  }

  updateOrderStatus(id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, { status }).pipe(
      tap(_ => {
          console.log(`Updated order id=${id} status to ${status}`);
          if (status === 'delivered') {
            this.updateStockForOrder(id);
          }
      }),
      catchError(this.handleError<any>(`updatedOrderStatus`))
    );
  }

  updateStockForOrder(orderId: string): void {
    this.getOrder(orderId).pipe(
      switchMap(order => {
        if (!order || !order.items || order.items.length === 0) {
          console.error('Cannot update stock: Invalid or no items found');
          return of(null);
        }
  
        // Create an array of update observables
        const updateObservables = order.items.map(item =>
          this.productService.getProduct(item.productId.toString()).pipe(
            switchMap(product => {
              if (!product) {
                console.error(`Product with ID ${item.productId} not found`);
                return of(null);
              }
              
              const newStock = Math.max(0, product.stock - item.quantity);
              const updatedProduct = { ...product, stock: newStock };
              
              return this.productService.updateProduct(updatedProduct).pipe(
                tap(() => console.log(`Updated stock for product: ${product.id}, new stock: ${newStock}`))
              );
            })
          )
        );
  
        // Execute all updates in parallel
        return forkJoin(updateObservables).pipe(
          tap(() => this.productService.refreshProductList())
        );
      })
    ).subscribe();
  }

  
cancelOrder(orderId: string): Observable<void> {
     return this.http.delete<void>(`${this.apiUrl}/${orderId}`).pipe(
       tap(_ => console.log(`Cancelled order id=${orderId}`)),
       catchError(this.handleError<void>('cancelOrder'))
     );
   }
  

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
