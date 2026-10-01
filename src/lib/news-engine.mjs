import crypto from 'node:crypto';

const DEFAULT_GDELT_QUERY = '(stocks OR "stock market" OR earnings OR inflation OR recession OR bitcoin OR ethereum OR oil OR gold OR "Federal Reserve" OR tariffs OR sanctions) sourcelang:english';
const FED_RSS = 'https://www.federalreserve.gov/feeds/press_all.xml';
const FED_MONETARY_RSS = 'https://www.federalreserve.gov/feeds/press_monetary.xml';
const SEC_RSS = 'https://www.sec.gov/news/pressreleases.rss';
const PUBLIC_RSS_SOURCES = [
  ['cnbc', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'cnbc.com'],
  ['marketwatch', 'https://feeds.marketwatch.com/marketwatch/topstories/', 'marketwatch.com'],
  ['coindesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/', 'coindesk.com'],
  ['defense_news', 'https://www.defensenews.com/arc/outboundfeeds/rss/', 'defensenews.com'],
  ['oilprice', 'https://oilprice.com/rss/main', 'oilprice.com'],
];

const SOURCE_QUALITY = {
  'federalreserve.gov':100, 'sec.gov':100,
  'reuters.com':95, 'apnews.com':93, 'bloomberg.com':92, 'ft.com':91, 'wsj.com':90,
  'cnbc.com':86, 'marketwatch.com':84, 'coindesk.com':82, 'finance.yahoo.com':80,
  'defensenews.com':82, 'oilprice.com':80,
  'finnhub':78
};

const CRITICAL_TERMS = [
  'bank run','bankruptcy','default','trading halt','market halt','emergency','invasion',
  'missile strike','airstrike','explosion','rate cut','rate hike','fomc statement',
  'cpi report','jobs report','payrolls','capital controls'
];

const CATEGORY_RULES = [
  ['crypto', ['bitcoin',' btc ','ethereum',' eth ','crypto','stablecoin','tokenized','dogecoin','doge']],
  ['commodities', ['oil','crude','brent','wti','diesel','gasoline','fuel','gold','silver','copper','wheat','corn','natural gas','lng','energy','power plants']],
  ['macro', ['federal reserve','fomc','inflation','cpi','ppi','gdp','payroll','unemployment','interest rate','yield','central bank','tariff','sanction','trade war','export ban','export control']],
  ['regulation', [' sec ','securities and exchange commission','cftc','regulation','rulemaking','enforcement','antitrust']],
  ['defense', ['defense','military','missile','pentagon','nato','weapon','drone','airstrike','navy','army','air force','space force','space command','procurement']],
  ['stocks', ['shares','stock','earnings','guidance','revenue','profit','ipo','merger','acquisition','buyback','artificial intelligence','ai chip','ai model']],
  ['markets', ['market','s&p','nasdaq','dow','equities','futures','volatility','vix','treasury yields']],
];

const ASSET_ALIASES = {
  AAPL:['apple'], MSFT:['microsoft'], NVDA:['nvidia'], AMZN:['amazon'], META:['meta platforms','facebook'],
  GOOGL:['alphabet','google'], GOOG:['alphabet','google'], TSLA:['tesla'], AMD:['advanced micro devices'], NFLX:['netflix'],
  BTC:['bitcoin'], ETH:['ethereum'], SOL:['solana'], XRP:['xrp','ripple'], BNB:['bnb','binance coin'], DOGE:['dogecoin'],
  SPY:['s&p 500','s&p500'], QQQ:['nasdaq 100','nasdaq-100']
};

const cache = new Map();
const breakers = new Map();
const CACHE_TTL_MS = 60_000;
const STALE_TTL_MS = 10 * 60_000;
const MAX_NEWS_AGE_MINUTES = 7 * 24 * 60;

