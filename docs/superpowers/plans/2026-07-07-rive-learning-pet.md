# Learning Pet (Rive) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thú cưng học tập cho học sinh — pet có XP/level/evolution/mood riêng, ăn EXP từ hoạt động học tập qua quest engine, render bằng Rive trong widget nổi trên mọi trang student.

**Architecture:** Backend NestJS thêm module `pets` (entity `student_pets` 1-1 User, mood tính khi đọc, không cron), hook duy nhất trong `QuestsService.handleEvent()`, realtime qua `GamificationGateway` sẵn có. Frontend Vite React thêm `PetWidget` mount trong `StudentLayout`, render qua `@rive-app/react-canvas` với adapter `pet-rig.ts` ánh xạ 6 hành vi về 3 trigger của file Roboware.

**Tech Stack:** NestJS 10 + TypeORM 0.3 + Postgres, Vite + React 18 + react-query 5 + zustand 4 + framer-motion 11, `@rive-app/react-canvas` (dep mới duy nhất).

**Spec:** `docs/superpowers/specs/2026-07-07-rive-learning-pet-design.md`

## Global Constraints

- Monorepo Nx 20, pnpm 9.12.0, Node >= 20. Mọi dependency nằm ở **root** `package.json` — cài bằng `pnpm add -w <pkg>`.
- **DB dev là AWS RDS dùng chung.** `synchronize: true` tự tạo bảng `student_pets` khi boot API (chấp nhận được, các bảng trước đều vậy). TUYỆT ĐỐI không chạy seed/cleanup/xoá dữ liệu.
- **Không dùng Postgres enum** — cột `mood`/`species` là `varchar` (bài học schema-drift: synchronize không sửa được enum/named constraint về sau).
- Entity extends `BaseEntity` (`apps/api/src/common/entities/base.entity.ts`); cột mới đặt tên snake_case qua option `name:`.
- UI copy tiếng Việt (theo codebase hiện tại).
- Pet flow backend không bao giờ được làm hỏng pipeline chấm bài/quest — mọi lời gọi từ quest engine phải `.catch` + log.
- File Rive: `apps/web/public/pet/roboware.riv`. Nếu file CHƯA tồn tại → **DỪNG, hỏi user** tải từ https://rive.app/marketplace/27869-52666-roboware-character-builder/ (miễn phí, cần tài khoản Rive). License CC BY 4.0 — phải có attribution "Roboware by Sutrisno_88".
- Backend test: `npx nx test api --testPathPattern=modules/pets`. Frontend KHÔNG có test target — verify bằng `npx tsc -p apps/web/tsconfig.app.json --noEmit` + kiểm tra browser.
- Tên trigger Rive (`trg_happy`, `trg_sad`, `trg_greeting`) và state machine (`main_sm`) là **giả định phải xác minh** ở Task 5 bằng dump `rive.contents`; nếu khác → chỉ sửa `pet-rig.ts`.

---

### Task 1: Shared types + pure pet logic (TDD)

**Files:**
- Create: `libs/shared/src/lib/types/pet.types.ts`
- Modify: `libs/shared/src/index.ts` (thêm 1 dòng export)
- Modify: `libs/shared/src/lib/types/gamification.types.ts:158-172` (mở rộng event union)
- Create: `apps/api/src/modules/pets/pet-logic.ts`
- Test: `apps/api/src/modules/pets/pet-logic.spec.ts`

**Interfaces:**
- Consumes: không có (task đầu).
- Produces: enum `PetMood { HAPPY, IDLE, SLEEPY, SAD }`; interface `IStudentPetView { id, name, species, level, evolutionStage, mood, xpIntoLevel, xpForNextLevel, shouldGreet, lastActivityAt }`; `IUpdatePetPayload { name: string }`; `GamificationEventType` mở rộng thêm `'pet:xp' | 'pet:level_up' | 'pet:evolve'`; các hàm thuần `computeMood(lastActivityAt: Date | null, now: Date): PetMood`, `petXpForActivity(points?: number): number`, `xpForLevel(level: number): number`, `evolutionStageForLevel(level: number): number`, `applyPetXp(pet: { xp: number; level: number; evolutionStage: number }, gain: number): { leveledUp: boolean; evolved: boolean }`, `DEFAULT_SPECIES = 'roboware'`.

**Ngữ nghĩa XP:** `pet.xp` là XP **trong level hiện tại** (trừ dần khi lên level), không phải cumulative. Level n → n+1 cần `n * 100` XP.

- [ ] **Step 1: Tạo shared types**

`libs/shared/src/lib/types/pet.types.ts`:

```ts
// ───────────────────────────────────────────────────────────────────────────
// Learning pet — thú cưng học tập của học sinh. Pet có XP/level/evolution
// riêng (tách khỏi StudentProfile.xp/level), mood suy từ lastActivityAt.
// ───────────────────────────────────────────────────────────────────────────

export enum PetMood {
  HAPPY = 'HAPPY',
  IDLE = 'IDLE',
  SLEEPY = 'SLEEPY',
  SAD = 'SAD',
}

export interface IStudentPetView {
  id: string;
  /** Tên do học sinh đặt, null = chưa đặt. */
  name: string | null;
  /** Key trỏ tới rig render phía frontend (vd 'roboware'). */
  species: string;
  level: number;
  evolutionStage: number;
  mood: PetMood;
  /** XP trong level hiện tại (reset mỗi lần lên level). */
  xpIntoLevel: number;
  /** XP cần để lên level kế = level * 100. */
  xpForNextLevel: number;
  /** True nếu đây là lần đầu mở pet trong ngày — frontend bắn trigger chào. */
  shouldGreet: boolean;
  lastActivityAt: string | null;
}

export interface IUpdatePetPayload {
  name: string;
}
```

- [ ] **Step 2: Export từ index + mở rộng gamification event union**

Trong `libs/shared/src/index.ts`, cạnh dòng `export * from './lib/types/gamification.types';` thêm:

```ts
export * from './lib/types/pet.types';
```

Trong `libs/shared/src/lib/types/gamification.types.ts`, sửa:

```ts
export type GamificationEventType =
  | 'quest:completed'
  | 'badge:earned'
  | 'level:up'
  | 'pet:xp'
  | 'pet:level_up'
  | 'pet:evolve';
```

và thêm các field optional vào `IGamificationEvent` (sau `rewardGems?: number;`):

```ts
  petXpGained?: number;
  petLevel?: number;
  petMood?: string;
  evolutionStage?: number;
```

- [ ] **Step 3: Viết failing test cho pet logic**

`apps/api/src/modules/pets/pet-logic.spec.ts`:

