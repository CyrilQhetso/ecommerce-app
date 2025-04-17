import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UserService } from '../../../services/user/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  registerForm!: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/']);
        return;
      }

      this.registerForm = this.formBuilder.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      }, {
        validator: this.checkPasswords
      });
  }

  get f() { return this.registerForm.controls; }

  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword =  group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notMatching: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    const user = {
      name: this.f['name'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      isAdmin: false
    };

    this.userService.userExists(user.email).subscribe({
      next: exists => {
        if (exists) {
          this.snackbar.open('User with this email already exists.', 'Close', {
            duration: 3000
          });
          this.loading = false;
        } else {
          this.authService.register(user)
            .subscribe({
              next: () => {
                this.snackbar.open('Registration successful! Please login.', 'Close', {
                  duration: 3000
                });
                this.router.navigate(['/login']);
              },
              error: error => {
                this.snackbar.open('Registration failed: ' + error.message, 'Close', {
                  duration: 5000
                });
                this.loading = false;
              }
            });
        }
      },
      error: error => {
        this.snackbar.open('Error checking user existence: ' + error.message, 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }
}
