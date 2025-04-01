export enum UserRole {
  USER = 'USER',
  REVIEWER = 'REVIEWER'
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UserListRequest {
  page: number;
  size: number;
  sort?: string;
}

export interface UserListResponse {
  results: User[];
  count: number;
}
