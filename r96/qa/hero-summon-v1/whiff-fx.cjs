// 사용자 2026-11-25 "헛칠때 공격이펙트 안나가게": 3D 조작 근접 영웅의 실제 A 가 아무 적도 맞히지 못하면
// 그 A 호출 동안 새로 생긴 공격 이펙트를 지우고(모션은 그대로), 맞히면 그대로 둔다.
// usage: node whiff-fx.cjs r96/client-source/hwando-3d-r1302.js
const fs=require('fs'),assert=require('assert/strict');
const src=fs.readFileSync(process.argv[2]||'r96/client-source/hwando-3d-r1302.js','utf8');
const m=src.match(/function stripWhiffEffects\(list,before,landed\)\{[\s\S]*?\n\}/);
assert(m,'stripWhiffEffects not found');
const strip=new Function(m[0]+';return stripWhiffEffects;')();
const a={k:'old-air',life:Infinity},b={k:'chain',life:.4},s1={k:'slash',life:.25},s2={k:'air',life:.3},s3={k:'pxfSprite',life:.5};
const cases=[];const t=(n,f)=>{f();cases.push(n);};
t('whiff: only effects created by this swing are removed, in place',()=>{const L=[a,b,s1,s2,s3];const keep=L;const n=strip(L,new Set([a,b]),false);assert.equal(n,3);assert.equal(L,keep);assert.deepEqual(L,[a,b]);});
t('landed hit: nothing removed',()=>{const L=[a,s1,s2];assert.equal(strip(L,new Set([a]),true),0);assert.deepEqual(L,[a,s1,s2]);});
t('whiff with no new effects: no change',()=>{const L=[a,b];assert.equal(strip(L,new Set([a,b]),false),0);assert.deepEqual(L,[a,b]);});
t('older effect removed by the swing itself is not resurrected',()=>{const L=[s1];assert.equal(strip(L,new Set([a,b]),false),1);assert.deepEqual(L,[]);});
t('host layers (life Infinity or 1e9) created by the swing are kept',()=>{const L=[a,{k:'r292-skill-fx',life:Infinity},{k:'r113Layer',life:1e9},s1,{k:'nolife'}];const n=strip(L,new Set([a]),false);assert.equal(n,1);assert.deepEqual(L.map(e=>e.k),['old-air','r292-skill-fx','r113Layer','nolife']);});
t('bad inputs are ignored safely',()=>{assert.equal(strip(null,new Set(),false),0);assert.equal(strip([a],null,false),0);});
const wrap=/function installWhiffGuard\(\)\{[\s\S]*?\n\}/.exec(src);
assert(wrap,'installWhiffGuard not found');
t('guard only for the active 3D controlled melee hero',()=>{assert.match(wrap[0],/active\(\)/);assert.match(wrap[0],/range/);});
t('guard installs outermost after load',()=>{assert.match(src,/addEventListener\('load',installWhiffGuard\)|readyState==='complete'\)installWhiffGuard\(\)/);});
t('shoulder spirit attack flash also off on a whiff',()=>{assert.match(src,/const contact=act==='attack'&&atk>=0&&!whiffNow\(now\)/);});
console.log(JSON.stringify({passed:true,cases},null,1));
