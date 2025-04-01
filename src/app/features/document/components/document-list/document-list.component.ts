import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDivider } from '@angular/material/divider';

import {AuthService, DocumentService, NotificationService} from '../../../../core/services';
import { DocumentListRequest, DocumentStatus, UserRole, DocumentModel } from '../../../../models';
import { DialogService } from '../../../../shared/services';


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
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatDivider
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private notification = inject(NotificationService);

  public documents = this.documentService.documents;
  public totalCount = this.documentService.totalCount;
  public loading = signal(false);
  public currentStatus = signal<string | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(10);
  public sortField = signal<string | null>(null);
  public sortDirection = signal<'asc' | 'desc'>('asc');

  public isReviewer = computed(() => this.authService.currentUser()?.role === UserRole.REVIEWER);
  public currentUser = this.authService.currentUser;

  public readonly displayedColumns = computed(() => {
    const columns = ['name', 'status', 'updatedAt'];
    if (this.isReviewer()) {
      columns.splice(1, 0, 'creator');
    }
    columns.push('actions');
    return columns;
  });

  public readonly statusOptions = [
    { value: null, viewValue: 'All Statuses' },
    { value: DocumentStatus.DRAFT, viewValue: 'Draft' },
    { value: DocumentStatus.READY_FOR_REVIEW, viewValue: 'Ready For Review' },
    { value: DocumentStatus.IN_REVIEW, viewValue: 'In Review' },
    { value: DocumentStatus.APPROVED, viewValue: 'Approved' },
    { value: DocumentStatus.REJECTED, viewValue: 'Rejected' },
    { value: DocumentStatus.REVOKED, viewValue: 'Revoked' }
  ];

  ngOnInit(): void {
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
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadDocuments();
  }

  public deleteDocument(document: DocumentModel): void {
    this.dialogService.confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${document.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      color: 'warn'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.loading.set(true);

        this.documentService.deleteDocument(document.id!).subscribe({
          next: () => {
            this.notification.success('Document deleted successfully');
            this.loadDocuments();
          },
          error: (error) => {
            console.error('Error deleting document:', error);

            this.notification.error('Failed to delete document');
            this.loading.set(false);
          }
        });
      }
    });
  }

  public revokeDocument(document: DocumentModel): void {
    this.dialogService.confirm({
      title: 'Revoke Document',
      message: `Are you sure you want to revoke "${document.name}" from review?`,
      confirmText: 'Revoke',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.loading.set(true);

        this.documentService.updateDocument({
          id: document.id!,
          status: DocumentStatus.REVOKED
        }).subscribe({
          next: () => {
            this.notification.success('Document revoked successfully');
            this.loadDocuments();
          },
          error: (error) => {
            console.error('Error revoking document:', error);

            this.notification.error('Failed to revoke document');
            this.loading.set(false);
          }
        });
      }
    });
  }

  public updateStatus(document: DocumentModel, status: DocumentStatus): void {
    let statusText = '';
    switch (status) {
      case DocumentStatus.IN_REVIEW:
        statusText = 'in review';
        break;
      case DocumentStatus.APPROVED:
        statusText = 'approved';
        break;
      case DocumentStatus.REJECTED:
        statusText = 'rejected';
        break;
    }

    this.loading.set(true);

    this.documentService.updateDocument({
      id: document.id!,
      status: status
    }).subscribe({
      next: () => {
        this.notification.success(`Document marked as ${statusText}`);
        this.loadDocuments();
      },
      error: (error) => {
        console.error('Error updating document status:', error);

        this.notification.error('Failed to update document status');
        this.loading.set(false);
      }
    });
  }

  public canEdit(document: DocumentModel): boolean {
    return !this.isReviewer() &&
      document.creator?.id === this.currentUser()?.id &&
      [DocumentStatus.DRAFT, DocumentStatus.REVOKED, DocumentStatus.REJECTED].includes(document.status as DocumentStatus);
  }

  public canDelete(document: DocumentModel): boolean {
    return !this.isReviewer() &&
      document.creator?.id === this.currentUser()?.id &&
      [DocumentStatus.DRAFT, DocumentStatus.REVOKED].includes(document.status as DocumentStatus);
  }

  public canRevoke(document: DocumentModel): boolean {
    return !this.isReviewer() &&
      document.creator?.id === this.currentUser()?.id &&
      document.status === DocumentStatus.READY_FOR_REVIEW;
  }

  public canChangeStatus(document: DocumentModel): boolean {
    return this.isReviewer() && document.status !== DocumentStatus.DRAFT;
  }

  public getStatusClass(status: string): string {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'status-draft';
      case DocumentStatus.READY_FOR_REVIEW:
        return 'status-pending';
      case DocumentStatus.IN_REVIEW:
        return 'status-review';
      case DocumentStatus.APPROVED:
        return 'status-approved';
      case DocumentStatus.REJECTED:
        return 'status-rejected';
      case DocumentStatus.REVOKED:
        return 'status-revoked';
      default:
        return '';
    }
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
        this.loading.set(false);
      }
    });
  }

  protected readonly DocumentStatus = DocumentStatus;
}
