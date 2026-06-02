import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Postgres + TypeORM config for the running app.
 * `synchronize` is dev-only — production must use migrations
 * (see apps/api/src/database/data-source.ts for the CLI side).
 */
export const typeOrmConfig = (cfg: ConfigService): TypeOrmModuleOptions => {
  const isProd = cfg.get('NODE_ENV') === 'production';
  return {
    type: 'postgres',
    url: cfg.get<string>('DATABASE_URL'),
    ssl: cfg.get<string>('DATABASE_URL')?.includes('amazonaws.com') ? { rejectUnauthorized: false } : undefined,
    autoLoadEntities: true,
    synchronize: !isProd,
    logging: isProd ? ['error'] : ['error', 'warn'],
    namingStrategy: undefined,
  };
};
