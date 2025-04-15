import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, tap } from 'rxjs';
import { User } from '../../models/user';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000';
  public currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.get<User[]>(`${this.apiUrl}/users?email=${email}`).pipe(
      map(users => {
        const user = users[0];
        if (user && user.password === password) {
          const token = this.generateToken(user);
          const userWithoutPassword = { ...user };
          delete userWithoutPassword.password;
          
          // Store user details and token in local storage
          localStorage.setItem('token', token);
          localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          
          this.currentUserSubject.next(userWithoutPassword);
          return { user: userWithoutPassword, token };
        }
        throw new Error('Invalid credentials');
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  register(user: User): Observable<any> {
    return this.http.post<User>(`${this.apiUrl}/users`, user).pipe(
      tap(newUser => {
        console.log('User registered successfully', newUser);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return token !== null && !this.jwtHelper.isTokenExpired(token);
  }

  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.isAdmin === true;
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      exp: new Date().getTime() + 24 * 60 * 60 * 1000 // 24 hours
    };
    
    // Encode the payload as base64
    const encodedPayload = btoa(JSON.stringify(payload));
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.signature`;
  }
}
