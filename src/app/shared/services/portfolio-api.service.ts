import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { shareReplay, tap, catchError } from 'rxjs/operators';
import { ApiError, ApiErrorType } from '../models/api-error.model';

@Injectable({
  providedIn: 'root',
})
export class PortfolioApiService {
  private readonly apiUrl = '/api/GetCosmosData';
  private readonly cacheMap = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    switch (error.status) {
      case 401:
        apiError = {
          message:
            'Authentication required - Please log in to access this resource',
          statusCode: error.status,
          errorType: ApiErrorType.UNAUTHORIZED,
        };
        break;

      case 403:
        apiError = {
          message:
            'Access denied - You do not have permission to access this resource',
          statusCode: error.status,
          errorType: ApiErrorType.FORBIDDEN,
        };
        break;

      case 404:
        apiError = {
          message: error.error?.message || 'Content not found',
          statusCode: error.status,
          errorType: ApiErrorType.NOT_FOUND,
        };
        break;

      case 503:
        apiError = {
          message: 'Service is temporarily unavailable',
          statusCode: error.status,
          errorType: ApiErrorType.SERVICE_UNAVAILABLE,
        };
        break;

      case 400:
        apiError = {
          message: error.error?.message || 'Invalid request',
          statusCode: error.status,
          errorType: ApiErrorType.BAD_REQUEST,
        };
        break;

      default:
        apiError = {
          message: 'An unexpected error occurred',
          statusCode: error.status,
          errorType: ApiErrorType.UNKNOWN,
        };
        break;
    }

    // Log the error for debugging purposes
    console.error('API Error:', apiError);

    return throwError(() => apiError);
  }

  getComponentData<T>(component: string): Observable<T[]> {
    if (!this.cacheMap.has(component)) {
      const request = this.http
        .post<T[]>(this.apiUrl, { component: component })
        .pipe(
          catchError((error) => this.handleError(error)),
          shareReplay({
            bufferSize: 1,
            windowTime: 24 * 60 * 60 * 1000, // 24 hours
            refCount: true,
          })
        );

      this.cacheMap.set(component, request);
    }
    return this.cacheMap.get(component)!;
  }

  clearCache(component?: string): void {
    if (component) {
      this.cacheMap.delete(component);
    } else {
      this.cacheMap.clear();
    }
  }
}
