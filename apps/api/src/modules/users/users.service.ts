import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';

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
}
