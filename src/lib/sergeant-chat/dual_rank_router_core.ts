import { corporalReply, type CorporalReply } from './corporal_engine';
import { sanitizeSergeantDeskContext, type SergeantDeskContext } from './desk_context';

export type DualRankConfig = {
  sergeantBase?: string;
  sergeantToken?: string;
  healthTimeoutMs?: number;
  chatTimeoutMs?: number;
  healthCacheMs?: number;
  failureCooldownMs?: number;
  failureCooldownMaxMs?: number;
  delegatedLocalFirst?: boolean;
  busyCooldownMs?: number;
};

export type SergeantState = 'ONLINE' | 'OFFLINE' | 'COOLDOWN' | 'BUSY' | 'UNCONFIGURED';

export type RankStatus = {
  rank: 'CORPORAL' | 'SERGEANT';
  mode: 'BASIC' | 'ADVANCED';
  advancedAvailable: boolean;
  paperOnly: true;
  sergeantState: SergeantState;
  checkedAt: number;
  retryAfterMs?: number;
};

export type SergeantReply = {
  rank: 'SERGEANT';
  mode: 'ADVANCED';
  advancedAvailable: true;
  paperOnly: true;
  status: string;
  message: string;
  kind?: string;
  symbols?: string[];
  latencyMs?: number;
  requestId?: string;
};

type Clock = () => number;

type HealthCache = {
  value: boolean;
  checkedAt: number;
  retryAfterMs?: number;
};

function stripSlash(x: string) { return x.replace(/\/+$/, ''); }

function finitePositive(x: number | undefined, fallback: number) {
  return Number.isFinite(x) && Number(x) > 0 ? Number(x) : fallback;
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {...init, signal: controller.signal, cache: 'no-store'});
  } finally {
    clearTimeout(timer);
  }
}

export function sanitizeHistory(history: unknown): Array<{role:'user'|'assistant'; content:string}> {
  if (!Array.isArray(history)) return [];
  const newestFirst: Array<{role:'user'|'assistant'; content:string}> = [];
  let total = 0;
  for (const raw of [...history].reverse()) {
    if (newestFirst.length >= 8) break;
    if (!raw || typeof raw !== 'object') continue;
    const role = (raw as any).role;
    if (role !== 'user' && role !== 'assistant') continue;
    let content = String((raw as any).content ?? '').trim();
    if (!content) continue;
    content = content.slice(0, 2000);
    const remaining = 8000 - total;
    if (remaining <= 0) break;
    if (content.length > remaining) break;
    total += content.length;
    newestFirst.push({role, content});
  }
  return newestFirst.reverse();
}

function sanitizeSergeantReply(data: unknown): SergeantReply | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const x: any = data;
  const message = typeof x.message === 'string' ? x.message.trim().slice(0, 8000) : '';
  const allowedStatus = new Set(['INFO','REFUSED','ACTION_REQUIRES_CONFIRMATION']);
  const status = typeof x.status === 'string' && allowedStatus.has(x.status) ? x.status : '';
  if (!message || !status) return null;
  const symbols = Array.isArray(x.symbols)
    ? x.symbols
        .filter((v: unknown) => typeof v === 'string' && /^[A-Z0-9][A-Z0-9._-]{0,14}$/.test(v))
        .slice(0, 12)
    : undefined;
  const latencyRaw = Number(x.latencyMs);
  const latencyMs = Number.isFinite(latencyRaw) && latencyRaw >= 0 && latencyRaw <= 600000 ? latencyRaw : undefined;
  const requestId = typeof x.requestId === 'string' && /^[A-Za-z0-9._:-]{1,80}$/.test(x.requestId) ? x.requestId : undefined;
  const allowedKinds = new Set(['DETERMINISTIC_POLICY','GROUNDED_EXPLANATION','GENERAL_EDUCATION']);
  const kind = typeof x.kind === 'string' && allowedKinds.has(x.kind) ? x.kind : undefined;
  return {
    rank: 'SERGEANT', mode: 'ADVANCED', advancedAvailable: true, paperOnly: true,
    status, message,
    ...(kind ? {kind} : {}),
    ...(symbols ? {symbols} : {}),
    ...(latencyMs !== undefined ? {latencyMs} : {}),
    ...(requestId ? {requestId} : {}),
  };
}

