import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

interface SubmissionJudgeJob {
  id: string;
  name: string;
  run: () => Promise<void>;
}

@Injectable()
export class SubmissionJudgeQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(SubmissionJudgeQueueService.name);
  private readonly concurrency = this.readPositiveIntEnv(process.env.SUBMISSION_JUDGE_CONCURRENCY, 2);
  private readonly queue: SubmissionJudgeJob[] = [];
  private readonly activeJobIds = new Set<string>();
  private activeCount = 0;
  private stopped = false;
  private scheduled = false;

  enqueue(job: SubmissionJudgeJob): void {
    if (this.stopped) {
      throw new Error('Submission judge queue is stopped');
    }

    if (this.activeJobIds.has(job.id) || this.queue.some((queued) => queued.id === job.id)) {
      this.logger.debug(`Skipping duplicate judge job ${job.id}`);
      return;
    }

    this.queue.push(job);
    this.scheduleDrain();
  }

  onModuleDestroy() {
    this.stopped = true;
    this.queue.length = 0;
  }

  private scheduleDrain(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    setImmediate(() => {
      this.scheduled = false;
      void this.drain();
    });
  }

  private async drain(): Promise<void> {
    while (!this.stopped && this.activeCount < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.activeCount++;
      this.activeJobIds.add(job.id);

      void job.run()
        .catch((error) => {
          this.logger.error(`Submission judge job ${job.name} failed: ${error?.message || error}`, error?.stack);
        })
        .finally(() => {
          this.activeCount--;
          this.activeJobIds.delete(job.id);
          this.scheduleDrain();
        });
    }
  }

  private readPositiveIntEnv(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
  }
}
