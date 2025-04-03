import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {provideRouter, Router} from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

import { LoginComponent } from './login.component';
import {AuthService} from '../../../../core/services';
import { LoginResponse, User, UserRole } from '../../../../models';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'loadUserInfo']);
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authServiceMock.login.and.returnValue(of({ access_token: 'fake-token' } as LoginResponse));
    authServiceMock.loadUserInfo.and.returnValue(of({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      role: UserRole.USER
    } as User));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        LoginComponent
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the login form', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')).toBeDefined();
    expect(component.loginForm.get('password')).toBeDefined();
  });

  describe('Form Validation', () => {
    it('should validate email is required', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();

      expect(emailControl?.valid).toBeFalse();
      expect(emailControl?.hasError('required')).toBeTrue();
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();

      expect(emailControl?.valid).toBeFalse();
      expect(emailControl?.hasError('email')).toBeTrue();
    });

    it('should validate password is required', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();

      expect(passwordControl?.valid).toBeFalse();
      expect(passwordControl?.hasError('required')).toBeTrue();
    });

    it('should have a valid form with correct inputs', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(component.loginForm.valid).toBeTrue();
    });
  });

  describe('Login Process', () => {
    it('should not submit if form is invalid', () => {
      component.onSubmit();

      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should call login service with correct credentials', () => {
      const testCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      component.loginForm.setValue(testCredentials);
      component.onSubmit();

      expect(authServiceMock.login).toHaveBeenCalledWith(testCredentials);
    });


    it('should navigate to dashboard after successful login', () => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });

      component.onSubmit();

      expect(authServiceMock.loadUserInfo).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should display error message on login failure', () => {
      authServiceMock.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'wrong-password'
      });

      component.onSubmit();

      expect(component.loginError).toBeTruthy();
      expect(component.isLoading).toBeFalse();
    });

    it('should display error message on user info loading failure', () => {
      authServiceMock.loadUserInfo.and.returnValue(throwError(() => new Error('Failed to load user')));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });

      component.onSubmit();

      expect(component.loginError).toBeTruthy();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('UI Elements', () => {
    it('should render form fields and submit button', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('input[formControlName="email"]')).toBeTruthy();
      expect(compiled.querySelector('input[formControlName="password"]')).toBeTruthy();
      expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

      expect(submitButton.disabled).toBeTrue();

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });
      fixture.detectChanges();

      expect(submitButton.disabled).toBeFalse();
    });

    it('should show error message when login fails', () => {
      authServiceMock.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'wrong-password'
      });

      component.onSubmit();
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Invalid email or password');
    });
  });
});
