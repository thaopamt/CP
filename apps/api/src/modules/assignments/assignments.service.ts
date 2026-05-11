import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';

import { Assignment } from './assignment.entity';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService extends TypeOrmCrudService<Assignment> {
  constructor(@InjectRepository(Assignment) private readonly assignments: Repository<Assignment>) {
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
}
