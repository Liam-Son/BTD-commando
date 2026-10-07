const r = require('./dist-sp5/lib/sergeant-risk.js');
function assert(cond,msg){ if(!cond) throw new Error(msg); }
function rnd(a,b){return a+Math.random()*(b-a)}
function mkBook(maxDD,maxNames,maxSleeve,positions=[],cash=100){return {schemaVersion:2,formulaId:'btd_v1_0',policyId:'sergeant_policy_v1',cash,peakEquity:100,realizedPnl:0,positions,log:[],kills:{maxDrawdownPct:maxDD,maxNames,maxSleevePct:maxSleeve,globalHalt:false},updatedAt:'2026-10-07T00:00:00.000Z'}}
function metrics(dd,gross,names,maxSleeve,equity=100){return {equity,positionValue:gross*equity,grossExposure:gross,targetGrossPct:gross*100,drawdownPct:dd,activeNames:names,maxSingleSleevePct:maxSleeve,unrealizedPnl:0,realizedPnl:0}}
let cases=0;
for(let i=0;i<5000;i++){
  const maxDD=rnd(1,40), maxNames=Math.floor(rnd(1,30)), maxSleeve=rnd(1,100);
  const dd=rnd(0,maxDD*1.2), gross=rnd(0,1), names=Math.floor(rnd(0,maxNames+2)), ms=names?rnd(0,maxSleeve*1.2):0;
  const book=mkBook(maxDD,maxNames,maxSleeve,[],100);
  const m=metrics(dd,gross,names,ms);
  const baseKills={globalHalt:false,drawdown:dd>=maxDD,names:names>=maxNames,sleeve:ms>maxSleeve+1e-9,any:false,reasons:[]};
  baseKills.any=baseKills.drawdown||baseKills.names||baseKills.sleeve;
  const rel=rnd(0,100);
  const b=r.assessSergeantRisk({book,metrics:m,kills:baseKills,feedState:'live',inputReliability:rel});
  assert(b.paperRiskCeilingPct>=0 && b.paperRiskCeilingPct<=20+1e-9,'ceiling outside 0..20');
  assert(b.paperRiskCeilingPct<=maxSleeve+1e-9,'ceiling exceeds configured sleeve');
  if(baseKills.drawdown||baseKills.sleeve) assert(b.paperRiskCeilingPct===0 && b.posture==='NO INCREASE','hard kill did not freeze increase');
  if(baseKills.names && !baseKills.drawdown && !baseKills.sleeve){assert(b.paperRiskCeilingPct>=0,'names-only invalid'); assert(b.posture!=='NO INCREASE','names-only became global freeze');}
  const down=r.assessSergeantRisk({book,metrics:m,kills:{...baseKills,drawdown:false,sleeve:false,globalHalt:false,any:baseKills.names},feedState:'down',inputReliability:rel});
  assert(down.paperRiskCeilingPct===0 && down.posture==='NO INCREASE','down feed not frozen');
  const healthyKills={globalHalt:false,drawdown:false,names:false,sleeve:false,any:false,reasons:[]};
  const low=r.sergeantPaperRiskCeilingPct(book,m,healthyKills,'live',20);
  const high=r.sergeantPaperRiskCeilingPct(book,m,healthyKills,'live',80);
  assert(low<=high+1e-9,'lower reliability increased ceiling');
  const dd1=metrics(Math.min(maxDD*.1,maxDD-.001),gross,names,Math.min(ms,maxSleeve));
  const dd2=metrics(Math.min(maxDD*.7,maxDD-.001),gross,names,Math.min(ms,maxSleeve));
  const c1=r.sergeantPaperRiskCeilingPct(book,dd1,healthyKills,'live',100);
  const c2=r.sergeantPaperRiskCeilingPct(book,dd2,healthyKills,'live',100);
  assert(c2<=c1+1e-9,'worse drawdown increased ceiling');
  const live=r.sergeantPaperRiskCeilingPct(book,m,healthyKills,'live',100);
  const snap=r.sergeantPaperRiskCeilingPct(book,m,healthyKills,'snapshot',100);
  const deg=r.sergeantPaperRiskCeilingPct(book,m,healthyKills,'degraded',100);
  const dn=r.sergeantPaperRiskCeilingPct(book,m,healthyKills,'down',100);
  assert(live+1e-9>=snap && snap+1e-9>=deg && deg+1e-9>=dn,'feed degradation monotonicity failed');
  const current=rnd(0,1), requested=rnd(0,current);
  assert(!r.sergeantRiskCeilingBlocksIncrease(current,requested,{paperRiskCeilingPct:0}),'reduction blocked by zero ceiling');
  cases++;
}
// deterministic stress monotonicity on a realistic book.
const pos=[{symbol:'A',name:'A',assetClass:'ETF',units:.2,avgPrice:100,lastPrice:100,targetSleeve:.2,openedAt:'x',updatedAt:'x'},{symbol:'B',name:'B',assetClass:'ETF',units:.1,avgPrice:100,lastPrice:100,targetSleeve:.1,openedAt:'x',updatedAt:'x'}];
const sb=mkBook(10,10,20,pos,70);
const s=r.stressSergeantBook(sb);
const l10=s.find(x=>x.id==='book_down_10').estimatedLossPct,l20=s.find(x=>x.id==='book_down_20').estimatedLossPct,l35=s.find(x=>x.id==='book_down_35').estimatedLossPct;
assert(l10<=l20 && l20<=l35,'stress losses not monotone');
console.log(JSON.stringify({status:'PASS',randomCases:cases,invariants:['ceiling bounded','hard kills freeze','names-only scoped','feed DOWN freezes','reliability monotone','drawdown monotone','feed quality monotone','reduction escape','stress monotone']},null,2));
