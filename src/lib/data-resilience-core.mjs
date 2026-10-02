export const DATASETS = ["sergeant", "medic", "notes", "echo", "chat"];
export const SENSITIVE = ["medic", "chat"];
export const PREFIX = "btd.data.v1:";
export const MAX_BYTES = 2000000;
const obj = x => x && typeof x === "object" && !Array.isArray(x);
const finite = x => typeof x === "number" && Number.isFinite(x);
const str = x => typeof x === "string" && x.length <= 16000;
const arr = (x, test, n=5000) => Array.isArray(x) && x.length <= n && x.every(test);
export function validateDataset(id, v) {
 if (!DATASETS.includes(id) || JSON.stringify(v).length > MAX_BYTES) return false;
 if (id === "sergeant") return obj(v) && v.schemaVersion === 2 && v.formulaId === "btd_v1_0" && v.policyId === "sergeant_policy_v1" && [v.cash,v.realizedPnl,v.peakEquity].every(finite) && v.cash >= 0 && obj(v.kills) && [v.kills.maxDrawdownPct,v.kills.maxNames,v.kills.maxSleevePct].every(finite) && typeof v.kills.globalHalt === "boolean" && arr(v.positions,p=>obj(p)&&str(p.symbol)&&p.symbol.length>0&&[p.units,p.avgPrice,p.lastPrice,p.targetSleeve].every(finite)&&p.units>=0&&p.avgPrice>0&&p.lastPrice>0&&p.targetSleeve>=0&&p.targetSleeve<=1,500) && arr(v.log,l=>obj(l)&&str(l.id)&&str(l.t)&&["OPEN","RESIZE","CLOSE","LOG_ONLY","KILL_CHANGE"].includes(l.action),500);
 if (id === "medic") return obj(v) && arr(v.checkins,x=>obj(x)&&str(x.id)&&str(x.date)&&[x.energy,x.mood,x.stress,x.focus,x.recovery,x.sleepHours,x.sleepQuality,x.hydrationMl,x.readinessScore].every(finite)) && arr(v.logs,x=>obj(x)&&str(x.id)&&str(x.timestamp)&&str(x.type)&&str(x.value)) && arr(v.reminders,x=>obj(x)&&str(x.id)&&str(x.title)&&str(x.dueDate)&&["open","completed"].includes(x.status)) && obj(v.settings)&&[v.settings.hydrationTarget,v.settings.sleepTarget,v.settings.weeklyActivityTarget].every(finite)&&obj(v.buddy)&&["good","recovery","checkin","offline"].includes(v.buddy.status)&&str(v.buddy.note);
 if (id === "chat") return arr(v,x=>obj(x)&&["user","assistant"].includes(x.role)&&str(x.content),200);
 if (id === "notes") return arr(v,x=>obj(x)&&(str(x.id)||finite(x.id))&&str(x.text),1000);
 return arr(v,x=>obj(x)&&(str(x.id)||finite(x.id))&&str(x.message),100);
}
export function key(owner,id) { if (!owner || !DATASETS.includes(id)) throw Error("Invalid dataset scope"); return PREFIX+owner+":"+id; }
export function parseRecord(raw,owner,id) {
 const x=JSON.parse(raw); if(!obj(x)||x.schema!==1||x.owner!==owner||x.dataset!==id||!Number.isInteger(x.revision)||x.revision<1||!str(x.token)||!validateDataset(id,x.data))throw Error("Invalid stored dataset"); return x;
}
export function readRecord(storage,owner,id) { const raw=storage.getItem(key(owner,id)); if(!raw)return null; try{return parseRecord(raw,owner,id)}catch(error){ try{storage.setItem("btd.quarantine:"+Date.now()+":"+owner+":"+id,raw)}catch{} throw Error("Corrupt "+id+" preserved; writes blocked. Use Data tools recovery.");} }
export function commitRecord(storage,owner,id,data,expectedToken,options={}) {
 if(!validateDataset(id,data))throw Error("Invalid "+id+" data; write blocked");
 const current=readRecord(storage,owner,id); if((current?.token??null)!==expectedToken)throw Error("Conflict: another tab changed "+id+". Reload latest or resolve in Data tools.");
 const x={schema:1,owner,dataset:id,revision:(current?.revision??0)+1,token:options.token??globalThis.crypto.randomUUID(),updatedAt:new Date().toISOString(),cloudRevision:options.cloudRevision??current?.cloudRevision??0,dirty:options.dirty??true,data};
 if(current)storage.setItem(key(owner,id)+":previous",JSON.stringify(current)); storage.setItem(key(owner,id),JSON.stringify(x)); return x;
}
export function cloudAllowed(consent,owner,id) { return owner!=="guest"&&consent?.owner===owner&&consent?.datasets?.[id]===true; }
export function conflictDecision(local,remote) { if(!remote)return local?.cloudRevision>0?"remote-deleted":"push"; if(!local)return "pull"; if(remote.revision===local.cloudRevision)return local.dirty?"push":"equal"; return local.dirty?"conflict":"pull"; }
export async function checksum(value) { const bytes=new TextEncoder().encode(JSON.stringify(value)); const digest=await globalThis.crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join(""); }
export async function makeBackup(owner,records,ids) {
 const selected={};for(const id of ids){if(!DATASETS.includes(id))throw Error("Unknown dataset");if(records[id]){if(!validateDataset(id,records[id].data))throw Error("Invalid dataset");selected[id]=records[id].data;}}
 const payload={format:"BTD_DATA_BACKUP",version:1,createdAt:new Date().toISOString(),sourceOwner:owner,datasets:selected};return {...payload,sha256:await checksum(payload)};
}
export async function inspectBackup(text) { if(new TextEncoder().encode(text).length>MAX_BYTES*5)throw Error("Backup too large");const b=JSON.parse(text); const {sha256,...payload}=b; if(payload.format!=="BTD_DATA_BACKUP"||payload.version!==1||!obj(payload.datasets)||await checksum(payload)!==sha256)throw Error("Backup version/checksum invalid"); for(const [id,data] of Object.entries(payload.datasets))if(!validateDataset(id,data))throw Error("Invalid "+id+" in backup"); if(Object.keys(payload).some(k=>!["format","version","createdAt","sourceOwner","datasets"].includes(k)))throw Error("Unexpected backup fields"); return payload; }
