import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Assignment } from '../assignments/assignment.entity';
import { ICodeExecutionResponse, SubmissionStatus } from '@cp/shared';

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
   * Execute code simply (for Run Code)
   */
  async runCode(language: string, code: string, stdin?: string): Promise<ICodeExecutionResponse> {
    const { lang, version } = this.mapLanguage(language);

    try {
      const response = await axios.post(this.pistonApiUrl, {
        language: lang,
        version: version,
        files: [{ content: code }],
        stdin: stdin || '',
      });

      const data = response.data;

      // Normalize response — Piston returns cpu_time/wall_time/memory at run level
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
        } as ICodeExecutionResponse;
      }
      this.logger.error(`Execution failed (${language}): ${error.message}`);
      throw new Error('Code execution failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Grade a submission against an assignment's test cases
   */
  async gradeSubmission(assignment: Assignment, language: string, code: string) {
    const config = assignment.codingConfig;
    if (!config || !config.testCases || config.testCases.length === 0) {
      this.logger.warn(`Assignment ${assignment.id} has no test cases. Running code once as acceptance.`);
      // Run code once without stdin — if it compiles and runs, mark accepted
      const res = await this.runCode(language, code, '');
      const hasError = (res.compile && res.compile.code !== 0) || res.run.code !== 0;
      return {
        status: hasError ? SubmissionStatus.RUNTIME_ERROR : SubmissionStatus.ACCEPTED,
        passedCount: hasError ? 0 : 1,
        totalCount: 1,
        maxMemory: 0,
        totalTime: 0,
        testResults: [{
          testCaseIndex: 0,
          status: hasError ? SubmissionStatus.RUNTIME_ERROR : SubmissionStatus.ACCEPTED,
          expectedOutput: '(no test cases)',
          actualOutput: res.run.stdout || res.run.stderr || '',
          errorMessage: res.compile?.stderr || res.run.stderr || null,
          executionTimeMs: 0,
          memoryBytes: 0,
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
      const res = await this.runCode(language, code, testCase.input);

      let status = SubmissionStatus.ACCEPTED;
      let actualOutput = res.run.stdout;
      let errorMsg = res.run.stderr;

      if (res.compile && res.compile.code !== 0) {
        status = SubmissionStatus.COMPILATION_ERROR;
        errorMsg = res.compile.stderr;
        finalStatus = status;
      } else if (res.run.code !== 0) {
        status = SubmissionStatus.RUNTIME_ERROR;
        finalStatus = status;
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
        executionTimeMs: 0,
        memoryBytes: 0,
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
}
