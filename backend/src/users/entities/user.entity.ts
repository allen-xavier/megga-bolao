import { UserRole as PrismaUserRole } from '@prisma/client';

export const UserRole = PrismaUserRole;
export type UserRole = PrismaUserRole;

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  cpf: string;
  pixKeyType?: string | null;
  email?: string | null;
  role: PrismaUserRole;
  city?: string | null;
  state?: string | null;
  createdAt: Date;
}
