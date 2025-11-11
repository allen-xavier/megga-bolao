export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  USER = 'USER',
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  cpf: string;
  email?: string | null;
  role: UserRole;
  city?: string | null;
  state?: string | null;
  createdAt: Date;
}
