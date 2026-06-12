import { UserRole } from './user-role.enum';

export enum SubmissionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ICodeExecutionRequest {
  language: string;
  code: string;
  stdin?: string;
  version?: string;
}

export interface ICodeExecutionResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
    /** CPU time in milliseconds (from Piston) */
    cpu_time?: number | null;
    /** Wall-clock time in milliseconds (from Piston) */
    wall_time?: number | null;
    /** Memory used in bytes (from Piston) */
    memory?: number | null;
    /** Piston message (e.g. timeout reason) */
    message?: string | null;
    /** Piston status code: 'TO' = timeout, 'RE' = runtime error, etc. */
    status?: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

export interface ISubmissionTestResult {
  id: string;
  submissionId: string;
  testCaseIndex: number;
  status: SubmissionStatus;
  input?: string | null;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs?: number;
  memoryBytes?: number;
  errorMessage?: string;
}

export interface ISubmission {
  id: string;
  userId: string;
  assignmentId: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  totalExecutionTimeMs?: number;
  maxMemoryBytes?: number;
  passedCount: number;
  totalCount: number;
  testResults?: ISubmissionTestResult[];
  createdAt: string;
  updatedAt: string;
}

export interface ISubmissionRealtimeTestResult extends Partial<Pick<ISubmissionTestResult, 'id' | 'submissionId'>> {
  testCaseIndex: number;
  status: SubmissionStatus;
  input?: string | null;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs?: number | null;
  memoryBytes?: number | null;
  errorMessage?: string | null;
}

export type SubmissionJudgePhase = 'queued' | 'running' | 'completed' | 'failed';

export interface ISubmissionJudgeProgress {
  phase: SubmissionJudgePhase;
  currentTestCaseIndex: number | null;
  completedCount: number;
  passedCount: number;
  totalCount: number;
  status: SubmissionStatus;
  message?: string;
  updatedAt: string;
}

export interface IRealtimeSubmission extends Omit<ISubmission, 'testResults'> {
  assignment?: {
    id: string;
    title: string;
    codingConfig?: unknown;
  };
  user?: {
    id: string;
    username?: string | null;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    avatarUrl?: string | null;
    /** Equipped cosmetics from the gem shop. */
    equippedTitle?: string | null;
    equippedFrame?: string | null;
    nameColor?: string | null;
  };
  testResults?: ISubmissionRealtimeTestResult[];
  judgeProgress?: ISubmissionJudgeProgress;
}

export type SubmissionRealtimeEventType =
  | 'created'
  | 'testcase_started'
  | 'testcase_finished'
  | 'completed'
  | 'failed';

export interface ISubmissionRealtimeEvent {
  event: SubmissionRealtimeEventType;
  submission: IRealtimeSubmission;
  testResult?: ISubmissionRealtimeTestResult;
  currentTestCaseIndex?: number | null;
  timestamp: string;
}

export interface ISubmitCodePayload {
  assignmentId: string;
  language: string;
  code: string;
}

export interface ISubmitCodeResponse {
  submission: ISubmission;
  message?: string;
}
