import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {DATASETS,key,readRecord,commitRecord,validateDataset,cloudAllowed,conflictDecision,makeBackup,inspectBackup} from '../src/lib/data-resilience-core.mjs';
if(!globalThis.crypto) Object.defineProperty(globalThis,'crypto',{value:webcrypto});
class Store{map=new Map();getItem(k){return this.map.get(k)??null}setItem(k,v){this.map.set(k,v)}removeItem(k){this.map.delete(k)}}
let n=0;function test(name,fn){fn();console.log('PASS',name);n++}
const s=new Store();const note=[{id:1,text:'synthetic',createdAt:'2026-10-02'}];
test('schemas reject malformed',()=>{assert.equal(validateDataset('notes',note),true);assert.equal(validateDataset('medic',{}),false);assert.equal(validateDataset('unknown',[]),false);assert.equal(validateDataset('chat',[{role:'system',content:'fake'}]),false)});
let r;test('initial version',()=>{r=commitRecord(s,'guest','notes',note,null);assert.equal(r.revision,1)});
test('stale tab conflict',()=>assert.throws(()=>commitRecord(s,'guest','notes',note,null),/Conflict/));
test('next version and previous recovery snapshot',()=>{r=commitRecord(s,'guest','notes',[],r.token);assert.equal(r.revision,2);assert.equal(JSON.parse(s.getItem(key('guest','notes')+':previous')).revision,1)});
test('account isolation',()=>{assert.equal(readRecord(s,'alice','notes'),null);assert.notEqual(key('alice','notes'),key('bob','notes'))});
test('corruption quarantined not overwritten',()=>{s.setItem(key('alice','notes'),'bad-json');assert.throws(()=>readRecord(s,'alice','notes'),/preserved/);assert.equal(s.getItem(key('alice','notes')),'bad-json');assert.ok([...s.map.keys()].some(k=>k.startsWith('btd.quarantine:')));assert.throws(()=>commitRecord(s,'alice','notes',[],null),/preserved/)});
test('cloud consent default off and bound owner',()=>{assert.equal(cloudAllowed(null,'alice','medic'),false);assert.equal(cloudAllowed({owner:'bob',datasets:{medic:true}},'alice','medic'),false);assert.equal(cloudAllowed({owner:'guest',datasets:{medic:true}},'guest','medic'),false);assert.equal(cloudAllowed({owner:'alice',datasets:{medic:true}},'alice','medic'),true)});
test('offline dirty persists',()=>assert.equal(readRecord(s,'guest','notes').dirty,true));
test('cloud revisions conflict not overwrite',()=>{assert.equal(conflictDecision({dirty:true,cloudRevision:1},{revision:2}),'conflict');assert.equal(conflictDecision({dirty:false,cloudRevision:1},{revision:2}),'pull');assert.equal(conflictDecision({dirty:true,cloudRevision:2},{revision:2}),'push');assert.equal(conflictDecision({cloudRevision:1},null),'remote-deleted')});
const backup=await makeBackup('guest',{notes:r},['notes']);assert.equal(backup.version,1);assert.deepEqual((await inspectBackup(JSON.stringify(backup))).datasets.notes,[]);console.log('PASS backup SHA256 roundtrip');n++;
const tampered={...backup,datasets:{notes:note}};await assert.rejects(inspectBackup(JSON.stringify(tampered)),/checksum/);console.log('PASS tamper rejected');n++;
assert.ok(!('consent' in backup));assert.ok(!('auth' in backup));console.log('PASS no consent or credentials exported');n++;
console.log(n+' tests PASS');
