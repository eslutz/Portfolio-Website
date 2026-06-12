import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { CmsApiService } from './cms-api.service';

describe('CmsApiService', () => {
  let service: CmsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });

    service = TestBed.inject(CmsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('reads editable component data from the CMS endpoint', () => {
    let result: { id: string }[] | undefined;

    service
      .getComponent<{ id: string }>('project')
      .subscribe((data) => (result = data));

    const req = httpMock.expectOne('/api/cms/components/project');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'project-1' }]);

    expect(result).toEqual([{ id: 'project-1' }]);
  });

  it('updates project records by id', () => {
    service
      .updateProject('project-1', {
        order: 1,
        title: 'Project',
        description: 'Description',
        codeLink: 'https://github.com/eslutz/example',
      })
      .subscribe();

    const req = httpMock.expectOne('/api/cms/projects/project-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.title).toBe('Project');
    req.flush({
      id: 'project-1',
      component: 'project',
      order: 1,
      title: 'Project',
      description: 'Description',
      codeLink: 'https://github.com/eslutz/example',
    });
  });

  it('uploads media as multipart form data', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' });

    service.uploadMedia(file, 'projects').subscribe();

    const req = httpMock.expectOne('/api/cms/media');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({
      url: 'https://media.example/projects/image.png',
      blobName: 'projects/image.png',
      contentType: 'image/png',
      size: 5,
    });
  });
});
