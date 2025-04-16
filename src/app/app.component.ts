import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'ShopSmart';
  showHeader = true;
  showFooter = true;
  isLandingPage = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        this.isLandingPage = url === '/' || url ==='/landing';

        this.showHeader = !this.isLandingPage;
        this.showFooter = !this.isLandingPage;
      });
  }
}