export function clean(s = '') {
  return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(s='') {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function textTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? clean(decodeEntities(m[1])) : '';
}

function attrTag(block, tag, attr) {
  const m = block.match(new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']+)["'][^>]*>`, 'i'));
  return m ? decodeEntities(m[1]).trim() : '';
}

export function parseFeed(xml, publisher, provider = 'rss') {
  const out = [];
  const rssItems = [...String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
  const atomItems = [...String(xml).matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(m => m[1]);
  const blocks = rssItems.length ? rssItems : atomItems;
  for (const b of blocks) {
    const headline = textTag(b, 'title');
    const url = textTag(b, 'link') || attrTag(b, 'link', 'href') || textTag(b, 'guid');
    const dateRaw = textTag(b, 'pubDate') || textTag(b, 'published') || textTag(b, 'updated') || textTag(b, 'dc:date');
    const summary = textTag(b, 'description') || textTag(b, 'summary') || textTag(b, 'content');
    if (!headline || !url) continue;
    const d = new Date(dateRaw || Date.now());
    out.push({
      headline,
      url,
      provider,
      publisher,
      publishedAt: Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
      summary: summary || undefined,
    });
  }
  return out;
}

function hashId(s) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
}

export function normalizeTitle(s) {
  return clean(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\b(the|a|an|and|or|to|of|for|in|on|at|with|from|by|as|is|are)\b/g, ' ')
    .replace(/\bshares?\b/g, ' stock ')
    .replace(/\bstocks?\b/g, ' stock ')
    .replace(/\bjumps?\b/g, ' jump ')
    .replace(/\brises?\b/g, ' rise ')
    .replace(/\bfalls?\b/g, ' fall ')
    .replace(/\bdrops?\b/g, ' drop ')
    .replace(/\bgains?\b/g, ' gain ')
    .replace(/\bsurges?\b/g, ' surge ')
    .replace(/\bslumps?\b/g, ' slump ')
    .replace(/\s+/g, ' ').trim();
}

function tokenSet(s) {
  return new Set(normalizeTitle(s).split(' ').filter(x => x.length > 2));
}

export function jaccard(a, b) {
  const A = tokenSet(a), B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

const GENERIC_NEWS_TOKENS = new Set(['company','companies','stock','market','markets','report','reports','reported','earnings','revenue','update','updates','latest','new','after','amid','jump','rise','fall','drop','gain','surge','slump','beat','beats','miss','misses','says','said']);
function distinctiveTokens(s) {
  return new Set(normalizeTitle(s).split(' ').filter(x => (/^\d+$/.test(x) || x.length>2) && !GENERIC_NEWS_TOKENS.has(x)));
}
function sharesDistinctiveToken(a,b) {
  const A=distinctiveTokens(a), B=distinctiveTokens(b);
  if (!A.size || !B.size) return false;
  for (const x of A) if (B.has(x)) return true;
  return false;
}

function sharesEventTerms(a,b) {
  const A=distinctiveTokens(a), B=distinctiveTokens(b);
  if (!A.size || !B.size) return false;
  let shared=0;
  for (const term of A) if (B.has(term)) shared++;
  return shared >= 3 && shared / Math.min(A.size,B.size) >= 0.5;
}

export function canonicalUrl(raw) {
  try {
    const u = new URL(raw);
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','src','fbclid','gclid'].forEach(k => u.searchParams.delete(k));
    u.hash = '';
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
    return u.toString();
  } catch { return raw; }
}

function domainOf(raw) {
  try { return new URL(raw).hostname.toLowerCase().replace(/^www\./,''); } catch { return ''; }
}

export function classify(text) {
  const t = ` ${String(text).toLowerCase()} `;
  const out = new Set();
  for (const [cat, words] of CATEGORY_RULES) {
    if (words.some((term) => {
      const value = term.trim();
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const plural = /[a-z0-9]$/i.test(value) ? 's?' : '';
      return new RegExp(`(^|[^a-z0-9])${escaped}${plural}(?=$|[^a-z0-9])`, 'i').test(t);
    })) out.add(cat);
  }
  if (!out.size) out.add('other');
  return [...out];
}

export function isRecent(publishedAt, now = Date.now()) {
  return ageMinutes(publishedAt, now) <= MAX_NEWS_AGE_MINUTES;
}

export function isRelevantIntel(categories, tickers = [], itemSeverity = 'normal') {
  return !categories.includes('other') || tickers.length > 0 || itemSeverity !== 'normal';
}

function ageMinutes(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 999999;
  return Math.max(0, Math.floor((now - t) / 60000));
}

function recencyScore(mins) {
  if (mins <= 15) return 100; if (mins <= 60) return 92; if (mins <= 180) return 82;
  if (mins <= 360) return 70; if (mins <= 720) return 58; if (mins <= 1440) return 45;
  if (mins <= 2880) return 30; return 12;
}

function sourceQuality(publisher, provider) {
  if (SOURCE_QUALITY[publisher] != null) return SOURCE_QUALITY[publisher];
  if (SOURCE_QUALITY[provider] != null) return SOURCE_QUALITY[provider];
  return publisher ? 70 : 62;
}

function impactScore(categories, text) {
  let score = 32;
  if (categories.includes('macro')) score += 16;
  if (categories.includes('regulation')) score += 10;
  if (categories.includes('commodities')) score += 8;
  if (categories.includes('defense')) score += 8;
  if (categories.includes('crypto')) score += 6;
  if (/\b(earnings|guidance|merger|acquisition|bankruptcy|default|halt|rate cut|rate hike)\b/i.test(text)) score += 18;
  return Math.min(100, score);
}

function tickerMatches(text, trackedAssets, categories=[]) {
  const raw = String(text);
  const upper = ` ${raw.toUpperCase().replace(/[^A-Z0-9.$ -]/g,' ')} `;
  const lower = ` ${raw.toLowerCase()} `;
  const financeContext = categories.some(c=>['stocks','markets','macro','crypto','commodities','regulation'].includes(c));
  return trackedAssets.filter(sym => {
    const s = String(sym).toUpperCase().replace(/[^A-Z0-9.-]/g, '');
    if (!s) return false;
    if (upper.includes(` ${s} `) || upper.includes(` $${s} `)) return true;
    const aliases = ASSET_ALIASES[s] ?? [];
    if (!financeContext && !['BTC','ETH','SOL','XRP','BNB','DOGE'].includes(s)) return false;
    return aliases.some(a => lower.includes(` ${a.toLowerCase()} `));
  });
}

function relevanceScore(tickers, categories) {
  let score = tickers.length ? Math.min(100, 68 + tickers.length * 8) : 42;
  if (categories.includes('macro') || categories.includes('markets')) score += 14;
  return Math.min(100, score);
}

function severity(text, age, corroborationCount) {
  const t = String(text).toLowerCase();
  const hits = CRITICAL_TERMS.filter(k => t.includes(k)).length;
  if (!hits) return 'normal';
  if (age <= 360 && (hits >= 2 || corroborationCount >= 2)) return 'critical';
  if (age <= 1440) return 'high';
  return 'normal';
}


function whyItMatters(categories, tickers, publisherCount, age) {
  const parts=[];
  if (tickers.length) parts.push(`Touches ${tickers.slice(0,3).join(', ')}`);
  if (categories.includes('macro')) parts.push('macro-sensitive');
  if (categories.includes('regulation')) parts.push('regulatory');
  if (categories.includes('commodities')) parts.push('commodity-linked');
  if (categories.includes('defense')) parts.push('defense/geopolitical');
  if (publisherCount>=2) parts.push(`${publisherCount} independent publishers`);
  if (age<=60) parts.push('fresh <1h'); else if (age<=360) parts.push('fresh <6h');
  return parts.length ? parts.join(' • ') : 'General market intelligence';
}

function attention(raw, categories, tickers, corroborationCount, now) {
  const age = ageMinutes(raw.publishedAt, now);
  const recency = recencyScore(age);
  const impact = impactScore(categories, `${raw.headline} ${raw.summary ?? ''}`);
  const relevance = relevanceScore(tickers, categories);
  const corroboration = Math.min(100, 30 + Math.max(0, corroborationCount - 1) * 28);
  const q = sourceQuality(raw.publisher, raw.provider);
  return Math.round(0.34*relevance + 0.26*impact + 0.20*recency + 0.10*corroboration + 0.10*q);
}

async function fetchWithTimeout(url, init = {}, timeoutMs = Number(process.env.BTD_FETCH_TIMEOUT_MS || 3200), retries = Number(process.env.BTD_FETCH_RETRIES || 0)) {
  let last;
  for (let attempt=0; attempt<=retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await fetch(url, { ...init, signal: controller.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      last = e;
      if (attempt < retries) await new Promise(r => setTimeout(r, 150 * (attempt + 1)));
    } finally { clearTimeout(timer); }
  }
  throw last;
}

function parseGdeltDate(v) {
  if (!v) return new Date().toISOString();
  const m = String(v).match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`).toISOString();
  const d = new Date(v); return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function buildGdeltQuery(baseQuery, trackedAssets=[]) {
  const terms=[];
  for (const raw of trackedAssets.slice(0,30)) {
    const s=String(raw).toUpperCase().replace(/[^A-Z0-9.-]/g,'');
    if (!s) continue;
    terms.push(s);
    const alias=(ASSET_ALIASES[s] ?? [])[0];
    if (alias) terms.push(`\"${alias}\"`);
  }
  const unique=[...new Set(terms)].slice(0,55);
  const base=clean(baseQuery || DEFAULT_GDELT_QUERY);
  if (!unique.length) return base;
  const assetPart=`(${unique.join(' OR ')})`;
  const body=`(${base.replace(/\s+sourcelang:english\s*$/i,'')} OR ${assetPart})`;
  return `${body.slice(0,1760)} sourcelang:english`;
}

async function fetchGdelt(query) {
  const u = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  u.searchParams.set('query', query);
  u.searchParams.set('mode', 'artlist'); u.searchParams.set('maxrecords','100');
  u.searchParams.set('format','json'); u.searchParams.set('sort','datedesc'); u.searchParams.set('timespan','1d');
  const r = await fetchWithTimeout(u, {headers:{'User-Agent':'Noviark-BTD-Intel/0.3'}});
  const data = await r.json();
  return (data.articles ?? []).map(x => ({
    headline: clean(x.title ?? ''), url: x.url, provider:'gdelt',
    publisher: clean(x.domain || domainOf(x.url) || 'unknown'),
    publishedAt: parseGdeltDate(x.seendate), image:x.socialimage || undefined,
    language:x.language || undefined, sourceCountry:x.sourcecountry || undefined,
  })).filter(x => x.headline && x.url);
}

async function fetchFinnhub() {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return [];
  const u = new URL('https://finnhub.io/api/v1/news'); u.searchParams.set('category','general'); u.searchParams.set('token', token);
  const r = await fetchWithTimeout(u, {}); const data = await r.json();
  return (Array.isArray(data) ? data : []).slice(0,100).map(x => ({
    headline:clean(x.headline ?? ''), url:x.url, provider:'finnhub',
    publisher:clean(x.source || domainOf(x.url) || 'finnhub'),
    publishedAt:new Date((x.datetime ?? Date.now()/1000)*1000).toISOString(),
    summary:clean(x.summary ?? '') || undefined, image:x.image || undefined,
  })).filter(x => x.headline && x.url);
}

async function fetchRss(url, publisher) {
  const r = await fetchWithTimeout(url, {headers:{'User-Agent':'Noviark-BTD-Intel/0.3 contact=admin@noviark.net'}});
  const xml = await r.text(); return parseFeed(xml, publisher, 'rss');
}

export function cluster(rawItems) {
  const sorted=[...rawItems].sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
  const groups=[];
  const urlToGroup=new Map();
  const tokenToGroups=new Map();
  for (const item of sorted) {
    const url=canonicalUrl(item.url);
    let hitIndex=urlToGroup.get(url);
    const dTokens=[...distinctiveTokens(item.headline)];
    if (hitIndex == null) {
      const candidates=new Set();
      for (const tok of dTokens) for (const idx of (tokenToGroups.get(tok) ?? [])) candidates.add(idx);
      for (const idx of candidates) {
        const g=groups[idx];
        const dt=Math.abs(new Date(g[0].publishedAt)-new Date(item.publishedAt));
        const titleSimilarity=jaccard(g[0].headline,item.headline);
        const sameEvent=titleSimilarity>=0.72 || sharesEventTerms(g[0].headline,item.headline);
        if (dt<=36*3600_000 && sameEvent && sharesDistinctiveToken(g[0].headline,item.headline)) { hitIndex=idx; break; }
      }
    }
    if (hitIndex == null) {
      hitIndex=groups.length; groups.push([item]);
    } else groups[hitIndex].push(item);
    urlToGroup.set(url,hitIndex);
    for (const tok of dTokens) {
      if (!tokenToGroups.has(tok)) tokenToGroups.set(tok,new Set());
      tokenToGroups.get(tok).add(hitIndex);
    }
  }
  return groups;
}

function keyFor(options) {
  return JSON.stringify({assets:[...(options.trackedAssets ?? [])].sort().slice(0,100), query:options.query || DEFAULT_GDELT_QUERY, limit:options.limit ?? 60});
}

export async function getNews(options = {}) {
  const trackedAssets = [...new Set((options.trackedAssets ?? []).map(x=>String(x).trim()).filter(Boolean))].slice(0,100);
  let query = clean(options.query || DEFAULT_GDELT_QUERY).slice(0,300);
  if (!query) query = DEFAULT_GDELT_QUERY;
  const limit = Math.max(1, Math.min(Number(options.limit ?? 60) || 60, 200));
  const now = options.now ?? Date.now();
  const cacheKey = keyFor({trackedAssets, query, limit});
  const hit = cache.get(cacheKey);
  if (!options.noCache && hit && now-hit.at < CACHE_TTL_MS) return {...hit.value, cacheStatus:'HIT'};

  const customFeeds = String(process.env.BTD_EXTRA_RSS || '').split(',').map(x=>x.trim()).filter(Boolean).slice(0,10);
  const calls = [
    ['gdelt', () => fetchGdelt(buildGdeltQuery(query, trackedAssets))], ['finnhub', () => fetchFinnhub()],
    ['fed', () => fetchRss(FED_RSS,'federalreserve.gov')], ['fed_monetary', () => fetchRss(FED_MONETARY_RSS,'federalreserve.gov')],
    ['sec', () => fetchRss(SEC_RSS,'sec.gov')],
    ...PUBLIC_RSS_SOURCES.map(([name, url, publisher]) => [name, () => fetchRss(url, publisher)]),
    ...customFeeds.map((url,i)=>[`extra_${i+1}`,()=>fetchRss(url,domainOf(url)||`extra_${i+1}`)]),
  ];

  const timed = calls.map(async ([name, fn]) => {
    const started = Date.now();
    const state=breakers.get(name);
    if (state?.openUntil > Date.now()) return {name, ok:false, skipped:true, error:new Error('circuit_open'), value:[], latencyMs:0};
    try {
      const value = await fn();
      breakers.set(name,{failures:0,openUntil:0});
      return {name, ok:true, value, latencyMs:Date.now()-started};
    } catch (error) {
      const prev=breakers.get(name) ?? {failures:0,openUntil:0};
      const failures=prev.failures+1;
      breakers.set(name,{failures,openUntil:failures>=2?Date.now()+5*60_000:0});
      return {name, ok:false, error, value:[], latencyMs:Date.now()-started};
    }
  });
  const settled = await Promise.all(timed);
  const sourceHealth = {}; const all = [];
  settled.forEach(r=>{
    if (r.ok) { sourceHealth[r.name]={ok:true,count:r.value.length,latencyMs:r.latencyMs}; all.push(...r.value); }
    else sourceHealth[r.name]={ok:false,count:0,latencyMs:r.latencyMs,error:String(r.error?.name==='AbortError'?'timeout':r.error?.message ?? r.error).slice(0,160),circuitOpen:Boolean(breakers.get(r.name)?.openUntil>Date.now())};
  });

  if (!all.length && hit && now-hit.at < STALE_TTL_MS) return {...hit.value, sourceHealth, cacheStatus:'STALE_FALLBACK'};

  const items = cluster(all).map(group=>{
    const ranked=[...group].sort((a,b)=>sourceQuality(b.publisher,b.provider)-sourceQuality(a.publisher,a.provider));
    const best=ranked[0]; const text=`${best.headline} ${best.summary ?? ''}`;
    const categories=classify(text); const tickers=tickerMatches(text,trackedAssets,categories);
    const publisherCount=new Set(group.map(x=>x.publisher).filter(Boolean)).size;
    const age=ageMinutes(best.publishedAt,now); const sev=severity(text,age,publisherCount);
    const flags=[]; if (sev==='critical') flags.push('CRITICAL'); else if (sev==='high') flags.push('HIGH');
    if (publisherCount>=2) flags.push('MULTI_SOURCE'); if (tickers.length) flags.push('TRACKED_ASSET');
    return {
      id:hashId(`${canonicalUrl(best.url)}|${normalizeTitle(best.headline)}`), headline:best.headline, url:best.url,
      provider:best.provider, publisher:best.publisher, publishedAt:best.publishedAt, summary:best.summary, image:best.image,
      language:best.language, sourceCountry:best.sourceCountry, categories, tickers, severity:sev,
      attentionScore:attention(best,categories,tickers,publisherCount,now), sourceQuality:sourceQuality(best.publisher,best.provider),
      corroborationCount:publisherCount, relatedSources:[...new Set(group.map(x=>x.publisher).filter(Boolean))].slice(0,8), ageMinutes:age, flags, whyItMatters:whyItMatters(categories,tickers,publisherCount,age),
    };
  }).filter(item => isRecent(item.publishedAt, now) && isRelevantIntel(item.categories, item.tickers, item.severity));
  items.sort((a,b)=> b.attentionScore-a.attentionScore || new Date(b.publishedAt)-new Date(a.publishedAt));
  const value={generatedAt:new Date(now).toISOString(),items:items.slice(0,limit),sourceHealth,cacheStatus:'MISS'};
  cache.set(cacheKey,{at:now,value});
  return value;
}
