import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out='out/hospital-b1/build-connected/',html=fs.readFileSync(out+'site/index.html','utf8');
const script=html.match(/<script id="hospital-b1-test-storage">([\s\S]*?)<\/script>/)[1];
const prefix='storyworld.hospital-b1.test.v1:',originalKeys=['hapil.storyworld.canonical-r54.20261016.save',...Array.from({length:3},(_,i)=>'hapil.storyworld.canonical-r54.20261016.save.slot-r73.'+(i+1)), 'hapil.storyworld.canonical-r54.20261016.save.slot-r73.active','storyworld.mobile.r62.preferences','storyworld.camera.r63.v1','hapil.storyworld.coop-r62.save','hapil.storyworld.canonical-r54.20261016.save.cheat777'];
const cases=[];
function test(name,fn){fn();cases.push({name,ok:true});}
const raw=new Map(originalKeys.map((k,i)=>[k,'original-'+i])),before=[...raw],calls=[];
const storage={getItem(k){calls.push(['get',k]);return raw.get(k)??null;},setItem(k,v){calls.push(['set',k]);raw.set(k,String(v));},removeItem(k){calls.push(['remove',k]);raw.delete(k);}};
function context(){const c={window:{localStorage:storage}};vm.createContext(c);vm.runInContext(script,c);return c.window.__STORYWORLD_TEST_STORAGE_B1__;}
const a=context();
test('all original key families remain unread and byte-identical under test get/set/remove',()=>{
 for(const k of originalKeys){assert.equal(a.store.getItem(k),null);a.store.setItem(k,'test');assert.equal(a.store.getItem(k),'test');a.store.removeItem(k);}
 assert.deepEqual([...raw],before);assert.ok(calls.every(([,k])=>k.startsWith(prefix)));assert.equal(a.originalSaveImported,false);
});
test('normal slots, previous backup, pointer, coop/777 and preferences map independently',()=>{
 const keys=[...originalKeys,...originalKeys.map(k=>k+'.previous')];
 keys.forEach((k,i)=>a.store.setItem(k,JSON.stringify({version:6,value:i})));
 keys.forEach((k,i)=>assert.equal(a.store.getItem(k),JSON.stringify({version:6,value:i})));
 assert.deepEqual(originalKeys.map(k=>[k,raw.get(k)]),before);
});
test('new instance/reload reads test values; code rollback sees original values',()=>{
 const b=context();assert.equal(a.prefix,b.prefix);
 for(const k of originalKeys){assert.equal(b.store.getItem(k),a.store.getItem(k));assert.equal(storage.getItem(k),before.find(([key])=>key===k)[1]);}
});
test('storage access failures remain lazy and propagate to original game catch paths',()=>{
 const c={window:{}};Object.defineProperty(c.window,'localStorage',{get(){throw Error('fixture security denial');}});vm.createContext(c);vm.runInContext(script,c);
 assert.throws(()=>c.window.__STORYWORLD_TEST_STORAGE_B1__.store.getItem('x'),/fixture security denial/);
 const q=a.create({getItem(){return null;},setItem(){throw Error('fixture quota');},removeItem(){}});assert.throws(()=>q.setItem('x','x'),/fixture quota/);
});
test('only 51 existing storage calls and renderer cache reference differ from reviewed HTML',()=>{
 const mapped='window.__STORYWORLD_TEST_STORAGE_B1__.store.';
 assert.equal(html.split(mapped).length-1,51);
 const undo=html.replace(/<script id="hospital-b1-test-storage">[\s\S]*?<\/script>\n/,'').replaceAll(mapped,'localStorage.').replace('./dist/phase1.js?hospital-b1=a09c0d264510286b','./dist/phase1.js?r76=1');
 assert.equal(undo,fs.readFileSync('out/hospital-b1/visual-b1/mask-fix/refined/site/index.html','utf8'));
});
test('all classic inline scripts compile as JavaScript; no browser or GPU execution',()=>{
 let count=0;for(const m of html.matchAll(/(<script\b[^>]*>)([\s\S]*?)<\/script>/gi)){if(/application\/json/i.test(m[1])||!m[2].trim())continue;new vm.Script(m[2]);count++;}assert.ok(count>50);
});
const report={schema:'m0.hospital.storage-cpu/v1',htmlSHA256:createHash('sha256').update(html).digest('hex'),helperSHA256:createHash('sha256').update(script).digest('hex'),cases,passed:cases.length,failed:0,scope:'CPU fake Storage and VM classic scripts; no original user save, browser origin, physical device, GPU or normal campaign'};
fs.writeFileSync(out+'storage-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
