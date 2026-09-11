export type SerialTaskQueue = <Result>(task: () => Promise<Result> | Result) => Promise<Result>;

export function createSerialTaskQueue(): SerialTaskQueue {
  let tail = Promise.resolve<void>(undefined);

  return async <Result>(task: () => Promise<Result> | Result) => {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await task();
    } finally {
      release();
    }
  };
}
