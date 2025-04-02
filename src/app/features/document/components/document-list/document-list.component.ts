import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService, DocumentService, NotificationService, UserService } from '../../../../core/services';
import { DocumentListRequest, DocumentStatus, User, UserRole } from '../../../../models';


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
    MatInputModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  private documentService = inject(DocumentService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  public documents = this.documentService.documents;
  public totalCount = this.documentService.totalCount;

  public loading = signal(false);
  public currentStatus = signal<string | null>(null);
  public currentPage = signal(1);
  public pageSize = signal(20);
  public sortField = signal<string | null>(null);
  public sortDirection = signal<'asc' | 'desc'>('asc');
  public creatorEmail = signal<string | null>(null);

  public creatorFilterControl = new FormControl('');
  public users = signal<User[]>([]);
  public filteredUsers = signal<User[]>([]);
  public isLoadingUsers = signal(false);

  public isReviewer = computed(() => this.authService.currentUser()?.role === UserRole.REVIEWER);
  public pageIndex = computed(() => this.currentPage() - 1);

  public readonly displayedColumns = computed(() => {
    const columns = ['name', 'status', 'updatedAt'];
    if (this.isReviewer()) {
      columns.splice(1, 0, 'creator');
    }
    return columns;
  });

  public readonly statusOptions = computed(() => {
    const options = [
      { value: null, viewValue: 'All Statuses' },
      { value: DocumentStatus.READY_FOR_REVIEW, viewValue: 'Ready For Review' },
      { value: DocumentStatus.UNDER_REVIEW, viewValue: 'Under Review' },
      { value: DocumentStatus.APPROVED, viewValue: 'Approved' },
      { value: DocumentStatus.DECLINED, viewValue: 'Declined' },
      { value: DocumentStatus.REVOKE, viewValue: 'Revoked' }
    ];

    if (!this.isReviewer()) {
      options.splice(1, 0, { value: DocumentStatus.DRAFT, viewValue: 'Draft' });
    }

    return options;
  });

  public ngOnInit(): void {
    this.loadDocuments();

    if (this.isReviewer()) {
      this.loadAllUsers();
      this.setupCreatorFilter();
    }
  }

  public displayFn = (user: User | string): string => {
    if (!user) return '';

    if (typeof user === 'string') return user;

    return user.fullName ? `${user.fullName} (${user.email})` : user.email;
  };

  private setupCreatorFilter(): void {
    this.creatorFilterControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value) {
        const search = value.toLowerCase();
        this.filteredUsers.set(
          this.users().filter(user =>
            user.email.toLowerCase().includes(search) ||
            (user.fullName && user.fullName.toLowerCase().includes(search))
          ).slice(0, 10)
        );
      } else {
        this.filteredUsers.set(this.users().slice(0, 10));
      }
    });
  }

  public onUserSelected(user: User): void {
    this.creatorEmail.set(user.email);
    this.creatorFilterControl.setValue(user.email);
    this.currentPage.set(1);
    this.loadDocuments();
  }

  public clearCreatorFilter(): void {
    this.creatorFilterControl.setValue('');
    this.creatorEmail.set(null);
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

  private loadAllUsers(): void {
    this.isLoadingUsers.set(true);

    this.userService.getUsers({
      page: 1,
      size: 100
    }).subscribe({
      next: (response) => {
        this.users.set(response.results);
        this.filteredUsers.set(response.results.slice(0, 10));
        this.isLoadingUsers.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoadingUsers.set(false);
      }
    });
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

    if (this.creatorEmail() && this.isReviewer()) {
      request.creatorEmail = this.creatorEmail()!;
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
