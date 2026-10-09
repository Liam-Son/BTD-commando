export const DATASETS: readonly ["sergeant", "medic", "notes", "echo", "chat"];
export function key(owner: string, id: string): string;
export function makeBackup(
  owner: string,
  records: Record<string, unknown>,
  ids: readonly string[],
): Promise<unknown>;
export function inspectBackup(text: string): Promise<any>;
export function validateDataset(id: string, value: unknown): boolean;
export function parseRecord(raw: string, owner: string, id: string): any;
