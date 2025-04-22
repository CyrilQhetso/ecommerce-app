import { Component, OnInit } from '@angular/core';
import { Product } from '../../../models/product';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../services/product/product.service';
import { CartService } from '../../../services/cart/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {

  product: Product | undefined;
  quantity = 1;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
      this.getProduct();

      this.route.params.subscribe(params => {
        const id = params['id'];
        this.productService.productList$.subscribe(products => {
          const product = products.find(p => p.id === id);
          if (product) {
            this.product = product;
          } else {
            this.productService.getProduct(id).subscribe(prod => this.product = prod);
          }
        });
      });
  }

  getProduct(): void {
    const id: string =  this.route.snapshot.paramMap.get('id')!;
    if (!id) {
      this.error = true;
      this.loading = false;
    }
    this.productService.getProduct(id)
      .subscribe({
        next: (product) => {
          this.product = product;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching product: ', err);
          this.loading = false;
          this.error = true;
        }
      });
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.product) {
      // Call addToCart method many items based on quantity
      for (let i = 0; i < this.quantity; i++) {
        this.cartService.addToCart(this.product);
      }

      this.snackBar.open(`${this.quantity} ${this.product.name} added to cart`, 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });

      // Reset quantity
      this.quantity = 1;
    }
  }
}
