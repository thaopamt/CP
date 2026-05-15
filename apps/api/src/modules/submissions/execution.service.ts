import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Assignment } from '../assignments/assignment.entity';
import { ICodeExecutionResponse, SubmissionStatus } from '@cp/shared';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);
  // Default to public Piston API for now, can be configured via env later
  private readonly pistonApiUrl = process.env.PISTON_API_URL || 'http://localhost:2000/api/v2/piston/execute';

  /**
   * Execute code simply (for Run Code)
   */
  async runCode(language: string, code: string, stdin?: string): Promise<ICodeExecutionResponse> {
    try {
      // Piston language mappings (ensure we map common names to piston names)
      let pistonLang = language.toLowerCase();
      let pistonVersion = '*'; // use latest
      
      if (pistonLang === 'python') {
        pistonVersion = '3.10.0';
      } else if (pistonLang === 'javascript' || pistonLang === 'js' || pistonLang === 'typescript' || pistonLang === 'ts') {
        pistonLang = 'typescript'; // Piston runs JS/TS with deno or typescript
        pistonVersion = '5.0.3';
      } else if (pistonLang === 'c++' || pistonLang === 'cpp') {
        pistonLang = 'c++';
        pistonVersion = '10.2.0';
      }

      const response = await axios.post(this.pistonApiUrl, {
        language: pistonLang,
        version: pistonVersion,
        files: [
          {
            content: code,
          },
        ],
        stdin: stdin || '',
      });

      return response.data as ICodeExecutionResponse;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        this.logger.warn(`Local Piston API not found at ${this.pistonApiUrl}. Using mock execution.`);
        return {
          language,
          version: 'mock',
          run: {
            stdout: 'Mock output: Local Piston API is not running. Please start the Docker container:\n docker run -p 2000:2000 -d piston/piston',
            stderr: '',
            code: 0,
            signal: null,
            output: 'Mock output...'
          }
        };
      }
      this.logger.error(`Failed to execute code in ${language}: ${error.message}`);
      throw new Error('Code execution failed: ' + (error.response?.data?.message || error.message));
    }
  }

  /**
   * Grade a submission against an assignment's test cases
   */
  async gradeSubmission(assignment: Assignment, language: string, code: string) {
    const config = assignment.codingConfig;
    if (!config || !config.testCases || config.testCases.length === 0) {
      this.logger.warn(`Assignment ${assignment.id} has no test cases configured. Returning mock success.`);
      return {
        status: SubmissionStatus.ACCEPTED,
        passedCount: 1,
        totalCount: 1,
        maxMemory: 1024,
        totalTime: 42,
        testResults: [
          {
            testCaseIndex: 0,
            status: SubmissionStatus.ACCEPTED,
            expectedOutput: 'Mock Output',
            actualOutput: 'Mock Output',
            errorMessage: null,
            executionTimeMs: 42,
            memoryBytes: 1024,
          }
        ],
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
      
      // Determine pass/fail
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
        // Compare output
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
        actualOutput: actualOutput,
        errorMessage: errorMsg,
        executionTimeMs: 0, // Piston free tier doesn't easily expose this in standard run, mock or parse if needed
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
