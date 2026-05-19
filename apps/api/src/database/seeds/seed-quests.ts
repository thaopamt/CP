import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'node:path';
import { Quest } from '../../modules/quests/quest.entity';
import { StudentQuest } from '../../modules/quests/student-quest.entity';
import { StudentProfile } from '../../modules/students/student-profile.entity';
import { Guardian } from '../../modules/students/guardian.entity';
import { User } from '../../modules/users/user.entity';
import { QuestType, StudentQuestStatus, UserRole } from '@cp/shared';

config({ path: join(process.cwd(), 'apps/api/.env') });
config({ path: join(process.cwd(), '.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'cp',
  password: process.env.DB_PASSWORD || 'cp',
  database: process.env.DB_NAME || 'cp',
  entities: [Quest, StudentQuest, StudentProfile, Guardian, User],
  synchronize: false,
});

/* ──────────────────────────────────────────────────
 *  Sample quest definitions
 * ────────────────────────────────────────────────── */
const sampleQuests: Array<{
  title: string;
  description: string;
  type: QuestType;
  targetCount: number;
  rewardXp: number;
  rewardGems: number;
  icon: string;
  isActive: boolean;
}> = [
  // ── DAILY QUESTS ──
  {
    title: 'Code Warrior',
    description: 'Submit 3 coding solutions today to sharpen your skills.',
    type: QuestType.DAILY,
    targetCount: 3,
    rewardXp: 50,
    rewardGems: 10,
    icon: 'code',
    isActive: true,
  },
  {
    title: 'Bug Hunter',
    description: 'Find and fix a bug in any of your previous submissions.',
    type: QuestType.DAILY,
    targetCount: 1,
    rewardXp: 30,
    rewardGems: 5,
    icon: 'bug_report',
    isActive: true,
  },
  {
    title: 'Speed Run',
    description: 'Solve 2 problems within 30 minutes each.',
    type: QuestType.DAILY,
    targetCount: 2,
    rewardXp: 60,
    rewardGems: 15,
    icon: 'timer',
    isActive: true,
  },
  {
    title: 'Study Session',
    description: 'Complete at least 1 course lesson today.',
    type: QuestType.DAILY,
    targetCount: 1,
    rewardXp: 25,
    rewardGems: 5,
    icon: 'school',
    isActive: true,
  },

  // ── MAIN STORY QUESTS ──
  {
    title: 'Algorithm Apprentice',
    description: 'Complete 10 algorithm challenges to earn your first badge.',
    type: QuestType.MAIN,
    targetCount: 10,
    rewardXp: 200,
    rewardGems: 50,
    icon: 'psychology',
    isActive: true,
  },
  {
    title: 'Array Master',
    description: 'Solve 5 array-based problems with optimal time complexity.',
    type: QuestType.MAIN,
    targetCount: 5,
    rewardXp: 150,
    rewardGems: 35,
    icon: 'data_array',
    isActive: true,
  },
  {
    title: 'The Recursion Path',
    description: 'Master recursion by solving 7 recursive challenges.',
    type: QuestType.MAIN,
    targetCount: 7,
    rewardXp: 180,
    rewardGems: 40,
    icon: 'autorenew',
    isActive: true,
  },
  {
    title: 'Graph Explorer',
    description: 'Conquer 5 graph traversal problems (BFS/DFS).',
    type: QuestType.MAIN,
    targetCount: 5,
    rewardXp: 250,
    rewardGems: 60,
    icon: 'hub',
    isActive: true,
  },
  {
    title: 'Dynamic Thinker',
    description: 'Solve 8 dynamic programming problems to unlock advanced content.',
    type: QuestType.MAIN,
    targetCount: 8,
    rewardXp: 300,
    rewardGems: 75,
    icon: 'trending_up',
    isActive: true,
  },

  // ── BOUNTY QUESTS ──
  {
    title: 'Perfect Score',
    description: 'Get 100% on any Hard difficulty assignment. No partial credit!',
    type: QuestType.BOUNTY,
    targetCount: 1,
    rewardXp: 500,
    rewardGems: 100,
    icon: 'emoji_events',
    isActive: true,
  },
  {
    title: 'Streak Legend',
    description: 'Maintain a 7-day coding streak without missing a day.',
    type: QuestType.BOUNTY,
    targetCount: 7,
    rewardXp: 350,
    rewardGems: 80,
    icon: 'local_fire_department',
    isActive: true,
  },
  {
    title: 'Speed Demon',
    description: 'Solve 5 problems in a single day. Only the brave survive!',
    type: QuestType.BOUNTY,
    targetCount: 5,
    rewardXp: 400,
    rewardGems: 90,
    icon: 'bolt',
    isActive: true,
  },
  {
    title: 'Polyglot Coder',
    description: 'Submit accepted solutions in 3 different programming languages.',
    type: QuestType.BOUNTY,
    targetCount: 3,
    rewardXp: 250,
    rewardGems: 60,
    icon: 'translate',
    isActive: true,
  },
];

async function seed() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected!\n');

    const questRepo = AppDataSource.getRepository(Quest);
    const sqRepo = AppDataSource.getRepository(StudentQuest);
    const userRepo = AppDataSource.getRepository(User);

    // Clean existing quest data
    console.log('🧹 Clearing existing quest data...');
    await AppDataSource.query('TRUNCATE TABLE student_quests CASCADE');
    await AppDataSource.query('TRUNCATE TABLE quests CASCADE');

    // Insert quests
    console.log('🗡️  Inserting sample quests...');
    const savedQuests: Quest[] = [];
    for (const data of sampleQuests) {
      const quest = questRepo.create(data);
      const saved = await questRepo.save(quest);
      savedQuests.push(saved);
      console.log(`   ✓ [${data.type.padEnd(6)}] ${data.title} — ${data.rewardXp} XP, ${data.rewardGems} 💎`);
    }
    console.log(`\n📊 Created ${savedQuests.length} quests total.\n`);

    // Find all students and assign quests with varying progress
    const students = await userRepo.find({ where: { role: UserRole.STUDENT } });
    console.log(`👥 Found ${students.length} student(s). Assigning quests...\n`);

    for (const student of students) {
      const assignments: StudentQuest[] = [];

      for (const quest of savedQuests) {
        // Randomize progress for a realistic demo
        const rand = Math.random();
        let progress: number;
        let status: StudentQuestStatus;

        if (rand < 0.25) {
          // 25% chance: not started
          progress = 0;
          status = StudentQuestStatus.IN_PROGRESS;
        } else if (rand < 0.55) {
          // 30% chance: partially done
          progress = Math.floor(Math.random() * (quest.targetCount - 1)) + 1;
          status = StudentQuestStatus.IN_PROGRESS;
        } else if (rand < 0.80) {
          // 25% chance: completed but unclaimed
          progress = quest.targetCount;
          status = StudentQuestStatus.COMPLETED;
        } else {
          // 20% chance: fully claimed
          progress = quest.targetCount;
          status = StudentQuestStatus.CLAIMED;
        }

        const sq = sqRepo.create({
          userId: student.id,
          questId: quest.id,
          progress,
          status,
        });
        assignments.push(sq);
      }

      await sqRepo.save(assignments);
      const completed = assignments.filter((a) => a.status === StudentQuestStatus.COMPLETED).length;
      const claimed = assignments.filter((a) => a.status === StudentQuestStatus.CLAIMED).length;
      console.log(
        `   👤 ${student.firstName} ${student.lastName}: ${assignments.length} quests assigned ` +
        `(${completed} ready to claim, ${claimed} claimed)`
      );
    }

    console.log('\n🎉 Quest seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