```ts
import { PetMood } from '@cp/shared';
import {
  applyPetXp,
  computeMood,
  evolutionStageForLevel,
  petXpForActivity,
  xpForLevel,
} from './pet-logic';

describe('pet-logic', () => {
  describe('computeMood', () => {
    const now = new Date('2026-07-07T10:00:00Z');
    it('chưa từng hoạt động → SAD', () => {
      expect(computeMood(null, now)).toBe(PetMood.SAD);
    });
    it('hoạt động hôm nay → HAPPY', () => {
      expect(computeMood(new Date('2026-07-07T01:00:00Z'), now)).toBe(PetMood.HAPPY);
    });
    it('nghỉ 1 ngày → IDLE', () => {
      expect(computeMood(new Date('2026-07-06T23:00:00Z'), now)).toBe(PetMood.IDLE);
    });
    it('nghỉ 2 ngày → SLEEPY', () => {
      expect(computeMood(new Date('2026-07-05T10:00:00Z'), now)).toBe(PetMood.SLEEPY);
    });
    it('nghỉ 3 ngày trở lên → SAD', () => {
      expect(computeMood(new Date('2026-07-04T10:00:00Z'), now)).toBe(PetMood.SAD);
      expect(computeMood(new Date('2026-06-01T10:00:00Z'), now)).toBe(PetMood.SAD);
    });
  });

  describe('petXpForActivity', () => {
    it('không có points → tối thiểu 5', () => {
      expect(petXpForActivity(undefined)).toBe(5);
      expect(petXpForActivity(0)).toBe(5);
    });
    it('points 100 → 10, points 37 → floor về min 5, points 120 → 12', () => {
      expect(petXpForActivity(100)).toBe(10);
      expect(petXpForActivity(37)).toBe(5);
      expect(petXpForActivity(120)).toBe(12);
    });
  });

  describe('xpForLevel / evolutionStageForLevel', () => {
    it('level n cần n*100 XP', () => {
      expect(xpForLevel(1)).toBe(100);
      expect(xpForLevel(7)).toBe(700);
    });
    it('evolution stage theo mốc 1-4 / 5-9 / 10-19 / 20+', () => {
      expect(evolutionStageForLevel(1)).toBe(1);
      expect(evolutionStageForLevel(4)).toBe(1);
      expect(evolutionStageForLevel(5)).toBe(2);
      expect(evolutionStageForLevel(9)).toBe(2);
      expect(evolutionStageForLevel(10)).toBe(3);
      expect(evolutionStageForLevel(19)).toBe(3);
      expect(evolutionStageForLevel(20)).toBe(4);
    });
  });

  describe('applyPetXp', () => {
    it('cộng XP chưa đủ ngưỡng → không lên level', () => {
      const pet = { xp: 0, level: 1, evolutionStage: 1 };
      const r = applyPetXp(pet, 50);
      expect(r).toEqual({ leveledUp: false, evolved: false });
      expect(pet).toEqual({ xp: 50, level: 1, evolutionStage: 1 });
    });
    it('đạt đúng ngưỡng → lên level, xp trừ phần dư', () => {
      const pet = { xp: 90, level: 1, evolutionStage: 1 };
      const r = applyPetXp(pet, 15);
      expect(r.leveledUp).toBe(true);
      expect(pet.level).toBe(2);
      expect(pet.xp).toBe(5);
    });
    it('lên nhiều level một lần', () => {
      const pet = { xp: 0, level: 1, evolutionStage: 1 };
      applyPetXp(pet, 100 + 200 + 10); // đủ level 1→2 (100) và 2→3 (200), dư 10
      expect(pet.level).toBe(3);
      expect(pet.xp).toBe(10);
    });
    it('lên level 5 → evolved = true, stage = 2', () => {
      const pet = { xp: 0, level: 4, evolutionStage: 1 };
      const r = applyPetXp(pet, 400);
      expect(r).toEqual({ leveledUp: true, evolved: true });
      expect(pet.evolutionStage).toBe(2);
    });
  });
});
```

- [ ] **Step 4: Chạy test, xác nhận FAIL**

Run: `npx nx test api --testPathPattern=modules/pets`
Expected: FAIL — `Cannot find module './pet-logic'`

- [ ] **Step 5: Viết pet-logic.ts**

`apps/api/src/modules/pets/pet-logic.ts`:

```ts
import { PetMood } from '@cp/shared';

/** Species mặc định — phải khớp key trong PET_RIGS phía frontend. */
export const DEFAULT_SPECIES = 'roboware';

/** XP cần để đi từ level n → n+1. Tuyến tính cho dễ giải thích với học sinh. */
export function xpForLevel(level: number): number {
  return level * 100;
}

/** Stage 1: lv 1-4, stage 2: lv 5-9, stage 3: lv 10-19, stage 4: lv 20+. */
export function evolutionStageForLevel(level: number): number {
  if (level >= 20) return 4;
  if (level >= 10) return 3;
  if (level >= 5) return 2;
  return 1;
}

/** Pet XP mỗi hoạt động = ceil(points/10), tối thiểu 5. */
export function petXpForActivity(points?: number): number {
  return Math.max(5, Math.ceil((points ?? 0) / 10));
}

function utcDayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000);
}

/**
 * Mood suy từ số NGÀY LỊCH (UTC) không hoạt động — cùng quy ước dayKey UTC
 * với streak trong quest engine.
 */
export function computeMood(lastActivityAt: Date | null, now: Date): PetMood {
  if (!lastActivityAt) return PetMood.SAD;
  const idleDays = utcDayNumber(now) - utcDayNumber(lastActivityAt);
  if (idleDays <= 0) return PetMood.HAPPY;
  if (idleDays === 1) return PetMood.IDLE;
  if (idleDays === 2) return PetMood.SLEEPY;
  return PetMood.SAD;
}

/**
 * Cộng XP vào pet (mutate), xử lý lên nhiều level một lần.
 * `pet.xp` là XP trong level hiện tại — trừ dần khi vượt ngưỡng.
 */
export function applyPetXp(
  pet: { xp: number; level: number; evolutionStage: number },
  gain: number,
): { leveledUp: boolean; evolved: boolean } {
  pet.xp += gain;
  let leveledUp = false;
  while (pet.xp >= xpForLevel(pet.level)) {
    pet.xp -= xpForLevel(pet.level);
    pet.level += 1;
    leveledUp = true;
  }
  const stage = evolutionStageForLevel(pet.level);
  const evolved = stage > pet.evolutionStage;
  pet.evolutionStage = stage;
  return { leveledUp, evolved };
}
```

- [ ] **Step 6: Chạy test, xác nhận PASS**

Run: `npx nx test api --testPathPattern=modules/pets`
Expected: PASS — toàn bộ describe `pet-logic` xanh.

- [ ] **Step 7: Commit**

```bash
git add libs/shared/src/lib/types/pet.types.ts libs/shared/src/index.ts libs/shared/src/lib/types/gamification.types.ts apps/api/src/modules/pets/
git commit -m "feat(pets): add shared pet types and pure pet logic"
```

---

### Task 2: StudentPet entity + PetsService (TDD)

**Files:**
- Create: `apps/api/src/modules/pets/student-pet.entity.ts`
- Create: `apps/api/src/modules/pets/pets.service.ts`
- Test: `apps/api/src/modules/pets/pets.service.spec.ts`

