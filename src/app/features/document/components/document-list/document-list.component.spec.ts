import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { DocumentListComponent } from './document-list.component';

import { DocumentStatus, UserRole } from '../../../../models';
import { DocumentService } from '../../services';
import { AuthService, NotificationService } from '../../../../core/services';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;
  let documentServiceMock: any;
  let notificationServiceMock: any;

  const mockCurrentUser = signal({
    id: '123',
    role: UserRole.USER
  });

  const authServiceMock = {
    currentUser: mockCurrentUser,
    isAuthenticated: () => true
  };

  beforeEach(async () => {
    documentServiceMock = {
      documents: signal([]),
      totalCount: signal(0),
      getDocuments: jasmine.createSpy('getDocuments').and.returnValue(
        of({ results: [], count: 0 })
      )
    };

    notificationServiceMock = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error')
    };

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DocumentListComponent
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: DocumentService, useValue: documentServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load documents on init', () => {
    expect(documentServiceMock.getDocuments).toHaveBeenCalled();
  });

  it('should show correct status options based on user role', () => {
    expect(mockCurrentUser().role).toBe(UserRole.USER);

    const userStatusOptions = component.statusOptions();

    const hasDraftForUser = userStatusOptions.some(option =>
      option.value === DocumentStatus.DRAFT
    );
    expect(hasDraftForUser).toBeTrue();

    mockCurrentUser.set({
      id: '123',
      role: UserRole.REVIEWER
    });

    component.ngOnInit();
    fixture.detectChanges();

    const reviewerStatusOptions = component.statusOptions();

    const hasDraftForReviewer = reviewerStatusOptions.some(option =>
      option.value === DocumentStatus.DRAFT
    );
    expect(hasDraftForReviewer).toBeFalse();
  });
});
