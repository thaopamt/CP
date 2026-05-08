/**
 * One-shot seed: creates one admin / one teacher / one student so the web
 * app's RBAC flows can be exercised end-to-end. Idempotent — re-running
 * after the rows already exist is a no-op.
 *
 *     pnpm exec nx run api:seed
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@cp/shared';

import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/user.entity';

const SEED = [
  {
    email: 'admin@cp.local',
    firstName: 'Ada',
    lastName: 'Admin',
    role: UserRole.ADMIN,
    avatarUrl: null,
  },
  {
    email: 'teacher@cp.local',
    firstName: 'Theo',
    lastName: 'Teacher',
    role: UserRole.TEACHER,
    avatarUrl: null,
  },
  {
    email: 'student@cp.local',
    firstName: 'Stella',
    lastName: 'Student',
    role: UserRole.STUDENT,
    avatarUrl: null,
  },
] as const;

const PASSWORD = 'password123';

async function run() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const seed of SEED) {
    const existing = await repo.findOne({ where: { email: seed.email } });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`✓  ${seed.email} already exists — skipping`);
      continue;
    }
    const entity = repo.create({ ...seed, passwordHash, isActive: true });
    await repo.save(entity);
    // eslint-disable-next-line no-console
    console.log(`+  created ${seed.email} (${seed.role})`);
  }

  // eslint-disable-next-line no-console
  console.log(`\nAll seeded. Password for every user: "${PASSWORD}"`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
