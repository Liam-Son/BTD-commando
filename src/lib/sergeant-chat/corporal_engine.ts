// Corporal V5 — always-on deterministic first-line assistant for Noviark.
// Runs in the normal website/serverless layer with no local model dependency.
// Scope: basic finance/site help, paper-desk explanations, safe refusals, and escalation to Sergeant.
// Voice: calm field sergeant. No live orders. Score is not an order.

export type CorporalStatus = 'BASIC_INFO' | 'REFUSED' | 'SERGEANT_REQUIRED';

export type CorporalReply = {
  rank: 'CORPORAL';
  mode: 'BASIC';
  status: CorporalStatus;
  message: string;
  paperOnly: true;
  advancedAvailable: boolean;
  reason: string;
  retryable: boolean;
  sergeantRequired: boolean;
  topic?: string;
};

type Entry = {
  topic: string;
  patterns: RegExp[];
  answer: string;
};

const BASIC: Entry[] = [
  {
    topic: 'btd_score',
    patterns: [/\bbtd\s*score\b/i, /\bscore formula\b/i, /what is the btd/i, /btd index/i],
    answer: 'Assessment: locked formula btd_v1_0 = 0.40·Valuation + 0.25·Momentum + 0.20·Fear + 0.10·Quality + 0.05·Risk. The score ranks dip attractiveness. It is not an order, not a broker ticket, and not a return guarantee.'
  },
  {
    topic: 'score_not_order',
    patterns: [/score\s*(≠|!=|is not)\s*order/i, /score not order/i, /\broe\b/i],
    answer: 'Assessment: score ≠ order. Sniper can flash a high score and the correct paper action can still be Stand Down if kills, stale feed, or caps block new exposure. You decide the paper fill. No live path.'
  },
  {
    topic: 'paper_policy',
    patterns: [/\bpaper policy\b/i, /\bsergeant_policy\b/i, /\bacquire\b/i, /\bstand down\b/i, /\bwatch\b.*\breduce\b/i, /posture bands/i],
    answer: 'Assessment: paper policy sergeant_policy_v1 maps score bands to posture, not to live size. Rough bands: ≥65 ACQUIRE, 50–65 WATCH, 35–50 REDUCE, ≤35 STAND DOWN. Applied sleeve can be lower than the raw band. New books start with a per-name cap. Override needs a reason.'
  },
  {
    topic: 'kill_switches',
    patterns: [/\bkill switch/i, /\bkills?\b/i, /\bhalt now\b/i, /max dd/i, /max names/i, /max sleeve/i, /risk controls/i, /paper risk/i],
    answer: 'Assessment: kill switches protect the paper book. Global HALT NOW freezes increases. Max drawdown, max names, and max sleeve can block new exposure while still allowing reductions. Loosening a control needs an explicit reason. Tightening can log without one.'
  },
  {
    topic: 'look_ahead',
    patterns: [/look[- ]ahead/i, /lookahead/i, /future function/i, /same[- ]close fill/i, /point[- ]in[- ]time/i],
    answer: 'Assessment: look-ahead bias means the backtest used information that was not knowable at the decision time. Common failures: same-close signal and fill, restated fundamentals, or tuning on the full sample then calling it out-of-sample. Prefer next-open fills and frozen rules.'
  },
  {
    topic: 'next_open',
    patterns: [/next[- ]open/i, /execution timing/i, /fill timing/i],
    answer: 'Assessment: next-open execution decides on a completed close, then fills at the following session open. It is slower and more honest than same-close fantasy fills. Costs still apply.'
  },
  {
    topic: 'costs',
    patterns: [/\btransaction costs?\b/i, /\bslippage\b/i, /\bbps\b/i, /trading costs/i],
    answer: 'Assessment: report costs on both buys and sells, including the first deployment. A strategy that only wins before costs is not a paper candidate. Use the same cost assumptions for the strategy and the SPY benchmark.'
  },
  {
    topic: 'local_terminal',
    patterns: [/sergeant local/i, /local terminal/i, /download.*sergeant/i, /tools\/sergeant-local/i],
    answer: 'Assessment: Sergeant Local is the paper-only terminal that runs on your computer. Download the source from GitHub tools/sergeant-local, not a site binary. It reviews a local folder, refuses broker keys, and does not place orders.'
  },
  {
    topic: 'diversification',
    patterns: [/\bdiversification\b/i, /분산\s*투자/i],
    answer: 'Assessment: diversification spreads exposure across assets or risk factors so one name has less control of the book. Different tickers can still carry the same risk. Overlap matters more than ticker count.'
  },
  {
    topic: 'dca',
    patterns: [/\bdca\b/i, /dollar[- ]cost averaging/i, /적립식/i],
    answer: 'Assessment: dollar-cost averaging invests a fixed amount on a schedule instead of hunting one perfect entry. It reduces timing drama. It does not remove market risk.'
  },
  {
    topic: 'etf',
    patterns: [/\betf\b/i, /상장지수펀드/i],
    answer: 'An ETF is a fund traded on an exchange. It can hold stocks, bonds, commodities, or other assets and is bought and sold like a listed security.'
  },
  {
    topic: 'volatility',
    patterns: [/\bvolatility\b/i, /변동성/i],
    answer: 'Volatility describes how widely prices move over time. Higher volatility generally means larger and less predictable price swings.'
  },
  {
    topic: 'market_cap',
    patterns: [/\bmarket cap\b/i, /market capitalization/i, /시가총액/i],
    answer: 'Market capitalization is the market value of a company’s outstanding shares: share price multiplied by shares outstanding.'
  },
  {
    topic: 'pe',
    patterns: [/\bp\/?e\b/i, /\bper\s+(?:ratio|multiple)\b/i, /price.?earnings/i, /주가수익비율/i],
    answer: 'P/E compares a company’s share price with earnings per share. It is one valuation measure and should be interpreted with growth, quality, sector, and accounting context.'
  },
  {
    topic: 'pb',
    patterns: [/\bp\/?b\b/i, /\bpbr\b/i, /price.?book/i, /주가순자산비율/i],
    answer: 'P/B compares market value with book value. It can be more informative for asset-heavy or financial businesses than for businesses dominated by intangible assets.'
  },
  {
    topic: 'rsi',
    patterns: [/\brsi\b/i, /relative strength index/i, /상대강도지수/i],
    answer: 'RSI is a momentum indicator based on recent gains and losses. It can describe momentum conditions, but it does not by itself prove that an asset is cheap or expensive.'
  },
  {
    topic: 'btd',
    patterns: [/\bbtd\b/i, /buy.?the.?dip/i],
    answer: 'Assessment: BTD means Buy-The-Dip. On this desk it is a scored research signal under btd_v1_0. High score means more dip evidence, not automatic buy authority.'
  },
  {
    topic: 'sergeant',
    patterns: [/\bsergeant\b/i, /what.*bot/i, /이\s*봇/i],
    answer: 'Assessment: Sergeant is the advanced paper-only advisor. Right now the private engine is often unconfigured, so I stay on duty as Corporal for basics, paper policy, and safe refusals.'
  },
  {
    topic: 'corporal',
    patterns: [/\bcorporal\b/i, /상병/i, /코퍼럴/i],
    answer: 'Assessment: Corporal is the always-on basic unit. I cover definitions, paper-desk rules, and refusals while advanced Sergeant is offline. I do not place orders.'
  },
  {
    topic: 'paper_only',
    patterns: [/\bpaper.?only\b/i, /paper trading/i, /페이퍼/i, /모의/i],
    answer: 'Assessment: paper-only means explain and simulate. No broker keys, no live tickets, no pretend fills. If someone asks for a real order, the answer is Negative.'
  },
  {
    topic: 'credit_risk',
    patterns: [/\bcredit risk\b/i, /신용\s*위험/i],
    answer: 'Credit risk is the risk that a borrower or issuer cannot meet promised payments. It can affect bond prices, spreads, and expected recovery values.'
  },
  {
    topic: 'risk',
    patterns: [/\brisk\b/i, /위험/i],
    answer: 'Investment risk can include market loss, concentration, liquidity, leverage, credit, currency, and model risk. The relevant risks depend on the asset and strategy.'
  },
  {
    topic: 'drawdown',
    patterns: [/\bdrawdown\b/i, /낙폭/i],
    answer: 'Assessment: drawdown is the fall from a prior peak to a later trough. Paper kills can trip on max drawdown. Report it next to any return claim.'
  },
  {
    topic: 'sharpe',
    patterns: [/\bsharpe\b/i, /샤프/i],
    answer: 'The Sharpe ratio compares excess return with return volatility. It is useful as one risk-adjusted metric but depends strongly on the period and data assumptions.'
  },
  {
    topic: 'alpha',
    patterns: [/\balpha\b/i, /초과\s*수익/i],
    answer: 'In investing, alpha usually means return beyond an appropriate benchmark or risk model. The exact meaning depends on how the benchmark and risk adjustment are defined.'
  },
  {
    topic: 'beta',
    patterns: [/\bbeta\b/i, /베타/i],
    answer: 'Beta describes how strongly an asset has historically moved relative to a benchmark. A beta above one usually means greater sensitivity to benchmark moves.'
  },
  {
    topic: 'liquidity',
    patterns: [/\bliquidity\b/i, /유동성/i],
    answer: 'Liquidity describes how easily an asset can be traded without materially moving its price. Lower liquidity can increase spreads and execution risk.'
  },
  {
    topic: 'leverage',
    patterns: [/\bleverage\b/i, /레버리지/i],
    answer: 'Leverage increases exposure using borrowed funds or derivatives. It can amplify both gains and losses and can create margin or liquidation risk.'
  },
  {
    topic: 'correlation',
    patterns: [/\bcorrelation\b/i, /상관관계/i, /상관\s*계수/i],
    answer: 'Correlation describes how two return series move together. It ranges from negative to positive association, but historical correlation can change over time.'
  },
  {
    topic: 'cagr',
    patterns: [/\bcagr\b/i, /compound annual growth rate/i, /연평균\s*성장률/i],
    answer: 'CAGR is the constant annual growth rate that would connect a starting value to an ending value over a period. It smooths the path and does not show interim volatility.'
  },
  {
    topic: 'per_annum',
    patterns: [/\bper annum\b/i, /\bp\.?a\.?\b/i, /연\s*(?:간|기준)/i],
    answer: 'Per annum means per year. A rate stated per annum is expressed on an annual basis; how it compounds depends on the specific rate convention.'
  },
  {
    topic: 'expense_ratio',
    patterns: [/\bexpense ratio\b/i, /총보수/i, /운용\s*보수/i],
    answer: 'An expense ratio is the annual fund operating cost expressed as a percentage of assets. It reduces investor returns over time.'
  },
  {
    topic: 'bond_yield',
    patterns: [/\bbond yield\b/i, /\byield to maturity\b/i, /\bytm\b/i, /채권.{0,8}수익률/i, /채권\s*금리/i],
    answer: 'A bond is a debt instrument. Its yield is a return measure tied to price, coupon, maturity, and cash flows; bond prices and yields generally move in opposite directions.'
  },
  {
    topic: 'dividend_yield',
    patterns: [/\bdividend yield\b/i, /배당\s*수익률/i],
    answer: 'Dividend yield is annual dividends per share divided by share price. It describes cash yield at a point in time, not total return or dividend safety.'
  },
  {
    topic: 'inflation',
    patterns: [/\binflation\b/i, /인플레이션/i, /물가\s*상승/i],
    answer: 'Inflation is a broad rise in prices that reduces the purchasing power of money. Its investment effects vary across assets, rates, growth, and valuation conditions.'
  },
  {
    topic: 'interest_rate',
    patterns: [/\binterest rates?\b/i, /기준\s*금리/i, /금리란/i],
    answer: 'An interest rate is the cost of borrowing or return on lending. Changes in rates can affect bond prices, financing costs, currencies, and equity valuations.'
  },
  {
    topic: 'yield_curve',
    patterns: [/\byield curve\b/i, /수익률\s*곡선/i],
    answer: 'The yield curve compares interest rates across maturities, usually for similar-quality debt. Its shape summarizes how markets price time, rates, and economic uncertainty.'
  },
  {
    topic: 'tracking_error',
    patterns: [/\btracking error\b/i, /추적\s*오차/i],
    answer: 'Tracking error measures how much a portfolio or fund’s returns deviate from its benchmark over time. Higher tracking error means less benchmark-like behavior.'
  },
  {
    topic: 'duration',
    patterns: [/\bduration\b/i, /듀레이션/i],
    answer: 'Bond duration is a measure of interest-rate sensitivity. Higher duration generally means a larger price response to a given change in yields.'
  },
  {
    topic: 'noviark',
    patterns: [/\bnoviark\b/i, /what.*site/i, /이\s*사이트/i],
    answer: 'Noviark is the hub that hosts the BTD project and related research tools. Corporal handles basic help; Sergeant handles advanced paper-only analysis when its backend is online.'
  },
  {
    topic: 'rank_switch',
    patterns: [/why.*(corporal|sergeant)/i, /why.*offline/i, /rank.*switch/i, /왜.*(코퍼럴|상병|서전트|sergeant)/i],
    answer: 'The rank changes automatically. Corporal stays available on the website; Sergeant appears when the advanced private backend is healthy.'
  }
];

