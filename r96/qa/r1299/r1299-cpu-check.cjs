// R1299 CPU 검사 — 소환물 크기(summon-size-r1299.js).
//  사용자 2026-11-21 12:39Z "영웅및 보스가소환하는 모든 소환몹 관련 전수조사해서 버그없게 특히 시각적연출과 이미지 출력".
//  실측(헤드리스, qa/r1299/audit.md): ① 세이렌 모르 R61 분신 117px 대 본체 152px(표식이 없어 보스 크기 사슬을 못 탐)
//   ② 기억사수 귀환 전우로 온 '컨트롤러 · 기억의 문'(본래 보스)이 midboss 표식 때문에 중간보스 축소를 받아 43px(제 지역 137px, 영웅 약 76px).
//  정상: 보스 분신 = 본체와 같은 크기, 중간보스 분신 = 본체와 같은 크기, 귀환 전우 본래 보스 = 중간보스 축소 없음.
//  경계: 주인이 없거나 일반 몹인 분신·본래 중간보스인 아군·일반 몹 → 그대로. 그리기 중 오류가 나도 표식은 되돌림. 같은 글 두 번 → 한 번.
//  회귀: 끄기(set false) → 예전과 같음. 표식은 그리기 밖에서 바뀌지 않음(판정·HUD 보스 막대 그대로). 빌드 연결 5곳.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('ok',m);};const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
const F='summon-size-r1299.js',TF='client-source/'+F;ok(fs.existsSync(path.join(R,TF)),F+' exists');
const SRC=rd(TF);ok(rd('runtime-text/'+F)===SRC,'runtime-text copy identical');
// 엔진 크기 사슬 흉내: 기본 키 = 60·spriteRect·defScale, R137 중간보스 ×.7, R205 중간보스 ×.5 · 보스·중간보스 최소 1.6(영웅 키 배수)
function world(o={}){const c={Math,String,Number,Array,Object,JSON,Map,WeakMap,Set,console,isFinite,
  localStorage:{_:{},getItem(k){return this._[k]??null;},setItem(k,v){this._[k]=String(v);}}};c.window=c;vm.createContext(c);
 vm.runInContext(`var room={id:'kair03',enemies:[]},drawn=[],texts=[],boom=false;
 var regionById={u203:{bosses:[{id:'u203-boss'}],midboss:{id:'u203-mid'}},u202:{bosses:[],midboss:{id:'u202-mid'}}};
 var ctx={fillText(t){texts.push(t);},strokeText(t){texts.push('s:'+t);}};
 function drawEnemy(e){/* 엔진 기본 */const ds=e.defScale,sr=(e.combatProfile&&e.combatProfile.spriteRect&&e.combatProfile.spriteRect.height)||1;let h=sr*ds;if(e.boss)ctx.fillText(e.name);drawn.push({id:e.id,h,boss:!!e.boss,mid:!!e.midboss});if(boom)throw new Error('boom');}
 // R137(먼저 실린 덧씌우기): 중간보스 ×.7
 (function(){const base=drawEnemy;drawEnemy=function(e){const ds=e.defScale;let s=false;if(!e.boss&&e.midboss){e.defScale=ds*.7;s=true;}try{return base.apply(this,arguments);}finally{if(s)e.defScale=ds;}};})();
 // R205: 중간보스 ×.5, 보스·중간보스 키가 1.6 미만이면 1.6 까지
 (function(){const base=drawEnemy;drawEnemy=function(e){const ds=e.defScale;let k=1;if(!e.boss&&e.midboss)k*=.5;if(e.boss||e.midboss){const sr=(e.combatProfile&&e.combatProfile.spriteRect&&e.combatProfile.spriteRect.height)||1,h=sr*ds*k;if(h<1.6)k*=1.6/h;}if(k!==1)e.defScale=ds*k;try{return base.apply(this,arguments);}finally{if(k!==1)e.defScale=ds;}};})();`,c);
 if(o.overlay!==false)vm.runInContext(SRC,c);return c;}
const mk=(c,o)=>vm.runInContext('('+JSON.stringify(o)+')',c);
function scene(c){const boss=mk(c,{id:'kair03:k103-boss',nativeId:'k103-boss',name:'세이렌 모르',boss:true,defScale:1.18,combatProfile:{spriteRect:{height:1.1}}});
 const mid=mk(c,{id:'ep1b02:mb-ep1b02',nativeId:'mb-ep1b02',name:'나태의 껍데기 파수',midboss:true,defScale:1.18,combatProfile:{spriteRect:{height:1.2}}});
 const clone=mk(c,{id:'kair03:r61-summon:1',nativeId:'k103-boss',name:'세이렌 모르 · 분신',r61Clone:true,r61Summoned:{kind:'clone',owner:boss.id},defScale:1.18,combatProfile:{spriteRect:{height:1.1}}});
 const cloneMid=mk(c,{id:'ep1b02:r61-summon:2',nativeId:'mb-ep1b02',name:'나태의 껍데기 파수 · 분신',r61Clone:true,r61Summoned:{kind:'clone',owner:mid.id},defScale:1.18,combatProfile:{spriteRect:{height:1.2}}});
 const orphan=mk(c,{id:'x:r61-summon:3',nativeId:'k103-boss',name:'고아 분신',r61Clone:true,r61Summoned:{kind:'clone',owner:'gone'},defScale:1.18,combatProfile:{spriteRect:{height:1.1}}});
 const minion=mk(c,{id:'kair03:r61-summon:4',nativeId:'kair-academy-wave-1',name:'훈련파동',r61Summoned:{kind:'minion',owner:boss.id},defScale:1.3,combatProfile:{spriteRect:{height:1}}});
 const allyBoss=mk(c,{id:'r953:1:u203-boss',nativeId:'u203-boss',name:'컨트롤러 · 기억의 문',r953Ally:true,boss:false,midboss:true,defScale:1.18,combatProfile:{spriteRect:{height:1.65}}});
 const allyMid=mk(c,{id:'r953:2:u202-mid',nativeId:'u202-mid',name:'제8단계 자비 교정관',r953Ally:true,boss:false,midboss:true,defScale:1.18,combatProfile:{spriteRect:{height:1.3}}});
 const homeBoss=mk(c,{id:'u203:u203-boss',nativeId:'u203-boss',name:'컨트롤러 · 기억의 문',boss:true,defScale:1.18,combatProfile:{spriteRect:{height:1.65}}});
 c.room.enemies.push(boss,mid,clone,cloneMid,orphan,minion);return {boss,mid,clone,cloneMid,orphan,minion,allyBoss,allyMid,homeBoss};}
