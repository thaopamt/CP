import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { ClassEntity } from '../../modules/classes/class.entity';
import { Course } from '../../modules/courses/course.entity';
import { ClassCourse } from '../../modules/classes/class-course.entity';
import { MazeLevel } from '../../modules/maze/maze-level.entity';
import { BlockType, Direction, GridConfig, PublishStatus, simulate, Command } from '@cp/shared';

/**
 * Seeds 5 sample maze levels of increasing difficulty under a "Lập trình
 * kéo-thả" course attached to the BASIC-A class. Idempotent: levels are matched
 * by title and re-created on each run (FK cascade removes old submissions).
 *
 * Each level ships with an `intendedSolution` that we run through the shared
 * engine at seed time to assert the level is actually solvable.
 */

interface LevelSeed {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  grid: GridConfig;
  allowedBlocks: BlockType[];
  maxBlocks: number | null;
  /** Assign directly to BASIC-A (true) or leave visible to everyone (false). */
  assignToBasicA: boolean;
  intendedSolution: Command[];
}

const move: Command = { type: BlockType.MOVE_FORWARD };
const left: Command = { type: BlockType.TURN_LEFT };
const right: Command = { type: BlockType.TURN_RIGHT };
const repeat = (times: number, body: Command[]): Command => ({ type: BlockType.REPEAT, times, body });

const LEVELS: LevelSeed[] = [
  {
    title: 'Mê cung 1 — Đường thẳng',
    description: 'Hãy giúp chú robot đi thẳng tới ngôi sao. Chỉ cần dùng khối "đi tới"!',
    difficulty: 'EASY',
    grid: { width: 5, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: 4, y: 0 } },
    allowedBlocks: [BlockType.MOVE_FORWARD],
    maxBlocks: null,
    assignToBasicA: false,
    intendedSolution: [move, move, move, move],
  },
  {
    title: 'Mê cung 2 — Khúc quanh',
    description: 'Đi tới rồi rẽ để tới đích. Em sẽ cần khối "quay phải" nhé!',
    difficulty: 'EASY',
    grid: { width: 4, height: 4, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: 3, y: 3 } },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT],
    maxBlocks: null,
    assignToBasicA: false,
    intendedSolution: [move, move, move, right, move, move, move],
  },
  {
    title: 'Mê cung 3 — Đường zigzag',
    description: 'Vượt qua các bức tường bằng cách đi vòng. Hãy quan sát kỹ lối đi!',
    difficulty: 'MEDIUM',
    grid: {
      width: 5,
      height: 5,
      walls: [
        { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
        { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
      ],
      start: { x: 0, y: 0 },
      startDir: Direction.EAST,
      goal: { x: 4, y: 4 },
    },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.TURN_LEFT, BlockType.TURN_RIGHT],
    maxBlocks: null,
    assignToBasicA: false,
    intendedSolution: [right, move, move, left, move, move, move, move, right, move, move],
  },
  {
    title: 'Mê cung 4 — Đường dài',
    description: 'Quãng đường rất dài! Thử dùng khối "lặp lại" để viết gọn hơn nhé.',
    difficulty: 'MEDIUM',
    grid: { width: 8, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: 7, y: 0 } },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.REPEAT],
    maxBlocks: null,
    assignToBasicA: true,
    intendedSolution: [repeat(7, [move])],
  },
  {
    title: 'Mê cung 5 — Phải dùng vòng lặp',
    description: 'Em chỉ được dùng tối đa 2 khối. Bắt buộc phải dùng "lặp lại" mới giải được!',
    difficulty: 'HARD',
    grid: { width: 6, height: 1, walls: [], start: { x: 0, y: 0 }, startDir: Direction.EAST, goal: { x: 5, y: 0 } },
    allowedBlocks: [BlockType.MOVE_FORWARD, BlockType.REPEAT],
    maxBlocks: 2,
    assignToBasicA: true,
    intendedSolution: [repeat(5, [move])],
  },
];

async function run() {
  console.log('🧩 Seeding maze levels...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('📂 Database connected.');
  }

  const classRepo = AppDataSource.getRepository(ClassEntity);
  const courseRepo = AppDataSource.getRepository(Course);
  const classCourseRepo = AppDataSource.getRepository(ClassCourse);
  const levelRepo = AppDataSource.getRepository(MazeLevel);

  // Sanity-check every level is solvable with its intended solution.
  for (const lvl of LEVELS) {
    const res = simulate(lvl.grid, lvl.intendedSolution);
    if (!res.reachedGoal) {
      throw new Error(`❌ Level "${lvl.title}" không giải được bằng lời giải mẫu (failReason=${res.failReason}).`);
    }
  }
  console.log('✅ All sample solutions verified solvable.');

  // Find BASIC-A class (optional — created by seed-basic-a).
  const basicA = await classRepo.findOneBy({ code: 'BASIC-A' });
  if (!basicA) {
    console.warn('⚠️ Class BASIC-A not found; levels will be visible to all students instead.');
  }

  // Maze course ("khóa học") grouping the levels.
  let course = await courseRepo.findOneBy({ code: 'MAZE-101' });
  if (!course) {
    course = new Course();
    course.code = 'MAZE-101';
    course.title = 'Lập trình kéo-thả: Mê cung';
    course.description = 'Khóa học làm quen với lập trình bằng cách kéo-thả khối lệnh điều khiển nhân vật đi trong mê cung.';
    course.credits = 1.0;
    course.durationWeeks = 2;
    course.subject = 'Computer Science';
    course.status = PublishStatus.PUBLISHED;
    course.assignmentCount = LEVELS.length;
    course.totalPoints = 0;
    course = await courseRepo.save(course);
    console.log('✅ Course MAZE-101 created.');
  }

  // Link course to BASIC-A class if not already linked.
  if (basicA) {
    const existingLink = await classCourseRepo.findOneBy({ classId: basicA.id, courseId: course.id });
    if (!existingLink) {
      const link = new ClassCourse();
      link.classId = basicA.id;
      link.courseId = course.id;
      link.orderIndex = 99;
      link.isRequired = false;
      await classCourseRepo.save(link);
      console.log('✅ Linked MAZE-101 to BASIC-A.');
    }
  }

  // Clean up previously-seeded maze levels (cascades to submissions).
  const titles = LEVELS.map((l) => l.title);
  await levelRepo.createQueryBuilder().delete().where('title IN (:...titles)', { titles }).execute();

  // Insert levels.
  let order = 1;
  for (const lvl of LEVELS) {
    const entity = new MazeLevel();
    entity.title = lvl.title;
    entity.description = lvl.description;
    entity.gridConfig = lvl.grid;
    entity.allowedBlocks = lvl.allowedBlocks;
    entity.maxBlocks = lvl.maxBlocks;
    entity.difficulty = lvl.difficulty;
    entity.status = PublishStatus.PUBLISHED;
    entity.courseId = course.id;
    entity.order = order++;
    entity.classIds = lvl.assignToBasicA && basicA ? [basicA.id] : null;
    await levelRepo.save(entity);
    console.log(`  🧩 ${lvl.title} [${lvl.difficulty}]`);
  }

  console.log(`🎉 Seeded ${LEVELS.length} maze levels successfully!`);
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('❌ Error during maze seed:', err);
  process.exit(1);
});