**Interfaces:**
- Consumes (Task 1): `PetMood`, `IStudentPetView` từ `@cp/shared`; `computeMood`, `petXpForActivity`, `applyPetXp`, `xpForLevel`, `DEFAULT_SPECIES` từ `./pet-logic`. Consumes sẵn có: `GamificationGateway.publish(userId: string, event: IGamificationEvent)` từ `../quests/gamification.gateway`, `BaseEntity` từ `../../common/entities/base.entity`, `User` từ `../users/user.entity`.
- Produces: class `StudentPet` (entity); class `PetsService` với các method: `getOrCreate(userId: string): Promise<StudentPet>`, `getMe(userId: string): Promise<IStudentPetView>`, `rename(userId: string, name: string): Promise<IStudentPetView>`, `onLearningActivity(userId: string, ctx: { points?: number; alreadySolved?: boolean }): Promise<void>`.

**Quyết định UX (đã ghi trong spec review):** pet mới tạo có `lastActivityAt = now`, `mood = HAPPY` — pet "mới sinh" không được buồn ngay ngày đầu.

- [ ] **Step 1: Viết entity**

`apps/api/src/modules/pets/student-pet.entity.ts`:

```ts
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { PetMood } from '@cp/shared';

import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';
import { DEFAULT_SPECIES } from './pet-logic';

/**
 * Thú cưng học tập — 1-1 với User, tạo lazy lần đầu học sinh mở pet.
 * XP/level/evolution RIÊNG, không đụng StudentProfile.xp/level.
 *
 * `mood`/`species` là varchar (không dùng Postgres enum — synchronize không
 * sửa được enum về sau, xem bài học schema-drift).
 */
@Entity({ name: 'student_pets' })
export class StudentPet extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /** Tên do học sinh đặt. */
  @Column({ type: 'varchar', length: 30, nullable: true })
  name!: string | null;

  /** Key trỏ tới rig render phía frontend. */
  @Column({ type: 'varchar', length: 40, default: DEFAULT_SPECIES })
  species!: string;

  /** XP trong level hiện tại (reset khi lên level). */
  @Column({ type: 'int', default: 0 })
  xp!: number;

  @Column({ type: 'int', default: 1 })
  level!: number;

  @Column({ type: 'int', default: 1, name: 'evolution_stage' })
  evolutionStage!: number;

  /** Giá trị lưu lần cuối — luôn recompute từ lastActivityAt khi đọc. */
  @Column({ type: 'varchar', length: 12, default: PetMood.HAPPY })
  mood!: PetMood;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_activity_at' })
  lastActivityAt!: Date | null;

  /** Ngày (UTC) cuối cùng pet đã chào — mỗi ngày chào 1 lần. */
  @Column({ type: 'date', nullable: true, name: 'last_greeted_date' })
  lastGreetedDate!: string | null;
}
```

- [ ] **Step 2: Viết failing test cho PetsService**

`apps/api/src/modules/pets/pets.service.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { PetMood } from '@cp/shared';

import { PetsService } from './pets.service';
import { StudentPet } from './student-pet.entity';
import { GamificationGateway } from '../quests/gamification.gateway';

const USER_ID = 'user-1';

function makePet(overrides: Partial<StudentPet> = {}): StudentPet {
  return {
    id: 'pet-1',
    userId: USER_ID,
    name: null,
    species: 'roboware',
    xp: 0,
    level: 1,
    evolutionStage: 1,
    mood: PetMood.HAPPY,
    lastActivityAt: new Date(),
    lastGreetedDate: null,
    ...overrides,
  } as StudentPet;
}

describe('PetsService', () => {
  let service: PetsService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let gateway: { publish: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => v),
    };
    gateway = { publish: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: getRepositoryToken(StudentPet), useValue: repo },
        { provide: GamificationGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(PetsService);
  });

  describe('getOrCreate', () => {
    it('tạo pet mới với mood HAPPY và lastActivityAt = now khi chưa có', async () => {
      repo.findOne.mockResolvedValue(null);
      const pet = await service.getOrCreate(USER_ID);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, mood: PetMood.HAPPY }),
      );
      expect(pet.lastActivityAt).toBeInstanceOf(Date);
    });

    it('recompute mood khi đọc pet cũ (3 ngày không hoạt động → SAD)', async () => {
      const stale = makePet({
        mood: PetMood.HAPPY,
        lastActivityAt: new Date(Date.now() - 3 * 86_400_000),
      });
      repo.findOne.mockResolvedValue(stale);
      const pet = await service.getOrCreate(USER_ID);
      expect(pet.mood).toBe(PetMood.SAD);
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('lần đầu trong ngày → shouldGreet=true và cập nhật lastGreetedDate', async () => {
      repo.findOne.mockResolvedValue(makePet({ lastGreetedDate: null }));
      const view = await service.getMe(USER_ID);
      expect(view.shouldGreet).toBe(true);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastGreetedDate: expect.any(String) }),
      );
    });

    it('đã chào hôm nay → shouldGreet=false', async () => {
      const today = new Date().toISOString().slice(0, 10);
      repo.findOne.mockResolvedValue(makePet({ lastGreetedDate: today }));
      const view = await service.getMe(USER_ID);
      expect(view.shouldGreet).toBe(false);
    });

    it('trả về xpIntoLevel/xpForNextLevel đúng', async () => {
      repo.findOne.mockResolvedValue(makePet({ xp: 40, level: 3 }));
      const view = await service.getMe(USER_ID);
      expect(view.xpIntoLevel).toBe(40);
      expect(view.xpForNextLevel).toBe(300);
    });
  });

  describe('rename', () => {
    it('trim tên và lưu', async () => {
      repo.findOne.mockResolvedValue(makePet());
      const view = await service.rename(USER_ID, '  Robo  ');
      expect(view.name).toBe('Robo');
    });

    it('tên rỗng sau trim → BadRequestException', async () => {
      repo.findOne.mockResolvedValue(makePet());
      await expect(service.rename(USER_ID, '   ')).rejects.toThrow(BadRequestException);
    });
  });

  describe('onLearningActivity', () => {
    it('cộng XP, set mood HAPPY, publish pet:xp', async () => {
      repo.findOne.mockResolvedValue(makePet({ xp: 0, level: 1 }));
      await service.onLearningActivity(USER_ID, { points: 100 });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ xp: 10, mood: PetMood.HAPPY }),
      );
      expect(gateway.publish).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ type: 'pet:xp', petXpGained: 10 }),
      );
    });

    it('lên level → publish thêm pet:level_up', async () => {
      repo.findOne.mockResolvedValue(makePet({ xp: 95, level: 1 }));
      await service.onLearningActivity(USER_ID, { points: 100 });
      const types = gateway.publish.mock.calls.map(([, e]) => e.type);
      expect(types).toContain('pet:level_up');
    });

    it('tiến hoá (level 4→5) → publish thêm pet:evolve', async () => {
      repo.findOne.mockResolvedValue(makePet({ xp: 395, level: 4, evolutionStage: 1 }));
      await service.onLearningActivity(USER_ID, { points: 100 });
      const types = gateway.publish.mock.calls.map(([, e]) => e.type);
      expect(types).toContain('pet:evolve');
    });

    it('alreadySolved → cập nhật lastActivityAt/mood nhưng KHÔNG cộng XP, KHÔNG publish', async () => {
      const pet = makePet({ xp: 10, lastActivityAt: new Date(Date.now() - 86_400_000) });
      repo.findOne.mockResolvedValue(pet);
      await service.onLearningActivity(USER_ID, { points: 100, alreadySolved: true });
      expect(pet.xp).toBe(10);
      expect(pet.mood).toBe(PetMood.HAPPY);
      expect(repo.save).toHaveBeenCalled();
      expect(gateway.publish).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx nx test api --testPathPattern=modules/pets`
