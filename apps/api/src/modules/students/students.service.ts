import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository, In, MoreThanOrEqual, Not } from 'typeorm';
import { EnrollmentStatus, UserRole, SubmissionStatus } from '@cp/shared';

import { User } from '../users/user.entity';
import { StudentProfile } from './student-profile.entity';
import { Guardian } from './guardian.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateMyStudentDto } from './dto/update-my-student.dto';
import { Enrollment } from '../classes/enrollment.entity';
import { ClassCourse } from '../classes/class-course.entity';
import { Assignment } from '../assignments/assignment.entity';
import { Submission } from '../submissions/submission.entity';

@Injectable()
export class StudentsService extends TypeOrmCrudService<StudentProfile> {
  constructor(
    @InjectRepository(StudentProfile) repo: Repository<StudentProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Guardian) private readonly guardians: Repository<Guardian>,
    private readonly ds: DataSource,
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

    return this.ds.transaction(async (tx) => {
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
  }

  async updateStudent(id: string, dto: UpdateStudentDto): Promise<StudentProfile> {
    const profile = await this.repo.findOne({ where: { id }, relations: ['user', 'guardians'] });
    if (!profile) throw new NotFoundException(`Student ${id} not found`);

    return this.ds.transaction(async (tx) => {
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
    const profile = await this.repo.findOne({
      where: { userId },
      relations: ['user', 'guardians'],
    });
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

    return this.ds.transaction(async (tx) => {
      const userRepo = tx.getRepository(User);
      const profileRepo = tx.getRepository(StudentProfile);

      if (
        dto.firstName !== undefined ||
        dto.lastName !== undefined ||
        dto.username !== undefined ||
        dto.avatarUrl !== undefined
      ) {
        await userRepo.update(
          { id: userId },
          {
            ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
            ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
            ...(dto.username !== undefined ? { username: nextUsername } : {}),
            ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl?.trim() || null } : {}),
          },
        );
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
    return { defaultLanguage: lang };
  }

  async getDashboardData(userId: string): Promise<any> {
    const profile = await this.repo.findOne({ where: { userId }, relations: ['user'] });
    if (!profile) throw new NotFoundException(`Student profile not found for user ${userId}`);

    // 1. Daily Quests
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const dailyQuestsCompleted = await this.ds.getRepository(Submission).count({
      where: { userId, status: SubmissionStatus.ACCEPTED, createdAt: MoreThanOrEqual(startOfDay) },
    });
    const dailyQuestsTarget = 5;

    // 2. Leaderboard
    const topProfiles = await this.repo.find({
      order: { xp: 'DESC' },
      take: 10,
      relations: ['user'],
    });
    const leaderboard = topProfiles.map((p, index) => ({
      rank: index + 1,
      name: p.userId === userId ? 'You' : `${p.user.firstName} ${p.user.lastName.charAt(0)}.`,
      points: p.xp.toLocaleString(),
      isMe: p.userId === userId,
      avatarInitial: p.userId === userId ? 'Y' : p.user.firstName.charAt(0).toUpperCase(),
    }));

    // 3. Enrolled Courses
    const enrollments = await this.ds.getRepository(Enrollment).find({ where: { studentId: userId } });
    const classIds = enrollments.map(e => e.classId);
    
    let enrolledCourses: any[] = [];
    if (classIds.length > 0) {
      const classCourses = await this.ds.getRepository(ClassCourse).find({
        where: { classId: In(classIds) },
        relations: ['course'],
      });
      
      // Deduplicate courses
      const uniqueCourses = new Map();
      classCourses.forEach(cc => {
        if (!uniqueCourses.has(cc.course.id)) {
          uniqueCourses.set(cc.course.id, {
            id: cc.course.id,
            title: cc.course.title,
            progress: 0, // Mocked until progress calculation is implemented
            colorGradient: 'from-cyan-500 to-blue-600',
            icon: 'menu_book',
          });
        }
      });
      enrolledCourses = Array.from(uniqueCourses.values());
    }

    // 4. Active Quests (Assignments)
    let activeQuests: any[] = [];
    if (classIds.length > 0) {
      // Postgres array overlap operator '&&'
      const assignments = await this.ds.getRepository(Assignment)
        .createQueryBuilder('a')
        .where('a.classIds && ARRAY[:...classIds]::uuid[]', { classIds })
        .limit(5)
        .getMany();

      activeQuests = assignments.map((a, idx) => ({
        id: a.id,
        title: a.title,
        icon: idx % 2 === 0 ? 'functions' : 'code',
        duration: a.estimatedMinutes ? `${a.estimatedMinutes} mins` : '20 mins',
        progress: 0, // Mocked until detailed submission progress is calculated
        colorPrefix: idx % 2 === 0 ? 'emerald' : 'purple',
      }));
    }

    return {
      level: profile.level,
      xp: profile.xp,
      xpForNext: profile.level * 1000,
      streak: profile.streak,
      gems: profile.gems,
      dailyQuestsCompleted,
      dailyQuestsTarget,
      defaultLanguage: profile.defaultLanguage || 'cpp',
      activeQuests,
      enrolledCourses,
      achievements: [ // Kept mocked as agreed
        {
          id: 'a1',
          icon: 'workspace_premium',
          label: 'Top of the Class',
          caption: 'Ranked #1 this week',
          unlocked: true,
        },
        {
          id: 'a2',
          icon: 'bolt',
          label: 'Lightning Fast',
          caption: 'Solved in under 5 mins',
          unlocked: true,
        },
        {
          id: 'a3',
          icon: 'military_tech',
          label: 'Code Master',
          caption: 'Completed 50 quests',
          unlocked: false,
        },
      ],
      leaderboard,
    };
  }
}
