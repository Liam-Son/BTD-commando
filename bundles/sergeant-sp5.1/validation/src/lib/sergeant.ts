export type FeedState = "live" | "snapshot" | "degraded" | "down";
export interface KillConfig { maxDrawdownPct:number; maxNames:number; maxSleevePct:number; globalHalt:boolean; }
export interface PaperPosition { symbol:string; name:string; assetClass:string; units:number; avgPrice:number; lastPrice:number; targetSleeve:number; openedAt:string; updatedAt:string; }
export interface SergeantBook { schemaVersion:2; formulaId:"btd_v1_0"; policyId:"sergeant_policy_v1"; cash:number; peakEquity:number; realizedPnl:number; positions:PaperPosition[]; log:unknown[]; kills:KillConfig; updatedAt:string; }
export interface BookMetrics { equity:number; positionValue:number; grossExposure:number; targetGrossPct:number; drawdownPct:number; activeNames:number; maxSingleSleevePct:number; unrealizedPnl:number; realizedPnl:number; }
export interface KillState { globalHalt:boolean; drawdown:boolean; names:boolean; sleeve:boolean; any:boolean; reasons:string[]; }
