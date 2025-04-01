import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  DocumentModel,
  DocumentCreateRequest,
  DocumentListRequest,
  DocumentListResponse,
  DocumentUpdateRequest
} from '../../models';

@Injectable({
  providedIn: 'root'
})

export class DocumentService {
  private apiUrl = `${environment.apiUrl}/document`;

  public documents = signal<DocumentModel[]>([]);
  public totalCount = signal<number>(0);

  constructor(private http: HttpClient) {}

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
    return this.http.patch<DocumentModel>(`${this.apiUrl}/${request.id}`, {
      name: request.name,
      status: request.status
    });
  }

  public deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
