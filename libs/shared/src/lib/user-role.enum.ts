/**
 * The single source of truth for application roles.
 * Imported by both NestJS (RolesGuard, @Roles decorator, User entity)
 * and React (RoleGuard, auth store) via `@cp/shared`.
 *
 * Values are stored verbatim in the Postgres `users.role` column and
 * embedded in the JWT payload — do not rename without a migration.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

/**
 * Where to send a user after login (and where to bounce them when they
 * navigate to a portal they don't have permission for).
 */
export const ROLE_HOME_PATH: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/admin',
  [UserRole.TEACHER]: '/teacher',
  [UserRole.STUDENT]: '/student',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.STUDENT]: 'Student',
};
