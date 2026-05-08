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
    host: cfg.get<string>('DB_HOST'),
    port: cfg.get<number>('DB_PORT'),
    username: cfg.get<string>('DB_USER'),
    password: cfg.get<string>('DB_PASSWORD'),
    database: cfg.get<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: !isProd,
    logging: isProd ? ['error'] : ['error', 'warn'],
    namingStrategy: undefined,
  };
};
