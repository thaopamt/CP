import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { User } from '../../modules/users/user.entity';
import { UserRole } from '@cp/shared';

async function run() {
  console.log('🚀 Starting Seed Script for Admin User...');
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📂 Database connected.');
  }

  const userRepo = AppDataSource.getRepository(User);

  const adminEmail = 'admin@zenith.local';
  let admin = await userRepo.findOneBy({ email: adminEmail });
  
  if (!admin) {
    admin = new User();
    admin.email = adminEmail;
    admin.firstName = 'Admin';
    admin.lastName = 'Zenith';
    admin.username = 'admin';
    admin.role = UserRole.ADMIN;
    admin.passwordHash = await bcrypt.hash('password123', 10);
    admin.isActive = true;
    admin = await userRepo.save(admin);
    console.log('✅ Admin user created: admin@zenith.local / password123');
  } else {
    console.log('ℹ️ Admin user already exists.');
  }

  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during admin seed:', err);
  process.exit(1);
});
