import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Assignment } from '../../modules/assignments/assignment.entity';
import { Course } from '../../modules/courses/course.entity';

config({ path: '../../../../../.env' });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'cp',
  password: process.env.DB_PASSWORD || 'cp',
  database: process.env.DB_NAME || 'cp',
  entities: [Assignment, Course],
  synchronize: false,
});

async function check() {
  await AppDataSource.initialize();
  const assignments = await AppDataSource.getRepository(Assignment).find({ take: 2 });
  const course = await AppDataSource.getRepository(Course).find({ take: 1 });
  
  if (course.length === 0 || assignments.length === 0) {
    console.log("Not enough data");
    process.exit(1);
  }

  const payload = { assignmentIds: assignments.map(a => a.id) };
  console.log("Course ID:", course[0].id);
  console.log("Payload:", payload);

  process.exit(0);
}
check();
