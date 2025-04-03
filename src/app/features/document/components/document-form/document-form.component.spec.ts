import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { DocumentFormComponent } from './document-form.component';
import {DocumentService} from '../../services';
import { NotificationService } from '../../../../core/services';
import { DialogService } from '../../../../shared/services';
import { DocumentModel, DocumentStatus } from '../../../../models';
import {provideHttpClient} from '@angular/common/http';

describe('DocumentFormComponent', () => {
  let component: DocumentFormComponent;
  let fixture: ComponentFixture<DocumentFormComponent>;

  let documentServiceMock: jasmine.SpyObj<Pick<DocumentService, 'getDocumentById' | 'createDocument' | 'updateDocument' | 'sendToReview'>>;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;
  let dialogServiceMock: jasmine.SpyObj<DialogService>;
  let routerMock: jasmine.SpyObj<Router>;
  let activatedRouteMock: any;

  const sampleDocument: DocumentModel = {
    id: '1',
    name: 'Test Document',
    status: DocumentStatus.DRAFT,
    fileUrl: 'file.pdf'
  };

  const mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

  beforeEach(async () => {
    documentServiceMock = jasmine.createSpyObj<DocumentService>('DocumentService', [
      'getDocumentById', 'createDocument', 'updateDocument', 'sendToReview'
    ]);
    documentServiceMock.getDocumentById.and.returnValue(of(sampleDocument));
    documentServiceMock.createDocument.and.returnValue(of(sampleDocument));
    documentServiceMock.updateDocument.and.returnValue(of(sampleDocument));
    documentServiceMock.sendToReview.and.returnValue(of({...sampleDocument, status: DocumentStatus.READY_FOR_REVIEW}));

    notificationServiceMock = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);

    dialogServiceMock = jasmine.createSpyObj<DialogService>('DialogService', ['confirm']);
    dialogServiceMock.confirm.and.returnValue(of(true));

    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);

    activatedRouteMock = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        NoopAnimationsModule,
        DocumentFormComponent,
      ],
      providers: [
        provideHttpClient(),
        { provide: DocumentService, useValue: documentServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: DialogService, useValue: dialogServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values in create mode', () => {
    expect(component.isEditMode()).toBeFalse();
    expect(component.selectedFile()).toBeNull();
    expect(component.documentForm.get('name')?.value).toBe('');
  });

  describe('Edit mode', () => {
    beforeEach(() => {
      activatedRouteMock.snapshot.paramMap.get.and.returnValue('1');

      fixture = TestBed.createComponent(DocumentFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should load document data in edit mode', () => {
      expect(component.isEditMode()).toBeTrue();
      expect(documentServiceMock.getDocumentById).toHaveBeenCalledWith('1');
      expect(component.documentForm.get('name')?.value).toBe('Test Document');
      expect(component.currentDocument()).toEqual(sampleDocument);
    });

    it('should handle document loading error', () => {
      documentServiceMock.getDocumentById.and.returnValue(throwError(() => new Error('Test error')));

      (component as any).loadDocument('1');

      expect(component.errorMessage()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });

    it('should update document when form is submitted', () => {
      component.documentForm.get('name')?.setValue('Updated Document Name');

      component.onSubmit();

      expect(documentServiceMock.updateDocument).toHaveBeenCalledWith({
        id: '1',
        name: 'Updated Document Name'
      });

      expect(notificationServiceMock.success).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard/documents']);
    });

    it('should submit document for review', () => {
      component.currentDocument.set(sampleDocument);

      component.submitForReview();

      expect(dialogServiceMock.confirm).toHaveBeenCalled();

      expect(documentServiceMock.sendToReview).toHaveBeenCalledWith('1');

      expect(notificationServiceMock.success).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard/documents']);
    });

    it('should handle errors when submitting for review', () => {
      documentServiceMock.sendToReview.and.returnValue(throwError(() => new Error('Test error')));

      component.currentDocument.set(sampleDocument);

      component.submitForReview();

      expect(component.errorMessage()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });

    it('should show submitForReview button only for DRAFT documents', () => {
      component.currentDocument.set({ ...sampleDocument, status: DocumentStatus.DRAFT });
      expect(component.canSubmitForReview()).toBeTrue();

      component.currentDocument.set({ ...sampleDocument, status: DocumentStatus.READY_FOR_REVIEW });
      expect(component.canSubmitForReview()).toBeFalse();
    });
  });

  describe('Create mode', () => {
    it('should handle file selection', () => {
      const mockEvent = {
        target: {
          files: [mockFile]
        }
      } as unknown as Event;

      component.onFileSelected(mockEvent);

      expect(component.selectedFile()).toBe(mockFile);

      expect(component.documentForm.get('name')?.value).toBe('test');
    });

    it('should validate file is required when creating', () => {
      component.documentForm.get('name')?.setValue('New Document');
      component.selectedFile.set(null);

      component.onSubmit(true);

      expect(component.errorMessage()).toBeTruthy();
      expect(documentServiceMock.createDocument).not.toHaveBeenCalled();
    });

    it('should create document as draft', () => {
      component.documentForm.get('name')?.setValue('New Document');
      component.selectedFile.set(mockFile);

      component.onSubmit(true);

      expect(documentServiceMock.createDocument).toHaveBeenCalledWith({
        name: 'New Document',
        status: DocumentStatus.DRAFT,
        file: mockFile
      });

      expect(notificationServiceMock.success).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard/documents']);
    });

    it('should create document and submit for review', () => {
      component.documentForm.get('name')?.setValue('New Document');
      component.selectedFile.set(mockFile);

      component.onSubmit(false);

      expect(documentServiceMock.createDocument).toHaveBeenCalledWith({
        name: 'New Document',
        status: DocumentStatus.DRAFT,
        file: mockFile
      });

      expect(documentServiceMock.sendToReview).toHaveBeenCalled();

      expect(notificationServiceMock.success).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard/documents']);
    });

    it('should handle creation error', () => {
      documentServiceMock.createDocument.and.returnValue(throwError(() => new Error('Test error')));

      component.documentForm.get('name')?.setValue('New Document');
      component.selectedFile.set(mockFile);

      component.onSubmit(true);

      expect(component.errorMessage()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    });

    it('should remove selected file', () => {
      component.selectedFile.set(mockFile);

      component.removeFile();

      expect(component.selectedFile()).toBeNull();
    });
  });

  it('should navigate back when cancel clicked', () => {
    component.cancelEdit();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard/documents']);
  });
});
