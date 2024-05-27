import { describe, it, expect, jest } from '@jest/globals';
import { promisify } from 'util';

import { AsyncQueue } from './AsyncQueue';

const sleep = promisify(setTimeout);

describe('AsyncQueue', () => {
  it('should emit job lifecycle events in order', async () => {
    const queue = new AsyncQueue(1);
    const spy = jest.fn();
    queue.once('added', spy);
    queue.once('started', spy);
    queue.once('completed', spy);
    const work = async () => {
      await sleep(1);
      return 'test';
    };
    const start = Date.now();

    queue.enqueue('test', work);
    await sleep(2);

    expect(spy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        state: 'pending',
        result: null,
        startedAt: 0,
        completedAt: 0,
      }),
    );
    expect((spy.mock.calls[0][0] as any).createdAt).toBeGreaterThanOrEqual(start);

    expect(spy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        state: 'active',
        result: null,
        completedAt: 0,
      }),
    );
    expect((spy.mock.calls[1][0] as any).startedAt).toBeGreaterThanOrEqual(
      (spy.mock.calls[0][0] as any).createdAt,
    );

    expect(spy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        state: 'complete',
        result: { success: true, data: 'test' },
      }),
    );
    expect((spy.mock.calls[2][0] as any).completedAt).toBeGreaterThanOrEqual(
      (spy.mock.calls[1][0] as any).startedAt,
    );
  });

  it('should limit job concurrency', async () => {
    const queue = new AsyncQueue(1);
    const startedSpy = jest.fn();
    const completedSpy = jest.fn();
    queue.on('started', startedSpy);
    queue.on('completed', completedSpy);
    const work = (data: string) => async () => {
      await sleep(5);
      return data;
    };

    queue.enqueue('first', work('first'));
    queue.enqueue('second', work('second'));
    await sleep(10);

    const firstCompleted = completedSpy.mock.calls[0][0] as any;
    const secondStarted = startedSpy.mock.calls[1][0] as any;
    expect(firstCompleted.id).toBe('first');
    expect(secondStarted.id).toBe('second');
    expect(firstCompleted.completedAt).toBeLessThanOrEqual(secondStarted.startedAt);
  });

  it('should return the correct job when synchronously dispatching', async () => {
    const queue = new AsyncQueue(1);
    queue.enqueue('first', () => sleep(2));
    queue.enqueue('second', () => sleep(2));
    queue.enqueue('third', () => sleep(2));

    await expect(queue.sync('fourth', () => Promise.resolve('fourth'))).resolves.toEqual('fourth');
    await expect(queue.sync('fith', () => Promise.reject('fifth'))).rejects.toEqual('fifth');
  });
});
