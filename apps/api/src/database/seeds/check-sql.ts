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
  const qb = AppDataSource.getRepository(Assignment)
    .createQueryBuilder('a')
    .innerJoin('course_assignments', 'ca', 'ca.assignment_id = a.id')
    .innerJoin('class_courses', 'cc', 'cc.course_id = ca.course_id')
    .innerJoin('enrollments', 'e', 'e.class_id = cc.class_id')
    .where('e.student_id = :studentId', { studentId: '123' });
    
  console.log("SQL:", qb.getSql());
  
  process.exit(0);
}
check();
