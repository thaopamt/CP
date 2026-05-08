import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Thin wrapper around the passport-jwt strategy registered as 'jwt'.
 * Use this on routes that require authentication.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
