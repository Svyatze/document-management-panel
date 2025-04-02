import {Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService, DocumentService, NotificationService } from '../../../../core/services';
import { DocumentListRequest, DocumentStatus, UserRole } from '../../../../models';


@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  public documents = this.documentService.documents;
  public totalCount = this.documentService.totalCount;
  public currentUser = this.authService.currentUser;

  public loading = signal(false);
  public currentStatus = signal<string | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(20);
  public pageIndex = computed(() => this.currentPage() - 1);

  public sortField = signal<string | null>(null);
  public sortDirection = signal<'asc' | 'desc'>('asc');

  public isReviewer = computed(() => this.authService.currentUser()?.role === UserRole.REVIEWER);

  public DocumentStatus = DocumentStatus;

  public readonly displayedColumns = computed(() => {
    const columns = ['name', 'status', 'updatedAt'];
    if (this.isReviewer()) {
      columns.splice(1, 0, 'creator');
    }
    return columns;
  });

  public readonly statusOptions = [
    { value: null, viewValue: 'All Statuses' },
    { value: DocumentStatus.DRAFT, viewValue: 'Draft' },
    { value: DocumentStatus.READY_FOR_REVIEW, viewValue: 'Ready For Review' },
    { value: DocumentStatus.UNDER_REVIEW, viewValue: 'Under Review' },
    { value: DocumentStatus.APPROVED, viewValue: 'Approved' },
    { value: DocumentStatus.DECLINED, viewValue: 'Declined' },
    { value: DocumentStatus.REVOKE, viewValue: 'Revoked' }
  ];

  public ngOnInit(): void {
    this.loadDocuments();
  }

  public onStatusChange(status: string | null): void {
    this.currentStatus.set(status);
    this.currentPage.set(1);
    this.loadDocuments();
  }

  public onSortChange(sort: Sort): void {
    this.sortField.set(sort.active);
    this.sortDirection.set(sort.direction as 'asc' | 'desc');
    this.loadDocuments();
  }

  public onPageChange(event: PageEvent): void {
    const newPage = event.pageIndex + 1;

    if (newPage < 1) {
      return;
    }

    this.currentPage.set(newPage);
    this.pageSize.set(event.pageSize);
    this.loadDocuments();
  }

  private loadDocuments(): void {
    this.loading.set(true);

    const request: DocumentListRequest = {
      page: this.currentPage(),
      size: this.pageSize()
    };

    if (this.currentStatus()) {
      request.status = this.currentStatus()!;
    }

    if (this.sortField() && this.sortDirection()) {
      request.sort = `${this.sortField()},${this.sortDirection()}`;
    }

    this.documentService.getDocuments(request).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading documents:', error);

        this.notification.error('Failed to load documents');
        this.loading.set(false);
      }
    });
  }

  public getStatusClass(status: string): string {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'status-draft';
      case DocumentStatus.READY_FOR_REVIEW:
        return 'status-ready_for_review';
      case DocumentStatus.UNDER_REVIEW:
        return 'status-under_review';
      case DocumentStatus.APPROVED:
        return 'status-approved';
      case DocumentStatus.DECLINED:
        return 'status-declined';
      case DocumentStatus.REVOKE:
        return 'status-revoke';
      default:
        return '';
    }
  }
}
