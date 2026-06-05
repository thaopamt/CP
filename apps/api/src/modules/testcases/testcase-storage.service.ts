import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import JSZip from 'jszip';

export interface ITestcaseContent {
  input: string;
  output: string;
}

export interface ITestcaseFilePair {
  inputFile: string;
  outputFile: string;
}

/**
 * File-backed storage for heavy grading test cases.
 *
 * The DB only keeps lightweight metadata (counts, visible samples). The actual
 * `.inp`/`.out` payloads — which can reach several MB for competitive problems
 * — live on disk under {@link rootDir}, one directory per assignment:
 *
 *   {rootDir}/{assignmentId}/{index}.inp
 *   {rootDir}/{assignmentId}/{index}.out
 *
 * Indices are 0-based and contiguous. The judge reads them by index.
 */
@Injectable()
export class TestcaseStorageService {
  private readonly logger = new Logger(TestcaseStorageService.name);
  private readonly rootDir =
    process.env.TESTCASE_STORAGE_DIR || path.join(process.cwd(), 'storage', 'testcases');

  private assignmentDir(assignmentId: string): string {
    return path.join(this.rootDir, assignmentId);
  }

  private inpPath(assignmentId: string, index: number): string {
    return path.join(this.assignmentDir(assignmentId), `${index}.inp`);
  }

  private outPath(assignmentId: string, index: number): string {
    return path.join(this.assignmentDir(assignmentId), `${index}.out`);
  }

  private manifestPath(assignmentId: string): string {
    return path.join(this.assignmentDir(assignmentId), 'manifest.json');
  }

  /**
   * Read a single hidden test case by index. Missing files resolve to empty
   * strings so a partially-uploaded set degrades gracefully rather than
   * crashing the judge.
   */
  async readTestcase(assignmentId: string, index: number): Promise<ITestcaseContent> {
    const [input, output] = await Promise.all([
      this.readFileSafe(this.inpPath(assignmentId, index)),
      this.readFileSafe(this.outPath(assignmentId, index)),
    ]);
    return { input, output };
  }

  /** Read every stored hidden test case in index order. */
  async readAll(assignmentId: string): Promise<ITestcaseContent[]> {
    const count = await this.count(assignmentId);
    const out: ITestcaseContent[] = [];
    for (let i = 0; i < count; i++) {
      out.push(await this.readTestcase(assignmentId, i));
    }
    return out;
  }

  /** Read stored display metadata for hidden testcase file pairs. */
  async readManifest(assignmentId: string): Promise<ITestcaseFilePair[]> {
    const content = await this.readFileSafe(this.manifestPath(assignmentId));
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item) => typeof item?.inputFile === 'string')
            .map((item) => ({
              inputFile: item.inputFile,
              outputFile: typeof item.outputFile === 'string' ? item.outputFile : '',
            }));
        }
      } catch (err: any) {
        this.logger.warn(`Failed to parse testcase manifest for ${assignmentId}: ${err?.message}`);
      }
    }

    const count = await this.count(assignmentId);
    return Array.from({ length: count }, (_, index) => ({
      inputFile: `${index + 1}.inp`,
      outputFile: `${index + 1}.out`,
    }));
  }

  /** Number of contiguous `.inp` files stored for the assignment. */
  async count(assignmentId: string): Promise<number> {
    let names: string[];
    try {
      names = await fs.readdir(this.assignmentDir(assignmentId));
    } catch (err: any) {
      if (err?.code === 'ENOENT') return 0;
      throw err;
    }
    const indices = names
      .map((n) => /^(\d+)\.inp$/.exec(n))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => parseInt(m[1], 10));
    return indices.length === 0 ? 0 : Math.max(...indices) + 1;
  }

  /**
   * Replace the assignment's entire hidden test set with the contents of a ZIP
   * archive. Accepts the common naming conventions used by the admin upload UI
   * (`1.inp`/`1.out`, `1.in`/`1.out`, `input1.txt`/`output1.txt`, ...).
   *
   * Returns the number of test cases written. The directory is wiped first so
   * re-uploading is idempotent and never leaves stale files behind.
   */
  async replaceFromZip(
    assignmentId: string,
    zipBuffer: Buffer,
  ): Promise<{ count: number; testcases: ITestcaseFilePair[] }> {
    const zip = await JSZip.loadAsync(zipBuffer);
    const fileMap = new Map<string, { inp?: string; out?: string; inputFile?: string; outputFile?: string }>();

    for (const [zipPath, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const filename = zipPath.split('/').pop() || '';
      const match =
        filename.match(/^(?:input|test)?(\d+)\.(?:inp|in|txt)$/i) ||
        filename.match(/^(?:output|ans)?(\d+)\.(?:out|ans|txt)$/i);
      if (!match) continue;

      const num = match[1];
      const isInput =
        /\.(inp|in)$/i.test(filename) || /^input/i.test(filename) || /^test.*\.in$/i.test(filename);
      const isOutput =
        /\.(out|ans)$/i.test(filename) || /^output/i.test(filename) || /^ans/i.test(filename);

      if (!fileMap.has(num)) fileMap.set(num, {});
      const content = await entry.async('string');
      if (isInput) {
        fileMap.get(num)!.inp = content;
        fileMap.get(num)!.inputFile = filename;
      } else if (isOutput) {
        fileMap.get(num)!.out = content;
        fileMap.get(num)!.outputFile = filename;
      }
    }

    const parsedCases = Array.from(fileMap.entries())
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
      .filter(([, v]) => v.inp !== undefined)
      .map(([num, v]) => ({
        content: { input: v.inp ?? '', output: v.out ?? '' },
        files: {
          inputFile: v.inputFile ?? `${num}.inp`,
          outputFile: v.outputFile ?? `${num}.out`,
        },
      }));
    const cases = parsedCases.map((item) => item.content);
    const testcases = parsedCases.map((item) => item.files);

    await this.replaceAll(assignmentId, cases, testcases);
    return { count: cases.length, testcases };
  }

  /** Replace the entire hidden test set from in-memory contents. */
  async replaceAll(
    assignmentId: string,
    cases: ITestcaseContent[],
    manifest?: ITestcaseFilePair[],
  ): Promise<void> {
    await this.clear(assignmentId);
    if (cases.length === 0) return;
    const dir = this.assignmentDir(assignmentId);
    await fs.mkdir(dir, { recursive: true });
    const testcaseManifest = manifest ?? cases.map((_, i) => ({
      inputFile: `${i + 1}.inp`,
      outputFile: `${i + 1}.out`,
    }));
    await Promise.all([
      ...cases.flatMap((tc, i) => [
        fs.writeFile(this.inpPath(assignmentId, i), tc.input ?? ''),
        fs.writeFile(this.outPath(assignmentId, i), tc.output ?? ''),
      ]),
      fs.writeFile(this.manifestPath(assignmentId), JSON.stringify(testcaseManifest, null, 2)),
    ]);
  }

  /** Remove all stored test cases for an assignment (e.g. on delete). */
  async clear(assignmentId: string): Promise<void> {
    try {
      await fs.rm(this.assignmentDir(assignmentId), { recursive: true, force: true });
    } catch (err: any) {
      this.logger.warn(`Failed to clear testcases for ${assignmentId}: ${err?.message}`);
    }
  }

  private async readFileSafe(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (err: any) {
      if (err?.code === 'ENOENT') return '';
      throw err;
    }
  }
}
