import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NotificationService } from '../../../../core/services';
import { DialogService } from '../../../../shared/services';
import { DocumentModel, DocumentStatus } from '../../../../models';
import { DocumentService } from '../../services';


@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  templateUrl: './document-form.component.html',
  styleUrl: './document-form.component.scss'
})
export class DocumentFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private dialogService = inject(DialogService);
  private destroyRef = inject(DestroyRef);

  public documentForm!: FormGroup;
  public isEditMode = signal(false);
  public loading = signal(false);
  public selectedFile = signal<File | null>(null);
  public currentDocument = signal<DocumentModel | null>(null);
  public errorMessage = signal<string | null>(null);
  public DocumentStatus = DocumentStatus;

  public ngOnInit(): void {
    this.initForm();

    const documentId = this.route.snapshot.paramMap.get('id');
    if (documentId) {
      this.isEditMode.set(true);
      this.loadDocument(documentId);
    }
  }

  private initForm(): void {
    this.documentForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      status: [''],
    });
  }

  private loadDocument(id: string): void {
    this.loading.set(true);

    this.documentService.getDocumentById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (document) => {
        this.currentDocument.set(document);
        this.documentForm.patchValue({
          name: document.name,
          status: document.status
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading document:', error);

        this.errorMessage.set('Failed to load document');
        this.loading.set(false);
      }
    });
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);

      if (!this.isEditMode()) {
        const fileName = input.files[0].name;
        const nameWithoutExtension = fileName.substr(0, fileName.lastIndexOf('.')) || fileName;
        this.documentForm.patchValue({
          name: nameWithoutExtension
        });
      }
    }
  }

  public onSubmit(asDraft: boolean = false): void {
    if (this.documentForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    if (this.isEditMode()) {
      this.updateDocument();
    } else {
      this.createDocument(asDraft);
    }
  }

  public submitForReview(): void {
    if (!this.currentDocument() || this.documentForm.invalid) {
      return;
    }

    this.dialogService.confirm({
      title: 'Submit for Review',
      message: 'Are you sure you want to submit this document for review?',
      confirmText: 'Submit',
      cancelText: 'Cancel'
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
      if (confirmed) {
        this.loading.set(true);

        const currentName = this.documentForm.get('name')?.value;
        const hasNameChanged = currentName !== this.currentDocument()!.name;

        const saveChanges$ = hasNameChanged ?
          this.documentService.updateDocument({
            id: this.currentDocument()!.id!,
            name: currentName
          }) :
          of(this.currentDocument());

        saveChanges$.pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap(doc => this.documentService.sendToReview(doc!.id!))
        ).subscribe({
          next: () => {
            this.notification.success('Document submitted for review');

            void this.router.navigate(['/dashboard/documents']);
          },
          error: (error) => {
            console.error('Error submitting document:', error);

            this.errorMessage.set('Failed to submit document for review');
            this.loading.set(false);
          }
        });
      }
    });
  }

  private createDocument(asDraft: boolean): void {
    if (!this.selectedFile()) {
      this.errorMessage.set('Please select a file');
      this.loading.set(false);
      return;
    }

    const name = this.documentForm.get('name')?.value;

    this.documentService.createDocument({
      name,
      status: DocumentStatus.DRAFT,
      file: this.selectedFile()!
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (document) => {
        if (!asDraft) {
          this.documentService.sendToReview(document.id!)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
            next: () => {
              this.notification.success('Document submitted for review');

              void this.router.navigate(['/dashboard/documents']);
            },
            error: (error) => {
              console.error('Error submitting document for review:', error);

              this.notification.error('Document created but could not be submitted for review');
              void this.router.navigate(['/dashboard/documents']);
            }
          });
        } else {
          this.notification.success('Document saved as draft');
          void this.router.navigate(['/dashboard/documents']);
        }
      },
      error: (error) => {
        console.error('Error creating document:', error);

        this.errorMessage.set('Failed to create document');
        this.loading.set(false);
      }
    });
  }

  private updateDocument(): void {
    if (!this.currentDocument()) {
      return;
    }

    const name = this.documentForm.get('name')?.value;

    this.documentService.updateDocument({
      id: this.currentDocument()!.id!,
      name
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.notification.success('Document updated successfully');

        void this.router.navigate(['/dashboard/documents']);
      },
      error: (error) => {
        console.error('Error updating document:', error);
        this.errorMessage.set('Failed to update document');
        this.loading.set(false);
      }
    });
  }

  public canSubmitForReview(): boolean {
    return this.isEditMode() &&
      this.currentDocument() !== null &&
      this.currentDocument()!.status === DocumentStatus.DRAFT;
  }

  public removeFile(): void {
    this.selectedFile.set(null);
  }

  public cancelEdit(): void {
    void this.router.navigate(['/dashboard/documents']);
  }
}
