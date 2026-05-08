import { UserRole } from './user-role.enum';
import { IUser } from './user.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: IUser;
}

/**
 * The body of the signed JWT. Both NestJS (JwtStrategy.validate) and
 * the React client agree on this shape so RBAC checks line up.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
