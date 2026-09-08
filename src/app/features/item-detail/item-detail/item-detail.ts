import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Products, Product } from '../../../core/products/products';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
    CurrencyPipe,
  ],
  templateUrl: './item-detail.html',
  styleUrl: './item-detail.scss',
})
export class ItemDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private productsService = inject(Products);

  product = signal<Product | null>(null);
  isLoading = signal(true);
  loadError = signal<string | null>(null);

  isEditing = signal(false);
  isSaving = signal(false);
  saveError = signal<string | null>(null);

  stockControl = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(0),
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError.set('No item id provided.');
      this.isLoading.set(false);
      return;
    }
    this.fetchProduct(id);
  }

  private fetchProduct(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.productsService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load this item.');
        this.isLoading.set(false);
      },
    });
  }

  onRetryLoad(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchProduct(id);
    }
  }

  startEdit(): void {
    this.stockControl.setValue(this.product()?.stock ?? 0);
    this.saveError.set(null);
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.saveError.set(null);
  }

  onSave(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || this.stockControl.invalid || this.stockControl.value === null) {
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);
    const newStock = this.stockControl.value;

    this.productsService.updateStock(id, newStock).subscribe({
      next: (updatedProduct) => {
        // update from the actual server response, not the raw form value —
        // consistent with "wait for the real response" decision
        this.product.set(updatedProduct);
        this.isSaving.set(false);
        this.isEditing.set(false);
      },
      error: () => {
        // form stays open, typed value stays in stockControl untouched, retry available
        this.isSaving.set(false);
        this.saveError.set('Save failed. Your changes were not saved.');
      },
    });
  }
}