Expected: FAIL — `Cannot find module './pets.service'`

- [ ] **Step 4: Viết PetsService**

`apps/api/src/modules/pets/pets.service.ts`:

```ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IStudentPetView, PetMood } from '@cp/shared';

import { GamificationGateway } from '../quests/gamification.gateway';
import { StudentPet } from './student-pet.entity';
import {
  applyPetXp,
  computeMood,
  DEFAULT_SPECIES,
  petXpForActivity,
  xpForLevel,
} from './pet-logic';

@Injectable()
export class PetsService {
  private readonly logger = new Logger(PetsService.name);

  constructor(
    @InjectRepository(StudentPet) private readonly pets: Repository<StudentPet>,
    private readonly gateway: GamificationGateway,
  ) {}

  /** Tạo lazy: pet "mới sinh" bắt đầu HAPPY với lastActivityAt = now. */
  async getOrCreate(userId: string): Promise<StudentPet> {
    let pet = await this.pets.findOne({ where: { userId } });
    if (!pet) {
      try {
        pet = await this.pets.save(
          this.pets.create({
            userId,
            species: DEFAULT_SPECIES,
            mood: PetMood.HAPPY,
            lastActivityAt: new Date(),
          }),
        );
        return pet;
      } catch (err) {
        // Race với request song song — unique index user_id đã chặn, đọc lại.
        pet = await this.pets.findOne({ where: { userId } });
        if (!pet) throw err;
      }
    }
    const mood = computeMood(pet.lastActivityAt, new Date());
    if (mood !== pet.mood) {
      pet.mood = mood;
      await this.pets.save(pet);
    }
    return pet;
  }

  async getMe(userId: string): Promise<IStudentPetView> {
    const pet = await this.getOrCreate(userId);
    const today = new Date().toISOString().slice(0, 10);
    const shouldGreet = pet.lastGreetedDate !== today;
    if (shouldGreet) {
      pet.lastGreetedDate = today;
      await this.pets.save(pet);
    }
    return this.toView(pet, shouldGreet);
  }

  async rename(userId: string, name: string): Promise<IStudentPetView> {
    const trimmed = (name ?? '').trim();
    if (!trimmed || trimmed.length > 30) {
      throw new BadRequestException('Tên pet phải từ 1 đến 30 ký tự');
    }
    const pet = await this.getOrCreate(userId);
    pet.name = trimmed;
    await this.pets.save(pet);
    return this.toView(pet, false);
  }

  /**
   * Gọi từ QuestsService.handleEvent trên MỌI hoạt động học tập được chấp
   * nhận. Re-solve (alreadySolved) giữ pet vui nhưng không cho XP — đồng bộ
   * với quest engine.
   */
  async onLearningActivity(
    userId: string,
    ctx: { points?: number; alreadySolved?: boolean },
  ): Promise<void> {
    const pet = await this.getOrCreate(userId);
    pet.lastActivityAt = new Date();
    pet.mood = PetMood.HAPPY;

    if (ctx.alreadySolved) {
      await this.pets.save(pet);
      return;
    }

    const gain = petXpForActivity(ctx.points);
    const { leveledUp, evolved } = applyPetXp(pet, gain);
    await this.pets.save(pet);

    const at = new Date().toISOString();
    const base = { icon: '🤖', petLevel: pet.level, petMood: pet.mood, at };
    this.gateway.publish(userId, {
      ...base,
      type: 'pet:xp',
      title: 'Pet nhận XP',
      message: `+${gain} XP cho thú cưng của bạn`,
      petXpGained: gain,
    });
    if (leveledUp) {
      this.gateway.publish(userId, {
        ...base,
        type: 'pet:level_up',
        title: 'Pet lên cấp!',
        message: `Thú cưng của bạn đã đạt cấp ${pet.level}`,
      });
    }
    if (evolved) {
      this.gateway.publish(userId, {
        ...base,
        type: 'pet:evolve',
        title: 'Pet tiến hoá!',
        message: 'Thú cưng của bạn vừa tiến hoá sang hình thái mới',
        evolutionStage: pet.evolutionStage,
      });
    }
  }

  private toView(pet: StudentPet, shouldGreet: boolean): IStudentPetView {
    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      level: pet.level,
      evolutionStage: pet.evolutionStage,
      mood: pet.mood,
      xpIntoLevel: pet.xp,
      xpForNextLevel: xpForLevel(pet.level),
      shouldGreet,
      lastActivityAt: pet.lastActivityAt ? pet.lastActivityAt.toISOString() : null,
    };
  }
}
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `npx nx test api --testPathPattern=modules/pets`
Expected: PASS — cả `pet-logic` và `PetsService` xanh.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/pets/
git commit -m "feat(pets): add StudentPet entity and PetsService"
```

---

### Task 3: PetsController + module wiring + hook vào quest engine

**Files:**
- Create: `apps/api/src/modules/pets/dto/update-pet.dto.ts`
- Create: `apps/api/src/modules/pets/pets.controller.ts`
- Create: `apps/api/src/modules/pets/pets.module.ts`
- Test: `apps/api/src/modules/pets/pets.controller.spec.ts`
- Modify: `apps/api/src/app/app.module.ts` (đăng ký PetsModule)
- Modify: `apps/api/src/modules/quests/quests.module.ts` (import PetsModule qua forwardRef)
- Modify: `apps/api/src/modules/quests/quests.service.ts:413-418` (gọi pet hook trong handleEvent)

**Interfaces:**
- Consumes (Task 2): `PetsService.getMe/rename/onLearningActivity`. Sẵn có: `JwtAuthGuard`, `RolesGuard`, `Roles`, `CurrentUser` từ `apps/api/src/common/guards|decorators`, `JwtPayload`, `UserRole` từ `@cp/shared`.
- Produces: REST `GET /pets/me` → `IStudentPetView`, `PATCH /pets/me` body `{ name }` → `IStudentPetView` (Task 4 frontend gọi 2 endpoint này).

**Lý do forwardRef:** `PetsModule` cần `GamificationGateway` (export bởi `QuestsModule`), còn `QuestsService` cần `PetsService` → vòng phụ thuộc cấp module, giải bằng `forwardRef` ở CẢ HAI phía import. Không có vòng cấp file (quests.service → pets.service → gamification.gateway là chuỗi thẳng).

- [ ] **Step 1: Viết DTO + failing controller test**

`apps/api/src/modules/pets/dto/update-pet.dto.ts`:

