import { Component, OnInit } from '@angular/core';
import { Product } from '../../../models/product';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product/product.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-management',
  standalone: false,
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.scss'
})
export class ProductManagementComponent implements OnInit {

  products: Product[] = [];
  displayedColumns: string[] = ['id', 'image', 'name', 'category', 'price', 'stock', 'actions'];
  dataSource = new MatTableDataSource<Product>();
  productForm: FormGroup;
  isEditing = false;
  selectedProduct: Product | null = null;
  categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Beauty', 'Sport', 'Other'];

  constructor(
    private productService: ProductService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.createProductForm();
  }

  ngOnInit(): void {
      this.loadProducts();

      this.productService.refreshProductList();
      this.productService.productList$.subscribe(products => {
        this.products = products;
        this.dataSource.data = [...products];
      })
  }

  createProductForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      imageUrl: ['', [Validators.required]],
      category: ['', [Validators.required]],
      stock: [0, [Validators.required, Validators.min(0)]],
      featured: [false]
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
      this.dataSource.data = this.products;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    const product: Product = this.productForm.value;

    if (this.isEditing && this.selectedProduct) {
      product.id = this.selectedProduct.id;
      this.updateProduct(product);
    } else {
      this.addProduct(product);
    }
  }

  addProduct(product: Product): void {
    this.productService.addProduct(product).subscribe(
      newProduct => {
        this.products.push(newProduct);
        this.dataSource.data = [...this.products];
        this.resetForm();
        this.snackBar.open('Product added successfully', 'Close', {
          duration: 3000
        });
      },
      error => {
        this.snackBar.open(`Error adding product: ${error.message}`, 'Close', {
          duration: 5000
        });
      }
    );
  }

  updateProduct(product: Product): void {
    this.productService.updateProduct(product).subscribe(
      () => {
        const index = this.products.findIndex(p => p.id === product.id);
        if (index !== -1) {
          this.products[index] = { ...product };
          this.dataSource.data = [...this.products];
        }
        this.resetForm();
        this.snackBar.open('Product updated successfully', 'Close', {
          duration: 3000
        });
      },
      error => {
        this.snackBar.open(`Error upding product: ${error.message}`, 'Close', {
          duration: 5000
        });
      }
    );
  }

  editProduct(product: Product): void {
    this.isEditing = true;
    this.selectedProduct = product;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      stock: product.stock,
      featured: product.featured || false
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id.toString()).subscribe(
        () => {
          this.products = this.products.filter(p => p.id !== id);
          this.dataSource.data = [...this.products];
          this.snackBar.open('Product deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error => {
          this.snackBar.open(`Error deleting product: ${error.message}`, 'Close', {
            duration: 5000
          });
        }
      );
    }
  }

  resetForm(): void {
    this.productForm.reset({
      price: 0,
      stock: 0,
      featured: false
    });
    this.isEditing = false;
    this.selectedProduct = null;
  }
}