const INJECTION = [
  /ignore.{0,30}(previous|prior|system|developer).{0,30}instructions/i,
  /(reveal|show|print|repeat).{0,30}(system prompt|hidden instructions|developer message)/i,
  /jailbreak|prompt leak|override.{0,20}instructions/i,
  /forget.{0,30}(rules|instructions|policy)/i,
  /disregard.{0,30}(above|rules|instructions|policy)/i,
  /(show|tell|give|output).{0,30}(initial|hidden|internal).{0,20}(prompt|instructions|rules)/i,
  /시스템\s*프롬프트|숨겨진\s*(지시|명령)|이전\s*(지시|명령).{0,20}무시/i,
];

const FAKE_EXECUTION = [
  /(tell|say|claim|pretend|confirm).{0,60}(order|trade).{0,40}(executed|filled|submitted|placed|completed)/i,
  /(tell|say|claim|pretend|confirm).{0,60}(executed|filled|submitted|placed|completed).{0,40}(order|trade)/i,
  /(show|write|create|generate|make).{0,50}(fake\s+)?(broker|order|trade).{0,30}(confirmation|receipt|fill|ticket|message)/i,
  /(show|write|create|generate|make).{0,70}(bought|sold|filled|executed|submitted|placed).{0,30}(successfully|confirmation|receipt|ticket)?/i,
  /(broker|order|trade).{0,30}(confirmation|receipt|ticket).{0,50}(bought|sold|filled|executed|submitted|placed)/i,
  /(체결|실행|주문).{0,25}(했다고|했다고 말|했다고 해|완료됐다고)/i,
  /(pretend|act as if).{0,60}(filled|executed|placed|submitted|went through)/i,
  /(order|trade).{0,30}(went through|was successful|is done)/i,
  /(가짜|허위).{0,20}(체결|주문|거래).{0,30}(확인|영수증|메시지)/i,
];