export class DualRankRouter {
  private cache: HealthCache | null = null;
  private cooldownUntil = 0;
  private busyUntil = 0;
  private consecutiveFailures = 0;
  private inFlightHealth: Promise<boolean> | null = null;

  constructor(
    private readonly cfg: DualRankConfig,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly now: Clock = () => Date.now(),
  ) {}

  reset() {
    this.cache = null;
    this.cooldownUntil = 0;
    this.busyUntil = 0;
    this.consecutiveFailures = 0;
    this.inFlightHealth = null;
  }

  private configured() {
    return Boolean(this.cfg.sergeantBase && this.cfg.sergeantToken);
  }

  private markFailure() {
    this.consecutiveFailures += 1;
    const base = finitePositive(this.cfg.failureCooldownMs, 15000);
    const cap = finitePositive(this.cfg.failureCooldownMaxMs, 120000);
    const cooldown = Math.min(cap, base * Math.pow(2, Math.min(this.consecutiveFailures - 1, 6)));
    const t = this.now();
    this.cooldownUntil = t + cooldown;
    this.busyUntil = 0;
    this.cache = {value: false, checkedAt: t};
  }

  private markHealthy() {
    this.consecutiveFailures = 0;
    this.cooldownUntil = 0;
    this.busyUntil = 0;
    this.cache = {value: true, checkedAt: this.now()};
  }

  private markBusy(retryAfterMs?: number) {
    const fallback = finitePositive(this.cfg.busyCooldownMs, 3000);
    const wait = Number.isFinite(retryAfterMs) && Number(retryAfterMs) > 0
      ? Math.min(30000, Number(retryAfterMs))
      : fallback;
    const t = this.now();
    this.busyUntil = t + wait;
    // Busy means the service is alive, so do not increase outage backoff.
    this.cache = {value: true, checkedAt: t};
  }

  private async probeHealth(): Promise<boolean> {
    const base = this.cfg.sergeantBase!;
    const token = this.cfg.sergeantToken!;
    try {
      const r = await fetchWithTimeout(this.fetchImpl, `${stripSlash(base)}/ready`, {
        headers: {'Authorization': `Bearer ${token}`},
      }, finitePositive(this.cfg.healthTimeoutMs, 900));
      if (!r.ok) { this.markFailure(); return false; }
      const j: any = await r.json();
      const ready = j?.ready === true;
      if (ready) this.markHealthy(); else this.markFailure();
      return ready;
    } catch {
      this.markFailure();
      return false;
    }
  }

  async sergeantAvailable(force = false): Promise<boolean> {
    if (!this.configured()) return false;
    const t = this.now();
    if (!force && t < this.busyUntil) return false;
    if (!force && t < this.cooldownUntil) return false;

    const ttl = finitePositive(this.cfg.healthCacheMs, 5000);
    if (!force && this.cache && (t - this.cache.checkedAt) <= ttl) return this.cache.value;

    if (this.inFlightHealth) return this.inFlightHealth;
    this.inFlightHealth = this.probeHealth();
    try {
      return await this.inFlightHealth;
    } finally {
      this.inFlightHealth = null;
    }
  }

  async rankStatus(force = false): Promise<RankStatus> {
    if (!this.configured()) {
      return {rank:'CORPORAL', mode:'BASIC', advancedAvailable:false, paperOnly:true, sergeantState:'UNCONFIGURED', checkedAt:this.now()};
    }
    const t = this.now();
    if (!force && t < this.busyUntil) {
      // Capacity pressure is not an outage. Sergeant remains online/available,
      // while an individual request may be answered by Corporal until a model
      // slot opens. Keep availability separate from responder identity.
      return {rank:'SERGEANT', mode:'ADVANCED', advancedAvailable:true, paperOnly:true, sergeantState:'BUSY', checkedAt:t, retryAfterMs:Math.max(0, this.busyUntil - t)};
    }
    if (!force && t < this.cooldownUntil) {
      return {rank:'CORPORAL', mode:'BASIC', advancedAvailable:false, paperOnly:true, sergeantState:'COOLDOWN', checkedAt:t, retryAfterMs:Math.max(0, this.cooldownUntil - t)};
    }
    const advanced = await this.sergeantAvailable(force);
    return {
      rank: advanced ? 'SERGEANT' : 'CORPORAL',
      mode: advanced ? 'ADVANCED' : 'BASIC',
      advancedAvailable: advanced,
      paperOnly: true,
      sergeantState: advanced ? 'ONLINE' : (this.now() < this.cooldownUntil ? 'COOLDOWN' : 'OFFLINE'),
      checkedAt: this.now(),
      ...(advanced ? {} : (this.now() < this.cooldownUntil ? {retryAfterMs: Math.max(0, this.cooldownUntil - this.now())} : {})),
    };
  }

