import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, IsNull, Repository } from 'typeorm';
import {
  ContestFormat,
  ExamAuditAction,
  ExamParticipantState,
  ExamPhase,
  ExamRankingRule,
  ExamStatus,
  ExamTieMode,
  ExamVisibility,
  IAddExamProblemPayload,
  ICreateExamPayload,
  ICreateExamRewardRulePayload,
  IExam,
  IExamLeaderboardResponse,
  IExamRankingRow,
  ISubtaskConfig,
  IUpdateExamPayload,
  IUpdateExamProblemPayload,
  IUpdateExamRewardRulePayload,
  JwtPayload,
  UserRole,
} from '@cp/shared';
import { Exam } from './exam.entity';
import { ExamProblem } from './exam-problem.entity';
import { ExamParticipant } from './exam-participant.entity';
import { ExamRewardRule } from './exam-reward-rule.entity';
import { ExamRankingSnapshot } from './exam-ranking-snapshot.entity';
import { ExamRewardGrant } from './exam-reward-grant.entity';
import { ExamAuditService } from './exam-audit.service';
import { ExamRankingService } from './exam-ranking.service';
import { ScoringProblem } from './exam-scoring.service';
import { User } from '../users/user.entity';
import { Enrollment } from '../classes/enrollment.entity';
import { Assignment } from '../assignments/assignment.entity';

