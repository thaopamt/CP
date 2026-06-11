/**
 * Shared shapes for the DP BASIC (Quy hoạch động cơ bản) seed curriculum.
 *
 * Each course (e.g. "DP 1 chiều", "Knapsack cơ bản") is a CourseSpec holding 10
 * ProblemSpecs. A ProblemSpec never hard-codes its expected output — instead it
 * carries a `solve(input)` reference solver written in JS. The seed builder runs
 * `solve` over every `inputs[]` string to GENERATE the expected output, so the
 * test cases can never drift from the intended answer.
 *
 * The judge compares `expected.trim()` vs `actual.trim()` (see ExecutionService),
 * so trailing newlines in solver output do not matter.
 */
export interface ProblemSpec {
  /** Unique within the course, two digits e.g. '01'. Drives the slug + order. */
  key: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  /** Markdown problem statement (the story / requirement). No Input/Output headers — those are added by the builder. */
  story: string;
  /** Describes the stdin format the student program receives. */
  inputDesc: string;
  /** Describes the stdout the program must print. */
  outputDesc: string;
  /** Optional hint shown under the worked example. */
  note?: string;
  /** Reference solver: given the raw stdin string, return the expected stdout. */
  solve: (input: string) => string;
  /**
   * stdin strings (>= 5). The first 3 become VISIBLE sample test cases; the rest
   * are hidden grading cases. Include edge cases. Each solver output is computed
   * from these, so they are the single source of truth.
   */
  inputs: string[];
}

export interface CourseSpec {
  /** Stable natural key, e.g. 'DP-BASIC-01'. Drives upsert + ordering. */
  code: string;
  title: string;
  description: string;
  tags: string[];
  problems: ProblemSpec[];
}
