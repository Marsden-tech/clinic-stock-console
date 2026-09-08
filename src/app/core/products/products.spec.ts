import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Products } from './products';

describe('Products', () => {
  let service: Products;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Products);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // fails the test if any request went out that we didn't expect/verify
    httpMock.verify();
  });

  it('calls the plain products endpoint when no category or search is given', () => {
    service.list({ limit: 12, skip: 0 }).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === 'https://dummyjson.com/products',
    );
    expect(req.request.params.get('limit')).toBe('12');
    expect(req.request.params.get('skip')).toBe('0');

    req.flush({ products: [], total: 0, skip: 0, limit: 12 });
  });

  it('calls the category endpoint and ignores search when category is set', () => {
    service.list({ limit: 12, skip: 0, category: 'smartphones', q: 'phone' }).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === 'https://dummyjson.com/products/category/smartphones',
    );
    // category wins per our decision: search param should NOT be present at all
    expect(req.request.params.has('q')).toBe(false);

    req.flush({ products: [], total: 0, skip: 0, limit: 12 });
  });

  it('calls the search endpoint with the q param when no category is set', () => {
    service.list({ limit: 12, skip: 0, q: 'phone' }).subscribe();

    const req = httpMock.expectOne(
      (request) => request.url === 'https://dummyjson.com/products/search',
    );
    expect(req.request.params.get('q')).toBe('phone');

    req.flush({ products: [], total: 0, skip: 0, limit: 12 });
  });
});