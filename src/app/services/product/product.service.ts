import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap } from 'rxjs';
import { Product } from '../../models/product';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = 'http://localhost:3000/products';

  private productListSubject$ = new BehaviorSubject<Product[]>([]);
  productList$ = this.productListSubject$.asObservable();

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Product[]>(this.apiUrl, { headers }).pipe(
      tap(_ => console.log('Fetched products')),
      catchError(this.handleError<Product[]>('getProducts', []))
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      tap(_ => console.log(`Fetched product id=${id}`)),
      catchError(this.handleError<Product>(`getProduct id=${id}`))
    );
  }

  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      tap((newProduct: Product) => console.log(`Added product w/ id=${newProduct.id}`)),
      catchError(this.handleError<Product>('addProduct'))
    );
  }

  updateProduct(product: Product): Observable<any> {
    return this.http.put(`${this.apiUrl}/${product.id}`, product).pipe(
      tap(_ => {
        console.log(`Updated product id=${product.id}`);

        const currentProducts = this.productListSubject$.getValue();
        const index = currentProducts.findIndex(p => p.id === product.id);
        if (index !== -1) {
          currentProducts[index] = { ...product };
          this.productListSubject$.next([...currentProducts]);
        }
      }),
      catchError(this.handleError<any>('updateProduct'))
    );
  }

  deleteProduct(id: string): Observable<Product> {
    return this.http.delete<Product>(`${this.apiUrl}/${id}`).pipe(
      tap(_ => {
        console.log(`Deleted product id=${id}`);
        this.refreshProductList();
      }),
      catchError(this.handleError<Product>('deleteProduct'))
    );
  }

  searchProduct(term: string): Observable<Product[]> {
    if (!term.trim()) {
      return of([]);
    }

    return this.http.get<Product[]>(`${this.apiUrl}?q=${term}`).pipe(
      tap(x => x.length ?
        console.log(`Found products matching "${term}"`) :
        console.log(`No products matching "${term}"`)),
      catchError(this.handleError<Product[]>('searchProduct', []))
    );
  }

  setProductList(products: Product[]): void {
    this.productListSubject$.next(products);
  }

  refreshProductList(): void {
    this.getProducts().subscribe(products => this.setProductList(products));
  }

  updateStock(productId: number, newStock: number): Observable<any> {
    return this.getProduct(productId.toString()).pipe(
      switchMap(product => {
        if (!product) {
          throw new Error(`Product with Id ${productId} not found`);
        }

        const updatedProduct = {
          ...product,
          stock: newStock
        };

        return this.updateProduct(updatedProduct);
      })
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
