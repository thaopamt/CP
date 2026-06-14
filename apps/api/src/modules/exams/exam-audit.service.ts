import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ExamAuditAction } from '@cp/shared';
import { ExamAuditLog } from './exam-audit-log.entity';

/** Thin append-only audit writer used by every mutating exam operation. */
@Injectable()
export class ExamAuditService {
  constructor(
    @InjectRepository(ExamAuditLog) private readonly repo: Repository<ExamAuditLog>,
  ) {}

  async log(
    examId: string,
    actorId: string | null,
    action: ExamAuditAction,
    meta?: Record<string, unknown>,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(ExamAuditLog) : this.repo;
    await repo.save(repo.create({ examId, actorId, action, meta: meta ?? null }));
  }

  async list(examId: string, limit = 200): Promise<ExamAuditLog[]> {
    return this.repo.find({
      where: { examId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 500),
    });
  }
}
