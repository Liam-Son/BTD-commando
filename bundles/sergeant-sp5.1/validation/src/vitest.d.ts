declare module "vitest" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void): void;
  export function expect(value: unknown): {
    toBe(x: unknown): void;
    toBeLessThan(x: number): void;
    toBeLessThanOrEqual(x: number): void;
    toContain(x: string): void;
    toBeCloseTo(x: number): void;
  };
}
