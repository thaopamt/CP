import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class StripPasswordHashInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => stripPasswordHash(data, new WeakMap())));
  }
}

function stripPasswordHash(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return value;

  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const arr: unknown[] = [];
    seen.set(value, arr);
    arr.push(...value.map((item) => stripPasswordHash(item, seen)));
    return arr;
  }

  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  seen.set(value, output);

  for (const [key, child] of Object.entries(source)) {
    if (key === 'passwordHash') continue;
    output[key] = stripPasswordHash(child, seen);
  }

  return output;
}
