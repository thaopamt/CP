# Weekly Leaderboard Rewards System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai tính năng chốt BXH tuần, trao quà (XP, Gems, Avatar hạn dùng 1 tuần) cho Top 10 học sinh tích cực nhất mỗi tuần, hiển thị popup chúc mừng khi học sinh đăng nhập và tab Lịch sử vinh danh (Hall of Fame).

**Architecture:** Bổ sung các cột lưu hạn dùng của avatar và lịch sử nhận thưởng. Sử dụng trigger chốt tuần và hết hạn avatar dạng Lazy (chạy khi có request) để tối ưu hiệu năng và độ ổn định của hệ thống mà không cần cron job chạy ngầm.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, React, Framer Motion, TailwindCSS, TypeScript.

## Global Constraints
- Hệ thống chốt tuần dựa theo múi giờ UTC Monday 00:00 (đồng bộ với banner reset BXH trên UI).
- Ba avatar đặc quyền hàng tuần không thể mua được bằng Gems và được ẩn khỏi catalog shop thường.

---

### Task 1: Database Schema & Entity updates

**Files:**
- Modify: `apps/api/src/modules/shop/student-inventory.entity.ts`
- Modify: `apps/api/src/modules/students/student-profile.entity.ts`
- Create: `apps/api/src/modules/quests/leaderboard-finalized-week.entity.ts`
- Modify: `apps/api/src/modules/quests/quests.module.ts`

**Interfaces:**
- Consumes: TypeORM decorators
- Produces: `StudentInventory.expiresAt` (Date | null), `StudentProfile.lastSeenWeeklyRewardWeek` (string | null), `LeaderboardFinalizedWeek` Entity.

- [ ] **Step 1: Cập nhật thực thể StudentInventory**
  Thêm cột `expiresAt` vào `StudentInventory` class:
  ```typescript
  // apps/api/src/modules/shop/student-inventory.entity.ts
  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true, default: null })
  expiresAt!: Date | null;
  ```

- [ ] **Step 2: Cập nhật thực thể StudentProfile**
  Thêm cột `lastSeenWeeklyRewardWeek` vào `StudentProfile` class:
  ```typescript
  // apps/api/src/modules/students/student-profile.entity.ts
  @Column({ type: 'varchar', length: 8, name: 'last_seen_weekly_reward_week', nullable: true, default: null })
  lastSeenWeeklyRewardWeek!: string | null;
  ```

- [ ] **Step 3: Tạo thực thể LeaderboardFinalizedWeek**
  Tạo file entity mới lưu trữ lịch sử chốt tuần:
  ```typescript
  // apps/api/src/modules/quests/leaderboard-finalized-week.entity.ts
  import { Column, Entity, Index } from 'typeorm';
  import { BaseEntity } from '../../common/entities/base.entity';

  @Entity({ name: 'leaderboard_finalized_weeks' })
  export class LeaderboardFinalizedWeek extends BaseEntity {
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 8, name: 'week_key' })
    weekKey!: string;

    @Column({ type: 'timestamptz', name: 'finalized_at', default: () => 'CURRENT_TIMESTAMP' })
    finalizedAt!: Date;

    @Column({ type: 'jsonb' })
    winners!: {
      userId: string;
      name: string;
      avatarUrl: string | null;
      rank: number;
      weeklyXp: number;
      rewards: {
        xp: number;
        gems: number;
        avatarCode: string;
      };
    }[];
  }
  ```

- [ ] **Step 4: Đăng ký entity mới vào QuestsModule**
  Cập nhật file `quests.module.ts` để import `LeaderboardFinalizedWeek`, `StudentInventory` và `ShopItem` vào TypeOrmModule.forFeature:
  ```typescript
  // apps/api/src/modules/quests/quests.module.ts
  import { LeaderboardFinalizedWeek } from './leaderboard-finalized-week.entity';
  import { StudentInventory } from '../shop/student-inventory.entity';
  import { ShopItem } from '../shop/shop-item.entity';

  // trong imports:
  TypeOrmModule.forFeature([
    Quest,
    StudentQuest,
    Badge,
    StudentBadge,
    StudentProfile,
    Enrollment,
    LeaderboardFinalizedWeek,
    StudentInventory,
    ShopItem
  ])
  ```

