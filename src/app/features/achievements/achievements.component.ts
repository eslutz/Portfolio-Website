import { Component, OnInit, OnDestroy } from '@angular/core';
import { Certification } from '../certifications/certification.interface';
import { Education } from '../education/education.interface';
import { WorkRecognition } from '../work-recognition/work-recognition.interface';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';
import { Subject, finalize, map, takeUntil } from 'rxjs';

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css'],
  standalone: false,
})
export class AchievementsComponent implements OnInit, OnDestroy {
  education: Education | null = null;
  certifications: Certification[] = [];
  recognition: WorkRecognition | null = null;

  loadingStates = {
    education: true,
    certifications: true,
    recognition: true
  };

  errors = {
    education: null as string | null,
    certifications: null as string | null,
    recognition: null as string | null
  };

  private destroy$ = new Subject<void>();

  constructor(private portfolioApi: PortfolioApiService) {}

  ngOnInit(): void {
    this.loadEducation();
    this.loadCertifications();
    this.loadRecognition();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEducation(): void {
    this.portfolioApi.getComponentData<Education>('education').pipe(
      map(([educationData]) => ({
        ...educationData,
        degrees: educationData.degrees.sort((a, b) => b.graduationYear - a.graduationYear)
      })),
      takeUntil(this.destroy$),
      finalize(() => this.loadingStates.education = false)
    ).subscribe({
      next: (data) => this.education = data,
      error: (error) => {
        console.error('Error fetching education data:', error);
        this.errors.education = 'Failed to load education';
      }
    });
  }

  private loadCertifications(): void {
    this.portfolioApi.getComponentData<Certification>('certification').pipe(
      map(certs => certs.sort((a, b) => new Date(b.earned).getTime() - new Date(a.earned).getTime())),
      takeUntil(this.destroy$),
      finalize(() => this.loadingStates.certifications = false)
    ).subscribe({
      next: (data) => this.certifications = data,
      error: (error) => {
        console.error('Error fetching certifications data:', error);
        this.errors.certifications = 'Failed to load certifications';
      }
    });
  }

  private loadRecognition(): void {
    this.portfolioApi.getComponentData<WorkRecognition>('recognition').pipe(
      map(([recognitionData]) => {
        recognitionData.companies.forEach(company => {
          company.recognition.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
        });
        return recognitionData;
      }),
      takeUntil(this.destroy$),
      finalize(() => this.loadingStates.recognition = false)
    ).subscribe({
      next: (data) => this.recognition = data,
      error: (error) => {
        console.error('Error fetching recognition data:', error);
        this.errors.recognition = 'Failed to load recognition';
      }
    });
  }
}
