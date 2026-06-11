import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Assignment } from '../assignments/assignment.entity';
import { ICodeExecutionResponse, ISubmissionRealtimeTestResult, SubmissionStatus } from '@cp/shared';
import { TestcaseStorageService } from '../testcases/testcase-storage.service';

/** Default limits when not specified by the assignment */
const DEFAULT_TIME_LIMIT_S = 5;          // 5 seconds
const DEFAULT_MEMORY_LIMIT_MB = 256;     // 256 MB
const DEFAULT_COMPILE_TIMEOUT_MS = 10_000; // 10 seconds for compilation
const BYTES_PER_MB = 1_000_000;
const LEGACY_MEMORY_LIMIT_KB_THRESHOLD = 16_384;
const LEGACY_TIME_LIMIT_MS_THRESHOLD = 1_000;
const DEFAULT_PISTON_RUN_TIMEOUT_MS = 30_000;
const DEFAULT_PISTON_MEMORY_LIMIT_BYTES = 512_000_000;

/** Marker used to separate program stdout from file-output content. */
const FILE_OUTPUT_MARKER = '___FILE_OUTPUT_MARKER_a7f3b9e2___';

/** Configuration for file-based I/O (freopen style). */
export interface FileIoConfig {
  inputFileName: string;   // e.g. 'SUMAB.INP'
  outputFileName: string;  // e.g. 'SUMAB.OUT'
}

export interface GradeSubmissionHooks {
  onTestCaseStart?: (progress: { testCaseIndex: number; totalCount: number }) => void | Promise<void>;
  onTestCaseComplete?: (progress: {
    testResult: ISubmissionRealtimeTestResult;
    completedCount: number;
    passedCount: number;
    totalCount: number;
    totalTime: number;
    maxMemory: number;
    status: SubmissionStatus;
  }) => void | Promise<void>;
}

@Injectable()
export class ExecutionService {
  constructor(private readonly testcaseStorage: TestcaseStorageService) {}

