import { Meta } from '@angular/platform-browser';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';

import { Certification } from '../certifications/certification.interface';
import { CmsApiService, CertificationInput, ProjectInput } from './cms-api.service';
import { CmsAuthService } from './cms-auth.service';
import { Education } from '../education/education.interface';
import { Home } from '../home/home.interface';
import { PortfolioApiService } from '../../shared/services/portfolio-api.service';
import { Project } from '../project/project.interface';
import { ThemePreference, ThemeService } from '../../shared/services/theme.service';
import { WorkRecognition } from '../work-recognition/work-recognition.interface';

type CmsTab = 'home' | 'projects' | 'achievements' | 'media';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.css'],
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsComponent implements OnInit, OnDestroy {
  private readonly cmsApi = inject(CmsApiService);
  private readonly auth = inject(CmsAuthService);
  private readonly fb = inject(FormBuilder);
  private readonly meta = inject(Meta);
  private readonly portfolioApi = inject(PortfolioApiService);
  private readonly theme = inject(ThemeService);

  private previousRobotsContent: string | null = null;
  private selectedStandaloneMedia: File | null = null;

  readonly tabs: { id: CmsTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'media', label: 'Media' },
  ];
  readonly activeTab = signal<CmsTab>('home');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal<string | null>(null);
  readonly mediaUploadUrl = signal<string | null>(null);
  readonly principal = this.auth.principal;
  readonly themeOptions = this.theme.options;
  readonly themePreference = this.theme.preference;

  readonly homeForm = this.fb.nonNullable.group({
    id: [''],
    title: ['', Validators.required],
    content: ['', Validators.required],
  });

  readonly projectsArray = this.fb.array<FormGroup>([]);
  readonly certificationsArray = this.fb.array<FormGroup>([]);

  readonly educationForm = this.fb.nonNullable.group({
    id: [''],
    json: ['', Validators.required],
  });

  readonly recognitionForm = this.fb.nonNullable.group({
    id: [''],
    json: ['', Validators.required],
  });

  readonly mediaForm = this.fb.nonNullable.group({
    category: ['projects', Validators.required],
  });

  ngOnInit(): void {
    this.theme.activateCmsTheme();
    this.previousRobotsContent =
      this.meta.getTag('name="robots"')?.content ?? null;
    this.meta.updateTag({
      name: 'robots',
      content: 'noindex,nofollow,noarchive',
    });
    this.loadContent();
  }

  ngOnDestroy(): void {
    this.theme.deactivateCmsTheme();
    if (this.previousRobotsContent) {
      this.meta.updateTag({
        name: 'robots',
        content: this.previousRobotsContent,
      });
      return;
    }

    this.meta.removeTag('name="robots"');
  }

  setActiveTab(tab: CmsTab): void {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  saveHome(): void {
    if (this.homeForm.invalid) {
      this.showError('Home title and content are required.');
      return;
    }

    const id = this.homeForm.controls.id.value;
    if (!id) {
      this.showError('Home content id is missing.');
      return;
    }

    this.saving.set(true);
    this.cmsApi
      .updateHome(id, {
        title: this.homeForm.controls.title.value,
        content: this.homeForm.controls.content.value,
      })
      .subscribe({
        next: (home) => {
          this.homeForm.patchValue(home);
          this.portfolioApi.clearCache('home');
          this.showStatus('Home content saved.');
        },
        error: () => this.showError('Failed to save home content.'),
      });
  }

  addProject(): void {
    this.projectsArray.push(
      this.createProjectGroup({
        id: '',
        component: 'project',
        order: this.projectsArray.length + 1,
        title: '',
        description: '',
        codeLink: '',
      })
    );
  }

  saveProjects(): void {
    if (this.projectsArray.invalid) {
      this.projectsArray.markAllAsTouched();
      this.showError('Every project needs a title, description, and code link.');
      return;
    }

    const requests = this.projectsArray.controls.map((control) => {
      const group = this.asGroup(control);
      const id = this.stringValue(group, 'id');
      const payload = this.projectInput(group);
      return id
        ? this.cmsApi.updateProject(id, payload)
        : this.cmsApi.createProject(payload);
    });

    this.saving.set(true);
    (requests.length ? forkJoin(requests) : of<Project[]>([])).subscribe({
      next: (projects) => {
        if (projects.length) {
          this.setProjects(projects);
        }
        this.portfolioApi.clearCache('project');
        this.showStatus('Projects saved.');
      },
      error: () => this.showError('Failed to save projects.'),
    });
  }

  deleteProject(index: number): void {
    const group = this.asGroup(this.projectsArray.at(index));
    const id = this.stringValue(group, 'id');
    const remove = (): void => {
      this.projectsArray.removeAt(index);
      this.portfolioApi.clearCache('project');
      this.showStatus('Project removed.');
    };

    if (!id) {
      remove();
      return;
    }

    this.saving.set(true);
    this.cmsApi.deleteProject(id).subscribe({
      next: remove,
      error: () => this.showError('Failed to delete project.'),
    });
  }

  saveEducation(): void {
    const id = this.educationForm.controls.id.value;
    const education = this.parseJson<Education>(
      this.educationForm.controls.json.value,
      'education'
    );
    if (!id || !education) {
      return;
    }

    this.saving.set(true);
    this.cmsApi.updateEducation(id, education).subscribe({
      next: (saved) => {
        this.educationForm.patchValue({
          id: saved.id,
          json: this.formatJson(saved),
        });
        this.portfolioApi.clearCache('education');
        this.showStatus('Education saved.');
      },
      error: () => this.showError('Failed to save education.'),
    });
  }

  addCertification(): void {
    this.certificationsArray.push(
      this.createCertificationGroup({
        id: '',
        component: 'certification',
        title: '',
        description: '',
        earned: '',
      })
    );
  }

  saveCertifications(): void {
    if (this.certificationsArray.invalid) {
      this.certificationsArray.markAllAsTouched();
      this.showError(
        'Every certification needs a title, description, and earned date.'
      );
      return;
    }

    const requests = this.certificationsArray.controls.map((control) => {
      const group = this.asGroup(control);
      const id = this.stringValue(group, 'id');
      const payload = this.certificationInput(group);
      return id
        ? this.cmsApi.updateCertification(id, payload)
        : this.cmsApi.createCertification(payload);
    });

    this.saving.set(true);
    (requests.length ? forkJoin(requests) : of<Certification[]>([])).subscribe({
      next: (certifications) => {
        if (certifications.length) {
          this.setCertifications(certifications);
        }
        this.portfolioApi.clearCache('certification');
        this.showStatus('Certifications saved.');
      },
      error: () => this.showError('Failed to save certifications.'),
    });
  }

  deleteCertification(index: number): void {
    const group = this.asGroup(this.certificationsArray.at(index));
    const id = this.stringValue(group, 'id');
    const remove = (): void => {
      this.certificationsArray.removeAt(index);
      this.portfolioApi.clearCache('certification');
      this.showStatus('Certification removed.');
    };

    if (!id) {
      remove();
      return;
    }

    this.saving.set(true);
    this.cmsApi.deleteCertification(id).subscribe({
      next: remove,
      error: () => this.showError('Failed to delete certification.'),
    });
  }

  saveRecognition(): void {
    const id = this.recognitionForm.controls.id.value;
    const recognition = this.parseJson<WorkRecognition>(
      this.recognitionForm.controls.json.value,
      'work recognition'
    );
    if (!id || !recognition) {
      return;
    }

    this.saving.set(true);
    this.cmsApi.updateRecognition(id, recognition).subscribe({
      next: (saved) => {
        this.recognitionForm.patchValue({
          id: saved.id,
          json: this.formatJson(saved),
        });
        this.portfolioApi.clearCache('recognition');
        this.showStatus('Work recognition saved.');
      },
      error: () => this.showError('Failed to save work recognition.'),
    });
  }

  uploadProjectMedia(
    event: Event,
    control: AbstractControl,
    targetControlName: 'imageSrc' | 'videoSrc'
  ): void {
    const file = this.fileFromEvent(event);
    if (!file) {
      return;
    }

    this.saving.set(true);
    this.cmsApi.uploadMedia(file, 'projects').subscribe({
      next: (result) => {
        this.asGroup(control).get(targetControlName)?.setValue(result.url);
        this.showStatus('Project media uploaded.');
      },
      error: () => this.showError('Failed to upload project media.'),
    });
  }

  uploadRecognitionMedia(): void {
    this.uploadStandaloneMedia();
  }

  uploadStandaloneMedia(category = this.mediaForm.controls.category.value): void {
    if (!this.selectedStandaloneMedia || this.mediaForm.invalid) {
      this.showError('Choose a media file first.');
      return;
    }

    this.saving.set(true);
    this.cmsApi
      .uploadMedia(
        this.selectedStandaloneMedia,
        category
      )
      .subscribe({
        next: (result) => {
          this.mediaUploadUrl.set(result.url);
          this.showStatus('Media uploaded.');
        },
        error: () => this.showError('Failed to upload media.'),
      });
  }

  setStandaloneMedia(event: Event): void {
    this.selectedStandaloneMedia = this.fileFromEvent(event);
    this.mediaUploadUrl.set(null);
  }

  asGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  trackControl(index: number): number {
    return index;
  }

  signOut(): void {
    this.auth.signOut();
  }

  setThemePreference(event: Event): void {
    const preference = (event.target as HTMLSelectElement)
      .value as ThemePreference;
    this.theme.setPreference(preference);
  }

  private loadContent(): void {
    this.loading.set(true);
    this.clearMessages();

    forkJoin({
      home: this.cmsApi.getComponent<Home>('home'),
      projects: this.cmsApi.getComponent<Project>('project'),
      education: this.cmsApi.getComponent<Education>('education'),
      certifications: this.cmsApi.getComponent<Certification>('certification'),
      recognition: this.cmsApi.getComponent<WorkRecognition>('recognition'),
    })
      .subscribe({
        next: (content) => {
          this.setHome(content.home[0]);
          this.setProjects(content.projects);
          this.setEducation(content.education[0]);
          this.setCertifications(content.certifications);
          this.setRecognition(content.recognition[0]);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.showError('Failed to load CMS content.');
        },
      });
  }

  private setHome(home: Home | undefined): void {
    if (!home) {
      return;
    }

    this.homeForm.patchValue(home);
  }

  private setProjects(projects: Project[]): void {
    this.projectsArray.clear();
    projects
      .toSorted((a, b) => a.order - b.order)
      .forEach((project) => this.projectsArray.push(this.createProjectGroup(project)));
  }

  private setEducation(education: Education | undefined): void {
    if (!education) {
      return;
    }

    this.educationForm.patchValue({
      id: education.id,
      json: this.formatJson(education),
    });
  }

  private setCertifications(certifications: Certification[]): void {
    this.certificationsArray.clear();
    certifications
      .toSorted(
        (a, b) => new Date(b.earned).getTime() - new Date(a.earned).getTime()
      )
      .forEach((certification) =>
        this.certificationsArray.push(
          this.createCertificationGroup(certification)
        )
      );
  }

  private setRecognition(recognition: WorkRecognition | undefined): void {
    if (!recognition) {
      return;
    }

    this.recognitionForm.patchValue({
      id: recognition.id,
      json: this.formatJson(recognition),
    });
  }

  private createProjectGroup(project: Project): FormGroup {
    return this.fb.nonNullable.group({
      id: [project.id],
      order: [project.order, Validators.required],
      title: [project.title, Validators.required],
      description: [project.description, Validators.required],
      imageSrc: [project.imageSrc ?? ''],
      videoSrc: [project.videoSrc ?? ''],
      demoLink: [project.demoLink ?? ''],
      demoLinkText: [project.demoLinkText ?? ''],
      codeLink: [project.codeLink, Validators.required],
    });
  }

  private createCertificationGroup(certification: Certification): FormGroup {
    return this.fb.nonNullable.group({
      id: [certification.id],
      title: [certification.title, Validators.required],
      description: [certification.description, Validators.required],
      link: [certification.link ?? ''],
      earned: [certification.earned, Validators.required],
      expires: [certification.expires ?? ''],
    });
  }

  private projectInput(group: FormGroup): ProjectInput {
    return {
      order: Number(group.get('order')?.value ?? 0),
      title: this.stringValue(group, 'title'),
      description: this.stringValue(group, 'description'),
      imageSrc: this.optionalStringValue(group, 'imageSrc'),
      videoSrc: this.optionalStringValue(group, 'videoSrc'),
      demoLink: this.optionalStringValue(group, 'demoLink'),
      demoLinkText: this.optionalStringValue(group, 'demoLinkText'),
      codeLink: this.stringValue(group, 'codeLink'),
    };
  }

  private certificationInput(group: FormGroup): CertificationInput {
    return {
      title: this.stringValue(group, 'title'),
      description: this.stringValue(group, 'description'),
      link: this.optionalStringValue(group, 'link'),
      earned: this.stringValue(group, 'earned'),
      expires: this.optionalStringValue(group, 'expires'),
    };
  }

  private parseJson<T>(json: string, label: string): T | null {
    try {
      return JSON.parse(json) as T;
    } catch {
      this.showError(`Invalid ${label} JSON.`);
      return null;
    }
  }

  private formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  private stringValue(group: FormGroup, controlName: string): string {
    return String(group.get(controlName)?.value ?? '').trim();
  }

  private optionalStringValue(
    group: FormGroup,
    controlName: string
  ): string | null {
    const value = this.stringValue(group, controlName);
    return value ? value : null;
  }

  private fileFromEvent(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    return input.files?.[0] ?? null;
  }

  private clearMessages(): void {
    this.error.set(null);
    this.status.set(null);
  }

  private showError(message: string): void {
    this.saving.set(false);
    this.status.set(null);
    this.error.set(message);
  }

  private showStatus(message: string): void {
    this.saving.set(false);
    this.error.set(null);
    this.status.set(message);
  }
}
