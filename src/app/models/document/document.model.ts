export enum DocumentStatus {
  DRAFT = 'DRAFT',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVOKED = 'REVOKED'
}

export interface Creator {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'REVIEWER';
}

export interface DocumentModel {
  id?: string;
  name: string;
  status: DocumentStatus;
  fileUrl: string;
  creator?: Creator;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface DocumentCreateRequest {
  name: string;
  status: DocumentStatus;
  file: File;
}

export interface DocumentUpdateRequest {
  id: string;
  name?: string;
  status?: DocumentStatus;
}

export interface DocumentListRequest {
  page: number;
  size: number;
  sort?: string;
  status?: string;
  creatorId?: string;
  creatorEmail?: string;
}

export interface DocumentListResponse {
  results: DocumentModel[];
  count: number;
}
