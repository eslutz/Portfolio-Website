import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of } from 'rxjs';

import { Certification } from '../certifications/certification.interface';
import { CertificationsComponent } from '../certifications/certifications.component';
import { Education } from '../education/education.interface';
import { EducationComponent } from '../education/education.component';
import { WorkRecognition } from '../work-recognition/work-recognition.interface';
import { WorkRecognitionComponent } from '../work-recognition/work-recognition.component';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';

interface SectionState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  imports: [EducationComponent, CertificationsComponent, WorkRecognitionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsComponent {
  private readonly portfolioApi = inject(PortfolioApiService);

  readonly educationState = toSignal(
    this.toSectionState(
      this.portfolioApi.getComponentData<Education>('education').pipe(
        map(([education]): Education | null => {
          if (!education) {
            return null;
          }
          return {
            ...education,
            degrees: education.degrees.toSorted(
              (a, b) => b.graduationYear - a.graduationYear
            ),
          };
        })
      ),
      'education'
    ),
    { initialValue: this.loadingState<Education>() }
  );

  readonly certificationsState = toSignal(
    this.toSectionState(
      this.portfolioApi.getComponentData<Certification>('certification').pipe(
        map((certifications): Certification[] | null => {
          if (certifications.length === 0) {
            return null;
          }
          return certifications.toSorted(
            (a, b) =>
              new Date(b.earned).getTime() - new Date(a.earned).getTime()
          );
        })
      ),
      'certifications'
    ),
    { initialValue: this.loadingState<Certification[]>() }
  );

  readonly recognitionState = toSignal(
    this.toSectionState(
      this.portfolioApi.getComponentData<WorkRecognition>('recognition').pipe(
        map(([recognition]): WorkRecognition | null => {
          if (!recognition) {
            return null;
          }
          return {
            ...recognition,
            companies: recognition.companies.map((company) => ({
              ...company,
              recognition: company.recognition.toSorted((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              }),
            })),
          };
        })
      ),
      'recognition'
    ),
    { initialValue: this.loadingState<WorkRecognition>() }
  );

  private toSectionState<T>(
    data$: Observable<T | null>,
    section: string
  ): Observable<SectionState<T>> {
    return data$.pipe(
      map((data): SectionState<T> => {
        if (data === null) {
          return {
            loading: false,
            error: `No ${section} content found`,
            data: null,
          };
        }
        return { loading: false, error: null, data };
      }),
      catchError(() =>
        of<SectionState<T>>({
          loading: false,
          error: `Failed to load ${section}`,
          data: null,
        })
      )
    );
  }

  private loadingState<T>(): SectionState<T> {
    return { loading: true, error: null, data: null };
  }
}
