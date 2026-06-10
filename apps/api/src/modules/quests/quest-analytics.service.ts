import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IQuestAnalyticsRow, IQuestAnalyticsSummary, QuestStatus, StudentQuestStatus } from '@cp/shared';
import { Quest } from './quest.entity';
import { StudentQuest } from './student-quest.entity';

@Injectable()
export class QuestAnalyticsService {
  constructor(
    @InjectRepository(Quest) private readonly quests: Repository<Quest>,
    @InjectRepository(StudentQuest) private readonly studentQuests: Repository<StudentQuest>,
  ) {}

  async getSummary(): Promise<IQuestAnalyticsSummary> {
    const quests = await this.quests.find();

    const raw = await this.studentQuests
      .createQueryBuilder('sq')
      .select('sq.quest_id', 'questId')
      .addSelect('sq.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .groupBy('sq.quest_id')
      .addGroupBy('sq.status')
      .getRawMany<{ questId: string; status: StudentQuestStatus; cnt: string }>();

    const byQuest = new Map<string, Record<string, number>>();
    for (const r of raw) {
      const bucket = byQuest.get(r.questId) ?? {};
      bucket[r.status] = Number(r.cnt);
      byQuest.set(r.questId, bucket);
    }

    const rows: IQuestAnalyticsRow[] = quests.map((q) => {
      const b = byQuest.get(q.id) ?? {};
      const inProgress = b[StudentQuestStatus.IN_PROGRESS] ?? 0;
      const completed = b[StudentQuestStatus.COMPLETED] ?? 0;
      const claimed = b[StudentQuestStatus.CLAIMED] ?? 0;
      const locked = b[StudentQuestStatus.LOCKED] ?? 0;
      const expired = b[StudentQuestStatus.EXPIRED] ?? 0;
      const assigned = inProgress + completed + claimed + locked + expired;
      const done = completed + claimed;
      return {
        questId: q.id,
        title: q.title,
        type: q.type,
        icon: q.icon,
        assignedCount: assigned,
        inProgressCount: inProgress,
        completedCount: completed,
        claimedCount: claimed,
        completionRate: assigned > 0 ? Math.round((done / assigned) * 100) : 0,
        xpAwarded: claimed * q.rewardXp,
        gemsAwarded: claimed * q.rewardGems,
      };
    });

    const totalInProgress = rows.reduce((s, r) => s + r.inProgressCount, 0);
    const totalCompleted = rows.reduce((s, r) => s + r.completedCount, 0);
    const totalClaimed = rows.reduce((s, r) => s + r.claimedCount, 0);

    return {
      totalQuests: quests.length,
      activeQuests: quests.filter((q) => q.isActive && q.status === QuestStatus.PUBLISHED).length,
      totalAssignments: rows.reduce((s, r) => s + r.assignedCount, 0),
      totalCompleted,
      totalClaimed,
      totalXpAwarded: rows.reduce((s, r) => s + r.xpAwarded, 0),
      totalGemsAwarded: rows.reduce((s, r) => s + r.gemsAwarded, 0),
      funnel: {
        inProgress: totalInProgress + totalCompleted + totalClaimed,
        completed: totalCompleted + totalClaimed,
        claimed: totalClaimed,
      },
      rows: rows.sort((a, b) => b.assignedCount - a.assignedCount),
    };
  }
}
