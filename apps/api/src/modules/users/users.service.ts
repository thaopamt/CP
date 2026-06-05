import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Not, Repository } from 'typeorm';

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
      avatarUrl?: string | null;
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
        ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl?.trim() || null } : {}),
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
}
