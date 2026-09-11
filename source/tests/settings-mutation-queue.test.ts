import { describe, expect, it } from 'vitest';
import { createSerialTaskQueue } from '../lib/settings-mutation-queue';

describe('settings mutation queue', () => {
  it('serializes controlled interleavings without reading stale state', async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const events: string[] = [];
    const enqueue = createSerialTaskQueue();

    const first = enqueue(async () => {
      events.push('first:start');
      await firstGate;
      events.push('first:end');
      return 1;
    });
    const second = enqueue(async () => {
      events.push('second:start');
      events.push('second:end');
      return 2;
    });

    await Promise.resolve();
    expect(events).toEqual(['first:start']);
    releaseFirst();
    await expect(Promise.all([first, second])).resolves.toEqual([1, 2]);
    expect(events).toEqual(['first:start', 'first:end', 'second:start', 'second:end']);
  });

  it('continues after a rejected task', async () => {
    const enqueue = createSerialTaskQueue();
    const failed = enqueue(async () => { throw new Error('first failed'); });
    const recovered = enqueue(async () => 'second completed');

    await expect(failed).rejects.toThrow('first failed');
    await expect(recovered).resolves.toBe('second completed');
  });
});
