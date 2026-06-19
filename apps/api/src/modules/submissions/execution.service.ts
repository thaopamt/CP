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
const BATCH_CASE_BEGIN_MARKER = '___CP_BATCH_CASE_BEGIN___';
const BATCH_CASE_END_MARKER = '___CP_BATCH_CASE_END___';
const BATCH_COMPILE_ERROR_MARKER = '___CP_BATCH_COMPILE_ERROR___';
const BATCH_COMPILE_END_MARKER = '___CP_BATCH_COMPILE_END___';

interface GradeTestCase {
  testCaseIndex: number;
  input: string;
  output: string;
}

interface BatchCaseOutput {
  testCaseIndex: number;
  exitCode: number;
  executionTimeMs: number;
  stdout: string;
  stderr: string;
}

interface GradedTestResult extends ISubmissionRealtimeTestResult {
  errorMessage: string | null;
  executionTimeMs: number | null;
  memoryBytes: number | null;
}

interface GradeComputationResult {
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  maxMemory: number;
  totalTime: number;
  testResults: GradedTestResult[];
}

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
  async gradeSubmission(
    assignment: Assignment,
    language: string,
    code: string,
    hooks: GradeSubmissionHooks = {},
  ): Promise<GradeComputationResult> {
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
      const isOutputLimitExceeded = this.isOutputLimitExceeded(res);

      let status: SubmissionStatus;
      if (isTLE) {
        status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
      } else if (isOutputLimitExceeded) {
        status = SubmissionStatus.RUNTIME_ERROR;
      } else if (hasError) {
        status = SubmissionStatus.RUNTIME_ERROR;
      } else {
        status = SubmissionStatus.ACCEPTED;
      }

      const wallTimeMs = res.run.wall_time ?? 0;
      const testResult: GradedTestResult = {
        testCaseIndex: 0,
        status,
        input: '',
        expectedOutput: '(no test cases)',
        actualOutput: res.run.stdout || res.run.stderr || '',
        errorMessage: isOutputLimitExceeded
          ? this.getOutputLimitErrorMessage(res)
          : res.compile?.stderr || res.run.stderr || null,
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

    const testCases = await this.resolveGradeTestCases(assignment, inlineCases, hiddenCount);
    if (this.canUseBatchGrader(language)) {
      try {
        return await this.gradeBatchTestCases(
          assignment.id,
          language,
          code,
          testCases,
          timeLimitMs,
          memoryLimitBytes,
          fileIoConfig,
          hooks,
        );
      } catch (error: any) {
        this.logger.warn(
          `Batch grading failed for assignment ${assignment.id}; falling back to sequential grading: ${error?.message || error}`,
        );
      }
    }

    return this.gradeSequentialTestCases(language, code, testCases, timeLimitMs, memoryLimitBytes, fileIoConfig, hooks);
  }

  private async resolveGradeTestCases(
    assignment: Assignment,
    inlineCases: Array<{ input: string; output: string }>,
    hiddenCount: number,
  ): Promise<GradeTestCase[]> {
    const testCases: GradeTestCase[] = inlineCases.map((tc, index) => ({
      testCaseIndex: index,
      input: tc.input,
      output: tc.output,
    }));

    for (let i = 0; i < hiddenCount; i++) {
      const hidden = await this.testcaseStorage.readTestcase(assignment.id, i);
      testCases.push({
        testCaseIndex: inlineCases.length + i,
        input: hidden.input,
        output: hidden.output,
      });
    }

    return testCases;
  }

  private async gradeSequentialTestCases(
    language: string,
    code: string,
    testCases: GradeTestCase[],
    timeLimitMs: number,
    memoryLimitBytes: number,
    fileIoConfig: FileIoConfig | undefined,
    hooks: GradeSubmissionHooks,
  ): Promise<GradeComputationResult> {
    const testResults: GradedTestResult[] = [];
    let passedCount = 0;
    let maxMemory = 0;
    let totalTime = 0;
    let finalStatus = SubmissionStatus.ACCEPTED;
    const totalCases = testCases.length;

    for (const testCase of testCases) {
      const { testCaseIndex, input: tcInput, output: tcOutput } = testCase;

      await hooks.onTestCaseStart?.({ testCaseIndex, totalCount: totalCases });
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
      const isOutputLimitExceeded = this.isOutputLimitExceeded(res);

      if (isTLE) {
        status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
        errorMsg = `Time Limit Exceeded: execution took ${wallTimeMs}ms (limit: ${timeLimitMs}ms)`;
        if (finalStatus === SubmissionStatus.ACCEPTED) {
          finalStatus = SubmissionStatus.TIME_LIMIT_EXCEEDED;
        }
      } else if (isOutputLimitExceeded) {
        status = SubmissionStatus.RUNTIME_ERROR;
        errorMsg = this.getOutputLimitErrorMessage(res);
        if (finalStatus === SubmissionStatus.ACCEPTED) {
          finalStatus = SubmissionStatus.RUNTIME_ERROR;
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

      const testResult: GradedTestResult = {
        testCaseIndex,
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

  private canUseBatchGrader(language: string): boolean {
    const l = language.toLowerCase();
    return (
      l === 'c++' ||
      l === 'cpp' ||
      l.startsWith('c++ ') ||
      l === 'java' ||
      l.startsWith('java ') ||
      l === 'python' ||
      l === 'py' ||
      l.startsWith('python ')
    );
  }

  private async gradeBatchTestCases(
    assignmentId: string,
    language: string,
    code: string,
    testCases: GradeTestCase[],
    timeLimitMs: number,
    memoryLimitBytes: number,
    fileIoConfig: FileIoConfig | undefined,
    hooks: GradeSubmissionHooks,
  ): Promise<GradeComputationResult> {
    const sourceFileName = this.getSourceFileName(language);
    const wrapper = this.buildBatchRunner(language, sourceFileName, testCases.length, timeLimitMs, fileIoConfig);
    const pistonPayload: Record<string, any> = {
      language: 'bash',
      version: '5.1.0',
      files: [
        { name: 'runner.sh', content: wrapper },
        { name: sourceFileName, content: code },
        ...testCases.map((testCase) => ({
          name: `cases/${testCase.testCaseIndex}.in`,
          content: testCase.input ?? '',
        })),
      ],
      stdin: '',
    };

    const effectiveRunTimeoutMs = this.resolveBatchRunTimeoutMs(timeLimitMs, testCases.length, assignmentId);
    if (effectiveRunTimeoutMs) {
      pistonPayload.run_timeout = effectiveRunTimeoutMs;
    }
    pistonPayload.compile_timeout = DEFAULT_COMPILE_TIMEOUT_MS;

    const effectiveMemoryLimitBytes = this.clampPistonMemoryLimit(memoryLimitBytes);
    if (effectiveMemoryLimitBytes) {
      pistonPayload.run_memory_limit = effectiveMemoryLimitBytes;
      pistonPayload.compile_memory_limit = effectiveMemoryLimitBytes;
    }

    let data: any;
    try {
      const response = await axios.post(this.pistonApiUrl, pistonPayload);
      data = response.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        throw new Error(`Piston API not reachable at ${this.pistonApiUrl}`);
      }
      throw new Error('Batch code execution failed: ' + (error.response?.data?.message || error.message));
    }

    const pistonResult = this.toCodeExecutionResponse(data);
    if (this.isOutputLimitExceeded(pistonResult)) {
      throw new Error(this.getOutputLimitErrorMessage(pistonResult));
    }
    if (this.isTimeLimitExceeded(pistonResult, effectiveRunTimeoutMs ?? timeLimitMs)) {
      throw new Error(`Batch grading exceeded global run timeout (${effectiveRunTimeoutMs ?? timeLimitMs}ms)`);
    }

    const stdout = pistonResult.run.stdout;
    const compileError = this.parseBatchCompileError(stdout);
    const memoryBytes = pistonResult.run.memory ?? 0;
    if (compileError !== null) {
      const compileResults: GradedTestResult[] = testCases.map((testCase) => ({
        testCaseIndex: testCase.testCaseIndex,
        status: SubmissionStatus.COMPILATION_ERROR,
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: '',
        errorMessage: compileError || 'Compilation failed',
        executionTimeMs: 0,
        memoryBytes,
      }));
      return this.replayComputedTestResults(compileResults, hooks, memoryBytes);
    }

    const outputs = this.parseBatchCaseOutputs(stdout);
    if (outputs.size !== testCases.length) {
      throw new Error(`Batch runner returned ${outputs.size}/${testCases.length} testcase result(s)`);
    }

    const testResults: GradedTestResult[] = testCases.map((testCase) => {
      const output = outputs.get(testCase.testCaseIndex);
      if (!output) {
        throw new Error(`Missing batch testcase result for index ${testCase.testCaseIndex}`);
      }

      let status = SubmissionStatus.ACCEPTED;
      let errorMessage: string | null = output.stderr || null;
      if (output.exitCode === 124) {
        status = SubmissionStatus.TIME_LIMIT_EXCEEDED;
        errorMessage = `Time Limit Exceeded: execution took at least ${timeLimitMs}ms (limit: ${timeLimitMs}ms)`;
      } else if (output.exitCode !== 0) {
        status = SubmissionStatus.RUNTIME_ERROR;
        errorMessage = output.stderr || `Runtime Error: process exited with code ${output.exitCode}`;
      } else if (testCase.output.trim() !== output.stdout.trim()) {
        status = SubmissionStatus.WRONG_ANSWER;
      }

      return {
        testCaseIndex: testCase.testCaseIndex,
        status,
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: output.stdout,
        errorMessage,
        executionTimeMs: output.executionTimeMs,
        memoryBytes,
      };
    });

    return this.replayComputedTestResults(testResults, hooks, memoryBytes);
  }

  private async replayComputedTestResults(
    testResults: GradedTestResult[],
    hooks: GradeSubmissionHooks,
    maxMemory: number,
  ): Promise<GradeComputationResult> {
    let passedCount = 0;
    let totalTime = 0;
    let finalStatus = SubmissionStatus.ACCEPTED;
    const totalCount = testResults.length;

    for (let i = 0; i < testResults.length; i++) {
      const testResult = testResults[i];
      await hooks.onTestCaseStart?.({ testCaseIndex: testResult.testCaseIndex, totalCount });

      if (testResult.status === SubmissionStatus.ACCEPTED) {
        passedCount++;
      } else if (finalStatus === SubmissionStatus.ACCEPTED) {
        finalStatus = testResult.status;
      }
      totalTime += testResult.executionTimeMs ?? 0;

      await hooks.onTestCaseComplete?.({
        testResult,
        completedCount: i + 1,
        passedCount,
        totalCount,
        totalTime,
        maxMemory,
        status: finalStatus,
      });
    }

    return {
      status: finalStatus,
      passedCount,
      totalCount,
      maxMemory,
      totalTime,
      testResults,
    };
  }

  private buildBatchRunner(
    language: string,
    sourceFileName: string,
    testCaseCount: number,
    timeLimitMs: number,
    fileIoConfig?: FileIoConfig,
  ): string {
    const l = language.toLowerCase();
    const timeoutSeconds = Math.max(0.001, timeLimitMs / 1000).toFixed(3);
    const source = this.shellSingleQuote(sourceFileName);
    const compileOut = 'compile.out';
    const compileErr = 'compile.err';

    let compileCommand = '';
    let runCommand: string;
    if (l === 'c++' || l === 'cpp' || l.startsWith('c++ ')) {
      compileCommand = `g++ -O2 -std=c++17 -o solution ${source} > ${compileOut} 2> ${compileErr}`;
      runCommand = './solution';
    } else if (l === 'java' || l.startsWith('java ')) {
      compileCommand = `javac ${source} > ${compileOut} 2> ${compileErr}`;
      runCommand = 'java -cp . Main';
    } else if (l === 'python' || l === 'py' || l.startsWith('python ')) {
      runCommand = `python3 ${source}`;
    } else {
      runCommand = `chmod +x ${source} && ./${source}`;
    }

    const runCase = fileIoConfig
      ? this.buildBatchFileIoRunCase(runCommand, timeoutSeconds, fileIoConfig)
      : `timeout --kill-after=1s ${timeoutSeconds}s ${runCommand} < "$input_file" > "$out_file" 2> "$err_file"`;

    return [
      '#!/bin/bash',
      'set +e',
      '',
      `CASE_COUNT=${testCaseCount}`,
      `CASE_BEGIN=${this.shellSingleQuote(BATCH_CASE_BEGIN_MARKER)}`,
      `CASE_END=${this.shellSingleQuote(BATCH_CASE_END_MARKER)}`,
      `COMPILE_ERROR=${this.shellSingleQuote(BATCH_COMPILE_ERROR_MARKER)}`,
      `COMPILE_END=${this.shellSingleQuote(BATCH_COMPILE_END_MARKER)}`,
      '',
      'emit_b64() {',
      '  if [ -f "$1" ]; then',
      '    base64 "$1" | tr -d "\\n"',
      '  fi',
      '  echo',
      '}',
      '',
      'now_ms() {',
      '  date +%s%3N 2>/dev/null || echo 0',
      '}',
      '',
      'duration_ms() {',
      '  case "$1$2" in',
      '    *[!0-9]*) echo 0 ;;',
      '    *) echo $(( $2 - $1 )) ;;',
      '  esac',
      '}',
      '',
      compileCommand
        ? [
            compileCommand,
            'COMPILE_EXIT=$?',
            'if [ "$COMPILE_EXIT" -ne 0 ]; then',
            `  cat ${compileOut} ${compileErr} > compile.all 2>/dev/null`,
            '  echo "$COMPILE_ERROR"',
            '  emit_b64 compile.all',
            '  echo "$COMPILE_END"',
            '  exit 0',
            'fi',
            '',
          ].join('\n')
        : '',
      'for ((i=0; i<CASE_COUNT; i++)); do',
      '  input_file="cases/${i}.in"',
      '  out_file=".case_${i}.out"',
      '  err_file=".case_${i}.err"',
      '  rm -f "$out_file" "$err_file" .case_stdout',
      '  start_ms=$(now_ms)',
      `  ${runCase}`,
      '  exit_code=$?',
      '  end_ms=$(now_ms)',
      '  elapsed_ms=$(duration_ms "$start_ms" "$end_ms")',
      '  echo "${CASE_BEGIN}|${i}|${exit_code}|${elapsed_ms}"',
      '  emit_b64 "$out_file"',
      '  emit_b64 "$err_file"',
      '  echo "${CASE_END}|${i}"',
      'done',
      '',
      'exit 0',
    ].join('\n');
  }

  private buildBatchFileIoRunCase(runCommand: string, timeoutSeconds: string, fileIo: FileIoConfig): string {
    const inputFileName = this.shellSingleQuote(fileIo.inputFileName);
    const outputFileName = this.shellSingleQuote(fileIo.outputFileName);
    return [
      `cp "$input_file" ${inputFileName}`,
      `rm -f ${outputFileName}`,
      `timeout --kill-after=1s ${timeoutSeconds}s ${runCommand} > .case_stdout 2> "$err_file"`,
      'run_exit=$?',
      `if [ -f ${outputFileName} ]; then`,
      `  cp ${outputFileName} "$out_file"`,
      'else',
      '  cp .case_stdout "$out_file" 2>/dev/null || :',
      'fi',
      '( exit "$run_exit" )',
    ].join('; ');
  }

  private parseBatchCompileError(stdout: string): string | null {
    const start = stdout.indexOf(BATCH_COMPILE_ERROR_MARKER);
    if (start === -1) return null;
    const end = stdout.indexOf(BATCH_COMPILE_END_MARKER, start);
    if (end === -1) return 'Compilation failed';
    const encoded = stdout
      .slice(start + BATCH_COMPILE_ERROR_MARKER.length, end)
      .trim()
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0);
    return encoded ? this.decodeBase64(encoded) : 'Compilation failed';
  }

  private parseBatchCaseOutputs(stdout: string): Map<number, BatchCaseOutput> {
    const outputs = new Map<number, BatchCaseOutput>();
    const lines = stdout.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith(BATCH_CASE_BEGIN_MARKER)) continue;

      const [, rawIndex, rawExitCode, rawDuration] = line.split('|');
      const testCaseIndex = Number(rawIndex);
      const exitCode = Number(rawExitCode);
      const executionTimeMs = Number(rawDuration);
      const stdoutLine = lines[++i] ?? '';
      const stderrLine = lines[++i] ?? '';
      const endLine = lines[++i] ?? '';
      if (!endLine.startsWith(`${BATCH_CASE_END_MARKER}|${testCaseIndex}`)) {
        throw new Error(`Malformed batch output around testcase ${rawIndex}`);
      }

      outputs.set(testCaseIndex, {
        testCaseIndex,
        exitCode: Number.isFinite(exitCode) ? exitCode : 1,
        executionTimeMs: Number.isFinite(executionTimeMs) && executionTimeMs >= 0 ? executionTimeMs : 0,
        stdout: stdoutLine ? this.decodeBase64(stdoutLine) : '',
        stderr: stderrLine ? this.decodeBase64(stderrLine) : '',
      });
    }

    return outputs;
  }

  private decodeBase64(value: string): string {
    return Buffer.from(value.trim(), 'base64').toString('utf8');
  }

  private resolveBatchRunTimeoutMs(timeLimitMs: number, totalCases: number, assignmentId?: string): number {
    const requestedMs = DEFAULT_COMPILE_TIMEOUT_MS + (timeLimitMs * Math.max(totalCases, 1)) + 1000;
    const effectiveMs = this.clampPistonRunTimeout(requestedMs) ?? this.pistonRunTimeoutMs;

    if (effectiveMs < requestedMs) {
      this.logger.warn(
        `Assignment ${assignmentId ?? 'unknown'} batch timeout ${requestedMs}ms exceeds Piston max ${this.pistonRunTimeoutMs}ms; clamped.`,
      );
    }

    return effectiveMs;
  }

  private toCodeExecutionResponse(data: any): ICodeExecutionResponse {
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
        stdout: data.run?.stdout || '',
        stderr: data.run?.stderr || '',
        code: data.run?.code ?? 0,
        signal: data.run?.signal,
        output: data.run?.output || '',
        cpu_time: data.run?.cpu_time ?? null,
        wall_time: data.run?.wall_time ?? null,
        memory: data.run?.memory ?? null,
        message: data.run?.message ?? null,
        status: data.run?.status ?? null,
      },
    } as ICodeExecutionResponse;
  }

  private shellSingleQuote(value: string): string {
    return `'${value.replace(/'/g, `'\\''`)}'`;
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

  private isOutputLimitExceeded(res: ICodeExecutionResponse): boolean {
    const run = res.run;
    const message = `${run.message ?? ''}\n${run.stderr ?? ''}`.toLowerCase();
    return (
      run.status === 'OL' ||
      run.status === 'EL' ||
      message.includes('stdout length exceeded') ||
      message.includes('stderr length exceeded')
    );
  }

  private getOutputLimitErrorMessage(res: ICodeExecutionResponse): string {
    const stream =
      res.run.status === 'EL' || res.run.message?.toLowerCase().includes('stderr')
        ? 'stderr'
        : 'stdout';
    const reason = res.run.message || `${stream} length exceeded`;
    return `Output Limit Exceeded: program produced more ${stream} than the judge allows (${reason})`;
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
