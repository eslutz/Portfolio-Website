import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { PortfolioApiService } from './portfolio-api.service';
import { ApiError, ApiErrorType } from '../models/api-error.model';

interface TestItem {
  id: string;
}

describe('PortfolioApiService', () => {
  let service: PortfolioApiService;
  let httpMock: HttpTestingController;
  let now: number;

  beforeEach(() => {
    now = 1700000000000;
    spyOn(Date, 'now').and.callFake(() => now);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(PortfolioApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('issues a GET to /api/components/{component} in lowercase', () => {
    let result: TestItem[] | undefined;
    service
      .getComponentData<TestItem>('Footer')
      .subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/components/footer');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: '1' }]);

    expect(result).toEqual([{ id: '1' }]);
  });

  it('replays cached data within the TTL without a second request', () => {
    service.getComponentData<TestItem>('home').subscribe();
    httpMock.expectOne('/api/components/home').flush([{ id: '1' }]);

    now += 23 * 60 * 60 * 1000;

    let result: TestItem[] | undefined;
    service
      .getComponentData<TestItem>('home')
      .subscribe((data) => (result = data));

    httpMock.expectNone('/api/components/home');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('evicts the cache entry and refetches after the TTL expires', () => {
    service.getComponentData<TestItem>('home').subscribe();
    httpMock.expectOne('/api/components/home').flush([{ id: '1' }]);

    now += 24 * 60 * 60 * 1000 + 1;

    let result: TestItem[] | undefined;
    service
      .getComponentData<TestItem>('home')
      .subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/components/home');
    req.flush([{ id: '2' }]);

    expect(result).toEqual([{ id: '2' }]);
  });

  it('refetches after the cache is cleared', () => {
    service.getComponentData<TestItem>('home').subscribe();
    httpMock.expectOne('/api/components/home').flush([{ id: '1' }]);

    service.clearCache('home');

    let result: TestItem[] | undefined;
    service
      .getComponentData<TestItem>('home')
      .subscribe((data) => (result = data));
    httpMock.expectOne('/api/components/home').flush([{ id: '2' }]);

    expect(result).toEqual([{ id: '2' }]);
  });

  it('maps a 404 response to a NOT_FOUND ApiError', () => {
    let apiError: ApiError | undefined;
    service.getComponentData<TestItem>('home').subscribe({
      error: (error: ApiError) => (apiError = error),
    });

    httpMock
      .expectOne('/api/components/home')
      .flush({ message: 'missing' }, { status: 404, statusText: 'Not Found' });

    expect(apiError?.errorType).toBe(ApiErrorType.NOT_FOUND);
    expect(apiError?.statusCode).toBe(404);
    expect(apiError?.message).toBe('missing');
  });

  it('maps a 503 response to a SERVICE_UNAVAILABLE ApiError', () => {
    let apiError: ApiError | undefined;
    service.getComponentData<TestItem>('home').subscribe({
      error: (error: ApiError) => (apiError = error),
    });

    httpMock
      .expectOne('/api/components/home')
      .flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(apiError?.errorType).toBe(ApiErrorType.SERVICE_UNAVAILABLE);
    expect(apiError?.statusCode).toBe(503);
  });
});