  private readonly logger = new Logger(ExecutionService.name);
  private readonly pistonApiUrl = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2/execute';
  private readonly pistonRunTimeoutMs = this.readPositiveIntEnv(
    process.env.PISTON_MAX_RUN_TIMEOUT_MS,
    this.readPositiveIntEnv(process.env.PISTON_RUN_TIMEOUT, DEFAULT_PISTON_RUN_TIMEOUT_MS),
  );
  private readonly pistonMemoryLimitBytes = this.readPositiveIntEnv(
    process.env.PISTON_MAX_MEMORY_LIMIT_BYTES,
    this.readPositiveIntEnv(process.env.PISTON_RUN_MEMORY_LIMIT, DEFAULT_PISTON_MEMORY_LIMIT_BYTES),
  );

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
   * @param memoryLimitBytes - Maximum memory in bytes (Piston `memory_limit`).
   * @param fileIoConfig - When provided, the program uses file I/O instead of
   *                       stdin/stdout.  A wrapper bash script is generated to
   *                       create the input file, run the compiled program, and
   *                       print the output file content to stdout.
   */
  async runCode(
    language: string,
    code: string,
    stdin?: string,
    timeLimitMs?: number,
    memoryLimitBytes?: number,
    fileIoConfig?: FileIoConfig,
  ): Promise<ICodeExecutionResponse> {
    // ── File I/O mode ──────────────────────────────────────────────────
    // When a problem uses freopen-style file I/O we wrap the student code
    // inside a bash script that:
    //   1. writes the test-case input to the expected input file,
    //   2. compiles (if needed) and runs the student program,
    //   3. reads the output file and echoes it to stdout behind a unique
    //      marker so we can split it from any normal stdout output.
    if (fileIoConfig) {
      return this.runCodeWithFileIo(language, code, stdin || '', timeLimitMs, memoryLimitBytes, fileIoConfig);
    }

    const { lang, version } = this.mapLanguage(language);

    // Build Piston request payload
    const pistonPayload: Record<string, any> = {
      language: lang,
      version: version,
      files: [{ content: code }],
      stdin: stdin || '',
    };

    // Set run timeout (Piston expects milliseconds)
    const effectiveRunTimeoutMs = this.clampPistonRunTimeout(timeLimitMs);
    if (effectiveRunTimeoutMs) {
      pistonPayload.run_timeout = effectiveRunTimeoutMs;
    }

    // Set compile timeout — always generous
    pistonPayload.compile_timeout = DEFAULT_COMPILE_TIMEOUT_MS;

    // Set memory limit (Piston expects bytes)
    const effectiveMemoryLimitBytes = this.clampPistonMemoryLimit(memoryLimitBytes);
    if (effectiveMemoryLimitBytes) {
      pistonPayload.run_memory_limit = effectiveMemoryLimitBytes;
      pistonPayload.compile_memory_limit = effectiveMemoryLimitBytes;
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
  async gradeSubmission(assignment: Assignment, language: string, code: string, hooks: GradeSubmissionHooks = {}) {
    const config = assignment.codingConfig;

    // Resolve limits from assignment config
    const timeLimitMs = this.resolveTimeLimitMs(config?.timeLimit, assignment.id);
    const memoryLimitBytes = this.resolveMemoryLimitBytes(config?.memoryLimit, assignment.id);

    // Resolve file I/O config if the assignment uses file-based I/O
    const fileIoConfig: FileIoConfig | undefined =
      config?.ioMode === 'file' && config.inputFileName && config.outputFileName
        ? { inputFileName: config.inputFileName, outputFileName: config.outputFileName }
        : undefined;

    // Inline test cases live in the DB (small, visible samples); heavy hidden
    // grading test cases live on disk. The judge grades the inline ones first,
    // then the disk-backed ones, so indices stay contiguous.
    const inlineCases = config?.testCases ?? [];
    const hiddenCount = config?.hiddenTestCount ?? 0;
    const totalCases = inlineCases.length + hiddenCount;

    if (!config || totalCases === 0) {
      this.logger.warn(`Assignment ${assignment.id} has no test cases. Running code once as acceptance.`);
      await hooks.onTestCaseStart?.({ testCaseIndex: 0, totalCount: 1 });
      // Run code once without stdin — if it compiles and runs, mark accepted
      const res = await this.runCode(language, code, '', timeLimitMs, memoryLimitBytes, fileIoConfig);
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
      const testResult: ISubmissionRealtimeTestResult = {
        testCaseIndex: 0,
        status,
        input: '',
        expectedOutput: '(no test cases)',
        actualOutput: res.run.stdout || res.run.stderr || '',
        errorMessage: res.compile?.stderr || res.run.stderr || null,
        executionTimeMs: wallTimeMs,
        memoryBytes: res.run.memory ?? 0,
      };

      await hooks.onTestCaseComplete?.({
        testResult,
        completedCount: 1,
        passedCount: status === SubmissionStatus.ACCEPTED ? 1 : 0,
        totalCount: 1,
        totalTime: wallTimeMs,
        maxMemory: res.run.memory ?? 0,
        status,
      });

      return {
        status,
        passedCount: status === SubmissionStatus.ACCEPTED ? 1 : 0,
        totalCount: 1,
        maxMemory: res.run.memory ?? 0,
        totalTime: wallTimeMs,
        testResults: [testResult],
      };
    }

    const testResults: any[] = [];
    let passedCount = 0;
    let maxMemory = 0;
    let totalTime = 0;
    let finalStatus = SubmissionStatus.ACCEPTED;

    for (let i = 0; i < totalCases; i++) {
      // Resolve this test case's input/expected output from inline config or
      // from the disk-backed hidden set.
      let tcInput: string;
      let tcOutput: string;
      if (i < inlineCases.length) {
        tcInput = inlineCases[i].input;
        tcOutput = inlineCases[i].output;
      } else {
        const hidden = await this.testcaseStorage.readTestcase(assignment.id, i - inlineCases.length);
        tcInput = hidden.input;
        tcOutput = hidden.output;
      }

      await hooks.onTestCaseStart?.({ testCaseIndex: i, totalCount: totalCases });
      const res = await this.runCode(language, code, tcInput, timeLimitMs, memoryLimitBytes, fileIoConfig);

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
        const expected = tcOutput.trim();
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

      const testResult: ISubmissionRealtimeTestResult = {
        testCaseIndex: i,
        status,
        input: tcInput,
        expectedOutput: tcOutput,
        actualOutput,
        errorMessage: errorMsg || null,
        executionTimeMs: wallTimeMs,
        memoryBytes: memoryBytes,
      };

      testResults.push(testResult);

      await hooks.onTestCaseComplete?.({
        testResult,
        completedCount: testResults.length,
        passedCount,
        totalCount: totalCases,
        totalTime,
        maxMemory,
        status: finalStatus,
      });
    }

    return {
      status: finalStatus,
      passedCount,
      totalCount: totalCases,
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

  private resolveTimeLimitMs(timeLimit?: number, assignmentId?: string): number {
    if (!Number.isFinite(timeLimit) || !timeLimit || timeLimit <= 0) {
      return DEFAULT_TIME_LIMIT_S * 1000;
    }

    // Older seed data stored milliseconds (for example 2000); current UI stores seconds.
    const requestedMs = timeLimit >= LEGACY_TIME_LIMIT_MS_THRESHOLD
      ? Math.round(timeLimit)
      : Math.round(timeLimit * 1000);

    const effectiveMs = this.clampPistonRunTimeout(requestedMs) ?? DEFAULT_TIME_LIMIT_S * 1000;

    if (effectiveMs < requestedMs) {
      this.logger.warn(
        `Assignment ${assignmentId ?? 'unknown'} time limit ${requestedMs}ms exceeds Piston max ${this.pistonRunTimeoutMs}ms; clamped.`,
      );
    }

    return effectiveMs;
  }

  private resolveMemoryLimitBytes(memoryLimit?: number, assignmentId?: string): number {
    let memoryLimitMb = DEFAULT_MEMORY_LIMIT_MB;

    if (Number.isFinite(memoryLimit) && memoryLimit && memoryLimit > 0) {
      memoryLimitMb = memoryLimit >= LEGACY_MEMORY_LIMIT_KB_THRESHOLD
        ? memoryLimit / 1024
        : memoryLimit;

      if (memoryLimit >= LEGACY_MEMORY_LIMIT_KB_THRESHOLD) {
        this.logger.warn(
          `Assignment ${assignmentId ?? 'unknown'} has legacy memoryLimit=${memoryLimit}; treating it as KB.`,
        );
      }
    }

    const requestedBytes = Math.round(memoryLimitMb * BYTES_PER_MB);
    const effectiveBytes = this.clampPistonMemoryLimit(requestedBytes) ?? DEFAULT_MEMORY_LIMIT_MB * BYTES_PER_MB;

    if (effectiveBytes < requestedBytes) {
      this.logger.warn(
        `Assignment ${assignmentId ?? 'unknown'} memory limit ${requestedBytes} bytes exceeds Piston max ${this.pistonMemoryLimitBytes}; clamped.`,
      );
    }

    return effectiveBytes;
  }

  private clampPistonMemoryLimit(memoryLimitBytes?: number): number | undefined {
    if (!Number.isFinite(memoryLimitBytes) || !memoryLimitBytes || memoryLimitBytes <= 0) {
      return undefined;
    }

    return Math.min(Math.round(memoryLimitBytes), this.pistonMemoryLimitBytes);
  }

  private clampPistonRunTimeout(timeLimitMs?: number): number | undefined {
    if (!Number.isFinite(timeLimitMs) || !timeLimitMs || timeLimitMs <= 0) {
      return undefined;
    }

    return Math.min(Math.round(timeLimitMs), this.pistonRunTimeoutMs);
  }

  private readPositiveIntEnv(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
  }

  // ── File I/O execution ──────────────────────────────────────────────

  /**
   * Run student code in file-I/O mode by wrapping it in a bash script.
   * The wrapper writes the input content to the expected input file,
   * compiles + runs the student program, and then echoes the output
   * file content (if any) to stdout behind a marker.
   */
  private async runCodeWithFileIo(
    language: string,
    code: string,
    inputContent: string,
    timeLimitMs: number | undefined,
    memoryLimitBytes: number | undefined,
    fileIo: FileIoConfig,
  ): Promise<ICodeExecutionResponse> {
    const sourceFileName = this.getSourceFileName(language);
    const wrapper = this.buildFileIoWrapper(language, sourceFileName, fileIo.inputFileName, fileIo.outputFileName);

    // Piston files: [0] = runner.sh (entrypoint), [1] = student source code
    // The input file is created dynamically by the wrapper via heredoc so
    // that special characters / binary data in test input don't break the
    // Piston file-name handling.
    const pistonPayload: Record<string, any> = {
      language: 'bash',
      version: '5.1.0',
      files: [
        { name: 'runner.sh', content: wrapper },
        { name: sourceFileName, content: code },
      ],
      stdin: inputContent,
    };

    // Timeouts & memory limits — add generous overhead for compile step
    const effectiveRunTimeoutMs = this.clampPistonRunTimeout(
      timeLimitMs ? timeLimitMs + DEFAULT_COMPILE_TIMEOUT_MS : undefined,
    );
    if (effectiveRunTimeoutMs) {
      pistonPayload.run_timeout = effectiveRunTimeoutMs;
    }
    pistonPayload.compile_timeout = DEFAULT_COMPILE_TIMEOUT_MS;

    const effectiveMemoryLimitBytes = this.clampPistonMemoryLimit(memoryLimitBytes);
    if (effectiveMemoryLimitBytes) {
      pistonPayload.run_memory_limit = effectiveMemoryLimitBytes;
      pistonPayload.compile_memory_limit = effectiveMemoryLimitBytes;
    }

    try {
      const response = await axios.post(this.pistonApiUrl, pistonPayload);
      const data = response.data;

      const rawStdout: string = data.run?.stdout || '';
      const rawStderr: string = data.run?.stderr || '';

      // Extract the file output from behind the marker
      const { programStdout, fileOutput } = this.extractFileOutput(rawStdout);

      // Build a response that mirrors the normal runCode() response,
      // but uses the file output as the effective stdout.
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
          // For judging we use the file output; if there was no output file
          // we fall back to normal stdout (handles compile/runtime errors).
          stdout: fileOutput !== null ? fileOutput : programStdout,
          stderr: rawStderr,
          code: data.run.code ?? 0,
          signal: data.run.signal,
          output: data.run.output || '',
          cpu_time: data.run.cpu_time ?? null,
          wall_time: data.run.wall_time ?? null,
          memory: data.run.memory ?? null,
          message: data.run.message ?? null,
          status: data.run.status ?? null,
          // Flag missing output file so gradeSubmission can report it clearly
          _missingOutputFile: fileOutput === null && (data.run.code ?? 0) === 0,
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
      this.logger.error(`File I/O execution failed (${language}): ${error.message}`);
      throw new Error('Code execution failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Build a bash wrapper script for file-I/O execution.
   *
   * The script:
   *  1. Reads stdin and writes it to the input file.
   *  2. Compiles (C++/Java) the student source.
   *  3. Runs the compiled program.
   *  4. If the output file exists, prints a unique marker line followed by
   *     the file content so the caller can extract it.
   */
  private buildFileIoWrapper(
    language: string,
    sourceFileName: string,
    inputFileName: string,
    outputFileName: string,
  ): string {
    const l = language.toLowerCase();
    const marker = FILE_OUTPUT_MARKER;

    let compileAndRun: string;

    if (l === 'c++' || l === 'cpp' || l.startsWith('c++ ')) {
      compileAndRun = [
        `g++ -O2 -std=c++17 -o solution ${sourceFileName} 2>&1`,
        'COMPILE_EXIT=$?',
        'if [ $COMPILE_EXIT -ne 0 ]; then exit $COMPILE_EXIT; fi',
        './solution',
        'RUN_EXIT=$?',
      ].join('\n');
    } else if (l === 'python' || l === 'py' || l.startsWith('python ')) {
      compileAndRun = [
        `python3 ${sourceFileName}`,
        'RUN_EXIT=$?',
      ].join('\n');
    } else if (l === 'java' || l.startsWith('java ')) {
      // Java source must be named after the public class. We assume Main.java.
      compileAndRun = [
        `javac ${sourceFileName} 2>&1`,
        'COMPILE_EXIT=$?',
        'if [ $COMPILE_EXIT -ne 0 ]; then exit $COMPILE_EXIT; fi',
        `java -cp . $(basename ${sourceFileName} .java)`,
        'RUN_EXIT=$?',
      ].join('\n');
    } else {
      // Fallback — try running as a script
      compileAndRun = [
        `chmod +x ${sourceFileName} && ./${sourceFileName}`,
        'RUN_EXIT=$?',
      ].join('\n');
    }

    return [
      '#!/bin/bash',
      '',
      '# Write stdin to the input file',
      `cat > '${inputFileName}'`,
      '',
      '# Compile and run',
      compileAndRun,
      '',
      '# Output the result file if it exists',
      `if [ -f '${outputFileName}' ]; then`,
      `  echo '${marker}'`,
      `  cat '${outputFileName}'`,
      'else',
      `  if [ \${RUN_EXIT:-0} -eq 0 ]; then`,
      `    echo "Error: Output file '${outputFileName}' was not created." >&2`,
      `    echo "This problem requires file I/O. Use freopen(\\"${inputFileName}\\", \\"r\\", stdin) and freopen(\\"${outputFileName}\\", \\"w\\", stdout) in your code." >&2`,
      '  fi',
      'fi',
      '',
      'exit ${RUN_EXIT:-0}',
    ].join('\n');
  }

  /**
   * Split raw stdout into the program's own stdout and the file-output content.
   * Returns `fileOutput: null` when the marker was not found (e.g. the program
   * crashed before producing an output file).
   */
  private extractFileOutput(rawStdout: string): { programStdout: string; fileOutput: string | null } {
    const idx = rawStdout.indexOf(FILE_OUTPUT_MARKER);
    if (idx === -1) {
      return { programStdout: rawStdout, fileOutput: null };
    }
    const programStdout = rawStdout.substring(0, idx);
    // Skip the marker line (marker + newline)
    const afterMarker = rawStdout.substring(idx + FILE_OUTPUT_MARKER.length);
    const fileOutput = afterMarker.startsWith('\n') ? afterMarker.substring(1) : afterMarker;
    return { programStdout, fileOutput };
  }

  /**
   * Map a language name to a conventional source file name.
   */
  private getSourceFileName(language: string): string {
    const l = language.toLowerCase();
    if (l === 'c++' || l === 'cpp' || l.startsWith('c++ ')) return 'main.cpp';
    if (l === 'python' || l === 'py' || l.startsWith('python ')) return 'main.py';
    if (l === 'java' || l.startsWith('java ')) return 'Main.java';
    if (l === 'javascript' || l === 'js') return 'main.js';
    return 'main.txt';
  }
}
