import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  BlockType,
  GridConfig,
  PublishStatus,
  SubmissionStatus,
  simulate,
  validateCommands,
} from '@cp/shared';

import { QuestsService } from '../quests/quests.service';
import { MazeLevel } from './maze-level.entity';
import { MazeSubmission } from './maze-submission.entity';
import { CreateMazeLevelDto, UpdateMazeLevelDto } from './dto/maze-level.dto';
import { SubmitMazeDto } from './dto/submit-maze.dto';

@Injectable()
export class MazeService {
  constructor(
    @InjectRepository(MazeLevel) private readonly levels: Repository<MazeLevel>,
    @InjectRepository(MazeSubmission) private readonly submissions: Repository<MazeSubmission>,
    private readonly questsService: QuestsService,
  ) {}

  // ── Admin CRUD ──────────────────────────────────────────────────────────

  async listLevels(): Promise<MazeLevel[]> {
    return this.levels.find({ order: { order: 'ASC', createdAt: 'DESC' } });
  }

  async getLevel(id: string): Promise<MazeLevel> {
    const level = await this.levels.findOne({ where: { id } });
    if (!level) throw new NotFoundException(`Không tìm thấy bàn chơi ${id}`);
    return level;
  }

  async createLevel(dto: CreateMazeLevelDto): Promise<MazeLevel> {
    this.assertValidGrid(dto.gridConfig);
    return this.levels.save(this.levels.create(dto));
  }

  async updateLevel(id: string, dto: UpdateMazeLevelDto): Promise<MazeLevel> {
    if (dto.gridConfig) this.assertValidGrid(dto.gridConfig);
    await this.levels.update({ id }, dto);
    return this.getLevel(id);
  }

  async deleteLevel(id: string): Promise<void> {
    await this.levels.delete({ id });
  }

  // ── Student-facing ──────────────────────────────────────────────────────

  /**
   * Published levels visible to a student. Mirrors
   * AssignmentsService.getAssignmentsForStudent: a level with no classes is
   * visible to everyone, otherwise it must be assigned to a class the student
   * is enrolled in.
   */
  async getLevelsForStudent(studentId: string): Promise<Array<MazeLevel & {
    solved: boolean;
    attempts: number;
    bestBlocks: number | null;
  }>> {
    const query = this.levels.createQueryBuilder('l');

    query
      .where('l.status = :status', { status: PublishStatus.PUBLISHED })
      .andWhere(
        new Brackets((qb) => {
          qb.where('l.class_ids IS NULL')
            .orWhere('CARDINALITY(l.class_ids) = 0')
            .orWhere(
              `EXISTS (
                SELECT 1 FROM enrollments e
                WHERE e.student_id = :studentId
                AND e.class_id = ANY(l.class_ids)
              )`,
            );
        }),
      )
      .setParameter('studentId', studentId)
      .orderBy('l.order', 'ASC')
      .addOrderBy('l.created_at', 'ASC');

    const levels = await query.getMany();
    if (levels.length === 0) return [];

    const progressRows = await this.submissions
      .createQueryBuilder('s')
      .select('s.levelId', 'levelId')
      .addSelect('BOOL_OR(s.reached_goal)', 'solved')
      .addSelect('COUNT(s.id)', 'attempts')
      .addSelect('MIN(s.blocks_used) FILTER (WHERE s.reached_goal)', 'bestBlocks')
      .where('s.userId = :studentId', { studentId })
      .andWhere('s.levelId IN (:...levelIds)', { levelIds: levels.map((level) => level.id) })
      .groupBy('s.levelId')
      .getRawMany();

    const progressByLevel = new Map(progressRows.map((row) => [
      row.levelId,
      {
        solved: row.solved === true || row.solved === 'true',
        attempts: Number(row.attempts),
        bestBlocks: row.bestBlocks != null ? Number(row.bestBlocks) : null,
      },
    ]));

    return levels.map((level) => ({
      ...level,
      solved: progressByLevel.get(level.id)?.solved ?? false,
      attempts: progressByLevel.get(level.id)?.attempts ?? 0,
      bestBlocks: progressByLevel.get(level.id)?.bestBlocks ?? null,
    }));
  }

  async getLevelForStudent(studentId: string, levelId: string): Promise<MazeLevel> {
    const visible = await this.getLevelsForStudent(studentId);
    const level = visible.find((l) => l.id === levelId);
    if (!level) throw new NotFoundException('Không tìm thấy bàn chơi này hoặc em chưa được giao.');
    return level;
  }

