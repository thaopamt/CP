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

export interface ISubmitCodePayload {
  assignmentId: string;
  language: string;
  code: string;
}

export interface ISubmitCodeResponse {
  submission: ISubmission;
  message?: string;
}
