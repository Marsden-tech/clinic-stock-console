import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  startWith,
  switchMap,
  catchError,
  of,
  Subject,
} from 'rxjs';
import { Products, Product, Category } from '../../../core/products/products';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
  ],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss',
})
export class ItemList {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(Products);

  products = signal<Product[]>([]);
  total = signal(0);
  categories = signal<Category[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  currentCategory = signal('');
  currentSortBy = signal('');
  currentPage = signal(1);

  searchControl = new FormControl('');
  pageSize = 12;

  private retryTrigger$ = new Subject<void>();

  constructor() {
    // fetch categories once, on component creation — not tied to URL changes
    this.productsService.getCategories().subscribe((categories) => {
      this.categories.set(categories);
    });

    // Two independent triggers feed this pipeline: the URL's query params
    // changing (typed search, clicked category, changed page, browser
    // back/forward, pasted link) and the manual retry button. combineLatest
    // re-emits whenever EITHER source emits, using the latest value of both.
    combineLatest([
      this.route.queryParamMap,
      this.retryTrigger$.pipe(startWith(undefined)), // startWith so combineLatest fires immediately on load, before any retry click
    ])
      .pipe(
        debounceTime(300), // wait for typing to pause before treating it as a real change
        // no distinctUntilChanged here deliberately: it would also block
        // retry-with-identical-params, which defeats the point of retry.
        // switchMap below already guarantees stale requests get cancelled,
        // so the only cost of omitting it is an occasional redundant fetch,
        // not a correctness problem.
        switchMap(([params]) => {
          this.isLoading.set(true);
          this.error.set(null);

          const page = Number(params.get('page') ?? 1);
          const category = params.get('category') ?? undefined;
          const q = category ? undefined : (params.get('q') ?? undefined); // category wins, per decision
          const sortBy = params.get('sortBy') ?? undefined;
          const order = (params.get('order') as 'asc' | 'desc') ?? undefined;

          // sync the search box's displayed value with the URL, without
          // re-triggering this same pipeline (that would be circular)
          this.searchControl.setValue(q ?? '', { emitEvent: false });

          // keep dropdowns/paginator in sync with the URL regardless of what
          // caused the change — our own dropdown, browser back, or a pasted link
          this.currentCategory.set(category ?? '');
          this.currentSortBy.set(sortBy ?? '');
          this.currentPage.set(page);

          return this.productsService
            .list({
              limit: this.pageSize,
              skip: (page - 1) * this.pageSize,
              category,
              q,
              sortBy,
              order,
            })
            .pipe(
              catchError(() => {
                // catchError here, not around the whole outer pipeline, is deliberate:
                // if we let the error propagate up through switchMap, the ENTIRE
                // combineLatest subscription would die on the first failed request,
                // and no future URL change or retry click could ever fetch again.
                // Catching it here means only this one inner request fails; the
                // subscription itself stays alive for the next trigger.
                this.error.set('Something went wrong loading items.');
                return of(null);
              }),
            );
        }),
      )
      .subscribe((response) => {
        this.isLoading.set(false);
        if (response) {
          this.products.set(response.products);
          this.total.set(response.total);
        }
      });

    // search box: update the URL when the user types (debounced), rather
    // than fetching directly — the pipeline above reacts to the URL change
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.updateQueryParams({ q: value || null, page: 1 });
      });
  }

  onCategoryChange(category: string): void {
    this.updateQueryParams({
      category: category || null,
      q: null, // category wins: clear search when a category is chosen
      page: 1,
    });
  }

  onSortChange(sortBy: string): void {
    this.updateQueryParams({ sortBy: sortBy || null, page: 1 });
  }

  onPageChange(event: PageEvent): void {
    this.updateQueryParams({ page: event.pageIndex + 1 });
  }

  onRetry(): void {
    this.retryTrigger$.next();
  }

  private updateQueryParams(changes: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge', // keep existing params not mentioned in `changes`
    });
  }

  get isCategoryActive(): boolean {
    return !!this.currentCategory();
  }
}