const PERSONALIZED = [
  /\bshould i (buy|sell|trade)\b/i,
  /\bwhat should i (buy|sell)\b/i,
  /\bdo you recommend (buying|selling)\b/i,
  /\bis it (a )?good time to (buy|sell)\b/i,
  /\bwould you (buy|sell|trade)\b/i,
  /\bis .{1,12} a buy\b/i,
  /\bbuy or sell\b/i,
  /\bgive me .{0,20}(stock|etf|asset).{0,12}to buy\b/i,
  /\bwhich .{0,30} should i (buy|sell|choose)\b/i,
  /\bpick .{0,30}(stock|etf|asset).{0,20}(for me|to buy)\b/i,
  /\btell me exactly what to (buy|sell)\b/i,
  /지금.{0,12}(사|팔|매수|매도).{0,8}(까|해야|추천)/i,
  /뭘.{0,12}(사|팔|매수|매도).{0,8}(야|까)/i,
];

const META_OR_NEGATION = [
  /\bdo not\b|\bdon't\b|\bnever\b/i,
  /\bwithout actually\b|\bnot asking you to\b/i,
  /\bhypothetical(ly)?\b|\bsuppose\b|\bif i were\b|\bif i (buy|sell|rebalance|allocate)\b/i,
  /\bwhat (would|happens?) if i (buy|sell|rebalance|allocate)\b/i,
  /\bpros? and cons? of (buying|selling)\b/i,
  /\bexplain\b|\bwhat does\b|\bwhat .* mean\b|\bmeaning\b|\bexample\b/i,
  /하지\s*마|하지마|실행하지|체결하지|주문하지|의미|설명|가정|만약|예시/i,
];

