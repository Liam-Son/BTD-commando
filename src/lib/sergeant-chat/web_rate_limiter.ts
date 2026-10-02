export type RateDecision = {ok:boolean; retryAfterMs:number};
type Bucket = {windowStart:number; count:number; lastSeen:number};

function positiveInt(x:number, fallback:number, cap:number) {
  return Number.isFinite(x) && x > 0 ? Math.min(cap, Math.floor(x)) : fallback;
}

export class WebRateLimiter {
  private buckets = new Map<string,Bucket>();
  private readonly limitPerWindow:number;
  private readonly windowMs:number;
  private readonly maxKeys:number;

  constructor(limitPerWindow = 20, windowMs = 60000, maxKeys = 5000) {
    this.limitPerWindow=positiveInt(limitPerWindow,20,10000);
    this.windowMs=positiveInt(windowMs,60000,3600000);
    this.maxKeys=positiveInt(maxKeys,5000,100000);
  }

  check(key: string, now = Date.now()): RateDecision {
    const k = (key || 'anonymous').slice(0,160);
    let b = this.buckets.get(k);
    if (!b || (now - b.windowStart) >= this.windowMs) b = {windowStart:now,count:0,lastSeen:now};
    b.lastSeen = now;
    if (b.count >= this.limitPerWindow) {
      this.buckets.set(k,b); this.prune(now);
      return {ok:false,retryAfterMs:Math.max(1,this.windowMs-(now-b.windowStart))};
    }
    b.count += 1; this.buckets.set(k,b); this.prune(now);
    return {ok:true,retryAfterMs:0};
  }

  private prune(now:number) {
    if (this.buckets.size <= this.maxKeys) return;
    for (const [k,b] of this.buckets) if ((now-b.lastSeen) >= this.windowMs*2) this.buckets.delete(k);
    if (this.buckets.size <= this.maxKeys) return;
    const oldest=[...this.buckets.entries()].sort((a,b)=>a[1].lastSeen-b[1].lastSeen);
    for (const [k] of oldest.slice(0,Math.max(0,this.buckets.size-this.maxKeys))) this.buckets.delete(k);
  }

  size() { return this.buckets.size; }
}

export type ClientIpMode = 'none' | 'cloudflare' | 'real' | 'xff';

export function requestClientKey(req: Request, mode: ClientIpMode = 'none'): string {
  const h=req.headers;
  if (mode === 'cloudflare') {
    const cf=h.get('cf-connecting-ip')?.trim();
    return cf ? `cf:${cf.slice(0,128)}` : 'anonymous';
  }
  if (mode === 'real') {
    const real=h.get('x-real-ip')?.trim();
    return real ? `real:${real.slice(0,128)}` : 'anonymous';
  }
  if (mode === 'xff') {
    const xff=h.get('x-forwarded-for')?.split(',',1)[0]?.trim();
    return xff ? `xff:${xff.slice(0,128)}` : 'anonymous';
  }
  // Safe default: do not trust user-spoofable forwarding headers unless the
  // deployment explicitly selects the hosting proxy/header contract.
  return 'anonymous';
}