- [ ] **Step 5: Run npm run build to verify syntax**
  Run: `npm run build`
  Expected: Build thành công không có lỗi TypeScript.

- [ ] **Step 6: Commit**
  ```bash
  git add apps/api/src/modules/shop/student-inventory.entity.ts apps/api/src/modules/students/student-profile.entity.ts apps/api/src/modules/quests/leaderboard-finalized-week.entity.ts apps/api/src/modules/quests/quests.module.ts
  git commit -m "feat: add schema and entities for weekly leaderboard rewards"
  ```

---

### Task 2: Seeding Weekly Avatar Rewards & Filtering Catalog

**Files:**
- Modify: `apps/api/src/database/seeds/seed-shop.ts`
- Modify: `apps/api/src/modules/shop/shop.service.ts`

**Interfaces:**
- Consumes: Database ShopItem
- Produces: Weekly Reward Avatar Seed rows, Hiding Weekly Avatars from Shop Catalog.

- [ ] **Step 1: Thêm seeds cho 3 avatar tuần vào seed-shop.ts**
  Bổ sung vào mảng `ITEMS` trong `seed-shop.ts` (khoảng dòng 79-80):
  ```typescript
  {
    code: 'CHAR_WEEKLY_CHAMPION',
    name: 'Chiến thần Bảng tuần',
    description: 'Avatar đặc quyền dành riêng cho nhà vô địch Bảng xếp hạng Tuần. Thời hạn sử dụng: 7 ngày.',
    icon: 'military_tech',
    imageUrl: '/character/male/15-divine.svg',
    kind: ShopItemKind.COSMETIC,
    category: ShopItemCategory.CHARACTER,
    rarity: BadgeRarity.LEGENDARY,
    price: 999999,
    minLevel: 0,
    payload: null,
    sortOrder: 999,
    isActive: true,
  },
  {
    code: 'CHAR_WEEKLY_ELITE',
    name: 'Cao thủ Bảng tuần',
    description: 'Avatar đặc quyền dành riêng cho Top 2-3 Bảng xếp hạng Tuần. Thời hạn sử dụng: 7 ngày.',
    icon: 'military_tech',
    imageUrl: '/character/male/12-royal.svg',
    kind: ShopItemKind.COSMETIC,
    category: ShopItemCategory.CHARACTER,
    rarity: BadgeRarity.EPIC,
    price: 999999,
    minLevel: 0,
    payload: null,
    sortOrder: 1000,
    isActive: true,
  },
  {
    code: 'CHAR_WEEKLY_CHALLENGER',
    name: 'Đấu sĩ Bảng tuần',
    description: 'Avatar đặc quyền dành cho Top 4-10 Bảng xếp hạng Tuần. Thời hạn sử dụng: 7 ngày.',
    icon: 'military_tech',
    imageUrl: '/character/male/6-platinum.svg',
    kind: ShopItemKind.COSMETIC,
    category: ShopItemCategory.CHARACTER,
    rarity: BadgeRarity.RARE,
    price: 999999,
    minLevel: 0,
    payload: null,
    sortOrder: 1001,
    isActive: true,
  }
  ```

- [ ] **Step 2: Ẩn Avatar tuần khỏi danh sách catalog mua hàng**
  Cập nhật hàm `getCatalog` trong `ShopService` để loại bỏ các avatar có mã bắt đầu bằng `CHAR_WEEKLY_`:
  ```typescript
  // apps/api/src/modules/shop/shop.service.ts:156 (trong getCatalog)
  const entries: IShopCatalogEntry[] = items
    .filter((item) => !item.code.startsWith('CHAR_WEEKLY_'))
    .map((item) => { ... });
  ```

