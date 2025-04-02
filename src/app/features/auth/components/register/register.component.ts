import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { RegisterUserRequest, UserRole } from '../../../../models';
import { UserService } from '../../../../core/services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  public registerForm: FormGroup;
  public isLoading = false;
  public registerError = '';
  public roles = [
    { value: UserRole.USER, viewValue: 'User' },
    { value: UserRole.REVIEWER, viewValue: 'Reviewer' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: ['', [Validators.required]],
      role: [UserRole.USER, [Validators.required]]
    });
  }

  public onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.registerError = '';

    const registerRequest: RegisterUserRequest = {
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value,
      fullName: this.registerForm.get('fullName')?.value,
      role: this.registerForm.get('role')?.value
    };

    this.userService.registerUser(registerRequest).subscribe({
      next: () => {
        void this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.registerError = 'Registration failed. Please try again.';
        console.error(error);
      }
    });
  }
}