// Meta/explanation language must never mask a second imperative action clause.
// Example: "Explain the concept, then buy SPY" is an action request, while
// "Explain the risks of buying SPY" remains a non-mutating explanation.
const ACTION_FOLLOWUP = [
  /\b(?:then|and then|after that|afterwards)\b.{0,80}\b(?:buy|sell|purchase|liquidate|rebalance|allocate|set|change|increase|decrease|move|shift|trim|add|reduce|place|submit|execute|cancel)\b/i,
  /\b(?:then|and then|after that|afterwards)\b.{0,40}\b(?:do it|execute it|place it|submit it|make the change)\b/i,
  /\b(?:explain|describe|summarize|give me an example).{0,80}\band\b.{0,50}\b(?:buy|sell|purchase|liquidate|rebalance|allocate|set|change|increase|decrease|move|shift|trim|add|reduce|place|submit|execute|cancel)\b/i,
  /\b(?:instead|but|however|rather)\s+(?:buy|sell|purchase|liquidate|rebalance|allocate|set|change|increase|decrease|move|shift|trim|add|reduce|place|submit|execute|cancel)\b/i,
  /[.;]\s*(?:buy|sell|purchase|liquidate|rebalance|allocate|set|change|increase|decrease|move|shift|trim|add|reduce|place|submit|execute|cancel)\b/i,
  /[.;]\s*next[, ]+(?:buy|sell|purchase|liquidate|rebalance|allocate|set|change|increase|decrease|move|shift|trim|add|reduce|place|submit|execute|cancel)\b/i,
  /(?:설명|예시).{0,60}(?:하고|한 뒤|후|그리고|다음).{0,70}(?:매수|매도|리밸런싱|비중.{0,20}(?:변경|설정|늘려|줄여)|주문.{0,20}(?:넣|제출|취소|실행))/i,
];

