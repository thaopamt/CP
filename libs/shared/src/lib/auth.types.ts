import { UserRole } from './user-role.enum';
import { IUser } from './user.interface';

export interface LoginRequest {
  email: string; // can be email or username
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface RefreshRequest {
  refreshToken: string;
}

export type CurrentUserResponse = IUser;

export interface UpdateMePayload {
  firstName?: string;
  lastName?: string;
  username?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * The body of the signed JWT. Both NestJS (JwtStrategy.validate) and
 * the React client agree on this shape so RBAC checks line up.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  /** Present only on tokens minted by admin impersonation; the admin's user id. */
  impersonatedBy?: string;
  iat?: number;
  exp?: number;
}