```ts
import { IsString, Length } from 'class-validator';

export class UpdatePetDto {
  @IsString()
  @Length(1, 30)
  name!: string;
}
```

`apps/api/src/modules/pets/pets.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';

import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

describe('PetsController', () => {
  let controller: PetsController;
  const service = {
    getMe: jest.fn().mockResolvedValue({ id: 'pet-1', shouldGreet: true }),
    rename: jest.fn().mockResolvedValue({ id: 'pet-1', name: 'Robo' }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PetsController],
      providers: [{ provide: PetsService, useValue: service }],
    }).compile();
    controller = module.get(PetsController);
  });

  it('GET /pets/me gọi service với userId từ JWT', async () => {
    const result = await controller.me({ sub: 'user-1' } as never);
    expect(service.getMe).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expect.objectContaining({ id: 'pet-1' }));
  });

  it('PATCH /pets/me truyền name từ DTO', async () => {
    await controller.rename({ sub: 'user-1' } as never, { name: 'Robo' });
    expect(service.rename).toHaveBeenCalledWith('user-1', 'Robo');
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx nx test api --testPathPattern=modules/pets`
Expected: FAIL — `Cannot find module './pets.controller'`

- [ ] **Step 3: Viết controller + module**

`apps/api/src/modules/pets/pets.controller.ts` (theo đúng pattern `shop.controller.ts`):

```ts
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@cp/shared';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PetsService } from './pets.service';
import { UpdatePetDto } from './dto/update-pet.dto';

@Controller('pets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class PetsController {
  constructor(private readonly service: PetsService) {}

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    return this.service.getMe(user.sub);
  }

  @Patch('me')
  async rename(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePetDto) {
    return this.service.rename(user.sub, dto.name);
  }
}
```

`apps/api/src/modules/pets/pets.module.ts`:

```ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestsModule } from '../quests/quests.module';
import { StudentPet } from './student-pet.entity';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';

@Module({
  // forwardRef: PetsModule cần GamificationGateway của QuestsModule, còn
  // QuestsService cần PetsService — vòng phụ thuộc 2 chiều cấp module.
  imports: [TypeOrmModule.forFeature([StudentPet]), forwardRef(() => QuestsModule)],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [PetsService],
})
export class PetsModule {}
```

- [ ] **Step 4: Đăng ký PetsModule + hook vào quest engine**

Trong `apps/api/src/app/app.module.ts`: thêm `import { PetsModule } from '../modules/pets/pets.module';` và thêm `PetsModule,` vào mảng `imports` (sau `ShopModule`).

Trong `apps/api/src/modules/quests/quests.module.ts`: thêm import

```ts
import { forwardRef } from '@nestjs/common';
import { PetsModule } from '../pets/pets.module';
```

(gộp `forwardRef` vào import `@nestjs/common` sẵn có) và thêm `forwardRef(() => PetsModule)` vào mảng `imports` của `@Module`.

Trong `apps/api/src/modules/quests/quests.service.ts`:

1. Thêm imports ở đầu file:

```ts
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { PetsService } from '../pets/pets.service';
```

(gộp vào import `@nestjs/common` sẵn có nếu đã có `Injectable`.)

2. Thêm vào constructor (sau `private readonly cache: SystemCacheService,`):

```ts
    @Inject(forwardRef(() => PetsService))
    private readonly petsService: PetsService,
```

3. Thêm field logger nếu class chưa có: `private readonly logger = new Logger(QuestsService.name);`

4. Trong `handleEvent()` (dòng ~413), ngay SAU dòng `await this.updateProfileCounters(userId, event);` thêm:

```ts
    // 1b. Nuôi pet — không bao giờ được làm hỏng pipeline quest/chấm bài.
    await this.petsService
      .onLearningActivity(userId, {
        points: event.points,
        alreadySolved: event.alreadySolved,
      })
      .catch((err: Error) => this.logger.warn(`Pet hook failed: ${err.message}`));
```

- [ ] **Step 5: Chạy test pets + boot API xác nhận không vỡ DI**

Run: `npx nx test api --testPathPattern=modules/pets`
Expected: PASS.

Run: `npx nx serve api` (chờ đến khi log `Nest application successfully started` rồi Ctrl-C — hoặc chạy background và kiểm tra log).
Expected: boot thành công, KHÔNG có lỗi `Nest can't resolve dependencies` (nếu có → kiểm tra forwardRef đủ 2 phía). Log TypeORM tạo bảng `student_pets` trên dev DB là bình thường.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/pets/ apps/api/src/app/app.module.ts apps/api/src/modules/quests/quests.module.ts apps/api/src/modules/quests/quests.service.ts
git commit -m "feat(pets): add pets API and feed pet from quest engine events"
```

---

### Task 4: Frontend data layer + rig adapter + pet store

**Files:**
- Modify: `package.json` / `pnpm-lock.yaml` (thêm `@rive-app/react-canvas`)
- Create: `apps/web/src/app/components/pet/pet-rig.ts`
- Create: `apps/web/src/app/stores/pet.store.ts`
- Create: `apps/web/src/app/api/pet.api.ts`
- Create: `apps/web/src/app/api/pet.queries.ts`

**Interfaces:**
- Consumes (Task 1/3): `IStudentPetView`, `IUpdatePetPayload`, `PetMood` từ `@cp/shared`; REST `GET/PATCH /pets/me`. Sẵn có: `apiClient` từ `../lib/api-client`, `queryStaleTime` từ `./query-cache`.
- Produces: type `PetAction = 'happy' | 'sad' | 'sleepy' | 'celebrate' | 'level_up' | 'greeting'`; `PetRig { src, stateMachine, triggers, overlays }`; `rigForSpecies(species: string): PetRig`; `actionForMood(mood: PetMood): PetAction | null`; store `usePetStore { minimized, setMinimized, pendingAction: { action, seq } | null, fireAction(action), clearAction() }`; hooks `usePet()`, `useRenamePet()`; `petQueryKeys.me() = ['pet','me']`.

- [ ] **Step 1: Cài dependency**

```bash
pnpm add -w @rive-app/react-canvas
```

Expected: root `package.json` có `"@rive-app/react-canvas"` trong dependencies, lockfile cập nhật.

- [ ] **Step 2: Viết rig adapter**

`apps/web/src/app/components/pet/pet-rig.ts`:

```ts
import { PetMood } from '@cp/shared';

/**
 * Adapter tách ngữ nghĩa hành vi pet khỏi file .riv cụ thể.
 * Đổi pet khác = thay file .riv + sửa/thêm 1 entry PET_RIGS. Không đụng logic.
 *
 * File Roboware chỉ có 3 trigger (trg_happy/trg_sad/trg_greeting) nên các
 * hành vi thiếu (sleepy/celebrate/level_up) được bù bằng overlay CSS/motion.
 */
export type PetAction = 'happy' | 'sad' | 'sleepy' | 'celebrate' | 'level_up' | 'greeting';
export type PetOverlay = 'zzz' | 'confetti';

