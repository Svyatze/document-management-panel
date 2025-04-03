import {inject, Injectable} from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { signal } from '@angular/core';

import { environment } from '../../../../environments/environment';
import {
  DocumentModel,
  DocumentCreateRequest,
  DocumentListRequest,
  DocumentListResponse,
  DocumentUpdateRequest,
  DocumentStatus
} from '../../../models';

@Injectable({
  providedIn: 'root'
})

export class DocumentService {
  private apiUrl = `${environment.apiUrl}/document`;

  private http = inject(HttpClient)

  public documents = signal<DocumentModel[]>([]);
  public totalCount = signal<number>(0);

  public getDocuments(request: DocumentListRequest): Observable<DocumentListResponse> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('size', request.size.toString());

    if (request.sort) {
      params = params.set('sort', request.sort);
    }

    if (request.status) {
      params = params.set('status', request.status);
    }

    if (request.creatorId) {
      params = params.set('creatorId', request.creatorId);
    }

    if (request.creatorEmail) {
      params = params.set('creatorEmail', request.creatorEmail);
    }

    return this.http.get<DocumentListResponse>(this.apiUrl, { params })
      .pipe(
        tap((response: DocumentListResponse) => {
          this.documents.set(response.results);
          this.totalCount.set(response.count);
        })
      );
  }

  public getDocumentById(id: string): Observable<DocumentModel> {
    return this.http.get<DocumentModel>(`${this.apiUrl}/${id}`);
  }

  public createDocument(request: DocumentCreateRequest): Observable<DocumentModel> {
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('status', request.status.toString());
    formData.append('file', request.file);

    return this.http.post<DocumentModel>(this.apiUrl, formData);
  }

  public updateDocument(request: DocumentUpdateRequest): Observable<DocumentModel> {
    const updateData: any = {};

    if (request.name !== undefined) {
      updateData.name = request.name;
    }

    return this.http.patch<DocumentModel>(`${this.apiUrl}/${request.id}`, updateData);
  }

  public sendToReview(documentId: string): Observable<DocumentModel> {
    return this.http.post<DocumentModel>(`${this.apiUrl}/${documentId}/send-to-review`, {});
  }

  public revokeReview(documentId: string): Observable<DocumentModel> {
    return this.http.post<DocumentModel>(`${this.apiUrl}/${documentId}/revoke-review`, {});
  }

  public changeStatus(documentId: string, status: DocumentStatus): Observable<DocumentModel> {
    return this.http.post<DocumentModel>(`${this.apiUrl}/${documentId}/change-status`, {
      status: status
    });
  }

  public deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