  async getMySubmissions(userId: string, levelId: string): Promise<MazeSubmission[]> {
    return this.submissions.find({
      where: { userId, levelId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Authoritative grading: validate the command tree against the level's
   * constraints, then re-simulate server-side. The server result is the source
   * of truth — never trust the client's pass/fail.
   */
  async submit(userId: string, dto: SubmitMazeDto) {
    const level = await this.getLevelForStudent(userId, dto.levelId);

    const validation = validateCommands(
      dto.commandTree,
      (level.allowedBlocks ?? []) as BlockType[],
      level.maxBlocks ?? null,
    );

    const submission = this.submissions.create({
      userId,
      levelId: level.id,
      workspaceXml: dto.workspaceXml,
      commandTree: dto.commandTree,
      status: SubmissionStatus.PENDING,
    });

    if (!validation.ok) {
      submission.status = SubmissionStatus.WRONG_ANSWER;
      submission.reachedGoal = false;
      const saved = await this.submissions.save(submission);
      return { submission: saved, reachedGoal: false, errors: validation.errors };
    }

    const result = simulate(level.gridConfig, dto.commandTree);
    submission.status = result.reachedGoal ? SubmissionStatus.ACCEPTED : SubmissionStatus.WRONG_ANSWER;
    submission.reachedGoal = result.reachedGoal;
    submission.blocksUsed = result.blocksUsed;
    submission.stepsCount = result.steps.length;
    submission.failReason = result.failReason;
    const saved = await this.submissions.save(submission);

    if (saved.status === SubmissionStatus.ACCEPTED) {
      await this.questsService.handleSubmissionAccepted(userId).catch((e) => {
        console.error('Failed to update quest progress:', e);
      });
    }

    return { submission: saved, reachedGoal: result.reachedGoal, failReason: result.failReason, errors: [] };
  }

  // ── Progress dashboard ────────────────────────────────────────────────────

  /** Per-student best status for one level. */
  async getProgress(levelId: string) {
    const rows = await this.submissions
      .createQueryBuilder('s')
      .innerJoin('s.user', 'u')
      .select('s.userId', 'userId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect('BOOL_OR(s.reached_goal)', 'solved')
      .addSelect('COUNT(s.id)', 'attempts')
      .addSelect('MIN(s.blocks_used) FILTER (WHERE s.reached_goal)', 'bestBlocks')
      .where('s.levelId = :levelId', { levelId })
      .groupBy('s.userId')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .getRawMany();

    return rows.map((r) => ({
      userId: r.userId,
      studentName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim(),
      solved: r.solved === true || r.solved === 'true',
      attempts: Number(r.attempts),
      bestBlocks: r.bestBlocks != null ? Number(r.bestBlocks) : null,
    }));
  }

  /** One row per level with solved/attempted counts, for the dashboard grid. */
  async getProgressSummary() {
    const levels = await this.levels.find({ order: { order: 'ASC' } });
    const rows = await this.submissions
      .createQueryBuilder('s')
      .select('s.levelId', 'levelId')
      .addSelect('COUNT(DISTINCT s.userId)', 'attemptedCount')
      .addSelect('COUNT(DISTINCT s.userId) FILTER (WHERE s.reached_goal)', 'solvedCount')
      .groupBy('s.levelId')
      .getRawMany();

    const byLevel = new Map(rows.map((r) => [r.levelId, r]));
    return levels.map((l) => {
      const r = byLevel.get(l.id);
      return {
        levelId: l.id,
        title: l.title,
        difficulty: l.difficulty,
        status: l.status,
        attemptedCount: r ? Number(r.attemptedCount) : 0,
        solvedCount: r ? Number(r.solvedCount) : 0,
      };
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private assertValidGrid(grid: GridConfig): void {
    const inBounds = (c: { x: number; y: number }) =>
      c && c.x >= 0 && c.x < grid.width && c.y >= 0 && c.y < grid.height;
    if (!grid.width || !grid.height || grid.width < 1 || grid.height < 1) {
      throw new BadRequestException('Kích thước lưới không hợp lệ.');
    }
    if (!inBounds(grid.start)) throw new BadRequestException('Điểm bắt đầu nằm ngoài lưới.');
    if (!inBounds(grid.goal)) throw new BadRequestException('Điểm đích nằm ngoài lưới.');
    if ((grid.walls ?? []).some((w) => !inBounds(w))) {
      throw new BadRequestException('Có tường nằm ngoài lưới.');
    }
    if ((grid.items ?? []).some((it) => !inBounds(it))) {
      throw new BadRequestException('Có vật phẩm nằm ngoài lưới.');
    }
    for (const monster of grid.monsters ?? []) {
      if (!monster.path?.length) {
        throw new BadRequestException('Quái vật phải có ít nhất một ô lộ trình.');
      }
      if (monster.path.some((c) => !inBounds(c))) {
        throw new BadRequestException('Có quái vật di chuyển ra ngoài lưới.');
      }
    }
  }
}