export interface PetRig {
  src: string;
  stateMachine: string;
  /** Tên trigger input cho mỗi action; null = để idle animation tự chạy. */
  triggers: Record<PetAction, string | null>;
  /** Hiệu ứng phụ render đè lên canvas cho các action file .riv không có. */
  overlays: Partial<Record<PetAction, PetOverlay>>;
}

export const PET_RIGS: Record<string, PetRig> = {
  // "Roboware Character Builder" by Sutrisno_88 — CC BY 4.0
  // https://rive.app/marketplace/27869-52666-roboware-character-builder/
  roboware: {
    src: '/pet/roboware.riv',
    stateMachine: 'main_sm',
    triggers: {
      happy: 'trg_happy',
      celebrate: 'trg_happy',
      sad: 'trg_sad',
      sleepy: 'trg_sad',
      level_up: 'trg_happy',
      greeting: 'trg_greeting',
    },
    overlays: { sleepy: 'zzz', celebrate: 'confetti', level_up: 'confetti' },
  },
};

export function rigForSpecies(species: string): PetRig {
  return PET_RIGS[species] ?? PET_RIGS['roboware'];
}

/** Action thể hiện mood tĩnh khi widget mount / mood đổi. */
export function actionForMood(mood: PetMood): PetAction | null {
  switch (mood) {
    case PetMood.SLEEPY:
      return 'sleepy';
    case PetMood.SAD:
      return 'sad';
    default:
      return null; // HAPPY/IDLE: để idle animation tự chạy
  }
}
```

- [ ] **Step 3: Viết pet store**

`apps/web/src/app/stores/pet.store.ts` (theo pattern `ui.store.ts`):

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { PetAction } from '../components/pet/pet-rig';

interface PetState {
  /** Widget thu nhỏ thành nút tròn — persist qua reload. */
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  /**
   * Hàng đợi 1 phần tử: action chờ PetCanvas bắn trigger Rive.
   * `seq` tăng dần để useEffect nhận ra action MỚI dù cùng tên.
   */
  pendingAction: { action: PetAction; seq: number } | null;
  fireAction: (action: PetAction) => void;
  clearAction: () => void;
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      minimized: false,
      setMinimized: (v) => set({ minimized: v }),
      pendingAction: null,
      fireAction: (action) =>
        set({ pendingAction: { action, seq: (get().pendingAction?.seq ?? 0) + 1 } }),
      clearAction: () => set({ pendingAction: null }),
    }),
    {
      name: 'pet-ui',
      partialize: (s) => ({ minimized: s.minimized }),
    },
  ),
);
```

- [ ] **Step 4: Viết API + queries**

`apps/web/src/app/api/pet.api.ts` (theo pattern `shop.api.ts`):

```ts
import { IStudentPetView, IUpdatePetPayload } from '@cp/shared';
import { apiClient } from '../lib/api-client';

export const petApi = {
  me() {
    return apiClient.get<IStudentPetView>('/pets/me');
  },
  rename(payload: IUpdatePetPayload) {
    return apiClient.patch<IStudentPetView>('/pets/me', payload);
  },
};
```

`apps/web/src/app/api/pet.queries.ts` (theo pattern `shop.queries.ts`):

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { petApi } from './pet.api';
import { queryStaleTime } from './query-cache';

export const petQueryKeys = {
  me: () => ['pet', 'me'] as const,
};

export function usePet() {
  return useQuery({
    queryKey: petQueryKeys.me(),
    queryFn: () => petApi.me().then((res) => res.data),
    staleTime: queryStaleTime.userScoped,
  });
}

export function useRenamePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => petApi.rename({ name }).then((res) => res.data),
    onSuccess: (pet) => qc.setQueryData(petQueryKeys.me(), pet),
  });
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc -p apps/web/tsconfig.app.json --noEmit`
Expected: exit 0, không lỗi type.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml apps/web/src/app/components/pet/ apps/web/src/app/stores/pet.store.ts apps/web/src/app/api/pet.api.ts apps/web/src/app/api/pet.queries.ts
git commit -m "feat(pet-web): add rive dep, pet rig adapter, store and data layer"
```

---

### Task 5: PetCanvas + xác minh file .riv thật

**Files:**
- Asset: `apps/web/public/pet/roboware.riv` — **nếu chưa có, DỪNG và hỏi user** (tải từ marketplace cần tài khoản Rive; user đã chọn asset này).
- Create: `apps/web/src/app/components/pet/PetCanvas.tsx`
- Modify (nếu tên khác giả định): `apps/web/src/app/components/pet/pet-rig.ts`

**Interfaces:**
- Consumes (Task 4): `PetRig`, `PetAction` từ `./pet-rig`. Dep: `useRive` từ `@rive-app/react-canvas`.
- Produces: `PetCanvas({ rig, action, onActionFired, onLoadError }: { rig: PetRig; action: { action: PetAction; seq: number } | null; onActionFired?: () => void; onLoadError?: () => void })` — component canvas thuần, cô lập `useRive` (best practice Rive: mỗi lần mount tạo canvas mới, unmount cleanup đúng).

- [ ] **Step 1: Kiểm tra file asset**

Run: `ls -la apps/web/public/pet/roboware.riv`
Expected: file tồn tại, kích thước > 10KB. Nếu KHÔNG tồn tại → dừng task, báo user tải file từ https://rive.app/marketplace/27869-52666-roboware-character-builder/ và đặt đúng đường dẫn trên.

- [ ] **Step 2: Viết PetCanvas**

`apps/web/src/app/components/pet/PetCanvas.tsx`:

```tsx
import { useEffect } from 'react';
import { useRive } from '@rive-app/react-canvas';

import { PetAction, PetRig } from './pet-rig';

interface PetCanvasProps {
  rig: PetRig;
  /** Action chờ bắn — seq tăng để phân biệt 2 lần bắn cùng action. */
  action: { action: PetAction; seq: number } | null;
  onActionFired?: () => void;
  onLoadError?: () => void;
}

/**
 * Bọc riêng useRive theo khuyến nghị của Rive: instance gắn với 1 canvas cụ
 * thể, cô lập vào component riêng để mount/unmount cleanup đúng.
 */
export function PetCanvas({ rig, action, onActionFired, onLoadError }: PetCanvasProps) {
  const { rive, RiveComponent } = useRive({
    src: rig.src,
    stateMachines: rig.stateMachine,
    autoplay: true,
    onLoadError: () => onLoadError?.(),
  });

  // Dump nội dung file ở dev để xác minh tên state machine + trigger.
  useEffect(() => {
    if (rive && import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[pet] rive contents:', JSON.stringify(rive.contents, null, 2));
    }
  }, [rive]);

  useEffect(() => {
    if (!rive || !action) return;
    const triggerName = rig.triggers[action.action];
    if (triggerName) {
      const input = rive
        .stateMachineInputs(rig.stateMachine)
        ?.find((i) => i.name === triggerName);
      // Input null khi file chưa load xong hoặc tên sai — bỏ qua, không crash.
      input?.fire();
    }
    onActionFired?.();
  }, [rive, action, rig, onActionFired]);

  return <RiveComponent style={{ width: '100%', height: '100%' }} />;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -p apps/web/tsconfig.app.json --noEmit`