- [ ] **Step 3: Chạy lại seed-shop để cập nhật DB local**
  Run: `tsx --tsconfig tsconfig.base.json apps/api/src/database/seeds/seed-shop.ts` (Hoặc chạy lệnh npm seed tương ứng)
  Expected: Seed thành công và thêm 3 items mới vào bảng `shop_items`.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/api/src/database/seeds/seed-shop.ts apps/api/src/modules/shop/shop.service.ts
  git commit -m "feat: seed weekly avatars and hide them from gem shop catalog"
  ```

---

### Task 3: Lazy Expiration Cleanup in ShopService

**Files:**
- Modify: `apps/api/src/modules/shop/shop.service.ts`
- Modify: `apps/api/src/modules/students/students.service.ts`

**Interfaces:**
- Consumes: `cleanupExpiredInventory(userId)`
- Produces: Automatic unequip and delete of expired inventory items.

- [ ] **Step 1: Tạo hàm helper cleanupExpiredInventory trong ShopService**
  Thêm hàm sau vào `ShopService`:
  ```typescript
  // apps/api/src/modules/shop/shop.service.ts
  import { LessThan } from 'typeorm';

  async cleanupExpiredInventory(userId: string): Promise<void> {
    const expired = await this.inventory.find({
      where: { userId, expiresAt: LessThan(new Date()) },
      relations: ['item'],
    });
    if (expired.length === 0) return;

    await this.ds.transaction(async (tx) => {
      const invRepo = tx.getRepository(StudentInventory);
      const profRepo = tx.getRepository(StudentProfile);
      const userRepo = tx.getRepository(User);

      const profile = await profRepo.findOne({ where: { userId } });
      const user = await userRepo.findOne({ where: { id: userId } });

      for (const row of expired) {
        if (row.equipped && profile) {
          this.clearCosmeticFromProfile(profile, row.item.category);
          if (row.item.category === ShopItemCategory.CHARACTER && user) {
            user.avatarUrl = null;
          }
        }
        await invRepo.remove(row);
      }

      if (profile) await profRepo.save(profile);
      if (user) await userRepo.save(user);
    });
  }
  ```

- [ ] **Step 2: Gọi helper cleanup ở các API Inventory và Catalog**
  Gọi `await this.cleanupExpiredInventory(userId);` ở dòng đầu của:
  - `getCatalog(userId)`
  - `getInventory(userId)`

- [ ] **Step 3: Gọi helper cleanup ở API Load Profile của học sinh**
  Inject `ShopService` vào `StudentsService` hoặc gọi trực tiếp từ `StudentsService.getProfile`. Để tránh circular dependency, ta có thể inject trực tiếp `Repository<StudentInventory>` và `Repository<ShopItem>` và thực hiện xóa/unequip tương tự hoặc gọi `ShopService` (do `StudentsModule` chưa import `ShopModule`).
  Đơn giản nhất, cập nhật `apps/api/src/modules/students/students.service.ts` để gọi cleanup:
  ```typescript
  // apps/api/src/modules/students/students.service.ts
  // Thêm method:
  async cleanupExpiredInventory(userId: string): Promise<void> {
    // Để gọi logic này độc lập trong StudentsService mà không phụ thuộc vòng vào ShopService:
    // Ta có thể inject repository StudentInventory trực tiếp vào StudentsService hoặc import ShopService qua forwardRef.
  }
  ```
  Hãy giải quyết bằng cách inject `StudentInventory` repository trực tiếp vào `StudentsService`:
  ```typescript
  // apps/api/src/modules/students/students.module.ts
  // Thêm StudentInventory vào TypeOrmModule.forFeature

  // apps/api/src/modules/students/students.service.ts
  // Viết logic dọn dẹp tương tự ở đầu hàm findOne hoặc getProfile.
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add apps/api/src/modules/shop/shop.service.ts apps/api/src/modules/students/students.service.ts
  git commit -m "feat: implement lazy expiration cleanup for reward items"
  ```

---

### Task 4: Weekly Finalization Logic & Tests

**Files:**
- Modify: `apps/api/src/modules/quests/leaderboard.service.ts`
- Create: `apps/api/src/modules/quests/leaderboard.service.spec.ts`

**Interfaces:**
- Consumes: StudentProfiles, LeaderboardFinalizedWeeks
- Produces: `checkAndFinalizeWeeklyLeaderboard(now: Date)`

- [ ] **Step 1: Viết test case chốt tuần kiểm tra lỗi (failing test)**
  Tạo file `leaderboard.service.spec.ts` và viết unit test mô phỏng quá trình chốt tuần:
  ```typescript
  // apps/api/src/modules/quests/leaderboard.service.spec.ts
  import { LeaderboardService } from './leaderboard.service';

  describe('LeaderboardService.checkAndFinalizeWeeklyLeaderboard', () => {
    it('finalizes previous week and awards top 10 correctly', async () => {
      // test logic
    });
  });
  ```

- [ ] **Step 2: Chạy thử test và xác nhận fail**
  Run: `nx test api --testFile=leaderboard.service.spec.ts`
  Expected: Thất bại do chưa implement hàm `checkAndFinalizeWeeklyLeaderboard`.

- [ ] **Step 3: Implement hàm chốt tuần trong LeaderboardService**
  Cập nhật `LeaderboardService` để thêm logic chốt tuần:
  ```typescript
  // apps/api/src/modules/quests/leaderboard.service.ts
  import { LeaderboardFinalizedWeek } from './leaderboard-finalized-week.entity';
  import { StudentInventory } from '../shop/student-inventory.entity';
  import { ShopItem } from '../shop/shop-item.entity';
  import { applyXpGain } from './period-keys';
  import { advanceLevel } from '../../common/gamification.constants';

  async checkAndFinalizeWeeklyLeaderboard(now: Date = new Date()): Promise<void> {
    const prevWeekTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeek = weekKey(prevWeekTime);

    const finalizedRepo = this.profiles.manager.getRepository(LeaderboardFinalizedWeek);
    const exists = await finalizedRepo.findOne({ where: { weekKey: prevWeek } });
    if (exists) return;

    // Chạy trong transaction để đảm bảo tính toàn vẹn dữ liệu
    await this.profiles.manager.transaction(async (tx) => {
      const txFinalizedRepo = tx.getRepository(LeaderboardFinalizedWeek);
      const profRepo = tx.getRepository(StudentProfile);
      const invRepo = tx.getRepository(StudentInventory);
      const itemRepo = tx.getRepository(ShopItem);

      // Lock double-check
      const doubleCheck = await txFinalizedRepo.findOne({ where: { weekKey: prevWeek } });
      if (doubleCheck) return;

      // Query top 10 có week_key = prevWeek, sắp xếp theo weekly_xp desc
      const topProfiles = await profRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.user', 'u')
        .where('u.is_active = :active', { active: true })
        .andWhere('u.role = :role', { role: 'STUDENT' })
        .andWhere('p.week_key = :prevWeek', { prevWeek })
        .andWhere('p.weekly_xp > 0')
        .orderBy('p.weekly_xp', 'DESC')
        .addOrderBy('p.xp', 'DESC')
        .limit(10)
        .getMany();

      if (topProfiles.length === 0) {
        // Không có ai hoạt động tuần trước, lưu bản ghi trống
        await txFinalizedRepo.save(txFinalizedRepo.create({ weekKey: prevWeek, winners: [] }));
        return;
      }

      const avatarCodes = ['CHAR_WEEKLY_CHAMPION', 'CHAR_WEEKLY_ELITE', 'CHAR_WEEKLY_CHALLENGER'];
      const rewardItems = await itemRepo.find({ where: { code: In(avatarCodes) } });
      const itemMap = new Map(rewardItems.map((i) => [i.code, i]));

      const winnersData = [];

      for (let i = 0; i < topProfiles.length; i++) {
        const p = topProfiles[i];
        const rank = i + 1;
        let xpReward = 200;
        let gemsReward = 100;
        let avatarCode = 'CHAR_WEEKLY_CHALLENGER';

        if (rank === 1) {
          xpReward = 1000;
          gemsReward = 500;
          avatarCode = 'CHAR_WEEKLY_CHAMPION';
        } else if (rank === 2 || rank === 3) {
          xpReward = 500;
          gemsReward = 300;
          avatarCode = 'CHAR_WEEKLY_ELITE';
        }

        // 1. Cộng Gems & XP
        p.gems += gemsReward;
        applyXpGain(p, xpReward, now);
        advanceLevel(p);
        await profRepo.save(p);

        // 2. Trao avatar hết hạn sau 7 ngày
        const item = itemMap.get(avatarCode);
        if (item) {
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          // Xóa avatar cũ cùng loại trong kho đồ nếu có trước khi insert mới
          await invRepo.delete({ userId: p.userId, itemId: item.id });
          await invRepo.save(invRepo.create({
            userId: p.userId,
            itemId: item.id,
            expiresAt,
            equipped: false
          }));
        }

        winnersData.push({
          userId: p.userId,
          name: p.user ? `${p.user.firstName} ${p.user.lastName}`.trim() : '—',
          avatarUrl: p.user?.avatarUrl ?? null,
          rank,
          weeklyXp: p.weeklyXp,
          rewards: { xp: xpReward, gems: gemsReward, avatarCode }
        });
      }

      await txFinalizedRepo.save(txFinalizedRepo.create({
        weekKey: prevWeek,
        winners: winnersData
      }));
    });
  }
  ```

- [ ] **Step 4: Chạy thử test và xác nhận pass**
  Run: `nx test api --testFile=leaderboard.service.spec.ts`
  Expected: PASS.

- [ ] **Step 5: Gọi checkAndFinalizeWeeklyLeaderboard ở API Leaderboard và XP updates**
  - Trong `LeaderboardService.getLeaderboard` (dòng đầu)
  - Trong `applyXpGain` hoặc trước khi cập nhật `weekKey` trong các service khác.

- [ ] **Step 6: Commit**
  ```bash
  git add apps/api/src/modules/quests/leaderboard.service.ts apps/api/src/modules/quests/leaderboard.service.spec.ts
  git commit -m "feat: implement lazy weekly leaderboard finalization and write tests"
  ```

---

### Task 5: Backend API Endpoints & Controller

**Files:**
- Modify: `apps/api/src/modules/quests/leaderboard.controller.ts`
- Modify: `apps/api/src/modules/quests/leaderboard.service.ts`

**Interfaces:**
- Consumes: API endpoints
- Produces: JSON payload for pending reward, reward claim and list of finalized weeks.

- [ ] **Step 1: Viết test endpoints chốt tuần**
  Đảm bảo các hàm trả về chính xác lịch sử và phần thưởng nhận được của học sinh.

- [ ] **Step 2: Bổ sung logic controller và service endpoints**
  ```typescript
  // apps/api/src/modules/quests/leaderboard.controller.ts
  @Get('finalized')
  async getFinalizedWeeks() {
    return this.service.getFinalizedWeeks();
  }

  @Get('pending-reward')
  async getPendingReward(@CurrentUser() user: JwtPayload) {
    return this.service.getPendingReward(user.sub);
  }

  @Post('claim-reward')
  async claimReward(@CurrentUser() user: JwtPayload) {
    return this.service.claimReward(user.sub);
  }
  ```
  Triển khai logic tương ứng trong `LeaderboardService`:
  - `getFinalizedWeeks()`: Fetch tất cả records từ `leaderboard_finalized_weeks` order by `weekKey DESC`.
  - `getPendingReward(userId)`: Tìm tuần chốt gần nhất. Nếu học sinh đó nằm trong Top 10 của tuần đó và `lastSeenWeeklyRewardWeek !== lastWeekKey`, trả về thông tin quà để client hiện popup.
  - `claimReward(userId)`: Cập nhật `lastSeenWeeklyRewardWeek = lastWeekKey` trên profile học sinh.

- [ ] **Step 3: Run npm run test to verify all tests pass**
  Run: `npm run test`
  Expected: Tất cả bài test cũ và mới đều PASS.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/api/src/modules/quests/leaderboard.controller.ts apps/api/src/modules/quests/leaderboard.service.ts
  git commit -m "feat: add api endpoints for weekly reward popup and history"
  ```

