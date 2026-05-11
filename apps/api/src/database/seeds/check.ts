import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Assignment } from '../../modules/assignments/assignment.entity';

config({ path: '../../../../../.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'cp',
  password: process.env.DB_PASSWORD || 'cp',
  database: process.env.DB_NAME || 'cp',
  entities: [Assignment],
  synchronize: false,
});

async function check() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Assignment);
  const assignments = await repo.find({ take: 2 });
  console.log(JSON.stringify(assignments.map(a => a.codingConfig), null, 2));
  process.exit(0);
}
check();
