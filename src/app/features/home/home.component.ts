import { Component, OnInit, OnDestroy } from '@angular/core';
import { Home } from './home.interface';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';
import { Subject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false,
})
export class HomeComponent implements OnInit, OnDestroy {
  home: Home | null = null;
  isLoading: boolean = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private portfolioApi: PortfolioApiService) {}

  ngOnInit(): void {
    this.portfolioApi.getComponentData<Home>('home').pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ([homeData]) => this.home = homeData,
      error: (error) => {
        console.error('Error fetching home data:', error);
        this.error = 'Failed to load home content';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
