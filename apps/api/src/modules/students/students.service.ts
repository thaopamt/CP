import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { EnrollmentStatus, UserRole } from '@cp/shared';

import { User } from '../users/user.entity';
import { StudentProfile } from './student-profile.entity';
import { Guardian } from './guardian.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

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
    // Pre-validate uniqueness so we can return 409 with a clear message
    const existingByEmail = await this.users.findOne({ where: { email: dto.email } });
    if (existingByEmail) {
      throw new ConflictException(`Email ${dto.email} is already registered`);
    }
    const studentId = dto.studentId ?? generateStudentId(dto.cohortYear ?? new Date().getFullYear());
    const existingByStudentId = await this.repo.findOne({ where: { studentId } });
    if (existingByStudentId) {
      throw new ConflictException(`Student ID ${studentId} already exists`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.ds.transaction(async (tx) => {
      const userRepo = tx.getRepository(User);
      const profileRepo = tx.getRepository(StudentProfile);
      const guardianRepo = tx.getRepository(Guardian);

      const user = await userRepo.save(
        userRepo.create({
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.STUDENT,
          passwordHash,
          isActive: true,
          avatarUrl: null,
        }),
      );

      const profile = await profileRepo.save(
        profileRepo.create({
          userId: user.id,
          studentId,
          dateOfBirth: dto.dateOfBirth ?? null,
          gender: dto.gender ?? null,
          homeAddress: dto.homeAddress ?? null,
          school: dto.school ?? null,
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
            phoneNumber: g.phoneNumber,
            email: g.email ?? null,
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
      if (dto.firstName || dto.lastName || dto.email) {
        await userRepo.update(
          { id: profile.userId },
          {
            ...(dto.firstName ? { firstName: dto.firstName } : {}),
            ...(dto.lastName ? { lastName: dto.lastName } : {}),
            ...(dto.email ? { email: dto.email } : {}),
          },
        );
      }

      // Profile-side updates
      const profilePatch: Partial<StudentProfile> = {};
      if (dto.studentId !== undefined) profilePatch.studentId = dto.studentId;
      if (dto.dateOfBirth !== undefined) profilePatch.dateOfBirth = dto.dateOfBirth;
      if (dto.gender !== undefined) profilePatch.gender = dto.gender;
      if (dto.homeAddress !== undefined) profilePatch.homeAddress = dto.homeAddress;
      if (dto.school !== undefined) profilePatch.school = dto.school;
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
                email: g.email ?? null,
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

  async resetPassword(studentId: string, newPassword: string): Promise<void> {
    const profile = await this.repo.findOne({ where: { id: studentId } });
    if (!profile) throw new NotFoundException(`Student ${studentId} not found`);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.update({ id: profile.userId }, { passwordHash });
  }

  async getDashboardData(userId: string): Promise<any> {
    const profile = await this.repo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException(`Student profile not found for user ${userId}`);

    // Aggregate gamification fields and mock the arrays for the dashboard
    return {
      level: profile.level,
      xp: profile.xp,
      xpForNext: profile.level * 1000,
      streak: profile.streak,
      gems: profile.gems,
      dailyQuestsCompleted: 3, // Mocked
      dailyQuestsTarget: 5,    // Mocked
      activeQuests: [
        {
          id: 'q1',
          title: 'Linear Algebra Basics',
          subject: 'Mathematics',
          icon: 'functions',
          duration: '45 mins',
          progress: 75,
          colorPrefix: 'emerald',
        },
        {
          id: 'q2',
          title: 'Intro to Python Arrays',
          subject: 'Computer Science',
          icon: 'code',
          duration: '20 mins',
          progress: 30,
          colorPrefix: 'purple',
        },
      ],
      enrolledCourses: [
        {
          id: 'c1',
          title: 'Advanced Algorithms',
          progress: 65,
          colorGradient: 'from-cyan-500 to-blue-600',
          icon: 'data_object',
        },
        {
          id: 'c2',
          title: 'Database Design',
          progress: 15,
          colorGradient: 'from-rose-500 to-orange-500',
          icon: 'database',
        },
        {
          id: 'c3',
          title: 'Machine Learning 101',
          progress: 80,
          colorGradient: 'from-fuchsia-500 to-purple-600',
          icon: 'smart_toy',
        },
      ],
      achievements: [
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
      leaderboard: [
        { rank: 1, name: 'Alice W.', points: '3,240', isMe: false, avatarInitial: 'A' },
        { rank: 2, name: 'You', points: '2,890', isMe: true, avatarInitial: 'Y' },
        { rank: 3, name: 'John D.', points: '2,400', isMe: false, avatarInitial: 'J' },
      ],
    };
  }
}

/** "STU-{cohortYear}-{4-digit random}" */
function generateStudentId(cohortYear: number): string {
  const suffix = Math.floor(Math.random() * 9000 + 1000).toString();
  return `STU-${cohortYear}-${suffix}`;
}
