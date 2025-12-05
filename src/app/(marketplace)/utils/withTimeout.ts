export class RequestTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestTimeoutError";
  }
}

interface TimeoutOptions {
  timeoutMs: number;
  timeoutMessage: string;
}

export async function withRequestTimeout<T>(
  promise: Promise<T>,
  { timeoutMs, timeoutMessage }: TimeoutOptions
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new RequestTimeoutError(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}