import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository, Brackets } from 'typeorm';

import { Assignment } from './assignment.entity';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/create-assignment.dto';
import { TestcaseStorageService } from '../testcases/testcase-storage.service';

@Injectable()
export class AssignmentsService extends TypeOrmCrudService<Assignment> {
  constructor(
    @InjectRepository(Assignment) private readonly assignments: Repository<Assignment>,
    private readonly testcaseStorage: TestcaseStorageService,
  ) {
    super(assignments);
  }

  /** Public create — used by the Override('createOneBase') endpoint */
  async createAssignment(dto: CreateAssignmentDto): Promise<Assignment> {
    return this.assignments.save(this.assignments.create(dto));
  }

  async updateAssignment(id: string, dto: UpdateAssignmentDto): Promise<Assignment> {
    await this.assignments.update({ id }, dto);
    const out = await this.assignments.findOne({ where: { id } });
    if (!out) throw new NotFoundException(`Assignment ${id} not found`);
    return out;
  }

  async getById(id: string): Promise<Assignment> {
    const out = await this.assignments.findOne({ where: { id } });
    if (!out) throw new NotFoundException(`Assignment ${id} not found`);
    return out;
  }

  /** Delete an assignment and remove its disk-backed test cases. */
  async deleteAssignment(id: string): Promise<Assignment> {
    const assignment = await this.getById(id);
    await this.assignments.delete({ id });
    await this.testcaseStorage.clear(id);
    return assignment;
  }

  /**
   * Replace the assignment's hidden grading test cases from an uploaded ZIP and
   * persist the resulting count into its codingConfig. Content lives on disk;
   * only the count is stored in the DB.
   */
  async uploadHiddenTestcases(id: string, zipBuffer: Buffer): Promise<Assignment> {
    const assignment = await this.getById(id);
    const count = await this.testcaseStorage.replaceFromZip(id, zipBuffer);
    assignment.codingConfig = { ...(assignment.codingConfig ?? {}), hiddenTestCount: count };
    return this.assignments.save(assignment);
  }

  /** Remove all hidden grading test cases for an assignment. */
  async clearHiddenTestcases(id: string): Promise<Assignment> {
    const assignment = await this.getById(id);
    await this.testcaseStorage.clear(id);
    assignment.codingConfig = { ...(assignment.codingConfig ?? {}), hiddenTestCount: 0 };
    return this.assignments.save(assignment);
  }

  /** Read hidden grading test case contents (admin / allowed viewers only). */
  async getHiddenTestcases(id: string) {
    return this.testcaseStorage.readAll(id);
  }

  async getAssignmentsForStudent(
    studentId: string,
    filters: { page: number; limit: number; search?: string; category?: string; difficulty?: string }
  ) {
    const query = this.assignments.createQueryBuilder('a');

    query.andWhere(new Brackets(qb => {
      qb.where('a.class_ids IS NULL')
        .orWhere('CARDINALITY(a.class_ids) = 0')
        .orWhere(`
          EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.student_id = :studentId
            AND e.class_id = ANY(a.class_ids)
          )
        `)
        .orWhere(`
          EXISTS (
            SELECT 1 FROM course_assignments ca
            JOIN class_courses cc ON cc.course_id = ca.course_id
            JOIN enrollments e ON e.class_id = cc.class_id
            WHERE ca.assignment_id = a.id
            AND e.student_id = :studentId
          )
        `);
    })).setParameter('studentId', studentId);

    if (filters.search) {
      query.andWhere(new Brackets(qb => {
        qb.where('a.title ILIKE :search', { search: `%${filters.search}%` })
          .orWhere('a.description ILIKE :search', { search: `%${filters.search}%` });
      }));
    }


    if (filters.difficulty) {
      query.andWhere('a.difficulty = :difficulty', { difficulty: filters.difficulty });
    }

    query.orderBy('a.createdAt', 'DESC');

    const [data, total] = await query
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    return {
      data,
      total,
      page: filters.page,
      pageCount: Math.ceil(total / filters.limit),
    };
  }

  async getImplicitClasses(assignmentId: string): Promise<string[]> {
    const raw = await this.assignments.query(
      `
      SELECT DISTINCT cc.class_id as id
      FROM course_assignments ca
      JOIN class_courses cc ON cc.course_id = ca.course_id
      WHERE ca.assignment_id = $1
      `,
      [assignmentId]
    );
    return raw.map((r: any) => r.id);
  }
}
