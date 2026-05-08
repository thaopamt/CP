import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'node:path';

import { User } from '../modules/users/user.entity';
import { ClassEntity } from '../modules/classes/class.entity';
import { ClassSession } from '../modules/classes/class-session.entity';
import { Enrollment } from '../modules/classes/enrollment.entity';

// Load env in CLI context (TypeORM CLI doesn't go through ConfigModule)
loadEnv({ path: join(process.cwd(), 'apps/api/.env') });
loadEnv({ path: join(process.cwd(), '.env') });

/**
 * Standalone DataSource for the typeorm CLI:
 *   - migration:generate
 *   - migration:run
 *   - migration:revert
 * Mirrors apps/api/src/config/typeorm.config.ts but exports a DataSource
 * instance (which the CLI requires).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'cp',
  password: process.env.DB_PASSWORD ?? 'cp',
  database: process.env.DB_NAME ?? 'cp',
  entities: [User, ClassEntity, ClassSession, Enrollment],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
  logging: ['error', 'warn'],
});

export default AppDataSource;
