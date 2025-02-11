import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortfolioApiService {
  private readonly apiUrl = '/api/getCosmosData';
  private readonly cacheMap = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  getComponentData<T>(component: string): Observable<T[]> {
    if (!this.cacheMap.has(component)) {
      const request = this.http.post<T[]>(this.apiUrl, { "component": component }).pipe(
        shareReplay({
          bufferSize: 1,
          windowTime: 24 * 60 * 60 * 1000, // 24 hours
          refCount: true
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
