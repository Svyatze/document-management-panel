import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import { importProvidersFrom} from '@angular/core';

import { environment } from '../../../../environments/environment.development';
import { DocumentModel, DocumentStatus } from '../../../models';
import { DocumentService } from './document.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentService,
        provideHttpClient(withInterceptorsFromDi()),
        importProvidersFrom(HttpClientTestingModule)
      ]
    });

    service = TestBed.inject(DocumentService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get documents', () => {
    const mockResponse = {
      results: [
        {
          id: '1',
          name: 'Test Document',
          status: DocumentStatus.DRAFT,
          fileUrl: 'file.pdf',
          updatedAt: new Date(),
          createdAt: new Date()
        }
      ],
      count: 1
    };

    service.getDocuments({ page: 1, size: 10 }).subscribe(response => {
      expect(response.results.length).toBe(1);
      expect(response.count).toBe(1);
      expect(service.documents().length).toBe(1);
    });

    const req = httpTestingController.expectOne(request =>
      request.url === `${environment.apiUrl}/document` &&
      request.params.get('page') === '1' &&
      request.params.get('size') === '10'
    );

    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should send document to review', () => {
    const mockDocument: DocumentModel = {
      id: '1',
      name: 'Test Document',
      status: DocumentStatus.READY_FOR_REVIEW,
      fileUrl: 'file.pdf',
    };

    service.sendToReview('1').subscribe(document => {
      expect(document.status).toBe(DocumentStatus.READY_FOR_REVIEW);
    });

    const req = httpTestingController.expectOne(`${environment.apiUrl}/document/1/send-to-review`);
    expect(req.request.method).toBe('POST');
    req.flush(mockDocument);
  });
});
