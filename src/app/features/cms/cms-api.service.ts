import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Certification } from '../certifications/certification.interface';
import { Education } from '../education/education.interface';
import { Home } from '../home/home.interface';
import { Project } from '../project/project.interface';
import { WorkRecognition } from '../work-recognition/work-recognition.interface';

export interface ProjectInput {
  order: number;
  title: string;
  description: string;
  imageSrc?: string | null;
  videoSrc?: string | null;
  demoLink?: string | null;
  demoLinkText?: string | null;
  codeLink: string;
}

export interface CertificationInput {
  title: string;
  description: string;
  link?: string | null;
  earned: string;
  expires?: string | null;
}

export interface MediaUploadResult {
  url: string;
  blobName: string;
  contentType: string;
  size: number;
}

@Injectable({
  providedIn: 'root',
})
export class CmsApiService {
  private readonly apiUrl = '/api/cms';
  private readonly http = inject(HttpClient);

  getComponent<T>(component: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/components/${component}`);
  }

  updateHome(id: string, payload: Pick<Home, 'title' | 'content'>): Observable<Home> {
    return this.http.put<Home>(`${this.apiUrl}/home/${id}`, payload);
  }

  createProject(payload: ProjectInput): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, payload);
  }

  updateProject(id: string, payload: ProjectInput): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, payload);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  updateEducation(id: string, payload: Education): Observable<Education> {
    return this.http.put<Education>(`${this.apiUrl}/education/${id}`, payload);
  }

  createCertification(payload: CertificationInput): Observable<Certification> {
    return this.http.post<Certification>(`${this.apiUrl}/certifications`, payload);
  }

  updateCertification(
    id: string,
    payload: CertificationInput
  ): Observable<Certification> {
    return this.http.put<Certification>(
      `${this.apiUrl}/certifications/${id}`,
      payload
    );
  }

  deleteCertification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/certifications/${id}`);
  }

  updateRecognition(
    id: string,
    payload: WorkRecognition
  ): Observable<WorkRecognition> {
    return this.http.put<WorkRecognition>(
      `${this.apiUrl}/recognition/${id}`,
      payload
    );
  }

  uploadMedia(file: File, category: string): Observable<MediaUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return this.http.post<MediaUploadResult>(`${this.apiUrl}/media`, formData);
  }
}