const H=(c,e)=>{c.drawn.length=0;c.drawEnemy(e);return c.drawn.at(-1).h;};
const near=(a,b,t=.02)=>Math.abs(a-b)<=t*Math.max(a,b);
// 실패 재현(덧씌우기 없음): 분신·귀환 전우 크기가 틀림
{const c=world({overlay:false}),s=scene(c);
 ok(H(c,s.clone)<H(c,s.boss)*.9,'(재현·덧씌우기 없음) 보스 분신이 본체보다 10% 넘게 작다');
 ok(H(c,s.cloneMid)>H(c,s.mid)*1.2,'(재현·덧씌우기 없음) 중간보스 분신이 본체보다 20% 넘게 크다');
 ok(H(c,s.allyBoss)<H(c,s.homeBoss)*.7,'(재현·덧씌우기 없음) 귀환 전우 본래 보스가 제 지역 크기의 70%도 안 된다');}
// 정상
const c=world(),s=scene(c),A=c.window.__STORYWORLD_SUMMON_SIZE_R1299__;
ok(A&&A.revision==='R1299-summon-size-1'&&A.inspect().wrapped===true,'모듈 실림·감쌈(문서 없는 환경은 바로)');
ok(near(H(c,s.clone),H(c,s.boss)),'① 보스 분신 = 본체 크기');
ok(near(H(c,s.cloneMid),H(c,s.mid)),'① 중간보스 분신 = 본체 크기(커지지 않음)');
ok(near(H(c,s.allyBoss),H(c,s.homeBoss)),'② 귀환 전우 본래 보스 = 중간보스 축소 없음(제 지역 기본 크기)');
// 경계
const before=x=>{const w=world({overlay:false}),q=scene(w);return H(w,q[x]);};
ok(near(H(c,s.orphan),before('orphan')),'경계: 주인 없는 분신은 그대로');
ok(near(H(c,s.minion),before('minion')),'경계: R61 일반 소환 몹은 그대로');
ok(near(H(c,s.allyMid),before('allyMid')),'경계: 귀환 전우 본래 중간보스는 예전 그대로');
ok(near(H(c,s.boss),before('boss'))&&near(H(c,s.mid),before('mid')),'경계: 본체 보스·중간보스 그대로');
ok(!s.clone.boss&&!s.clone.midboss&&s.allyBoss.midboss===true&&s.allyBoss.boss===false,'표식은 그리기 밖에서 그대로(판정·HUD 영향 없음)');
c.boom=true;let threw=false;try{c.drawEnemy(s.clone);}catch(_){threw=true;}c.boom=false;
ok(threw&&!s.clone.boss&&!s.clone.midboss,'그리기 중 오류여도 표식 되돌림(오류는 그대로 위로)');
c.texts.length=0;c.drawEnemy(s.clone);ok(c.texts.filter(t=>t==='세이렌 모르 · 분신').length===1,'분신 이름 한 번만 씀');
// 회귀
A.set(false);ok(near(H(c,s.clone),before('clone'))&&near(H(c,s.allyBoss),before('allyBoss')),'끄기 → 예전과 같음');A.set(true);
ok(A.inspect().stats.errors===0,'오류 0');
ok(!/\.(arc|fillRect|strokeRect|ellipse|beginPath)\(/.test(SRC),'도형 그리기 없음');
// 빌드 연결
const html=rd('runtime-text/index.html');
ok(html.split('"./'+F+'"').length===2&&/<script src="\.\/ego-auto-r1292\.js"><\/script>\n<script src="\.\/summon-size-r1299\.js"><\/script>\n/.test(html),'index.html 한 번, ego-auto-r1292 바로 뒤');
ok(new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8')),'verify-r96-public.py 목록');
ok(/r96\/qa\/r1299\/r1299-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8')),'pages.yml CPU 검사 줄');
ok(rd('runtime-inputs.json').includes(F)&&rd('runtime-manifest.json').includes(F),'runtime-inputs·manifest 에 들어감(sync-r99)');
console.log(`R1299 CPU: ${n} 통과`);
