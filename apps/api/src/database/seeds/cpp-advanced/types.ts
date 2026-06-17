import { IAssignmentEditorial } from '@cp/shared';

export type CoverageTag =
  | 'smallest'
  | 'largest'
  | 'all_negative'
  | 'all_positive'
  | 'has_zero'
  | 'duplicates'
  | 'query_start'
  | 'query_end'
  | 'whole_range'
  | 'index_trap';

export interface TestInputSpec {
  input: string;
  tags: CoverageTag[];
}

export interface ProblemSpec {
  key: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  story: string;
  inputDesc: string;
  outputDesc: string;
  constraints: string;
  editorial: IAssignmentEditorial;
  solve: (input: string) => string;
  inputs: TestInputSpec[];
}

export interface CourseSpec {
  code: string;
  title: string;
  description: string;
  tags: string[];
  problems: ProblemSpec[];
}
