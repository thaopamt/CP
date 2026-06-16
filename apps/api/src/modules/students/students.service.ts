import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository, In, MoreThanOrEqual, Not } from 'typeorm';
import { DayOfWeek, EnrollmentStatus, PublishStatus, SubmissionStatus, UserRole } from '@cp/shared';
import { CourseContentKind, type ICourseNextStep } from '@cp/shared';

import { User } from '../users/user.entity';
import { StudentProfile } from './student-profile.entity';
import { Guardian } from './guardian.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateMyStudentDto } from './dto/update-my-student.dto';
import { Enrollment } from '../classes/enrollment.entity';
import { ClassCourse } from '../classes/class-course.entity';
import { CourseAssignment } from '../courses/course-assignment.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Submission } from '../submissions/submission.entity';
import { StudentAssignmentProgress } from '../submissions/student-assignment-progress.entity';
import { StudentSchedule } from './student-schedule.entity';
import { SystemCacheService } from '../../common/cache/system-cache.service';
import {
  advanceLevel,
  DAILY_QUESTS_TARGET,
  xpThresholdForNextLevel,
  xpIntoCurrentLevel,
  xpBucketSize,
} from '../../common/gamification.constants';

@Injectable()
export class StudentsService extends TypeOrmCrudService<StudentProfile> {
  constructor(
    @InjectRepository(StudentProfile) repo: Repository<StudentProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Guardian) private readonly guardians: Repository<Guardian>,
    private readonly ds: DataSource,
    private readonly cache: SystemCacheService,
  ) {
    super(repo);
  }

  /**
   * Atomically create User (auth identity) + StudentProfile + Guardian rows.
   * Returns the freshly-loaded profile with guardians eager-attached.
   */
  async createStudent(dto: CreateStudentDto): Promise<StudentProfile> {
    const email = `student-${randomUUID()}@internal.local`;
    const { firstName, lastName } = this.splitFullName(dto.fullName);
    // Pre-validate uniqueness so we can return 409 with a clear message
    const existingByEmail = await this.users.findOne({ where: { email } });
    if (existingByEmail) {
      throw new ConflictException(`Email ${email} is already registered`);
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.ds.transaction(async (tx) => {
      const userRepo = tx.getRepository(User);
      const profileRepo = tx.getRepository(StudentProfile);
      const guardianRepo = tx.getRepository(Guardian);

      const user = await userRepo.save(
        userRepo.create({
          email,
          username: dto.username || null,
          firstName,
          lastName,
          role: UserRole.STUDENT,
          passwordHash,
          isActive: true,
          avatarUrl: null,
        }),
      );

      const profile = await profileRepo.save(
        profileRepo.create({
          userId: user.id,
          homeAddress: dto.homeAddress ?? null,
          grade: dto.grade,
          cohortYear: dto.cohortYear ?? new Date().getFullYear() + (12 - dto.grade),
          startDate: dto.startDate ?? null,
          status: dto.status ?? EnrollmentStatus.ACTIVE,
          monthlyTuition: dto.monthlyTuition ?? 0,
        }),
      );

      if (dto.guardians?.length) {
        const rows = dto.guardians.map((g, idx) =>
          guardianRepo.create({
            studentProfileId: profile.id,
            fullName: g.fullName,
            relationship: g.relationship,
            phoneNumber: g.phoneNumber ?? '',
            // First guardian is primary by default unless caller specifies
            isPrimary: g.isPrimary ?? idx === 0,
          }),
        );
        await guardianRepo.save(rows);
      }

      const loaded = await profileRepo.findOne({
        where: { id: profile.id },
        relations: ['user', 'guardians'],
      });
      if (!loaded) throw new NotFoundException();
      return loaded;
    });
    void this.cache.bumpTags([
      'students:list',
      'leaderboard:global',
      'finance:monthly',
      'attendance:schedule',
      `student:${created.userId}:profile`,
      `student:${created.userId}:dashboard`,
    ]);
    return created;
  }

  async updateStudent(id: string, dto: UpdateStudentDto): Promise<StudentProfile> {
    const profile = await this.repo.findOne({ where: { id }, relations: ['user', 'guardians'] });
    if (!profile) throw new NotFoundException(`Student ${id} not found`);

    const updated = await this.ds.transaction(async (tx) => {
      const userRepo = tx.getRepository(User);
      const profileRepo = tx.getRepository(StudentProfile);
      const guardianRepo = tx.getRepository(Guardian);

      // User-side updates
      if (dto.fullName !== undefined || dto.username !== undefined) {
        const userPatch: Partial<User> = {};
        if (dto.fullName !== undefined) {
          Object.assign(userPatch, this.splitFullName(dto.fullName));
        }
        if (dto.username !== undefined) {
          userPatch.username = dto.username || null;
        }
        await userRepo.update(
          { id: profile.userId },
          userPatch,
        );
      }

      // Profile-side updates
      const profilePatch: Partial<StudentProfile> = {};
      if (dto.homeAddress !== undefined) profilePatch.homeAddress = dto.homeAddress;
      if (dto.grade !== undefined) profilePatch.grade = dto.grade;
      if (dto.cohortYear !== undefined) profilePatch.cohortYear = dto.cohortYear;
      if (dto.startDate !== undefined) profilePatch.startDate = dto.startDate;
      if (dto.status !== undefined) profilePatch.status = dto.status;
      if (dto.monthlyTuition !== undefined) profilePatch.monthlyTuition = dto.monthlyTuition;
      if (dto.honorRoll !== undefined) profilePatch.honorRoll = dto.honorRoll;
      if (Object.keys(profilePatch).length) {
        await profileRepo.update({ id }, profilePatch);
      }

      // Replace guardian list if provided
      if (dto.guardians) {
        await guardianRepo.delete({ studentProfileId: id });
        if (dto.guardians.length) {
          await guardianRepo.save(
            dto.guardians.map((g, idx) =>
              guardianRepo.create({
                studentProfileId: id,
                fullName: g.fullName,
                relationship: g.relationship,
                phoneNumber: g.phoneNumber,
                isPrimary: g.isPrimary ?? idx === 0,
              }),
            ),
          );
        }
      }

      const loaded = await profileRepo.findOne({
        where: { id },
        relations: ['user', 'guardians'],
      });
      if (!loaded) throw new NotFoundException();
      return loaded;
    });
    void this.cache.bumpTags([
      'students:list',
      'leaderboard:global',
      'finance:monthly',
      'attendance:schedule',
      `student:${updated.userId}:profile`,
      `student:${updated.userId}:dashboard`,
    ]);
    return updated;
  }

  private splitFullName(fullName: string): Pick<User, 'firstName' | 'lastName'> {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) {
      return { firstName: parts[0] ?? 'Student', lastName: '' };
    }
    return {
      firstName: parts.slice(0, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  }

  async getStudentByUserId(userId: string): Promise<StudentProfile> {
    const profile = await this.cache.remember(
      {
        namespace: 'student-profile-by-user',
        parts: [userId],
        tags: [`student:${userId}:profile`],
        ttlMs: 30_000,
      },
      () =>
        this.repo.findOne({
          where: { userId },
          relations: ['user', 'guardians'],
        }),
    );
    if (!profile) throw new NotFoundException(`Student profile not found for user ${userId}`);
    return profile;
  }

  async updateCurrentStudent(userId: string, dto: UpdateMyStudentDto): Promise<StudentProfile> {
    const profile = await this.getStudentByUserId(userId);

    const nextUsername =
      dto.username === undefined ? undefined : dto.username?.trim() || null;
    if (nextUsername) {
      const existing = await this.users.findOne({
        where: { username: nextUsername, id: Not(userId) },
      });
      if (existing) {
        throw new ConflictException(`Username ${nextUsername} is already taken`);
      }
    }

    const updated = await this.ds.transaction(async (tx) => {
      const userRepo = tx.getRepository(User);
      const profileRepo = tx.getRepository(StudentProfile);

      if (dto.username !== undefined) {
        await userRepo.update({ id: userId }, { username: nextUsername });
      }

      const profilePatch: Partial<StudentProfile> = {};
      if (dto.homeAddress !== undefined) profilePatch.homeAddress = dto.homeAddress?.trim() || null;

      if (Object.keys(profilePatch).length) {
        await profileRepo.update({ id: profile.id }, profilePatch);
      }

      const loaded = await profileRepo.findOne({
        where: { id: profile.id },
        relations: ['user', 'guardians'],
      });
      if (!loaded) throw new NotFoundException();
      return loaded;
    });
    void this.cache.bumpTags([`student:${userId}:profile`, `student:${userId}:dashboard`, 'students:list']);
    return updated;
  }

  async resetPassword(studentId: string, newPassword: string): Promise<void> {
    const profile = await this.repo.findOne({ where: { id: studentId } });
    if (!profile) throw new NotFoundException(`Student ${studentId} not found`);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.update({ id: profile.userId }, { passwordHash });
  }

  async updateDefaultLanguage(userId: string, language: string): Promise<{ defaultLanguage: string }> {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException(`Student profile not found for user ${userId}`);

    const allowed = ['cpp', 'java', 'python', 'javascript'];
    const lang = allowed.includes(language) ? language : 'cpp';

    profile.defaultLanguage = lang;
    await this.repo.save(profile);
    void this.cache.bumpTags([`student:${userId}:dashboard`, `student:${userId}:profile`]);
    return { defaultLanguage: lang };
  }

  async getDashboardData(userId: string): Promise<any> {
    return this.cache.remember(
      {
        namespace: 'student-dashboard',
        parts: [userId],
        tags: [`student:${userId}:dashboard`, `student:${userId}:profile`, 'leaderboard:global'],
        ttlMs: 20_000,
      },
      () => this.buildDashboardData(userId),
    );
  }

  private async buildDashboardData(userId: string): Promise<any> {
    const profile = await this.repo.findOne({ where: { userId }, relations: ['user'] });
    if (!profile) throw new NotFoundException(`Student profile not found for user ${userId}`);

    // Defensive: recalculate level from XP in case it was not updated
    // (e.g. badge XP rewards previously skipped the level-up check).
    const levelCorrected = advanceLevel(profile);
    if (levelCorrected) {
      await this.repo.update({ id: profile.id }, { level: profile.level });
      void this.cache.bumpTags([`student:${userId}:profile`, `student:${userId}:dashboard`, 'leaderboard:global']);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(startOfDay);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));

    const dailyQuestsCompleted = await this.ds.getRepository(Submission).count({
      where: { userId, status: SubmissionStatus.ACCEPTED, createdAt: MoreThanOrEqual(startOfDay) },
    });
    const weeklyAccepted = await this.ds.getRepository(Submission).count({
      where: { userId, status: SubmissionStatus.ACCEPTED, createdAt: MoreThanOrEqual(startOfWeek) },
    });
    const dailyQuestsTarget = DAILY_QUESTS_TARGET;

    const topProfiles = await this.repo.find({
      order: { xp: 'DESC' },
      take: 10,
      relations: ['user'],
    });
    const leaderboard = topProfiles.map((p, index) => ({
      rank: index + 1,
      name: p.userId === userId ? 'You' : this.formatDisplayName(p.user),
      points: p.xp.toLocaleString(),
      isMe: p.userId === userId,
      avatarInitial: this.getInitials(p.user),
    }));

    const enrollments = await this.ds.getRepository(Enrollment).find({
      where: { studentId: userId },
      relations: ['class'],
    });
    const classIds = enrollments.map(e => e.classId);

    const classCourses = classIds.length
      ? await this.ds.getRepository(ClassCourse).find({
          where: { classId: In(classIds) },
          relations: ['course', 'class'],
          order: { orderIndex: 'ASC' },
        })
      : [];
    const courseIds = [...new Set(classCourses.map((cc) => cc.courseId))];
    const courseAssignments = courseIds.length
      ? await this.ds.getRepository(CourseAssignment)
          .createQueryBuilder('ca')
          .leftJoinAndSelect('ca.assignment', 'a')
          .where('"ca"."course_id" IN (:...courseIds)', { courseIds })
          .andWhere('a.status = :status', { status: PublishStatus.PUBLISHED })
          .orderBy('"ca"."order_index"', 'ASC')
          .getMany()
      : [];
    const scopedAssignments = await this.getScopedAssignmentsForDashboard(classIds);

    const allAssignments = new Map<string, Assignment>();
    for (const ca of courseAssignments) allAssignments.set(ca.assignment.id, ca.assignment);
    for (const assignment of scopedAssignments) allAssignments.set(assignment.id, assignment);

    const assignmentIds = [...allAssignments.keys()];
    const progressRows = assignmentIds.length
      ? await this.ds.getRepository(StudentAssignmentProgress).find({
          where: { studentId: userId, assignmentId: In(assignmentIds) },
        })
      : [];
    const progressByAssignment = new Map(progressRows.map((p) => [p.assignmentId, p]));
    const getProgress = (assignmentId: string): number => {
      const p = progressByAssignment.get(assignmentId);
      if (!p) return 0;
      if (p.completed) return 100;
      if (p.totalCount > 0) return Math.max(5, Math.round((p.passedCount / p.totalCount) * 100));
      return p.lastStatus ? 10 : 0;
    };

    const totalAssignments = assignmentIds.length;
    const totalCompleted = progressRows.filter((p) => p.completed).length;
    const overallProgress = totalAssignments > 0 ? Math.round((totalCompleted / totalAssignments) * 100) : 0;

    const courseAssignmentsByCourse = new Map<string, CourseAssignment[]>();
    for (const ca of courseAssignments) {
      const rows = courseAssignmentsByCourse.get(ca.courseId) ?? [];
      rows.push(ca);
      courseAssignmentsByCourse.set(ca.courseId, rows);
    }

    const enrolledCourses = Array.from(
      classCourses.reduce((acc, cc) => {
        if (!acc.has(cc.course.id)) acc.set(cc.course.id, cc);
        return acc;
      }, new Map<string, ClassCourse>()).values(),
    ).map((cc, idx) => {
      const rows = courseAssignmentsByCourse.get(cc.courseId) ?? [];
      const isMazeCourse = cc.course.contentKind === CourseContentKind.MAZE;
      const completedAssignments = rows.filter((row) => getProgress(row.assignmentId) === 100).length;
      const progress = rows.length > 0 ? Math.round((completedAssignments / rows.length) * 100) : 0;
      return {
        id: cc.course.id,
        classId: cc.classId,
        className: cc.class?.name,
        code: cc.course.code,
        title: cc.course.title,
        progress,
        completedAssignments,
        totalAssignments: isMazeCourse ? cc.course.assignmentCount : rows.length,
        route: isMazeCourse ? `/student/maze?courseId=${cc.course.id}` : `/student/classes/${cc.classId}/courses/${cc.course.id}`,
        colorGradient: idx % 2 === 0 ? 'from-primary to-tertiary' : 'from-secondary to-primary',
        icon: isMazeCourse ? 'extension' : 'menu_book',
      };
    });

    const courseNextSteps = classCourses
      .map((cc): ICourseNextStep | null => {
        const rows = [...(courseAssignmentsByCourse.get(cc.courseId) ?? [])].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
        if (rows.length === 0) return null;

        const completedAssignments = rows.filter((row) => getProgress(row.assignmentId) === 100).length;
        const courseProgress = Math.round((completedAssignments / rows.length) * 100);
        const nextRow = rows.find((row) => getProgress(row.assignmentId) < 100);
        if (!nextRow) return null;

        const assignment = nextRow.assignment;
        return {
          id: `${cc.id}:${assignment.id}`,
          classId: cc.classId,
          className: cc.class?.name ?? null,
          courseId: cc.course.id,
          courseCode: cc.course.code,
          courseTitle: cc.course.title,
          courseProgress,
          completedAssignments,
          totalAssignments: rows.length,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          assignmentDifficulty: assignment.difficulty,
          assignmentPoints: assignment.points,
          assignmentProgress: getProgress(assignment.id),
          estimatedMinutes: assignment.estimatedMinutes ?? undefined,
          route: assignment.codingConfig
            ? `/student/workspace/${assignment.id}`
            : `/student/assignments/${assignment.id}`,
        };
      })
      .filter((step): step is ICourseNextStep => step !== null)
      .sort((a, b) => {
        const aStarted = a.assignmentProgress > 0 ? 0 : 1;
        const bStarted = b.assignmentProgress > 0 ? 0 : 1;
        if (aStarted !== bStarted) return aStarted - bStarted;
        return b.assignmentProgress - a.assignmentProgress || b.courseProgress - a.courseProgress;
      })
      .slice(0, 6);

    const recentSubmissions = await this.ds.getRepository(Submission).find({
      where: { userId },
      relations: ['assignment'],
      order: { createdAt: 'DESC' },
      take: 5,
    });
    const recentAccepted = recentSubmissions.find((submission) => submission.status === SubmissionStatus.ACCEPTED);
    const targetPoints = recentAccepted?.assignment?.points ?? Math.max(10, profile.level * 10);

    const activeQuests = Array.from(allAssignments.values())
      .map((a, idx) => ({
        id: a.id,
        title: a.title,
        subject: a.tags?.[0] ?? 'Practice',
        icon: a.codingConfig ? 'code' : 'assignment',
        duration: a.estimatedMinutes ? `${a.estimatedMinutes} mins` : '20 mins',
        progress: getProgress(a.id),
        difficulty: a.difficulty,
        xpReward: a.points,
        route: a.codingConfig ? `/student/workspace/${a.id}` : `/student/assignments/${a.id}`,
        colorPrefix: idx % 2 === 0 ? 'emerald' : 'cyan',
      }))
      .filter((a) => a.progress < 100)
      .sort((a, b) => {
        const aStarted = a.progress > 0 ? 0 : 1;
        const bStarted = b.progress > 0 ? 0 : 1;
        if (aStarted !== bStarted) return aStarted - bStarted;
        const aPointDistance = Math.abs(a.xpReward - targetPoints);
        const bPointDistance = Math.abs(b.xpReward - targetPoints);
        return aPointDistance - bPointDistance || b.progress - a.progress || b.xpReward - a.xpReward;
      })
      .slice(0, 6);

    const scheduleRows = await this.ds.getRepository(StudentSchedule).find({
      where: { studentId: userId },
      relations: ['class'],
      order: { startTime: 'ASC' },
    });
    const todayKey = this.getTodayKey();
    const todaySchedule = scheduleRows
      .filter((session) => session.dayOfWeek === todayKey)
      .sort((a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime))
      .map((session) => this.toScheduleSummary(session, 0));
    const nextSession = this.findNextScheduleSession(scheduleRows);

    const recommendedCourseStep = courseNextSteps[0];
    const recommendedNext = recommendedCourseStep
      ? {
          title: recommendedCourseStep.assignmentTitle,
          subtitle: recommendedCourseStep.assignmentProgress > 0
            ? 'Continue from your course sequence'
            : 'Next assignment in your course',
          icon: recommendedCourseStep.assignmentProgress > 0 ? 'pending_actions' : 'play_lesson',
          route: recommendedCourseStep.route,
          actionLabel: 'Open',
          tone: recommendedCourseStep.assignmentProgress > 0 ? 'success' : 'primary',
          source: 'course',
        }
      : activeQuests[0]
        ? {
          title: activeQuests[0].title,
          subtitle: 'Standalone assignment matched to your level',
          icon: activeQuests[0].icon,
          route: activeQuests[0].route,
          actionLabel: 'Open',
          tone: activeQuests[0].progress > 0 ? 'success' : 'primary',
          source: 'assignment',
        }
      : nextSession
        ? {
            title: nextSession.className ?? 'Next class',
            subtitle: `${this.formatDay(nextSession.dayOfWeek)} ${nextSession.startTime}-${nextSession.endTime}`,
            icon: 'event',
            route: '/student/classes',
            actionLabel: 'View schedule',
            tone: 'neutral',
            source: 'schedule',
          }
        : null;

    return {
      studentName: this.formatFullName(profile.user),
      level: profile.level,
      xp: profile.xp,
      xpForNext: xpThresholdForNextLevel(profile.level),
      xpIntoLevel: xpIntoCurrentLevel(profile.xp, profile.level),
      xpPerLevel: xpBucketSize(profile.level),
      streak: profile.streak,
      gems: profile.gems,
      nameColor: profile.nameColor ?? null,
      equippedTitle: profile.equippedTitle ?? null,
      equippedFrame: profile.equippedFrame ?? null,
      equippedTheme: profile.equippedTheme ?? null,
      dailyQuestsCompleted,
      dailyQuestsTarget,
      weeklyAccepted,
      totalAssignments,
      totalCompleted,
      overallProgress,
      defaultLanguage: profile.defaultLanguage || 'cpp',
      activeQuests,
      enrolledCourses,
      courseNextSteps,
      achievements: [
        {
          id: 'firstAccepted',
          icon: 'workspace_premium',
          label: 'First accepted',
          caption: 'Solved your first assignment',
          unlocked: totalCompleted > 0,
        },
        {
          id: 'dailyGoal',
          icon: 'bolt',
          label: 'Daily goal',
          caption: 'Finished today target',
          unlocked: dailyQuestsCompleted >= dailyQuestsTarget,
        },
        {
          id: 'streak3',
          icon: 'local_fire_department',
          label: 'Three-day streak',
          caption: 'Studied three days in a row',
          unlocked: profile.streak >= 3,
        },
        {
          id: 'tenSolved',
          icon: 'military_tech',
          label: 'Code master',
          caption: 'Completed 10 assignments',
          unlocked: totalCompleted >= 10,
        },
      ],
      leaderboard,
      todaySchedule,
      nextSession,
      recentSubmissions: recentSubmissions.map((submission) => ({
        id: submission.id,
        assignmentId: submission.assignmentId,
        assignmentTitle: submission.assignment?.title ?? 'Assignment',
        status: submission.status,
        language: submission.language,
        passedCount: submission.passedCount,
        totalCount: submission.totalCount,
        createdAt: submission.createdAt.toISOString(),
        route: submission.assignment?.codingConfig
          ? `/student/workspace/${submission.assignmentId}`
          : `/student/assignments/${submission.assignmentId}`,
      })),
      recommendedNext,
    };
  }

  private async getScopedAssignmentsForDashboard(classIds: string[]): Promise<Assignment[]> {
    const qb = this.ds.getRepository(Assignment)
      .createQueryBuilder('a')
      .where('a.status = :status', { status: PublishStatus.PUBLISHED });

    if (classIds.length > 0) {
      qb.andWhere(
        '("a"."class_ids" IS NULL OR CARDINALITY("a"."class_ids") = 0 OR "a"."class_ids" && ARRAY[:...classIds]::uuid[])',
        { classIds },
      );
    } else {
      qb.andWhere('("a"."class_ids" IS NULL OR CARDINALITY("a"."class_ids") = 0)');
    }

    return qb.orderBy('a.updatedAt', 'DESC').limit(40).getMany();
  }

  private getTodayKey(): DayOfWeek {
    const days = [
      DayOfWeek.SUN,
      DayOfWeek.MON,
      DayOfWeek.TUE,
      DayOfWeek.WED,
      DayOfWeek.THU,
      DayOfWeek.FRI,
      DayOfWeek.SAT,
    ];
    return days[new Date().getDay()];
  }

  private findNextScheduleSession(rows: StudentSchedule[]) {
    if (!rows.length) return null;
    const now = new Date();
    const todayIndex = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const ranked = rows
      .map((row) => {
        const dayIndex = this.dayIndex(row.dayOfWeek);
        let startsInDays = (dayIndex - todayIndex + 7) % 7;
        const startMinutes = this.timeToMinutes(row.startTime);
        if (startsInDays === 0 && startMinutes < currentMinutes) startsInDays = 7;
        return { row, startsInDays, startMinutes };
      })
      .sort((a, b) => a.startsInDays - b.startsInDays || a.startMinutes - b.startMinutes);

    const next = ranked[0];
    return next ? this.toScheduleSummary(next.row, next.startsInDays) : null;
  }

  private toScheduleSummary(session: StudentSchedule, startsInDays?: number) {
    return {
      id: session.id,
      classId: session.classId,
      className: session.class?.name ?? null,
      classCode: session.class?.code ?? null,
      dayOfWeek: session.dayOfWeek,
      startTime: this.formatTime(session.startTime),
      endTime: this.formatTime(session.endTime),
      ...(startsInDays !== undefined ? { startsInDays } : {}),
    };
  }

  private dayIndex(day: DayOfWeek): number {
    return {
      [DayOfWeek.SUN]: 0,
      [DayOfWeek.MON]: 1,
      [DayOfWeek.TUE]: 2,
      [DayOfWeek.WED]: 3,
      [DayOfWeek.THU]: 4,
      [DayOfWeek.FRI]: 5,
      [DayOfWeek.SAT]: 6,
    }[day];
  }

  private timeToMinutes(time: string): number {
    const [hour, minute] = time.split(':').map((part) => Number(part));
    return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
  }

  private formatTime(time: string): string {
    return time.slice(0, 5);
  }

  private formatDay(day: DayOfWeek): string {
    return {
      [DayOfWeek.MON]: 'Mon',
      [DayOfWeek.TUE]: 'Tue',
      [DayOfWeek.WED]: 'Wed',
      [DayOfWeek.THU]: 'Thu',
      [DayOfWeek.FRI]: 'Fri',
      [DayOfWeek.SAT]: 'Sat',
      [DayOfWeek.SUN]: 'Sun',
    }[day];
  }

  private formatFullName(user: User): string {
    return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || 'Student';
  }

  private formatDisplayName(user: User): string {
    const initial = user.lastName?.charAt(0);
    return initial ? `${user.firstName} ${initial}.` : user.firstName || user.username || 'Student';
  }

  private getInitials(user: User): string {
    const name = this.formatFullName(user);
    return name
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'S';
  }
}
