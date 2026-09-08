import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  thumbnail: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}

export interface ProductQuery {
  limit: number;
  skip: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  q?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class Products {
  private readonly baseUrl = 'https://dummyjson.com/products';

  constructor(private http: HttpClient) {}

  list(query: ProductQuery): Observable<ProductsResponse> {
    let params = new HttpParams().set('limit', query.limit).set('skip', query.skip);

    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy).set('order', query.order ?? 'asc');
    }

    if (query.category) {
      // category uses a different path shape than plain listing
      return this.http.get<ProductsResponse>(`${this.baseUrl}/category/${query.category}`, {
        params,
      });
    }

    if (query.q) {
      return this.http.get<ProductsResponse>(`${this.baseUrl}/search`, {
        params: params.set('q', query.q),
      });
    }

    return this.http.get<ProductsResponse>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  updateStock(id: string, stock: number): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, { stock });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }
}
