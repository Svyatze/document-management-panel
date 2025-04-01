import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { DocumentService } from '../../../../core/services';
import { DocumentModel, DocumentStatus } from '../../../../models';

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
    MatSnackBarModule
  ],
  templateUrl: './document-form.component.html',
  styleUrl: './document-form.component.scss'
})
export class DocumentFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  public documentForm!: FormGroup;
  public isEditMode = signal(false);
  public loading = signal(false);
  public selectedFile = signal<File | null>(null);
  public currentDocument = signal<DocumentModel | null>(null);
  public errorMessage = signal<string | null>(null);

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
      name: ['', [Validators.required]]
    });
  }

  private loadDocument(id: string): void {
    this.loading.set(true);

    this.documentService.getDocumentById(id).subscribe({
      next: (document) => {
        this.currentDocument.set(document);
        this.documentForm.patchValue({
          name: document.name
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

  public onSubmit(asDraft: boolean): void {
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

  private createDocument(asDraft: boolean): void {
    if (!this.selectedFile()) {
      this.errorMessage.set('Please select a file');
      this.loading.set(false);

      return;
    }

    const status = asDraft ? DocumentStatus.DRAFT : DocumentStatus.READY_FOR_REVIEW;
    const name = this.documentForm.get('name')?.value;

    this.documentService.createDocument({
      name,
      status,
      file: this.selectedFile()!
    }).subscribe({
      next: () => {
        const message = asDraft
          ? 'Document saved as draft'
          : 'Document submitted for review';
        this.snackBar.open(message, 'Close', { duration: 3000 });

        void this.router.navigate(['/dashboard/documents']);
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
    }).subscribe({
      next: () => {
        this.snackBar.open('Document updated successfully', 'Close', { duration: 3000 });
        void this.router.navigate(['/dashboard/documents']);
      },
      error: (error) => {
        console.error('Error updating document:', error);

        this.errorMessage.set('Failed to update document');
        this.loading.set(false);
      }
    });
  }

  public removeFile(): void {
    this.selectedFile.set(null);
  }

  public cancelEdit(): void {
    void this.router.navigate(['/dashboard/documents']);
  }
}
