import { EventEmitter } from 'events';

export type JobState = 'pending' | 'active' | 'complete';

export type Job<T> = {
  id: string;
  work: () => Promise<T>;
  state: JobState;
  createdAt: number;
  startedAt: number;
  completedAt: number;
  result: JobResult<T> | null;
};

export type JobResult<T> = { success: true; data: T } | { success: false; error: Error };

export type JobEvent = 'added' | 'started' | 'completed';

export declare interface AsyncQueue<T = any> {
  on(event: JobEvent, listener: (job: Job<T>) => void): this;
  emit(event: JobEvent, job: Job<T>): boolean;
}

export class AsyncQueue<T = any> extends EventEmitter {
  concurrency: number;
  items: Job<T>[] = [];
  active: Job<T>[] = [];

  constructor(concurrency = 2) {
    super();
    this.concurrency = concurrency;
    this.on('completed', this.pump.bind(this));
  }

  enqueue(id: string, work: () => Promise<T>) {
    const job: Job<T> = {
      id,
      work,
      state: 'pending',
      createdAt: Date.now(),
      startedAt: 0,
      completedAt: 0,
      result: null,
    };

    this.items.push(job);
    this.emit('added', job);
    this.pump();
  }

  async sync(id: string, work: () => Promise<T>): Promise<T> {
    const promise = new Promise<T>((resolve, reject) => {
      this.on('completed', (job) => {
        if (job.id !== id || !job.result) {
          return;
        }

        if (job.result.success) {
          resolve(job.result.data);
        } else {
          reject(job.result.error);
        }
      });
    });

    this.enqueue(id, work);
    return promise;
  }

  private pump() {
    // too many active
    if (this.active.length >= this.concurrency) {
      return;
    }

    const job = this.items.shift();
    // nothing to do
    if (!job) {
      return;
    }

    const copy: Job<T> = {
      ...job,
      startedAt: Date.now(),
      state: 'active',
    };

    this.emit('started', copy);
    this.active.push(copy);
    this.run(copy);
  }

  private async run(job: Job<T>) {
    const copy = { ...job };
    try {
      const data = await copy.work();
      copy.result = { success: true, data };
    } catch (error: any) {
      copy.result = { success: false, error };
    } finally {
      // make space for the next job
      this.active = this.active.filter((active) => active.id !== copy.id);
      copy.state = 'complete';
      copy.completedAt = Date.now();
      this.emit('completed', copy);
    }
  }
}
