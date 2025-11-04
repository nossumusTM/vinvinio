declare module 'node:test' {
  export const describe: (name: string, fn: () => void | Promise<void>) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
}

declare module 'node:assert/strict' {
  const assert: typeof import('assert');
  export default assert;
}
