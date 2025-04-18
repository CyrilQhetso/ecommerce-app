import { Component, OnInit } from '@angular/core';
import { Product } from '../../../models/product';
import { FormControl } from '@angular/forms';
import { ProductService } from '../../../services/product/product.service';
import { CartService } from '../../../services/cart/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  searchControl = new FormControl('');
  categoryFilter = new FormControl('all');
  categories: string[] = [];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
      this.loadProducts();

      this.searchControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(value => {
        this.filterProducts(value || '', this.categoryFilter.value || 'all');
      });

      // Category filter
      this.categoryFilter.valueChanges.subscribe(category => {
        this.filterProducts(this.searchControl.value || '', category || 'all');
      });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products;
        this.filteredProducts = [...products];
        this.extractCategories();
        this.loading = false;
      },
      error: error => {
        console.error ('Error loading products', error);
        this.loading = false;
      }
    });
  }

  extractCategories(): void {
    const categorySet = new Set<string>();
    this.products.forEach(product => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    this.categories = Array.from(categorySet);
  }

  filterProducts(searchTerm: string, category: string): void {
    let filtered = this.products;

    // Category filter
    if (category && category !== 'all') {
      filtered = filtered.filter(product => product.category === category);
    }

    // Search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(lowerSearchTerm) ||
        product.description.toLowerCase().includes(lowerSearchTerm)
      );
    }

    this.filteredProducts = filtered;
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
    this.snackBar.open(`${product.name} added to cart`, 'Close', {
      duration: 3000
    });
  }
}
