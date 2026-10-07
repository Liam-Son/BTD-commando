import { assessSergeantRisk, sergeantPaperRiskCeilingPct, stressSergeantBook } from "./lib/sergeant-risk.js";
import type { BookMetrics, KillState, SergeantBook } from "./lib/sergeant.js";

const t0 = "2026-10-07T00:00:00.000Z";
const book = (o: Partial<SergeantBook> = {}): SergeantBook => ({
  schemaVersion:2, formulaId:"btd_v1_0", policyId:"sergeant_policy_v1", cash:100, peakEquity:100, realizedPnl:0,
  positions:[], log:[], kills:{maxDrawdownPct:10,maxNames:10,maxSleevePct:20,globalHalt:false}, updatedAt:t0, ...o,
});
const metrics = (o: Partial<BookMetrics> = {}): BookMetrics => ({equity:100,positionValue:0,grossExposure:0,targetGrossPct:0,drawdownPct:0,activeNames:0,maxSingleSleevePct:0,unrealizedPnl:0,realizedPnl:0,...o});
const kills = (o: Partial<KillState> = {}): KillState => ({globalHalt:false,drawdown:false,names:false,sleeve:false,any:false,reasons:[],...o});
const ok=(cond:boolean,msg:string)=>{if(!cond) throw new Error(msg)};
const healthy=assessSergeantRisk({book:book(),metrics:metrics(),kills:kills(),feedState:"live",inputReliability:100});
ok(healthy.bookHealth===100,"healthy health"); ok(healthy.paperRiskCeilingPct===20,"healthy cap"); ok(healthy.posture==="CLEAR","healthy posture");
const dd2=assessSergeantRisk({book:book(),metrics:metrics({drawdownPct:2}),kills:kills(),feedState:"live",inputReliability:90});
const dd8=assessSergeantRisk({book:book(),metrics:metrics({drawdownPct:8}),kills:kills(),feedState:"live",inputReliability:90});
ok(dd8.bookHealth<dd2.bookHealth,"drawdown monotonic health"); ok(dd8.paperRiskCeilingPct<=dd2.paperRiskCeilingPct,"drawdown monotonic cap");
const live=sergeantPaperRiskCeilingPct(book(),metrics(),kills(),"live",100); const snap=sergeantPaperRiskCeilingPct(book(),metrics(),kills(),"snapshot",100); const deg=sergeantPaperRiskCeilingPct(book(),metrics(),kills(),"degraded",100); const down=sergeantPaperRiskCeilingPct(book(),metrics(),kills(),"down",100);
ok(live>=snap && snap>=deg && deg>=down && down===0,"feed monotonic");
const missing=assessSergeantRisk({book:book(),metrics:metrics(),kills:kills(),feedState:"live"}); ok(missing.inputReliability===50 && missing.paperRiskCeilingPct===10,"missing reliability conservative");
const stressedBook=book({cash:50,positions:[{symbol:"SPY",name:"SPY",assetClass:"ETF",units:0.5,avgPrice:100,lastPrice:100,targetSleeve:0.5,openedAt:t0,updatedAt:t0}]});
const s=stressSergeantBook(stressedBook); const d10=s.find(x=>x.id==="book_down_10")!; const d20=s.find(x=>x.id==="book_down_20")!; const d35=s.find(x=>x.id==="book_down_35")!;
ok(d10.estimatedLossPct<d20.estimatedLossPct && d20.estimatedLossPct<d35.estimatedLossPct,"stress monotonic");
const tripped=assessSergeantRisk({book:book(),metrics:metrics({drawdownPct:10}),kills:kills({drawdown:true,any:true,reasons:["DD kill"]}),feedState:"live",inputReliability:100}); ok(tripped.posture==="NO INCREASE" && tripped.paperRiskCeilingPct===0,"kill blocks");
console.log(JSON.stringify({healthy,dd2:{health:dd2.bookHealth,cap:dd2.paperRiskCeilingPct},dd8:{health:dd8.bookHealth,cap:dd8.paperRiskCeilingPct},feedCaps:{live,snap,deg,down},missing:{health:missing.bookHealth,cap:missing.paperRiskCeilingPct},stress:s,tripped:{posture:tripped.posture,cap:tripped.paperRiskCeilingPct}},null,2));