const ACTION = [
  /\b(buy(?:ing)?|sell(?:ing)?|purchas(?:e|ing)|liquidat(?:e|ing)|rebalanc(?:e|ing)|allocat(?:e|ing))\b/i,
  /\b(set|change|increase|decrease|move|shift|trim|add|reduce)\b.{0,40}\b(allocation|position|portfolio|weight|exposure)\b/i,
  /\b(place|submit|execute|cancel)\b.{0,40}\b(order|trade)\b/i,
  /\bput\b.{0,30}(%|percent|dollars?|usd|\$).{0,30}\b(into|in)\b/i,
  /\bmove\b.{0,30}(\$|usd|dollars?).{0,30}\b(into|to)\b/i,
  /\bmake\b.{0,20}\b\w{1,8}\b.{0,20}(%|percent).{0,30}\b(portfolio|allocation|weight)\b/i,
  /매수|매도|리밸런싱|주문|비중.{0,20}(변경|설정|늘려|줄여)/i,
];

const LIVE_CONTEXT = [
  /\b(today|right now|currently|current price|latest|real[- ]time|live)\b/i,
  /\b(price of|trading at|quote for)\b.{0,30}\b[A-Z]{1,6}\b/,
  /\bhow did\b.{0,30}\bperform today\b/i,
  /오늘|현재|실시간|최신|지금.{0,20}(가격|시세|뉴스)/i,
];

