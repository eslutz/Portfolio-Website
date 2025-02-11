import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { Footer } from './footer.interface';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  standalone: false
})
export class FooterComponent implements OnInit, OnDestroy {
  footer: Footer | null = null;
  currentYear: number = new Date().getFullYear();
  isLoading: boolean = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private portfolioApi: PortfolioApiService) {}

  ngOnInit(): void {
    this.portfolioApi.getComponentData<Footer>('footer').pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: ([footerData]) => this.footer = footerData,
      error: (error) => {
        console.error('Error fetching footer data:', error);
        this.error = 'Failed to load footer content';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