Expected: exit 0.

- [ ] **Step 4: Xác minh file .riv trong browser (BẮT BUỘC)**

Tạm render `<PetCanvas rig={rigForSpecies('roboware')} action={null} />` ở một chỗ dễ thấy (ví dụ đầu `DashboardPage`), chạy `npx nx run-many --target=serve --projects=api,web --parallel=2`, đăng nhập tài khoản student, mở DevTools Console và đọc dòng `[pet] rive contents:`.

Kiểm tra trong JSON dump:
1. Tên artboard và **state machine** — nếu không phải `main_sm` → sửa `stateMachine` trong `pet-rig.ts`.
2. Danh sách inputs của state machine có đúng `trg_happy`, `trg_sad`, `trg_greeting` — nếu tên khác → sửa map `triggers` trong `pet-rig.ts`.
3. Robot hiển thị và idle animation chạy.

Sau khi xác minh xong, GỠ render tạm khỏi DashboardPage. Ghi kết quả xác minh (tên thật của SM + inputs) vào commit message.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/components/pet/ apps/web/public/pet/roboware.riv
git commit -m "feat(pet-web): add PetCanvas with verified riv state machine + triggers"
```

---

### Task 6: PetWidget + overlay effects + socket + mount vào StudentLayout

**Files:**
- Create: `apps/web/src/app/components/pet/PetWidget.tsx`
- Modify: `apps/web/src/app/hooks/useGamificationSocket.ts:58-70` (nhánh riêng cho event pet)
- Modify: `apps/web/src/app/components/GamificationCelebration.tsx` (guard bỏ qua event pet)
- Modify: `apps/web/src/app/layouts/StudentLayout.tsx:98` (mount widget)

**Interfaces:**
- Consumes (Task 4/5): `usePet`, `useRenamePet`, `petQueryKeys`, `usePetStore`, `PetCanvas`, `rigForSpecies`, `actionForMood`. Sẵn có: `framer-motion` (`motion`, `AnimatePresence`), `useGamificationSocket`, `IGamificationEvent`.
- Produces: `<PetWidget />` — self-contained, mount 1 lần trong StudentLayout.

- [ ] **Step 1: Nhánh pet trong useGamificationSocket**

Trong `apps/web/src/app/hooks/useGamificationSocket.ts`, thêm import:

```ts
import { usePetStore } from '../stores/pet.store';
```

và sửa đầu hàm `handler` (trước phần toast hiện tại):

```ts
    const handler = (event: IGamificationEvent) => {
      if (event.type.startsWith('pet:')) {
        // Event pet: không toast (đã có animation), chỉ refresh cache + bắn action.
        void qc.invalidateQueries({ queryKey: ['pet', 'me'] });
        usePetStore
          .getState()
          .fireAction(
            event.type === 'pet:level_up' || event.type === 'pet:evolve'
              ? 'level_up'
              : 'happy',
          );
        onEvent?.(event);
        return;
      }
      // Quest/badge/level-up của HỌC SINH → pet ăn mừng cùng.
      if (event.type === 'quest:completed' || event.type === 'level:up') {
        usePetStore.getState().fireAction('celebrate');
      }
      // ... phần toast + invalidate hiện có giữ nguyên ...
```

- [ ] **Step 2: Guard trong GamificationCelebration**

Mở `apps/web/src/app/components/GamificationCelebration.tsx`, tìm callback đang nhận `IGamificationEvent` (hàm truyền vào `useGamificationSocket(...)` hoặc handler set state hiển thị popup), thêm dòng đầu tiên:

```ts
if (event.type.startsWith('pet:')) return;
```

(Popup full-screen chỉ dành cho quest/badge/level-up; pet có animation riêng.)

- [ ] **Step 3: Viết PetWidget**

`apps/web/src/app/components/pet/PetWidget.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PetMood } from '@cp/shared';

import { usePet, useRenamePet } from '../../api/pet.queries';
import { usePetStore } from '../../stores/pet.store';
import { PetCanvas } from './PetCanvas';
import { actionForMood, rigForSpecies } from './pet-rig';

const CONFETTI = ['🎉', '✨', '⭐', '🎊', '💫', '🌟'];

