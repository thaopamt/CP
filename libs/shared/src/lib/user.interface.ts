import { UserRole } from './user-role.enum';

/**
 * Wire-format representation of a user. Both the API DTOs and the
 * React auth store use this shape — Date fields are always serialized
 * to ISO strings at the boundary so the type round-trips through JSON.
 */
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Convenience computed name (kept here so both apps agree on formatting). */
export function fullName(user: Pick<IUser, 'firstName' | 'lastName'>): string {
  return `${user.firstName} ${user.lastName}`.trim();
}
