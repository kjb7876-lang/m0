// R338 사몽 세계 쉼터의 사몽 에피소드 입구 검사(정적 + 가짜 엔진).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/samong-gate-r338.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/samong-gate-r338.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');assert(idx.split('"./samong-gate-r338.js"').length===2);ok('script tag loaded once');
assert(!/strokeText/.test(src.replace(/\/\*[\s\S]*?\*\//g,'')));ok('no strokeText (Three recorder lacks it)');
assert(!/room\.props\.push/.test(src));ok('gate is not a room prop (no save/path/collision side effects)');
// 가짜 엔진
const calls={start:0,base:0};const effects=[];
const g={window:{__STORYWORLD_WORLD_R74__:Object.freeze({interactions:()=>[{id:'door-0',kind:'door',point:{x:1,y:1}}],use:t=>'base:'+t.id,canUse:()=>true}),__STORYWORLD_SAMONG_R103__:{start:async()=>{calls.start++;return true;},inspect:()=>({here:false})}},localStorage:{getItem:()=>null,setItem(){}},
 started:true,layer:'DREAM',room:{id:'village',exploration:{entry:{x:10,y:10}},objective:{x:20,y:20}},regionById:{village:{safe:true},dist01:{}},player:{x:10,y:10},effects,modal:false,blocked:()=>false,time:0};
const f=new Function(...Object.keys(g),'let interact=function(){__b();},tick=function(){},drawEffect=function(){};const __b=()=>__c.base++;const __c=arguments[arguments.length-1];'+src+';return {i:()=>interact(),t:()=>tick()};');
const h=f(...Object.values(g),calls);const G=g.window.__STORYWORLD_SAMONG_GATE_R338__;
h.t();const gate=G.current();assert(gate&&gate.zone==='village'&&Math.hypot(gate.x-10,gate.y-10)>=2.4);assert(effects.some(e=>e.type==='r338-gate'));ok('DREAM shelter gets a gate near the entry, drawn through the effect slot');
g.player.x=gate.x+.5;g.player.y=gate.y;h.i();assert.strictEqual(calls.start,1);assert.strictEqual(calls.base,0);ok('interact near the gate starts/continues the samong episode (R103 start)');
g.player.x=gate.x+8;h.i();assert.strictEqual(calls.base,1);ok('away from the gate, normal interaction');
g.room.id='dist01';h.t();assert.strictEqual(G.current(),null);ok('no gate outside shelters');
// 모바일 대상 목록(R74 interactions)에 입구가 'object' 로 들어가고, 터치 '사용'이 입구로 들어간다
g.room.id='village';h.t();{const W=g.window.__STORYWORLD_WORLD_R74__,rows=W.interactions();const t=rows.find(r=>r.id==='r338-gate');assert(t&&t.kind==='object'&&rows.some(r=>r.id==='door-0'));const s0=calls.start;assert.strictEqual(W.use(t),true);assert.strictEqual(calls.start,s0+1);assert.strictEqual(W.use(rows[0]),'base:door-0');ok('mobile target list includes the gate (kind object); touch use enters samong; other targets unchanged');}
assert(!/'runecross'|'rune'/.test(src));ok('ally gate uses the cross only (no magic circle, SKILL.md 11)');
console.log(JSON.stringify({ok:true,checks:n,method:'static + fake engine; headless: village DREAM gate -> sz115-P-1'}));
