import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService, NotificationService, PdfViewerService } from '../../../../core/services';
import { DialogService } from '../../../../shared/services';
import { DocumentModel, DocumentStatus, UserRole } from '../../../../models';
import { DocumentService } from '../../services';
import { DocumentStatusPipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    DocumentStatusPipe,
  ],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.scss'
})
export class DocumentViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;

  private documentService = inject(DocumentService);
  private pdfViewerService = inject(PdfViewerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  public document = signal<DocumentModel | null>(null);
  public loading = signal(true);
  public error = signal<string | null>(null);
  public documentId: string | null = null;

  public currentUser = this.authService.currentUser;
  public isReviewer = computed(() => this.currentUser()?.role === UserRole.REVIEWER);

  public DocumentStatus = DocumentStatus;

  public canEditDocument = computed(() => {
    if (!this.document() || !this.currentUser()) return false;

    return !this.isReviewer() &&
      [DocumentStatus.DRAFT, DocumentStatus.REVOKE, DocumentStatus.DECLINED].includes(this.document()!.status as DocumentStatus);
  });

  public canDeleteDocument = computed(() => {
    if (!this.document() || !this.currentUser()) return false;

    return !this.isReviewer() &&
      [DocumentStatus.DRAFT, DocumentStatus.REVOKE].includes(this.document()!.status as DocumentStatus);
  });

  public canRevokeDocument = computed(() => {
    if (!this.document() || !this.currentUser()) return false;

    return !this.isReviewer() &&
      this.document()!.status === DocumentStatus.READY_FOR_REVIEW;
  });

  public canChangeDocumentStatus = computed(() => {
    if (!this.document()) return false;

    return this.isReviewer() && this.document()!.status !== DocumentStatus.DRAFT;
  });

  public canChangeToUnderReview = computed(() => {
    if (!this.document()) return false;

    return this.isReviewer() && this.document()!.status === DocumentStatus.READY_FOR_REVIEW;
  });

  public canApproveDocument = computed(() => {
    if (!this.document()) return false;

    return this.isReviewer() && this.document()!.status === DocumentStatus.UNDER_REVIEW;
  });

  public canDeclineDocument = computed(() => {
    if (!this.document()) return false;

    return this.isReviewer() && this.document()!.status === DocumentStatus.UNDER_REVIEW;
  });

  public ngOnInit(): void {
    this.documentId = this.route.snapshot.paramMap.get('id');
    if (this.documentId) {
      this.loadDocument(this.documentId);
    } else {
      this.error.set('Document ID not provided');
      this.loading.set(false);
    }
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.document() && this.pdfContainer) {
        this.initPSPDFKit();
      }
    });
  }

  public ngOnDestroy(): void {
    this.pdfViewerService.unloadDocument();
  }

  public editDocument(): void {
    if (!this.document()) return;

    void this.router.navigate(['/dashboard/documents', this.document()!.id, 'edit']);
  }

  public deleteDocument(): void {
    if (!this.document()) return;

    this.dialogService.confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${this.document()!.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      color: 'warn'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
      if (confirmed) {
        this.loading.set(true);

        this.documentService.deleteDocument(this.document()!.id!)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
          next: () => {
            this.notification.success('Document deleted successfully');

            void this.router.navigate(['/dashboard/documents']);
          },
          error: (error) => {
            console.error('Error deleting document:', error);
            this.error.set('Failed to delete document');
            this.loading.set(false);
          }
        });
      }
    });
  }

  public revokeDocument(): void {
    if (!this.document()) return;

    this.dialogService.confirm({
      title: 'Revoke Document',
      message: `Are you sure you want to revoke "${this.document()!.name}" from review?`,
      confirmText: 'Revoke',
      cancelText: 'Cancel'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
      if (confirmed) {
        this.loading.set(true);

        this.documentService.revokeReview(this.document()!.id!)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
          next: (updatedDocument) => {
            this.document.set(updatedDocument);
            this.loading.set(false);
            this.notification.success('Document revoked successfully');
          },
          error: (error) => {
            console.error('Error revoking document:', error);

            this.error.set('Failed to revoke document');
            this.loading.set(false);
          }
        });
      }
    });
  }

  public updateStatus(status: DocumentStatus): void {
    if (!this.document()) return;

    this.loading.set(true);

    this.documentService.changeStatus(this.document()!.id!, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (updatedDocument) => {
        this.document.set(updatedDocument);

        let statusMessage;
        switch (status) {
          case DocumentStatus.UNDER_REVIEW:
            statusMessage = 'under review';
            break;
          case DocumentStatus.APPROVED:
            statusMessage = 'approved';
            break;
          case DocumentStatus.DECLINED:
            statusMessage = 'declined';
            break;
          default:
            statusMessage = 'updated';
        }

        this.notification.success(`Document status set to ${statusMessage}`);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error updating document status:', error);

        this.error.set('Failed to update document status');
        this.loading.set(false);
      }
    });
  }

  public getStatusClass(status: DocumentStatus): string {
    switch (status) {
      case DocumentStatus.DRAFT:
        return 'status-draft';
      case DocumentStatus.READY_FOR_REVIEW:
        return 'status-ready_for_review';
      case DocumentStatus.UNDER_REVIEW:
        return 'status-in_review';
      case DocumentStatus.APPROVED:
        return 'status-approved';
      case DocumentStatus.DECLINED:
        return 'status-rejected';
      case DocumentStatus.REVOKE:
        return 'status-revoke';
      default:
        return '';
    }
  }

  private loadDocument(id: string): void {
    this.documentService.getDocumentById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (document) => {
          this.document.set(document);
          this.loading.set(false);

          if (this.pdfContainer) {
            setTimeout(() => this.initPSPDFKit(), 0);
          }
        },
        error: (error) => {
          console.error('Error loading document:', error);

          this.error.set('Failed to load document');
          this.loading.set(false);
        }
      });
  }

  private initPSPDFKit(): void {
    if (!this.document() || !this.document()?.fileUrl) {
      return;
    }

    this.loading.set(true);

    this.pdfViewerService.loadDocument(
      this.pdfContainer.nativeElement,
      this.document()!.fileUrl
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error initializing PSPDFKit:', error);

          this.error.set('Failed to load PDF viewer');
          this.loading.set(false);
        }
      });
  }
}