---

### Task 6: Frontend Weekly Winner Popup

**Files:**
- Create: `apps/web/src/app/components/WeeklyWinnerModal.tsx`
- Modify: `apps/web/src/app/pages/student/LeaderboardPage.tsx`
- Create/Modify queries: `apps/web/src/app/api/gamification.api.ts` & `gamification.queries.ts`

**Interfaces:**
- Consumes: `GET /leaderboard/pending-reward`, `POST /leaderboard/claim-reward`
- Produces: Celebration UI popup with Framer Motion, confetti and reward details.

- [ ] **Step 1: Thêm API queries trên frontend**
  Thêm các hàm fetch và mutation cho pending reward và claim reward.

- [ ] **Step 2: Tạo component WeeklyWinnerModal.tsx**
  Thiết kế component modal đẹp lung linh sử dụng Framer Motion và Canvas Confetti (`@tsparticles/react` hoặc `canvas-confetti` nếu có). Hiển thị chi tiết Gems, XP và Avatar nhận được kèm nhãn đếm ngược 7 ngày.

- [ ] **Step 3: Gọi hiển thị modal trên trang LeaderboardPage**
  Khi vào trang Leaderboard, fetch pending reward, nếu có dữ liệu thì mở modal vinh danh học sinh.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/web/src/app/components/WeeklyWinnerModal.tsx apps/web/src/app/pages/student/LeaderboardPage.tsx apps/web/src/app/api/gamification.api.ts apps/web/src/app/api/gamification.queries.ts
  git commit -m "feat: add frontend weekly winner popup with premium particles celebration"
  ```

---

### Task 7: Frontend Leaderboard Details & Hall of Fame

**Files:**
- Modify: `apps/web/src/app/pages/student/LeaderboardPage.tsx`

**Interfaces:**
- Consumes: `GET /leaderboard/finalized`
- Produces: Header Banner, Gift icons for Top 10 preview, and Hall of Fame history tab.

- [ ] **Step 1: Thêm Banner giải thích cơ chế quà tặng hàng tuần**
  Hiển thị hộp giới thiệu quà tặng ở đầu tab "weekly" để kích thích tinh thần đua top.

- [ ] **Step 2: Thêm Gift Icon Preview**
  Bổ sung một icon hộp quà nhỏ bên cạnh Rank #1, #2, #3 và Top 4-10. Khi hover sẽ hiện tooltip hiển thị quà tặng tương ứng.

- [ ] **Step 3: Tạo Tab Lịch sử vinh danh (Hall of Fame)**
  Thêm nút chuyển đổi tab bên cạnh tabs Xếp hạng hiện tại. Render danh sách các tuần đã chốt cùng Top 3 người đạt giải cao nhất mỗi tuần đó.

- [ ] **Step 4: Run serve:all to manually verify the features work**
  Run: `npm run serve:all`
  Expected: Trang web tải bình thường, hiển thị hoàn hảo Bảng vinh danh và các biểu tượng quà tặng.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web/src/app/pages/student/LeaderboardPage.tsx
  git commit -m "feat: implement hall of fame tab and reward previews on leaderboard page"
  ```