  async resolve(message: string, history: unknown, requestId?: string, context?: unknown): Promise<SergeantReply | CorporalReply> {
    const q = String(message ?? '').trim();
    const safeHistory = sanitizeHistory(history);
    const safeContext: SergeantDeskContext | null = sanitizeSergeantDeskContext(context);
    const local = corporalReply(q, safeContext);

    // Corporal is the deterministic first-line unit. If it can safely answer or
    // refuse locally, do not wake the slow model even when Sergeant is online.
    if (this.cfg.delegatedLocalFirst === true && !local.sergeantRequired) return local;

    const base = this.cfg.sergeantBase;
    const token = this.cfg.sergeantToken;
    if (base && token && await this.sergeantAvailable(false)) {
      try {
        const r = await fetchWithTimeout(this.fetchImpl, `${stripSlash(base)}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Sergeant-Deadline-Ms': String((() => { const outer=finitePositive(this.cfg.chatTimeoutMs, 300000); const headroom=Math.min(5000, Math.max(500, Math.floor(outer*0.05))); return Math.max(1000, Math.min(299000, outer-headroom)); })()),
            ...(requestId && /^[A-Za-z0-9._:-]{8,96}$/.test(requestId) ? {'Idempotency-Key': requestId} : {}),
          },
          body: JSON.stringify({
            message: q,
            history: safeHistory,
            deskContext: safeContext,
            constraints: {
              paperOnly: true,
              noBroker: true,
              noPortfolioMutation: true,
              deterministicRiskAuthoritative: true,
            },
          }),
        }, finitePositive(this.cfg.chatTimeoutMs, 300000));

        if (r.ok) {
          const cleaned = sanitizeSergeantReply(await r.json());
          if (cleaned) { this.markHealthy(); return cleaned; }
          this.markFailure();
        } else if (r.status === 429) {
          let retryAfterMs: number | undefined;
          try {
            const busy: any = await r.json();
            const n = Number(busy?.retryAfterMs);
            if (Number.isFinite(n) && n > 0) retryAfterMs = n;
          } catch {}
          this.markBusy(retryAfterMs);
          return local;
        } else if (r.status === 504 || r.status === 408) {
          // A per-request deadline is not proof that Sergeant is offline.
          // Keep availability truthful and temporarily delegate to Corporal.
          this.markBusy(finitePositive(this.cfg.busyCooldownMs, 3000));
          return local;
        } else {
          this.markFailure();
        }
      } catch {
        this.markFailure();
      }
    }

    return local;
  }

}

export function createDualRankRouter(
  cfg: DualRankConfig,
  fetchImpl: typeof fetch = fetch,
  now: Clock = () => Date.now(),
) {
  return new DualRankRouter(cfg, fetchImpl, now);
}

// Backward-compatible stateless helpers. The Next.js route should prefer a
// long-lived router instance so health caching/circuit breaking can work.
export async function sergeantAvailable(cfg: DualRankConfig, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  return new DualRankRouter(cfg, fetchImpl).sergeantAvailable();
}

export async function rankStatus(cfg: DualRankConfig, fetchImpl: typeof fetch = fetch): Promise<RankStatus> {
  return new DualRankRouter(cfg, fetchImpl).rankStatus();
}

export async function resolveNoviarkChat(
  message: string,
  history: unknown,
  cfg: DualRankConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<SergeantReply | CorporalReply> {
  return new DualRankRouter(cfg, fetchImpl).resolve(message, history);
}
