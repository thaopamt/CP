import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Not, QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@cp/shared';

import { User } from './user.entity';

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo);
  }

  /**
   * Login flow needs the password hash, which the entity has marked
   * `select: false`. We pull it explicitly via addSelect() and never
   * leak it through other call sites.
   * Accepts email OR username as the identifier.
   */
  async findByEmailWithPassword(identifier: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :identifier OR u.username = :identifier', { identifier })
      .getOne();
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.refreshTokenHash')
      .where('u.id = :id', { id })
      .getOne();
  }

  async findActiveById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id, isActive: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
    });
  }

  async updateOwnProfile(
    id: string,
    patch: {
      firstName?: string;
      lastName?: string;
      username?: string | null;
    },
  ): Promise<User> {
    const user = await this.findActiveById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const nextUsername =
      patch.username === undefined ? undefined : patch.username?.trim() || null;

    if (nextUsername) {
      const existing = await this.repo.findOne({
        where: { username: nextUsername, id: Not(id) },
      });
      if (existing) {
        throw new ConflictException(`Username ${nextUsername} is already taken`);
      }
    }

    await this.repo.update(
      { id },
      {
        ...(patch.firstName !== undefined ? { firstName: patch.firstName.trim() } : {}),
        ...(patch.lastName !== undefined ? { lastName: patch.lastName.trim() } : {}),
        ...(patch.username !== undefined ? { username: nextUsername } : {}),
      },
    );

    const updated = await this.findActiveById(id);
    if (!updated) throw new NotFoundException(`User ${id} not found`);
    return updated;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.repo.update({ id }, { passwordHash });
  }

  async updateRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.repo.update({ id }, { refreshTokenHash });
  }

  // ── Admin account management (e.g. teachers) ─────────────────────────────

  /** Creates a user account with a hashed password. Defaults to TEACHER. */
  async createUser(dto: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    username?: string | null;
    role?: UserRole;
  }): Promise<User> {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username?.trim() || null;

    if (await this.repo.findOne({ where: { email } })) {
      throw new ConflictException(`Email ${email} is already in use`);
    }
    if (username && (await this.repo.findOne({ where: { username } }))) {
      throw new ConflictException(`Username ${username} is already taken`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.repo.save(
      this.repo.create({
        email,
        username,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: dto.role ?? UserRole.TEACHER,
        passwordHash,
        isActive: true,
      }),
    );

    // Re-fetch so the select:false password hash never round-trips out.
    return this.repo.findOneOrFail({ where: { id: created.id } });
  }

  /** Admin edit of a user's profile fields and active flag. */
  async adminUpdate(
    id: string,
    patch: {
      email?: string;
      firstName?: string;
      lastName?: string;
      username?: string | null;
      isActive?: boolean;
    },
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);

    const nextEmail = patch.email === undefined ? undefined : patch.email.trim().toLowerCase();
    const nextUsername =
      patch.username === undefined ? undefined : patch.username?.trim() || null;

    if (nextEmail && nextEmail !== user.email) {
      const existing = await this.repo.findOne({ where: { email: nextEmail, id: Not(id) } });
      if (existing) throw new ConflictException(`Email ${nextEmail} is already in use`);
    }
    if (nextUsername) {
      const existing = await this.repo.findOne({ where: { username: nextUsername, id: Not(id) } });
      if (existing) throw new ConflictException(`Username ${nextUsername} is already taken`);
    }

    await this.repo.update(
      { id },
      {
        ...(nextEmail !== undefined ? { email: nextEmail } : {}),
        ...(patch.firstName !== undefined ? { firstName: patch.firstName.trim() } : {}),
        ...(patch.lastName !== undefined ? { lastName: patch.lastName.trim() } : {}),
        ...(nextUsername !== undefined ? { username: nextUsername } : {}),
        ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      },
    );

    return this.repo.findOneOrFail({ where: { id } });
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.update({ id }, { passwordHash });
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    try {
      await this.repo.delete({ id });
    } catch (err) {
      // FK violations (e.g. the account still owns chat/attendance records).
      if (err instanceof QueryFailedError) {
        throw new ConflictException(
          'This account still has related records and cannot be deleted. Deactivate it instead.',
        );
      }
      throw err;
    }
  }
}