function ConfettiBurst({ seq }: { seq: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {CONFETTI.concat(CONFETTI).map((emoji, i) => (
        <motion.span
          key={`${seq}-${i}`}
          className="absolute left-1/2 top-1/2 text-lg"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
          animate={{
            x: Math.cos((i / 12) * Math.PI * 2) * 70,
            y: Math.sin((i / 12) * Math.PI * 2) * 70 - 20,
            opacity: 0,
            scale: 1.2,
          }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

function ZzzOverlay() {
  return (
    <motion.div
      className="pointer-events-none absolute right-1 top-0 text-base font-bold text-sky-400"
      animate={{ y: [-2, -10], opacity: [0.9, 0] }}
      transition={{ duration: 1.6, repeat: Infinity }}
    >
      Zzz
    </motion.div>
  );
}

export function PetWidget() {
  const { data: pet, isError } = usePet();
  const renamePet = useRenamePet();
  const minimized = usePetStore((s) => s.minimized);
  const setMinimized = usePetStore((s) => s.setMinimized);
  const pendingAction = usePetStore((s) => s.pendingAction);
  const clearAction = usePetStore((s) => s.clearAction);
  const fireAction = usePetStore((s) => s.fireAction);

  const [riveFailed, setRiveFailed] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [confettiSeq, setConfettiSeq] = useState(0);
  const greetedRef = useRef(false);

  // Chào 1 lần/ngày khi server báo shouldGreet.
  useEffect(() => {
    if (pet?.shouldGreet && !greetedRef.current) {
      greetedRef.current = true;
      fireAction('greeting');
    }
  }, [pet?.shouldGreet, fireAction]);

  // Thể hiện mood tĩnh khi mood đổi (sad/sleepy).
  useEffect(() => {
    if (!pet) return;
    const action = actionForMood(pet.mood);
    if (action) fireAction(action);
  }, [pet?.mood]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pet đang vui thì thi thoảng nhún nhảy.
  useEffect(() => {
    if (pet?.mood !== PetMood.HAPPY) return;
    const id = setInterval(() => fireAction('happy'), 45_000);
    return () => clearInterval(id);
  }, [pet?.mood, fireAction]);

  // Confetti cho celebrate / level_up.
  useEffect(() => {
    if (
      pendingAction &&
      (pendingAction.action === 'celebrate' || pendingAction.action === 'level_up')
    ) {
      setConfettiSeq(pendingAction.seq);
    }
  }, [pendingAction]);

  if (!pet || isError) return null;
  const rig = rigForSpecies(pet.species);
  const xpPercent = Math.min(100, Math.round((pet.xpIntoLevel / pet.xpForNextLevel) * 100));

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-lg ring-1 ring-black/10 transition hover:scale-110 dark:bg-slate-800"
        title="Mở thú cưng"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-44 rounded-2xl bg-white/95 p-2 shadow-xl ring-1 ring-black/10 backdrop-blur dark:bg-slate-800/95">
      <div className="flex items-center justify-between px-1">
        <span className="truncate text-xs font-semibold">
          {pet.name ?? 'Thú cưng'} · Lv.{pet.level}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setNameDraft(pet.name ?? '');
              setEditingName((v) => !v);
            }}
            className="text-xs opacity-60 hover:opacity-100"
            title="Đổi tên"
          >
            ✏️
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="text-xs opacity-60 hover:opacity-100"
            title="Thu nhỏ"
          >
            —
          </button>
        </div>
      </div>

      <div className="relative h-32">
        {riveFailed ? (
          <div className="flex h-full items-center justify-center text-5xl">🤖</div>
        ) : (
          <PetCanvas
            rig={rig}
            action={pendingAction}
            onActionFired={clearAction}
            onLoadError={() => setRiveFailed(true)}
          />
        )}
        {pet.mood === PetMood.SLEEPY && <ZzzOverlay />}
        <AnimatePresence>
          {confettiSeq > 0 && <ConfettiBurst key={confettiSeq} seq={confettiSeq} />}
        </AnimatePresence>
      </div>

      {/* XP bar */}
      <div className="px-1 pb-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <div className="mt-0.5 flex justify-between text-[10px] opacity-60">
          <span>
            {pet.xpIntoLevel}/{pet.xpForNextLevel} XP
          </span>
          {pet.mood === PetMood.SAD && <span title="Pet nhớ bạn!">💔</span>}
        </div>
      </div>

      {editingName && (
        <form
          className="flex gap-1 px-1 pb-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (nameDraft.trim()) {
              renamePet.mutate(nameDraft.trim(), { onSuccess: () => setEditingName(false) });
            }
          }}
        >
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={30}
            autoFocus
            className="w-full rounded border border-slate-300 px-1 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-700"
            placeholder="Tên pet…"
          />
          <button type="submit" className="text-xs" disabled={renamePet.isPending}>
            ✔
          </button>
        </form>
      )}

      {/* Attribution CC BY 4.0 — bắt buộc theo license asset */}
      <p className="px-1 text-[8px] leading-tight opacity-40">
        Pet: Roboware by Sutrisno_88 (CC BY 4.0)
      </p>
    </div>
  );
}
```

Lưu ý style: nếu codebase không dùng dark-mode class `dark:` ở các component tương tự thì bỏ các class `dark:*` cho đồng nhất (kiểm tra `GamificationCelebration.tsx` để khớp idiom Tailwind hiện có).

- [ ] **Step 4: Mount vào StudentLayout**

Trong `apps/web/src/app/layouts/StudentLayout.tsx`: thêm import

```ts
import { PetWidget } from '../components/pet/PetWidget';
```

và ngay dưới dòng 98 `<GamificationCelebration />` thêm:

```tsx
      <PetWidget />
```

- [ ] **Step 5: Typecheck + kiểm tra browser**

Run: `npx tsc -p apps/web/tsconfig.app.json --noEmit`
Expected: exit 0.

Run app (`npx nx run-many --target=serve --projects=api,web --parallel=2`), login student, kiểm tra:
1. Widget hiện góc dưới phải trên Dashboard VÀ trong Workspace.
2. Lần đầu trong ngày: pet chào (trigger greeting).
3. Thu nhỏ → nút tròn 🤖; reload trang → vẫn thu nhỏ (persist).
4. Đổi tên pet → tên mới hiển thị, reload vẫn còn.
5. GET `/pets/me` trả 200 trong Network tab.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/components/pet/ apps/web/src/app/hooks/useGamificationSocket.ts apps/web/src/app/components/GamificationCelebration.tsx apps/web/src/app/layouts/StudentLayout.tsx
git commit -m "feat(pet-web): add floating PetWidget with realtime reactions"
```

---

### Task 7: Migration production + e2e verification

**Files:**
- Create: `apps/api/src/database/migrations/1790000000005-AddStudentPets.ts`

**Interfaces:**
- Consumes: schema bảng `student_pets` do synchronize đã tạo trên dev (Task 3).
- Produces: migration prod-ready.

- [ ] **Step 1: Đối chiếu convention với migration exams**

Mở `apps/api/src/database/migrations/1789900000000-CreateExamTables.ts`, ghi nhận: hàm uuid default (`uuid_generate_v4()` hay `gen_random_uuid()`), cách viết index/FK. Code ở Step 2 dùng `uuid_generate_v4()` — nếu file exams dùng hàm khác thì sửa theo cho đồng nhất.

- [ ] **Step 2: Viết migration**

`apps/api/src/database/migrations/1790000000005-AddStudentPets.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentPets1790000000005 implements MigrationInterface {
  name = 'AddStudentPets1790000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_pets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "version" integer NOT NULL DEFAULT 1,
        "user_id" uuid NOT NULL,
        "name" character varying(30),
        "species" character varying(40) NOT NULL DEFAULT 'roboware',
        "xp" integer NOT NULL DEFAULT 0,
        "level" integer NOT NULL DEFAULT 1,
        "evolution_stage" integer NOT NULL DEFAULT 1,
        "mood" character varying(12) NOT NULL DEFAULT 'HAPPY',
        "last_activity_at" TIMESTAMP WITH TIME ZONE,
        "last_greeted_date" date,
        CONSTRAINT "PK_student_pets" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_student_pets_user_id" ON "student_pets" ("user_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "student_pets"
      ADD CONSTRAINT "FK_student_pets_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "student_pets"`);
  }
}
```

- [ ] **Step 3: Đối chiếu schema dev thật (bài học schema-drift)**

So sánh migration với bảng synchronize đã tạo trên dev. Dùng psql/TablePlus chạy `\d student_pets` (CHỈ đọc — không sửa gì trên dev DB), đối chiếu từng cột: tên, kiểu, default, nullable, index unique trên `user_id`, FK CASCADE. Nếu lệch → sửa migration cho khớp entity/synchronize (KHÔNG sửa dev DB).

- [ ] **Step 4: Chạy full test + typecheck lần cuối**

Run: `npx nx test api --testPathPattern=modules/pets && npx tsc -p apps/web/tsconfig.app.json --noEmit`
Expected: tất cả PASS.

- [ ] **Step 5: E2E manual — vòng đời pet đầy đủ**

Chạy `npx nx run-many --target=serve --projects=api,web --parallel=2`, login student có bài tập chưa giải:
1. Submit lời giải ĐÚNG một bài chưa giải → trong ~vài giây: pet nhảy `happy`, XP bar tăng, KHÔNG có toast trùng cho pet (chỉ toast quest nếu có).
2. Kiểm tra `student_pets` (đọc): `xp` tăng, `last_activity_at` = hôm nay, `mood` = HAPPY.
3. Submit lại CHÍNH bài đó (re-solve) → XP KHÔNG tăng.
4. Nếu tích đủ XP lên level → thấy confetti + (nếu qua mốc 5) event evolve.
5. GamificationCelebration vẫn hoạt động bình thường cho quest:completed.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/database/migrations/1790000000005-AddStudentPets.ts
git commit -m "feat(pets): add production migration for student_pets"
```
