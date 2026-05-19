import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { DataSource, Repository } from 'typeorm';
import { QuestType, StudentQuestStatus } from '@cp/shared';
import { Quest } from './quest.entity';
import { StudentQuest } from './student-quest.entity';
import { StudentProfile } from '../students/student-profile.entity';

@Injectable()
export class QuestsService extends TypeOrmCrudService<Quest> {
  constructor(
    @InjectRepository(Quest) repo: Repository<Quest>,
    @InjectRepository(StudentQuest) private readonly studentQuests: Repository<StudentQuest>,
    @InjectRepository(StudentProfile) private readonly studentProfiles: Repository<StudentProfile>,
    private readonly ds: DataSource,
  ) {
    super(repo);
  }

  /**
   * Called by the system when a student logs in or views their quests.
   * Auto-assigns new daily/active quests that they don't have yet.
   */
  async ensureQuestsAssigned(userId: string): Promise<void> {
    const activeQuests = await this.repo.find({ where: { isActive: true } });
    const existing = await this.studentQuests.find({ where: { userId } });
    const existingIds = new Set(existing.map((sq) => sq.questId));

    const newAssignments = activeQuests
      .filter((q) => !existingIds.has(q.id))
      .map((q) =>
        this.studentQuests.create({
          userId,
          questId: q.id,
          progress: 0,
          status: StudentQuestStatus.IN_PROGRESS,
        })
      );

    if (newAssignments.length > 0) {
      await this.studentQuests.save(newAssignments);
    }
  }

  async getMyQuests(userId: string): Promise<StudentQuest[]> {
    await this.ensureQuestsAssigned(userId);
    return this.studentQuests.find({
      where: { userId },
      relations: ['quest'],
      order: { createdAt: 'DESC' },
    });
  }

  async claimReward(userId: string, studentQuestId: string): Promise<StudentQuest> {
    return this.ds.transaction(async (tx) => {
      const sqRepo = tx.getRepository(StudentQuest);
      const profileRepo = tx.getRepository(StudentProfile);

      const sq = await sqRepo.findOne({ where: { id: studentQuestId, userId }, relations: ['quest'] });
      if (!sq) throw new NotFoundException('Quest progress not found');
      if (sq.status !== StudentQuestStatus.COMPLETED) {
        throw new BadRequestException('Quest is not ready to be claimed');
      }

      // Mark claimed
      sq.status = StudentQuestStatus.CLAIMED;
      await sqRepo.save(sq);

      // Reward student
      const profile = await profileRepo.findOne({ where: { userId } });
      if (profile) {
        profile.xp += sq.quest.rewardXp;
        profile.gems += sq.quest.rewardGems;
        
        // Level up logic (1000 xp per level)
        if (profile.xp >= profile.level * 1000) {
          profile.level += 1;
        }
        await profileRepo.save(profile);
      }

      return sq;
    });
  }

  /**
   * Hook called by Submissions pipeline.
   * Increments progress for active DAILY quests for this user.
   */
  async handleSubmissionAccepted(userId: string): Promise<void> {
    const inProgress = await this.studentQuests.find({
      where: { userId, status: StudentQuestStatus.IN_PROGRESS },
      relations: ['quest'],
    });

    for (const sq of inProgress) {
      // In a real app, you'd match specific criteria. For now, we increment all 'Submit Code' daily quests.
      if (sq.quest.type === QuestType.DAILY) {
        sq.progress += 1;
        if (sq.progress >= sq.quest.targetCount) {
          sq.progress = sq.quest.targetCount;
          sq.status = StudentQuestStatus.COMPLETED;
        }
        await this.studentQuests.save(sq);
      }
    }
  }
}
