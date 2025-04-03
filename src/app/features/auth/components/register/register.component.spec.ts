import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';

import { RegisterComponent } from './register.component';
import { UserService } from '../../../../core/services';
import { User, UserRole } from '../../../../models';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let userServiceMock: jasmine.SpyObj<UserService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    userServiceMock = jasmine.createSpyObj<UserService>('UserService', ['registerUser']);
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);

    userServiceMock.registerUser.and.returnValue(of({
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      role: UserRole.USER
    } as User));

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        RegisterComponent
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the registration form', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('email')).toBeDefined();
    expect(component.registerForm.get('password')).toBeDefined();
    expect(component.registerForm.get('fullName')).toBeDefined();
    expect(component.registerForm.get('role')).toBeDefined();

    expect(component.registerForm.get('role')?.value).toBe(UserRole.USER);
  });

  describe('Form Validation', () => {
    it('should validate email is required', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();

      expect(emailControl?.valid).toBeFalse();
      expect(emailControl?.hasError('required')).toBeTrue();
    });

    it('should validate email format', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();

      expect(emailControl?.valid).toBeFalse();
      expect(emailControl?.hasError('email')).toBeTrue();
    });

    it('should validate password is required', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();

      expect(passwordControl?.valid).toBeFalse();
      expect(passwordControl?.hasError('required')).toBeTrue();
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('short');
      passwordControl?.markAsTouched();

      expect(passwordControl?.valid).toBeFalse();
      expect(passwordControl?.hasError('minlength')).toBeTrue();
    });

    it('should validate full name is required', () => {
      const fullNameControl = component.registerForm.get('fullName');
      fullNameControl?.setValue('');
      fullNameControl?.markAsTouched();

      expect(fullNameControl?.valid).toBeFalse();
      expect(fullNameControl?.hasError('required')).toBeTrue();
    });

    it('should validate role is required', () => {
      const roleControl = component.registerForm.get('role');
      roleControl?.setValue(null);
      roleControl?.markAsTouched();

      expect(roleControl?.valid).toBeFalse();
      expect(roleControl?.hasError('required')).toBeTrue();
    });

    it('should have a valid form with correct inputs', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.USER
      });

      expect(component.registerForm.valid).toBeTrue();
    });
  });

  describe('Registration Process', () => {
    it('should not submit if form is invalid', () => {
      component.onSubmit();

      expect(userServiceMock.registerUser).not.toHaveBeenCalled();
    });

    it('should call registerUser service with correct data', () => {
      const testRegistration = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.USER
      };

      component.registerForm.setValue(testRegistration);
      component.onSubmit();

      expect(userServiceMock.registerUser).toHaveBeenCalledWith(testRegistration);
    });

    it('should navigate to login page after successful registration', () => {
      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.USER
      });

      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should display error message on registration failure', () => {
      userServiceMock.registerUser.and.returnValue(throwError(() => new Error('Registration failed')));

      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.USER
      });

      component.onSubmit();

      expect(component.registerError).toBeTruthy();
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('UI Elements', () => {
    it('should render form fields and submit button', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('input[formControlName="email"]')).toBeTruthy();
      expect(compiled.querySelector('input[formControlName="password"]')).toBeTruthy();
      expect(compiled.querySelector('input[formControlName="fullName"]')).toBeTruthy();
      expect(compiled.querySelector('mat-select[formControlName="role"]')).toBeTruthy();
      expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

      expect(submitButton.disabled).toBeTrue();

      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.USER
      });
      fixture.detectChanges();

      expect(submitButton.disabled).toBeFalse();
    });

    it('should show error message when registration fails', () => {
      userServiceMock.registerUser.and.returnValue(throwError(() => new Error('Registration failed')));

      component.registerForm.setValue({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.USER
      });

      component.onSubmit();
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Registration failed');
    });

    it('should show role selection options', () => {
      const selectElement = fixture.nativeElement.querySelector('mat-select');
      selectElement.click();
      fixture.detectChanges();

      const roleOptions = component.roles;

      const optionElements = document.querySelectorAll('mat-option');
      expect(optionElements.length).toBe(roleOptions.length);
    });
  });
});
