// 실플레이 검수(2026-11-25): 지역 이동 때 releaseImageMemory 가 3D 환도 소환 그림(attack-e.webp)을
// imageCache 에서 지우면, cachedSpiritImage 가 '이미 요청함' 표만 보고 다시 요청하지 않아
// 그 판 끝까지 A 적중 2D 소환이 그려지지 않던 문제의 회귀 검사.
// usage: node side-art-evict.cjs r96/client-source/hwando-3d-r1302.js
const fs=require('fs'),assert=require('assert/strict');
const src=fs.readFileSync(process.argv[2]||'r96/client-source/hwando-3d-r1302.js','utf8');
const m=src.match(/function cachedSpiritImage\(p,asked\)\{[\s\S]*?\n\}/);
assert(m,'cachedSpiritImage not found');
function harness({withCache=true}={}){
 const cache=new Map(),calls=[];
 const env={readyImage:p=>{const r=cache.get(p);return r&&r.ready?r:null;},
  addImage:(p)=>{calls.push(p);cache.set(p,{path:p,ready:false,image:null,error:null});}};
 const fn=new Function('readyImage','addImage','imageCache',m[0]+';return cachedSpiritImage;')(env.readyImage,env.addImage,withCache?cache:undefined);
 return {fn,cache,calls,asked:new Set()};
}
const P='assets/r283/hwando/r271/attack-e.webp';const results=[];
const t=(name,f)=>{f();results.push(name);};
t('first call asks once and returns null while pending',()=>{const h=harness();assert.equal(h.fn(P,h.asked),null);assert.equal(h.fn(P,h.asked),null);assert.deepEqual(h.calls,[P]);});
t('ready image is returned without new requests',()=>{const h=harness();h.fn(P,h.asked);h.cache.get(P).ready=true;h.cache.get(P).image={w:1};assert.deepEqual(h.fn(P,h.asked),{w:1});assert.equal(h.calls.length,1);});
t('evicted image (region change) is requested again',()=>{const h=harness();h.fn(P,h.asked);const row=h.cache.get(P);row.ready=true;row.image={w:1};h.cache.delete(P);
 assert.equal(h.fn(P,h.asked),null);assert.equal(h.calls.length,2,'must re-request after releaseImageMemory eviction');
 h.cache.get(P).ready=true;h.cache.get(P).image={w:2};assert.deepEqual(h.fn(P,h.asked),{w:2});});
t('repeated evictions keep recovering (boundary: 3 region changes)',()=>{const h=harness();for(let i=0;i<3;i++){h.fn(P,h.asked);const r=h.cache.get(P);r.ready=true;r.image={i};assert.deepEqual(h.fn(P,h.asked),{i});h.cache.delete(P);}assert.equal(h.calls.length,3);});
t('failed load entry stays in cache: no retry storm',()=>{const h=harness();h.fn(P,h.asked);h.cache.get(P).error='404';for(let i=0;i<50;i++)h.fn(P,h.asked);assert.equal(h.calls.length,1);});
t('no imageCache global: still asks only once',()=>{const h=harness({withCache:false});for(let i=0;i<5;i++)h.fn(P,h.asked);assert.equal(h.calls.length,1);});
console.log(JSON.stringify({passed:true,cases:results},null,1));
