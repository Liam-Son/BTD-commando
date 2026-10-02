import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
// @ts-expect-error Runtime-only tested ESM module
import { DATASETS, key, readRecord, commitRecord, validateDataset, cloudAllowed, conflictDecision } from "./data-resilience-core.mjs";
export type Dataset = "sergeant"|"medic"|"notes"|"echo"|"chat";
export type DataRecord = {schema:1;owner:string;dataset:Dataset;revision:number;token:string;updatedAt:string;cloudRevision:number;dirty:boolean;data:any};
const EVENT="btd:data-change";
export function emitData(){window.dispatchEvent(new Event(EVENT));}
export function ownerId(user: {id:string}|null){return user?.id??"guest";}
export function consent(owner:string):any {try{return JSON.parse(localStorage.getItem("btd.consent.v1:"+owner)??"null")}catch{return null}}
export function setConsent(owner:string,id:Dataset,on:boolean){const c=consent(owner)??{owner,datasets:{},localChat:false};c.datasets[id]=on;localStorage.setItem("btd.consent.v1:"+owner,JSON.stringify(c));emitData();}
export function setLocalChat(owner:string,on:boolean){const c=consent(owner)??{owner,datasets:{},localChat:false};c.localChat=on;if(!on)c.datasets.chat=false;localStorage.setItem("btd.consent.v1:"+owner,JSON.stringify(c));emitData();}
export function getRecord(owner:string,id:Dataset):DataRecord|null{return readRecord(localStorage,owner,id)}
export async function writeData(owner:string,id:Dataset,data:any,token:string|null,options:any={}){
 const run=()=>{const r=commitRecord(localStorage,owner,id,data,token,options);emitData();return r;};
 if(navigator.locks)return navigator.locks.request(key(owner,id),run);throw Error("Safe cross-tab writes require browser Web Locks support; data remains read-only here.");
}
export function useDataset<T>(id:Dataset,fallback:()=>T):{value:T;setValue:Dispatch<SetStateAction<T>>;ready:boolean;issue:string;owner:string}{
 const {user,loading}=useAuth();const owner=ownerId(user);const [value,setValue]=useState<T>(fallback);const [ready,setReady]=useState(false);const [issue,setIssue]=useState("");const ref=useRef<{owner:string;record:DataRecord|null;value:T;blocked:boolean}>({owner,record:null,value,blocked:false});
 useEffect(()=>{if(loading)return;setReady(false);const refresh=()=>{try{const r=getRecord(owner,id);ref.current={owner,record:r,value:r?.data??fallback(),blocked:false};setValue(ref.current.value);setIssue("");setReady(true)}catch(e){ref.current={owner,record:null,value:fallback(),blocked:true};setValue(ref.current.value);setIssue(e instanceof Error?e.message:"Storage unavailable");setReady(true)}};refresh();const external=(e:StorageEvent)=>{if(e.key?.startsWith(key(owner,id)))refresh()};window.addEventListener("storage",external);window.addEventListener(EVENT,refresh);return()=>{window.removeEventListener("storage",external);window.removeEventListener(EVENT,refresh)}},[owner,loading,id]);
 const update:Dispatch<SetStateAction<T>>=(next)=>{const before=ref.current;if(!ready||before.blocked||before.owner!==owner){setIssue("Storage is not ready or is quarantined. Use Data tools.");return;}const data=typeof next==="function"?(next as (x:T)=>T)(before.value):next;if(data===before.value)return;void writeData(owner,id,data,before.record?.token??null).catch(e=>setIssue(e.message));};
 return {value,setValue:update,ready,issue,owner};
}
const running=new Set<string>();
export async function syncDataset(owner:string,id:Dataset){
 if(running.has(owner+id)||!cloudAllowed(consent(owner),owner,id))return;
 running.add(owner+id);try{
 const local=getRecord(owner,id);const client=supabase as any;
 const {data:remote,error}=await client.from("btd_dataset_snapshots").select("payload,revision").eq("user_id",owner).eq("dataset",id).maybeSingle();if(error)throw error;
 if(!cloudAllowed(consent(owner),owner,id))return;
 const decision=conflictDecision(local,remote);if(decision==="equal")return;
 if(decision==="conflict"||decision==="remote-deleted"){localStorage.setItem("btd.conflict:"+owner+":"+id,JSON.stringify({remote:remote??null,detectedAt:new Date().toISOString()}));throw Error("Cloud conflict for "+id+"; choose a version in Data tools.");}
 if(decision==="pull"){if(!validateDataset(id,remote.payload))throw Error("Cloud schema invalid");await writeData(owner,id,remote.payload,local?.token??null,{cloudRevision:remote.revision,dirty:false});return;}
 if(!local)return;
 if(!cloudAllowed(consent(owner),owner,id))return;
 const {data:result,error:err}=await client.rpc("btd_save_snapshot",{p_dataset:id,p_payload:local.data,p_expected_revision:local.cloudRevision});if(err)throw err;if(!result?.ok)throw Error("Cloud conflict; retry to inspect versions");
 const now=getRecord(owner,id);if(now?.token===local.token)await writeData(owner,id,now.data,now.token,{cloudRevision:result.revision,dirty:false});
 }finally{running.delete(owner+id)}
}
export function useCloudSync(){const {user,loading}=useAuth();useEffect(()=>{if(loading||!user)return;const owner=user.id;let alive=true;const tick=()=>{if(!alive||!navigator.onLine)return;for(const id of DATASETS)void syncDataset(owner,id).then(()=>{if(alive&&cloudAllowed(consent(owner),owner,id))sessionStorage.setItem("btd.cloud-status:"+owner,"Connected; last check "+new Date().toLocaleTimeString())}).catch(e=>{if(alive)sessionStorage.setItem("btd.cloud-status:"+owner,e.message?.includes("btd_dataset_snapshots")?"Backend not activated: database migration required":e.message??"Offline; local data retained")})};tick();const timer=setInterval(tick,15000);window.addEventListener("online",tick);return()=>{alive=false;clearInterval(timer);window.removeEventListener("online",tick)}},[user?.id,loading]);}

export async function restoreDatasets(owner:string,datasets:Record<string,unknown>,expected:Record<string,string|null>){
 if(!navigator.locks)throw Error("Restore requires Web Locks support");
 const ids=Object.keys(datasets).sort() as Dataset[];
 const locked=async(i:number):Promise<void>=>{if(i<ids.length)return navigator.locks.request(key(owner,ids[i]),()=>locked(i+1));
 const originals=new Map<string,string|null>();for(const id of ids){if(!validateDataset(id,datasets[id]))throw Error("Invalid restore dataset");const r=getRecord(owner,id);if((r?.token??null)!==expected[id])throw Error("Data changed since preview; load preview again");for(const k of [key(owner,id),key(owner,id)+":previous"])originals.set(k,localStorage.getItem(k));}
 try{for(const id of ids)commitRecord(localStorage,owner,id,datasets[id],expected[id]);}catch(e){for(const[k,v]of originals){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}throw e;}finally{emitData();}};
 await locked(0);
}
