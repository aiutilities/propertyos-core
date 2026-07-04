export interface CreatePersonDto {
  displayName: string;
  email?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
