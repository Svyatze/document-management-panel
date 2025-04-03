import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { DocumentViewerComponent } from './document-viewer.component';
import { DocumentModel, DocumentStatus, UserRole } from '../../../../models';
import { DocumentService } from '../../services';
import { AuthService, NotificationService, PdfViewerService } from '../../../../core/services';
import { DialogService } from '../../../../shared/services';

describe('DocumentViewerComponent', () => {
  let component: DocumentViewerComponent;
  let fixture: ComponentFixture<DocumentViewerComponent>;

  const mockDocument: DocumentModel = {
    id: '1',
    name: 'Test Document',
    status: DocumentStatus.DRAFT,
    fileUrl: 'file.pdf'
  };

  const documentServiceMock = {
    getDocumentById: jasmine.createSpy('getDocumentById').and.returnValue(of(mockDocument)),
    changeStatus: jasmine.createSpy('changeStatus').and.returnValue(of(mockDocument)),
    revokeReview: jasmine.createSpy('revokeReview').and.returnValue(of(mockDocument)),
    deleteDocument: jasmine.createSpy('deleteDocument').and.returnValue(of({}))
  };

  const pdfViewerServiceMock = {
    loadDocument: jasmine.createSpy('loadDocument').and.returnValue(of({})),
    unloadDocument: jasmine.createSpy('unloadDocument')
  };

  const mockCurrentUser = signal({
    id: '1',
    role: UserRole.USER
  });

  const authServiceMock = {
    currentUser: mockCurrentUser
  };

  const notificationServiceMock = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error')
  };

  const dialogServiceMock = {
    confirm: jasmine.createSpy('confirm').and.returnValue(of(true))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DocumentViewerComponent
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: DocumentService, useValue: documentServiceMock },
        { provide: PdfViewerService, useValue: pdfViewerServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: DialogService, useValue: dialogServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load document on init', () => {
    component.ngOnInit();
    expect(documentServiceMock.getDocumentById).toHaveBeenCalledWith('1');
  });
});
