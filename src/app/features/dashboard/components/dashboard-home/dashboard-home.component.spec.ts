import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { signal, WritableSignal } from '@angular/core';

import { DashboardHomeComponent } from './dashboard-home.component';
import {User, UserRole} from '../../../../models';
import {AuthService} from '../../../../core/services';

describe('DashboardHomeComponent', () => {
  let component: DashboardHomeComponent;
  let fixture: ComponentFixture<DashboardHomeComponent>;
  let debugElement: DebugElement;

  let mockCurrentUser: WritableSignal<User | null>;
  let authServiceMock: any;

  beforeEach(async () => {
    mockCurrentUser = signal<User | null>({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      role: UserRole.USER
    } as User);

    authServiceMock = {
      logout: jasmine.createSpy('logout'),
      currentUser: mockCurrentUser,
      isAuthenticated: signal(true)
    };

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DashboardHomeComponent
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHomeComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call logout service when logout is clicked', () => {
    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalled();
  });

  it('should calculate isReviewer correctly based on user role', () => {
    expect(component.isReviewer()).toBeFalse();

    mockCurrentUser.set({
      ...mockCurrentUser()!,
      role: UserRole.REVIEWER
    });
    fixture.detectChanges();

    expect(component.isReviewer()).toBeTrue();
  });
});