const LIVE_OR_ADVANCED = [
  /\bportfolio optimization\b/i,
  /\bbacktest\b/i,
  /\bscenario analysis\b/i,
  /\bcompare\b.{0,50}\bportfolio\b/i,
  /백테스트|포트폴리오.{0,10}(분석|최적화)/i,
];

function matchesAny(xs: RegExp[], text: string) {
  return xs.some((x) => x.test(text));
}

function base(status: CorporalStatus, message: string, reason: string, retryable: boolean, sergeantRequired: boolean, topic?: string): CorporalReply {
  return {
    rank: 'CORPORAL', mode: 'BASIC', status, message,
    paperOnly: true, advancedAvailable: false, reason,
    retryable, sergeantRequired, ...(topic ? {topic} : {}),
  };
}

export function corporalReply(message: string): CorporalReply {
  const q = String(message ?? '').trim();

  if (!q) {
    return base('BASIC_INFO', 'Report in. Ask about the BTD score, paper policy, kill switches, costs, or look-ahead risk. I stay paper-only.', 'empty_prompt', false, false, 'help');
  }

  if (matchesAny(INJECTION, q)) {
    return base('REFUSED', 'Negative. I will not reveal or override hidden system or developer instructions.', 'prompt_injection', false, false, 'safety');
  }

  if (matchesAny(FAKE_EXECUTION, q)) {
    return base('REFUSED', 'Negative. I will not claim a real trade filled. Corporal has no broker authority.', 'fake_execution', false, false, 'safety');
  }

  if (matchesAny(PERSONALIZED, q)) {
    return base('REFUSED', 'Negative. I can explain the concept, but I will not give a personalized buy or sell order.', 'personalized_advice', false, false, 'safety');
  }

  const meta = matchesAny(META_OR_NEGATION, q) && !matchesAny(ACTION_FOLLOWUP, q);
  if (!meta && matchesAny(ACTION, q)) {
    return base('SERGEANT_REQUIRED', 'Hold. That needs the full paper engine or the desk controls. Corporal will not change portfolio state from chat.', 'advanced_action', true, true, 'portfolio_action');
  }

  if (matchesAny(LIVE_OR_ADVANCED, q)) {
    return base('SERGEANT_REQUIRED', 'Hold. That needs deeper Sergeant analysis when the private engine is online. I can still explain the general concept.', 'advanced_or_live', true, true, 'advanced_analysis');
  }

  if (matchesAny(LIVE_CONTEXT, q)) {
    return base('SERGEANT_REQUIRED', 'Negative. I have no live quote feed here, so I will not invent a price or headline. Use the board data or wait for advanced Sergeant.', 'live_data_unavailable', true, true, 'live_data');
  }

  if (meta && matchesAny(ACTION, q)) {
    return base('BASIC_INFO', 'Assessment: that is description, not an order. No portfolio state and no broker ticket changed.', 'meta_action_explanation', false, false, 'safety');
  }

  for (const entry of BASIC) {
    if (matchesAny(entry.patterns, q)) {
      return base('BASIC_INFO', entry.answer, 'basic_knowledge', false, false, entry.topic);
    }
  }

  return base('SERGEANT_REQUIRED', 'Standby. I cover score, paper policy, kills, costs, and core definitions. For deeper portfolio work use the paper desk or Sergeant Local from Tools.', 'out_of_scope', true, true, 'unknown');
}
