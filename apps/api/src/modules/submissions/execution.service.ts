import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Assignment } from '../assignments/assignment.entity';
import { ICodeExecutionResponse, SubmissionStatus } from '@cp/shared';

/** Default limits when not specified by the assignment */
const DEFAULT_TIME_LIMIT_S = 5;          // 5 seconds
const DEFAULT_MEMORY_LIMIT_KB = 256_000; // 256 MB
const DEFAULT_COMPILE_TIMEOUT_MS = 10_000; // 10 seconds for compilation

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);
  private readonly pistonApiUrl = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2/execute';

  /**
   * Map frontend language names to Piston-compatible language + version.
   */
  private mapLanguage(language: string): { lang: string; version: string } {
    const l = language.toLowerCase();
    if (l === 'python' || l === 'py') {
      return { lang: 'python', version: '3.10.0' };
    }
    if (l === 'c++' || l === 'cpp') {
      return { lang: 'c++', version: '10.2.0' };
    }
    if (l === 'java') {
      return { lang: 'java', version: '15.0.2' };
    }
    if (l === 'javascript' || l === 'js') {
      // JavaScript not installed yet — fallback to python for now
      return { lang: 'python', version: '3.10.0' };
    }
    // Default fallback
    return { lang: l, version: '*' };
  }

  /**
   * Execute code with optional time/memory limits.
   *
   * @param language     - Frontend language name (e.g. 'cpp', 'python')
   * @param code         - Source code to execute
   * @param stdin        - Standard input for the program
   * @param timeLimitMs  - Maximum wall-clock time for the **run** phase (ms).
   *                       Piston will SIGKILL the process if exceeded.
   * @param memoryLimitKb - Maximum memory in KB (Piston `memory_limit`).
   */
  async runCode(
    language: string,
    code: string,
    stdin?: string,
    timeLimitMs?: number,
    memoryLimitKb?: number,
  ): Promise<ICodeExecutionResponse> {
    const { lang, version } = this.mapLanguage(language);

    // Build Piston request payload
    const pistonPayload: Record<string, any> = {
      language: lang,
      version: version,
      files: [{ content: code }],
      stdin: stdin || '',
    };

    // Set run timeout (Piston expects milliseconds)
    if (timeLimitMs && timeLimitMs > 0) {
      pistonPayload.run_timeout = timeLimitMs;
    }

    // Set compile timeout — always generous
    pistonPayload.compile_timeout = DEFAULT_COMPILE_TIMEOUT_MS;

    // Set memory limit (Piston expects bytes)
    if (memoryLimitKb && memoryLimitKb > 0) {
      pistonPayload.run_memory_limit = memoryLimitKb * 1024;
      pistonPayload.compile_memory_limit = memoryLimitKb * 1024;
    }

    try {
      const response = await axios.post(this.pistonApiUrl, pistonPayload);
      const data = response.data;

      // Normalize response — include cpu_time/wall_time/memory from Piston
      return {
        language: data.language,
        version: data.version,
        compile: data.compile ? {
          stdout: data.compile.stdout || '',
          stderr: data.compile.stderr || '',
          code: data.compile.code ?? 0,
          signal: data.compile.signal,
          output: data.compile.output || '',
        } : undefined,
        run: {
          stdout: data.run.stdout || '',
          stderr: data.run.stderr || '',
          code: data.run.code ?? 0,
          signal: data.run.signal,
          output: data.run.output || '',
          // Piston provides these extra fields
          cpu_time: data.run.cpu_time ?? null,
          wall_time: data.run.wall_time ?? null,
          memory: data.run.memory ?? null,
          message: data.run.message ?? null,
          status: data.run.status ?? null,
        },
      } as ICodeExecutionResponse;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        this.logger.warn(`Piston API not reachable at ${this.pistonApiUrl}. Using mock.`);
        return {
          language,
          version: 'mock',
          run: {
            stdout: '⚠️ Piston API is not running.\nStart it with: docker compose -f docker/piston/docker-compose.yml up -d',
            stderr: '',
            code: 0,
            signal: null,
            output: '',
          },
        };
      }
      this.logger.error(`Execution failed (${language}): ${error.message}`);
      throw new Error('Code execution failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Grade a submission against an assignment's test cases.
   * Checks for TLE based on codingConfig.timeLimit (seconds).
   */
  async gradeSubmission(assignment: Assignment, language: string, code: string) {
    const config = assignment.codingConfig;

    // Resolve limits from assignment config
    const timeLimitS = config?.timeLimit ?? DEFAULT_TIME_LIMIT_S;
    const timeLimitMs = timeLimitS * 1000;
    const memoryLimitKb = config?.memoryLimit
      ? config.memoryLimit * 1024  // config stores MB → convert to KB
      : DEFAULT_MEMORY_LIMIT_KB;

    if (!config || !config.testCases || config.testCases.length === 0) {
      this.logger.warn(`Assignment ${assignment.id} has no test cases. Running code once as acceptance.`);
      // Run code once without stdin — if it compiles and runs, mark accepted
      const res = await this.runCode(language, code, '', timeLimitMs, memoryLimitKb);
      const hasError = (res.compile && res.compile.code !== 0) || res.run.code !== 0;

      // Check for TLE via Piston signal or status
      const isTLE = this.isTimeLimitExceeded(res, timeLimitMs);

      let status: SubmissionStatus;
      if (isTLE) {
        status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
      } else if (hasError) {
        status = SubmissionStatus.RUNTIME_ERROR;
      } else {
        status = SubmissionStatus.ACCEPTED;
      }

      const wallTimeMs = res.run.wall_time ?? 0;

      return {
        status,
        passedCount: status === SubmissionStatus.ACCEPTED ? 1 : 0,
        totalCount: 1,
        maxMemory: res.run.memory ?? 0,
        totalTime: wallTimeMs,
        testResults: [{
          testCaseIndex: 0,
          status,
          expectedOutput: '(no test cases)',
          actualOutput: res.run.stdout || res.run.stderr || '',
          errorMessage: res.compile?.stderr || res.run.stderr || null,
          executionTimeMs: wallTimeMs,
          memoryBytes: res.run.memory ?? 0,
        }],
      };
    }

    const testResults: any[] = [];
    let passedCount = 0;
    let maxMemory = 0;
    let totalTime = 0;
    let finalStatus = SubmissionStatus.ACCEPTED;

    for (let i = 0; i < config.testCases.length; i++) {
      const testCase = config.testCases[i];
      const res = await this.runCode(language, code, testCase.input, timeLimitMs, memoryLimitKb);

      let status = SubmissionStatus.ACCEPTED;
      let actualOutput = res.run.stdout;
      let errorMsg = res.run.stderr;

      // Extract timing/memory from Piston response
      const wallTimeMs = res.run.wall_time ?? 0;
      const memoryBytes = res.run.memory ?? 0;

      // Track aggregate stats
      totalTime += wallTimeMs;
      if (memoryBytes > maxMemory) {
        maxMemory = memoryBytes;
      }

      // Check for TLE first — takes priority over other errors
      const isTLE = this.isTimeLimitExceeded(res, timeLimitMs);

      if (isTLE) {
        status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
        errorMsg = `Time Limit Exceeded: execution took ${wallTimeMs}ms (limit: ${timeLimitMs}ms)`;
        if (finalStatus === SubmissionStatus.ACCEPTED) {
          finalStatus = SubmissionStatus.TIME_LIMIT_EXCEEDED;
        }
      } else if (res.compile && res.compile.code !== 0) {
        status = SubmissionStatus.COMPILATION_ERROR;
        errorMsg = res.compile.stderr;
        finalStatus = status;
      } else if (res.run.code !== 0) {
        status = SubmissionStatus.RUNTIME_ERROR;
        if (finalStatus === SubmissionStatus.ACCEPTED) {
          finalStatus = SubmissionStatus.RUNTIME_ERROR;
        }
      } else {
        // Compare output (trim trailing whitespace/newlines)
        const expected = testCase.output.trim();
        const actual = actualOutput.trim();

        if (expected !== actual) {
          status = SubmissionStatus.WRONG_ANSWER;
          if (finalStatus === SubmissionStatus.ACCEPTED) {
            finalStatus = SubmissionStatus.WRONG_ANSWER;
          }
        } else {
          passedCount++;
        }
      }

      testResults.push({
        testCaseIndex: i,
        status,
        expectedOutput: testCase.output,
        actualOutput,
        errorMessage: errorMsg || null,
        executionTimeMs: wallTimeMs,
        memoryBytes: memoryBytes,
      });
    }

    return {
      status: finalStatus,
      passedCount,
      totalCount: config.testCases.length,
      maxMemory,
      totalTime,
      testResults,
    };
  }

  /**
   * Determine if a Piston execution result indicates Time Limit Exceeded.
   *
   * Piston signals TLE in several ways:
   * 1. `run.status === 'TO'` (timeout)
   * 2. `run.signal === 'SIGKILL'` with `run.message` containing 'Time'
   * 3. `run.wall_time >= timeLimitMs` (wall time exceeded the limit)
   */
  private isTimeLimitExceeded(res: ICodeExecutionResponse, timeLimitMs: number): boolean {
    const run = res.run;

    // Piston timeout status
    if (run.status === 'TO') {
      return true;
    }

    // SIGKILL from timeout
    if (run.signal === 'SIGKILL' && run.message?.toLowerCase().includes('time')) {
      return true;
    }

    // Wall time exceeded the limit (with small tolerance for overhead)
    if (run.wall_time != null && run.wall_time > timeLimitMs) {
      return true;
    }

    return false;
  }
}
