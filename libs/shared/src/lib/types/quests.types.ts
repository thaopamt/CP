export enum QuestType {
  DAILY = 'DAILY',
  MAIN = 'MAIN',
  BOUNTY = 'BOUNTY',
}

export enum StudentQuestStatus {
  LOCKED = 'LOCKED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLAIMED = 'CLAIMED',
}

export interface IQuest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  targetCount: number;
  rewardXp: number;
  rewardGems: number;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IStudentQuest {
  id: string;
  userId: string;
  questId: string;
  quest: IQuest;
  progress: number;
  status: StudentQuestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IClaimQuestPayload {
  studentQuestId: string;
}

export interface ICreateQuestPayload {
  title: string;
  description?: string;
  type: QuestType;
  targetCount: number;
  rewardXp: number;
  rewardGems: number;
  icon?: string;
  isActive?: boolean;
}
