import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RegisterUserRequest,
  User,
  UserListRequest,
  UserListResponse
} from '../../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  public getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}`);
  }

  public registerUser(request: RegisterUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, request);
  }

  public getUsers(request: UserListRequest): Observable<UserListResponse> {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('size', request.size.toString());

    if (request.sort) {
      params = params.set('sort', request.sort);
    }

    return this.http.get<UserListResponse>(`${this.apiUrl}/users`, { params });
  }
}