export interface ExamListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  format?: string;
}

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private readonly exams: Repository<Exam>,
    @InjectRepository(ExamProblem) private readonly examProblems: Repository<ExamProblem>,
    @InjectRepository(ExamParticipant) private readonly participants: Repository<ExamParticipant>,
    @InjectRepository(ExamRewardRule) private readonly rewardRules: Repository<ExamRewardRule>,
    @InjectRepository(ExamRankingSnapshot) private readonly snapshots: Repository<ExamRankingSnapshot>,
    @InjectRepository(ExamRewardGrant) private readonly grants: Repository<ExamRewardGrant>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(Assignment) private readonly assignments: Repository<Assignment>,
    private readonly audit: ExamAuditService,
    private readonly ranking: ExamRankingService,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private isStaff(user: JwtPayload): boolean {
    return user.role === UserRole.ADMIN || user.role === UserRole.TEACHER;
  }

  /** Throws unless the user is an admin or the exam's owner. */
  assertManager(exam: Exam, user: JwtPayload): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.TEACHER && exam.createdBy === user.sub) return;
    throw new ForbiddenException('You do not manage this exam');
  }

  async loadExamOrThrow(id: string): Promise<Exam> {
    const exam = await this.exams.findOne({ where: { id } });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  derivePhase(exam: Exam, now = new Date()): ExamPhase {
    const t = now.getTime();
    if (t < new Date(exam.startAt).getTime()) return ExamPhase.UPCOMING;
    if (t > new Date(exam.endAt).getTime()) return ExamPhase.ENDED;
    return ExamPhase.RUNNING;
  }

  /** Effective freeze instant, or null if leaderboard is never frozen. */
  effectiveFreezeAt(exam: Exam): Date | null {
    if (exam.freezeAt) return new Date(exam.freezeAt);
    const offset = exam.settings?.freezeOffsetMinutes;
    if (offset && offset > 0) return new Date(new Date(exam.endAt).getTime() - offset * 60000);
    return null;
  }

  isFrozenNow(exam: Exam, now = new Date()): boolean {
    if (exam.isFrozen) return true;
    const freezeAt = this.effectiveFreezeAt(exam);
    if (!freezeAt) return false;
    const end = new Date(exam.endAt).getTime();
    return now.getTime() >= freezeAt.getTime() && now.getTime() <= end;
  }

  toDto(exam: Exam, extra: Partial<IExam> = {}): IExam {
    return {
      id: exam.id,
      title: exam.title,
      slug: exam.slug,
      description: exam.description,
      format: exam.format,
      rankingRule: exam.rankingRule,
      tieMode: exam.tieMode,
      status: exam.status,
      phase: this.derivePhase(exam),
      startAt: new Date(exam.startAt).toISOString(),
      endAt: new Date(exam.endAt).toISOString(),
      durationMinutes: exam.durationMinutes,
      freezeAt: exam.freezeAt ? new Date(exam.freezeAt).toISOString() : null,
      isFrozen: this.isFrozenNow(exam),
      visibility: exam.visibility,
      classIds: exam.classIds,
      createdBy: exam.createdBy,
      autoFinalize: exam.autoFinalize,
      autoGrantReward: exam.autoGrantReward,
      finalizedAt: exam.finalizedAt ? new Date(exam.finalizedAt).toISOString() : null,
      snapshotVersion: exam.snapshotVersion,
      settings: exam.settings,
      createdAt: new Date(exam.createdAt).toISOString(),
      updatedAt: new Date(exam.updatedAt).toISOString(),
      ...extra,
    };
  }

  async getScoringProblems(examId: string): Promise<ScoringProblem[]> {
    const problems = await this.examProblems.find({
      where: { examId },
      order: { orderIndex: 'ASC' },
    });
    return problems.map((p) => ({
      examProblemId: p.id,
      assignmentId: p.assignmentId,
      label: p.label,
      points: p.points,
      scoringMode: p.scoringMode,
      subtaskConfig: p.subtaskConfig,
    }));
  }

  private async studentClassIds(userId: string): Promise<string[]> {
    const rows = await this.enrollments.find({ where: { studentId: userId }, select: ['classId'] });
    return rows.map((r) => r.classId);
  }

  private slugify(title: string): string {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60);
    const suffix = Math.random().toString(36).slice(2, 7);
    return `${base || 'exam'}-${suffix}`;
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async list(query: ExamListQuery, user: JwtPayload) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(query.limit ?? 20, 100);

    const qb = this.exams.createQueryBuilder('e').orderBy('e.createdAt', 'DESC');
    if (user.role === UserRole.TEACHER) qb.andWhere('e.created_by = :uid', { uid: user.sub });
    if (query.status && query.status !== 'ALL') qb.andWhere('e.status = :status', { status: query.status });
    if (query.format && query.format !== 'ALL') qb.andWhere('e.format = :format', { format: query.format });
    if (query.search?.trim()) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('e.title ILIKE :q').orWhere('e.slug ILIKE :q');
        }),
        { q: `%${query.search.trim()}%` },
      );
    }

    const [rows, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const counts = await this.countsFor(rows.map((r) => r.id));
    return {
      data: rows.map((e) => this.toDto(e, counts.get(e.id))),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private async countsFor(examIds: string[]): Promise<Map<string, { problemCount: number; participantCount: number }>> {
    const map = new Map<string, { problemCount: number; participantCount: number }>();
    if (examIds.length === 0) return map;
    for (const id of examIds) map.set(id, { problemCount: 0, participantCount: 0 });
    const probs = await this.examProblems
      .createQueryBuilder('p')
      .select('p.exam_id', 'examId')
      .addSelect('COUNT(*)', 'count')
      .where('p.exam_id IN (:...ids)', { ids: examIds })
      .groupBy('p.exam_id')
      .getRawMany<{ examId: string; count: string }>();
    for (const r of probs) map.get(r.examId)!.problemCount = Number(r.count);
    const parts = await this.participants
      .createQueryBuilder('p')
      .select('p.exam_id', 'examId')
      .addSelect('COUNT(*)', 'count')
      .where('p.exam_id IN (:...ids)', { ids: examIds })
      .groupBy('p.exam_id')
      .getRawMany<{ examId: string; count: string }>();
    for (const r of parts) map.get(r.examId)!.participantCount = Number(r.count);
    return map;
  }

  async getOneForStaff(id: string, user: JwtPayload): Promise<IExam> {
    const exam = await this.loadExamOrThrow(id);
    if (user.role === UserRole.TEACHER && exam.createdBy !== user.sub) {
      throw new ForbiddenException('You do not manage this exam');
    }
    const counts = await this.countsFor([id]);
    return this.toDto(exam, counts.get(id));
  }

  async create(payload: ICreateExamPayload, user: JwtPayload): Promise<IExam> {
    const startAt = new Date(payload.startAt);
    const endAt = new Date(payload.endAt);
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) throw new BadRequestException('Invalid start/end time');
    if (endAt <= startAt) throw new BadRequestException('endAt must be after startAt');

    const exam = this.exams.create({
      title: payload.title,
      slug: this.slugify(payload.title),
      description: payload.description ?? '',
      format: payload.format ?? ContestFormat.PRACTICE,
      rankingRule: payload.rankingRule ?? ExamRankingRule.SCORE_THEN_TIME,
      tieMode: payload.tieMode ?? ExamTieMode.COMPETITION,
      status: ExamStatus.DRAFT,
      startAt,
      endAt,
      durationMinutes: payload.durationMinutes ?? null,
      freezeAt: payload.freezeAt ? new Date(payload.freezeAt) : null,
      visibility: payload.visibility ?? ExamVisibility.CLASS,
      classIds: payload.classIds ?? null,
      createdBy: user.sub,
      autoFinalize: payload.autoFinalize ?? true,
      autoGrantReward: payload.autoGrantReward ?? false,
      settings: payload.settings ?? null,
    });
    const saved = await this.exams.save(exam);
    await this.audit.log(saved.id, user.sub, ExamAuditAction.CREATED, { title: saved.title });
    return this.toDto(saved, { problemCount: 0, participantCount: 0 });
  }

  async update(id: string, payload: IUpdateExamPayload, user: JwtPayload): Promise<IExam> {
    const exam = await this.loadExamOrThrow(id);
    this.assertManager(exam, user);
    if (exam.status === ExamStatus.FINALIZED && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Finalized exams can only be edited by an admin');
    }

    if (payload.title !== undefined) exam.title = payload.title;
    if (payload.description !== undefined) exam.description = payload.description;
    if (payload.format !== undefined) exam.format = payload.format;
    if (payload.rankingRule !== undefined) exam.rankingRule = payload.rankingRule;
    if (payload.tieMode !== undefined) exam.tieMode = payload.tieMode;
    if (payload.startAt !== undefined) exam.startAt = new Date(payload.startAt);
    if (payload.endAt !== undefined) exam.endAt = new Date(payload.endAt);
    if (payload.durationMinutes !== undefined) exam.durationMinutes = payload.durationMinutes;
    if (payload.freezeAt !== undefined) exam.freezeAt = payload.freezeAt ? new Date(payload.freezeAt) : null;
    if (payload.visibility !== undefined) exam.visibility = payload.visibility;
    if (payload.classIds !== undefined) exam.classIds = payload.classIds;
    if (payload.autoFinalize !== undefined) exam.autoFinalize = payload.autoFinalize;
    if (payload.autoGrantReward !== undefined) exam.autoGrantReward = payload.autoGrantReward;
    if (payload.settings !== undefined) exam.settings = payload.settings;

    if (new Date(exam.endAt) <= new Date(exam.startAt)) throw new BadRequestException('endAt must be after startAt');

    const saved = await this.exams.save(exam);
    await this.audit.log(saved.id, user.sub, ExamAuditAction.UPDATED);
    this.ranking.invalidate(saved.id);
    return this.toDto(saved);
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const exam = await this.loadExamOrThrow(id);
    this.assertManager(exam, user);
    await this.exams.softDelete(id);
  }

  async setStatus(id: string, status: ExamStatus, action: ExamAuditAction, user: JwtPayload): Promise<IExam> {
    const exam = await this.loadExamOrThrow(id);
    this.assertManager(exam, user);
    exam.status = status;
    const saved = await this.exams.save(exam);
    await this.audit.log(saved.id, user.sub, action, { status });
    return this.toDto(saved);
  }

  async publish(id: string, user: JwtPayload): Promise<IExam> {
    const exam = await this.loadExamOrThrow(id);
    this.assertManager(exam, user);
    const count = await this.examProblems.count({ where: { examId: id } });
    if (count === 0) throw new BadRequestException('Cannot publish an exam with no problems');
    exam.status = ExamStatus.PUBLISHED;
    const saved = await this.exams.save(exam);
    await this.audit.log(saved.id, user.sub, ExamAuditAction.PUBLISHED);
    return this.toDto(saved);
  }

  async setFreeze(id: string, frozen: boolean, user: JwtPayload): Promise<IExam> {
    const exam = await this.loadExamOrThrow(id);
    this.assertManager(exam, user);
    exam.isFrozen = frozen;
    const saved = await this.exams.save(exam);
    await this.audit.log(saved.id, user.sub, frozen ? ExamAuditAction.FROZEN : ExamAuditAction.UNFROZEN);
    this.ranking.invalidate(id);
    return this.toDto(saved);
  }

  // ── Problems ─────────────────────────────────────────────────────────────

  async listProblems(examId: string): Promise<ExamProblem[]> {
    return this.examProblems.find({
      where: { examId },
      relations: ['assignment'],
      order: { orderIndex: 'ASC' },
    });
  }

  private validateSubtasks(subtasks: ISubtaskConfig[] | null | undefined): void {
    if (!subtasks || subtasks.length === 0) return;
    const sorted = subtasks.slice().sort((a, b) => a.testIndexFrom - b.testIndexFrom);
    let prevTo = -1;
    for (const st of sorted) {
      if (st.testIndexFrom < 0 || st.testIndexTo < st.testIndexFrom) {
        throw new BadRequestException('Invalid subtask range');
      }
      if (st.testIndexFrom <= prevTo) throw new BadRequestException('Subtask ranges must not overlap');
      if (st.points < 0) throw new BadRequestException('Subtask points must be >= 0');
      prevTo = st.testIndexTo;
    }
  }

  async addProblem(examId: string, payload: IAddExamProblemPayload, user: JwtPayload): Promise<ExamProblem> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    const assignment = await this.assignments.findOne({ where: { id: payload.assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    this.validateSubtasks(payload.subtaskConfig);

    const existing = await this.examProblems.findOne({ where: { examId, assignmentId: payload.assignmentId } });
    if (existing) throw new BadRequestException('Problem already added to this exam');

    const maxOrder = await this.examProblems
      .createQueryBuilder('p')
      .select('COALESCE(MAX(p.order_index), -1)', 'max')
      .where('p.exam_id = :examId', { examId })
      .getRawOne<{ max: string }>();

    const problem = this.examProblems.create({
      examId,
      assignmentId: payload.assignmentId,
      orderIndex: payload.orderIndex ?? Number(maxOrder?.max ?? -1) + 1,
      label: payload.label ?? null,
      points: payload.points ?? assignment.points ?? 100,
      scoringMode: payload.scoringMode,
      subtaskConfig: payload.subtaskConfig ?? null,
    });
    const saved = await this.examProblems.save(problem);
    await this.audit.log(examId, user.sub, ExamAuditAction.PROBLEM_ADDED, { assignmentId: payload.assignmentId });
    this.ranking.invalidate(examId);
    return saved;
  }

  async updateProblem(
    examId: string,
    examProblemId: string,
    payload: IUpdateExamProblemPayload,
    user: JwtPayload,
  ): Promise<ExamProblem> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    const problem = await this.examProblems.findOne({ where: { id: examProblemId, examId } });
    if (!problem) throw new NotFoundException('Exam problem not found');
    if (payload.subtaskConfig !== undefined) this.validateSubtasks(payload.subtaskConfig);

    if (payload.orderIndex !== undefined) problem.orderIndex = payload.orderIndex;
    if (payload.label !== undefined) problem.label = payload.label;
    if (payload.points !== undefined) problem.points = payload.points;
    if (payload.scoringMode !== undefined) problem.scoringMode = payload.scoringMode;
    if (payload.subtaskConfig !== undefined) problem.subtaskConfig = payload.subtaskConfig;

    const saved = await this.examProblems.save(problem);
    this.ranking.invalidate(examId);
    return saved;
  }

  async removeProblem(examId: string, examProblemId: string, user: JwtPayload): Promise<void> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    const problem = await this.examProblems.findOne({ where: { id: examProblemId, examId } });
    if (!problem) throw new NotFoundException('Exam problem not found');
    await this.examProblems.delete({ id: examProblemId });
    await this.audit.log(examId, user.sub, ExamAuditAction.PROBLEM_REMOVED, { assignmentId: problem.assignmentId });
    this.ranking.invalidate(examId);
  }

  // ── Participants ─────────────────────────────────────────────────────────

  async listParticipants(examId: string, user: JwtPayload): Promise<ExamParticipant[]> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    return this.participants.find({ where: { examId }, relations: ['user'], order: { createdAt: 'ASC' } });
  }

  async inviteParticipants(examId: string, userIds: string[], user: JwtPayload): Promise<{ added: number }> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    if (!userIds?.length) return { added: 0 };
    const values = userIds.map((uid) => ({
      examId,
      userId: uid,
      state: ExamParticipantState.INVITED,
      invitedBy: user.sub,
    }));
    const res = await this.participants
      .createQueryBuilder()
      .insert()
      .into(ExamParticipant)
      .values(values)
      .orIgnore()
      .execute();
    await this.audit.log(examId, user.sub, ExamAuditAction.PARTICIPANT_ADDED, { count: userIds.length });
    return { added: res.identifiers.filter(Boolean).length };
  }

  async removeParticipant(examId: string, userId: string, user: JwtPayload): Promise<void> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    await this.participants.delete({ examId, userId });
    await this.audit.log(examId, user.sub, ExamAuditAction.PARTICIPANT_REMOVED, { userId });
  }

  async setBan(examId: string, userId: string, banned: boolean, reason: string | null, user: JwtPayload): Promise<void> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    const participant = await this.participants.findOne({ where: { examId, userId } });
    if (!participant) throw new NotFoundException('Participant not found');
    participant.state = banned ? ExamParticipantState.BANNED : ExamParticipantState.JOINED;
    participant.banReason = banned ? reason : null;
    await this.participants.save(participant);
    await this.audit.log(
      examId,
      user.sub,
      banned ? ExamAuditAction.PARTICIPANT_BANNED : ExamAuditAction.PARTICIPANT_UNBANNED,
      { userId, reason },
    );
    this.ranking.invalidate(examId);
  }

  // ── Reward rules ─────────────────────────────────────────────────────────

  async listRewardRules(examId: string, user: JwtPayload): Promise<ExamRewardRule[]> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    return this.rewardRules.find({ where: { examId }, order: { priority: 'ASC', createdAt: 'ASC' } });
  }

  async createRewardRule(examId: string, payload: ICreateExamRewardRulePayload, user: JwtPayload): Promise<ExamRewardRule> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    const rule = this.rewardRules.create({
      examId,
      type: payload.type,
      label: payload.label ?? null,
      condition: payload.condition ?? {},
      reward: payload.reward ?? {},
      priority: payload.priority ?? 0,
      isActive: payload.isActive ?? true,
    });
    const saved = await this.rewardRules.save(rule);
    await this.audit.log(examId, user.sub, ExamAuditAction.UPDATED, { rewardRuleCreated: saved.id });
    return saved;
  }

  async updateRewardRule(
    examId: string,
    ruleId: string,
    payload: IUpdateExamRewardRulePayload,
    user: JwtPayload,
  ): Promise<ExamRewardRule> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    const rule = await this.rewardRules.findOne({ where: { id: ruleId, examId } });
    if (!rule) throw new NotFoundException('Reward rule not found');
    if (payload.type !== undefined) rule.type = payload.type;
    if (payload.label !== undefined) rule.label = payload.label;
    if (payload.condition !== undefined) rule.condition = payload.condition;
    if (payload.reward !== undefined) rule.reward = payload.reward;
    if (payload.priority !== undefined) rule.priority = payload.priority;
    if (payload.isActive !== undefined) rule.isActive = payload.isActive;
    return this.rewardRules.save(rule);
  }

  async deleteRewardRule(examId: string, ruleId: string, user: JwtPayload): Promise<void> {
    const exam = await this.loadExamOrThrow(examId);
    this.assertManager(exam, user);
    await this.rewardRules.delete({ id: ruleId, examId });
  }

  // ── Leaderboard ──────────────────────────────────────────────────────────

  /**
   * Build a leaderboard response. Staff (asAdmin) always see the live board;
   * students see the frozen board during the freeze window and the official
   * snapshot once finalized.
   */
  async getLeaderboard(
    examId: string,
    viewer: JwtPayload,
    opts: { asStaff: boolean } = { asStaff: false },
  ): Promise<IExamLeaderboardResponse> {
    const exam = await this.loadExamOrThrow(examId);
    const official = exam.status === ExamStatus.FINALIZED;

    let rows: IExamRankingRow[];
    let frozen = false;

    if (official) {
      rows = await this.officialRows(exam);
    } else {
      const problems = await this.getScoringProblems(examId);
      const staffView = opts.asStaff && this.isStaff(viewer);
      frozen = !staffView && this.isFrozenNow(exam);
      const asOf = frozen ? this.effectiveFreezeAt(exam)?.getTime() ?? null : null;
      rows = await this.ranking.rankedLive(exam, problems, { asOf });
    }

    await this.attachNames(rows);
    let me: IExamRankingRow | null = null;
    for (const r of rows) {
      if (r.userId === viewer.sub) {
        r.isMe = true;
        me = r;
      }
    }

    return {
      examId,
      rankingRule: exam.rankingRule,
      tieMode: exam.tieMode,
      frozen,
      official,
      rows,
      me,
      total: rows.length,
    };
  }

  private async officialRows(exam: Exam): Promise<IExamRankingRow[]> {
    const snaps = await this.snapshots.find({
      where: { examId: exam.id, version: exam.snapshotVersion },
      order: { rank: 'ASC' },
    });
    return snaps.map((s) => ({
      rank: s.rank,
      displayRank: s.displayRank,
      userId: s.userId,
      name: '',
      username: null,
      avatarUrl: null,
      totalScore: s.totalScore,
      solvedCount: s.solvedCount,
      penalty: s.penalty,
      lastSolveTimeMs: s.lastSolveTimeMs != null ? Number(s.lastSolveTimeMs) : null,
      problemResults: s.perProblem ?? [],
    }));
  }

  private async attachNames(rows: IExamRankingRow[]): Promise<void> {
    const ids = [...new Set(rows.map((r) => r.userId))];
    if (ids.length === 0) return;
    const users = await this.users.find({
      where: { id: In(ids) },
      select: ['id', 'username', 'firstName', 'lastName', 'avatarUrl'],
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    for (const r of rows) {
      const u = byId.get(r.userId);
      r.name = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || (u.username ?? 'Unknown') : 'Unknown';
      r.username = u?.username ?? null;
      r.avatarUrl = u?.avatarUrl ?? null;
    }
  }

  // ── Student-facing helpers ───────────────────────────────────────────────

  async listMyExams(userId: string) {
    const myClassIds = await this.studentClassIds(userId);
    const myParticipations = await this.participants.find({ where: { userId } });
    const participatingExamIds = new Set(myParticipations.map((p) => p.examId));
    const stateByExam = new Map(myParticipations.map((p) => [p.examId, p.state]));

    // Student-visible statuses only.
    const visibleStatuses = [ExamStatus.PUBLISHED, ExamStatus.FINALIZING, ExamStatus.FINALIZED];
    const exams = await this.exams.find({
      where: { status: In(visibleStatuses), deletedAt: IsNull() },
      order: { startAt: 'DESC' },
    });

    const visible = exams.filter((e) => {
      if (participatingExamIds.has(e.id) && stateByExam.get(e.id) !== ExamParticipantState.BANNED) return true;
      if (e.visibility === ExamVisibility.PUBLIC) return true;
      if (e.visibility === ExamVisibility.CLASS && e.classIds?.some((c) => myClassIds.includes(c))) return true;
      return false;
    });

    const counts = await this.countsFor(visible.map((e) => e.id));
    return visible.map((e) => ({
      ...this.toDto(e, counts.get(e.id)),
      myState: stateByExam.get(e.id) ?? null,
    }));
  }

  /** Visibility check used before serving exam content to a student. */
  async assertStudentCanView(exam: Exam, userId: string): Promise<ExamParticipant | null> {
    const participant = await this.participants.findOne({ where: { examId: exam.id, userId } });
    if (participant && participant.state === ExamParticipantState.BANNED) {
      throw new ForbiddenException('You are banned from this exam');
    }
    const visibleStatus = [ExamStatus.PUBLISHED, ExamStatus.FINALIZING, ExamStatus.FINALIZED].includes(exam.status);
    if (!visibleStatus) throw new ForbiddenException('Exam is not available');
    if (participant) return participant;
    if (exam.visibility === ExamVisibility.PUBLIC) return null;
    if (exam.visibility === ExamVisibility.CLASS) {
      const myClassIds = await this.studentClassIds(userId);
      if (exam.classIds?.some((c) => myClassIds.includes(c))) return null;
    }
    throw new ForbiddenException('You are not allowed to view this exam');
  }

  /** Effective per-participant end instant. */
  participantEndsAt(exam: Exam, participant: ExamParticipant | null): Date {
    const examEnd = new Date(exam.endAt);
    if (!exam.durationMinutes || !participant?.joinedAt) return examEnd;
    const personal = new Date(new Date(participant.joinedAt).getTime() + exam.durationMinutes * 60000);
    return personal < examEnd ? personal : examEnd;
  }

  async join(examId: string, userId: string): Promise<ExamParticipant> {
    const exam = await this.loadExamOrThrow(examId);
    const existing = await this.assertStudentCanView(exam, userId);

    const phase = this.derivePhase(exam);
    if (phase === ExamPhase.ENDED) throw new BadRequestException('Exam has ended');
    if (exam.status !== ExamStatus.PUBLISHED) throw new BadRequestException('Exam is not open');
    if (
      phase === ExamPhase.RUNNING &&
      exam.durationMinutes &&
      exam.settings?.allowLateJoin === false &&
      !existing?.joinedAt
    ) {
      // Late join into a personal-window exam is allowed only when configured.
    }

    if (existing) {
      if (!existing.joinedAt) {
        existing.joinedAt = new Date();
        existing.state = ExamParticipantState.JOINED;
        return this.participants.save(existing);
      }
      return existing;
    }

    const participant = this.participants.create({
      examId,
      userId,
      state: ExamParticipantState.JOINED,
      joinedAt: new Date(),
    });
    return this.participants.save(participant);
  }

  private examProblemToDto(p: ExamProblem) {
    return {
      id: p.id,
      examId: p.examId,
      assignmentId: p.assignmentId,
      orderIndex: p.orderIndex,
      label: p.label,
      points: p.points,
      scoringMode: p.scoringMode,
      subtaskConfig: p.subtaskConfig,
      createdAt: new Date(p.createdAt).toISOString(),
      updatedAt: new Date(p.updatedAt).toISOString(),
      assignment: p.assignment
        ? {
            id: p.assignment.id,
            title: p.assignment.title,
            slug: p.assignment.slug,
            difficulty: p.assignment.difficulty as unknown as string,
          }
        : undefined,
    };
  }

  /** Server-authoritative take-exam payload for a student. */
  async getStudentTakePayload(examId: string, userId: string) {
    const exam = await this.loadExamOrThrow(examId);
    const participant = await this.assertStudentCanView(exam, userId);
    const phase = this.derivePhase(exam);
    const problems = await this.examProblems.find({
      where: { examId },
      relations: ['assignment'],
      order: { orderIndex: 'ASC' },
    });
    return {
      exam: this.toDto(exam),
      phase,
      serverTime: new Date().toISOString(),
      endsAt: this.participantEndsAt(exam, participant).toISOString(),
      participant: participant
        ? {
            id: participant.id,
            examId: participant.examId,
            userId: participant.userId,
            state: participant.state,
            joinedAt: participant.joinedAt ? new Date(participant.joinedAt).toISOString() : null,
            invitedBy: participant.invitedBy,
            banReason: participant.banReason,
            createdAt: new Date(participant.createdAt).toISOString(),
            updatedAt: new Date(participant.updatedAt).toISOString(),
          }
        : null,
      problems: problems.map((p) => this.examProblemToDto(p)),
    };
  }

  /** Sanitized single-problem content for solving (hidden testcases stripped). */
  async getStudentProblem(examId: string, examProblemId: string, userId: string) {
    const exam = await this.loadExamOrThrow(examId);
    await this.assertStudentCanView(exam, userId);
    const phase = this.derivePhase(exam);
    if (phase === ExamPhase.UPCOMING) throw new BadRequestException('Exam has not started yet');

    const problem = await this.examProblems.findOne({
      where: { id: examProblemId, examId },
      relations: ['assignment'],
    });
    if (!problem || !problem.assignment) throw new NotFoundException('Problem not found');

    const a = problem.assignment;
    const cfg = a.codingConfig;
    const sanitizedConfig = cfg
      ? {
          ...cfg,
          // Keep only sample testcases; never leak hidden testcase data.
          testCases: (cfg.testCases ?? []).filter((tc) => !tc.isHidden),
        }
      : null;

    return {
      id: problem.id,
      examId: problem.examId,
      label: problem.label,
      points: problem.points,
      scoringMode: problem.scoringMode,
      orderIndex: problem.orderIndex,
      assignment: {
        id: a.id,
        title: a.title,
        description: a.description,
        difficulty: a.difficulty,
        points: a.points,
        tags: a.tags ?? [],
        codingConfig: sanitizedConfig,
      },
    };
  }

  async getMyResult(examId: string, userId: string) {
    const exam = await this.loadExamOrThrow(examId);
    await this.assertStudentCanView(exam, userId);
    const snap = await this.snapshots.findOne({
      where: { examId, version: exam.snapshotVersion, userId },
    });
    const rewards = await this.grants.find({ where: { examId, userId }, relations: ['rule'] });
    return {
      exam: this.toDto(exam),
      rank: snap?.rank ?? null,
      displayRank: snap?.displayRank ?? null,
      totalScore: snap?.totalScore ?? 0,
      solvedCount: snap?.solvedCount ?? 0,
      penalty: snap?.penalty ?? 0,
      problemResults: snap?.perProblem ?? [],
      rewards: rewards.map((g) => ({
        id: g.id,
        examId: g.examId,
        userId: g.userId,
        rewardRuleId: g.rewardRuleId,
        status: g.status,
        grantedGems: g.grantedGems,
        grantedXp: g.grantedXp,
        grantedBadgeId: g.grantedBadgeId,
        snapshotVersion: g.snapshotVersion,
        errorMessage: g.errorMessage,
        createdAt: new Date(g.createdAt).toISOString(),
        updatedAt: new Date(g.updatedAt).toISOString(),
        rule: g.rule ? { id: g.rule.id, type: g.rule.type, label: g.rule.label } : undefined,
      })),
    };
  }
}
