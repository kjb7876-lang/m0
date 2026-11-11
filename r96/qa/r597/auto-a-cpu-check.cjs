'use strict';
// R597 — A키 오토공격(사용자 2026-11-10 07:32Z "오토공격 설정 만들어서 a키만 누르면 모든스킬및 공격들 알아서 나가게-이게기본설정
//  (sd키제외) 이건 일반공격이랑 동일하게 적용해서 77프로 상향버프 받도록").
//  A(1·J)를 누르고 있는 동안 기본 공격(엔진 그대로)에 더해 Q·W·E·R·F(EGO)·T(실 춤)가 쿨이 돌아오고 적이 사거리 안일 때 저절로 나간다.
//  S(블링크)·D(공명방어)는 절대 누르지 않는다. 반자동(Space)을 켜지 않으므로 R274 손플레이 +77% 피해를 그대로 받는다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='auto-attack-r597.js',src=rd(path.join(R,'client-source',NAME)),html=rd(path.join(R,'runtime-text/index.html'));
const r274=rd(path.join(R,'client-source/manual-bonus-r274.js'));
ok(src.length>0,'client-source/'+NAME+' 있음');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
// ── 연결 다섯 곳
ok(/<script src="\.\/hunter-arrows-r535\.js"><\/script>\s*<script src="\.\/auto-attack-r597\.js"><\/script>/.test(html),'index.html: hunter-arrows-r535 바로 뒤에 auto-attack-r597 태그');
ok(html.indexOf(NAME)>0&&html.indexOf(NAME)<html.indexOf('"./combat-r118.js"'),'combat-r118·world-tiles-r118 보다 앞');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r597/auto-a-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(R,'runtime-manifest.json')).includes(NAME)&&rd(path.join(R,'runtime-inputs.json')).includes(NAME),'runtime-manifest·inputs 등록');
// ── 영웅 파일·공용 API 를 고치지 않는다(읽기만)
ok(!/__STORYWORLD_SAMONG_SURGE_R571__\s*=/.test(src),'사몽 배수 R571 API 를 덮어쓰지 않음');
ok(!/\bauto\s*=(?!=)/.test(src.replace(/autoA|auto[A-Za-z_]/g,'x')),'엔진 반자동 변수 auto 에 값을 넣지 않음(R274 +77% 유지)');
ok(!/\bblink\s*\(|guardStart\s*\(/.test(src),'S 블링크·D 공명방어 함수를 부르지 않음');

// ── 동작(vm) — 엔진 전역을 흉내 낸다
function mk(opt={}){
 const calls=[],hits=[],store=Object.assign({},opt.store||{});
 const enemies=(opt.enemies||[{id:'m1',x:3,y:0,hp:10}]).map(e=>Object.assign({hp:10,spawnState:'active'},e));
 const ctx={console,Math,Number,Object,Array,Set,Map,JSON,String,
  localStorage:{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  keys:new Set(opt.held===false?[]:['attack']),auto:!!opt.auto,guide:!!opt.guide,settings:{autoSkill:false},
  started:true,modal:opt.modal||null,loading:false,time:0,
  player:Object.assign({hero:'slayer',x:0,y:0,hp:100,specialCD:0,egoCD:0,ego:0,samong:0,resonance:opt.resonance??0,blinkCD:0,guard:false},opt.player||{}),
  room:{enemies,engaged:!!opt.engaged},HEROES:{slayer:{range:2.2},michaela:{range:5}},
  safeRegion:()=>!!opt.safe,distance:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),
  nearestEnemy:r=>enemies.filter(e=>e.hp>0&&Math.hypot(e.x,e.y)<=r).sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y))[0]||null,
  tick(dt){ctx.time+=dt;},
  hitEnemy(e,v){hits.push(v);},
  special(){calls.push('q');ctx.player.specialCD=10;ctx.hitEnemy(enemies[0],10);},
  ego(){calls.push('f');ctx.player.resonance-=30;ctx.player.ego=3;ctx.player.egoCD=6;},
  blink(){calls.push('S!');},guardStart(){calls.push('D!');},
  showSettings(){return 'base';},
  window:{}};
 const reach=Object.assign({q:4,w:5,e:6,r:5},opt.reach||{});
 const W=ctx.window;
 W.__STORYWORLD_HANDO_FINAL_R49__={rangeFor:s=>reach[s]||0,eligible:(e,r)=>e&&e.hp>0&&Math.hypot(e.x-ctx.player.x,e.y-ctx.player.y)<=r,
  autoTarget(s){const r=reach[s];return enemies.filter(e=>e.hp>0&&Math.hypot(e.x,e.y)<=r).sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y))[0]||null;},
  autoSpecial(){if(!this.autoTarget('q'))return false;ctx.special();return true;}};
 const ready={w:0,e:0,r:0};
 W.__STORYWORLD_WER__={cast(s,auto){if(opt.blockWER?.includes(s))return false;if(ready[s]>ctx.time)return false;if(auto&&!W.__STORYWORLD_HANDO_FINAL_R49__.autoTarget(s))return false;ready[s]=ctx.time+8;calls.push(s+(auto?'':'(manual)'));return true;}};
 const mr={w:0,e:0};
 W.__STORYWORLD_MICHAELA_R247__={on:()=>true,fire(s,a){if(ctx.player.hero!=='michaela'||mr[s]>ctx.time)return false;mr[s]=ctx.time+5;calls.push('m'+s);return true;}};
 let tReady=0;W.__STORYWORLD_CAMPAIGN_R63R1__={autoCast(){if(tReady>ctx.time)return false;tReady=ctx.time+12;calls.push('t');return true;}};
 if(opt.coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;
 try{if(opt.with274){vm.runInContext('var window=this.window;'+r274,ctx);}vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 const run=(sec,step=1/60)=>{for(let t=0;t<sec;t+=step)ctx.tick(step);};
 return{ctx,calls,hits,store,err,run,api:W.__STORYWORLD_AUTO_A_R597__};}

const A=mk({resonance:0});ok(!A.err&&!!A.api,'오버레이가 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''));
// 정상 경로 — 기본값 켜짐, A 누르고 있으면 스킬이 나간다
ok(A.api?.enabled()===true,'기본값 = 켜짐(저장값 없음)');
A.run(3);ok(['q','w','e','r','t'].every(c=>c==='r'?!A.calls.includes(c):A.calls.includes(c)),'A 누름 → Q·W·E·T 자동 시전(R 은 몹 1마리라 아낌): '+A.calls.join());
ok(!A.calls.includes('S!')&&!A.calls.includes('D!'),'S·D 는 나가지 않음');
ok(A.calls.every(c=>!c.includes('manual')),'WER 은 자동 표적(cast(slot,true))으로만 부름');
// 한 박자(0.35초)에 하나씩 — 한 프레임에 스킬 여럿이 겹치지 않는다
{const B=mk({resonance:0});B.run(.2);ok(B.calls.length===1,'첫 박자에 스킬 하나만('+B.calls.join()+')');B.run(.3);ok(B.calls.length===2,'0.35초 뒤 다음 스킬 하나('+B.calls.join()+')');}
// 쿨다운: 같은 스킬이 쿨 안에 다시 나가지 않는다
{const B=mk({resonance:0});B.run(5);const q=B.calls.filter(c=>c==='q').length;ok(q===1,'Q 는 쿨(10초) 안에 한 번만('+q+')');}
// 경계 — A 를 안 누르면 아무것도 안 나감
{const B=mk({held:false});B.run(3);ok(B.calls.length===0,'A 안 누름 → 자동 시전 없음');}
// A 를 떼면 바로 멈춤
{const B=mk({resonance:0});B.run(.4);const k=B.calls.length;B.ctx.keys.delete('attack');B.run(3);ok(k>0&&B.calls.length===k,'A 를 떼면 그 뒤로 시전 없음');}
// 사거리 밖 적 → 낭비 없음
{const B=mk({enemies:[{id:'far',x:30,y:0}]});B.run(3);ok(B.calls.length===0,'적이 사거리 밖 → 아무것도 안 씀('+B.calls.join()+')');}
// 적 없음
{const B=mk({enemies:[]});B.run(3);ok(B.calls.length===0,'적 없음 → 아무것도 안 씀');}
// 안전 구역·창 열림·죽음·협동
{const B=mk({safe:true});B.run(3);ok(B.calls.length===0,'안전 구역 → 없음');}
{const B=mk({modal:'menu'});B.run(3);ok(B.calls.length===0,'창 열림 → 없음');}
{const B=mk({player:{hp:0}});B.run(3);ok(B.calls.length===0,'영웅 쓰러짐 → 없음');}
{const B=mk({coop:true});B.run(3);ok(B.calls.length===0,'협동 모드 → 이 모듈은 쉼(R62/R63 이 맡음)');}
// 설정 끔 → 지금과 같이(아무것도 안 함)
{const B=mk({store:{'storyworld.r597.autoA':'0'}});ok(B.api?.enabled()===false,'저장값 0 → 꺼짐');B.run(3);ok(B.calls.length===0,'끔 → 자동 시전 없음(지금과 같음)');}
{const B=mk({});B.api?.set(false);ok(B.store['storyworld.r597.autoA']==='0','set(false) 저장');B.run(2);ok(B.calls.length===0,'set(false) 뒤 없음');B.api?.set(true);B.run(1);ok(B.calls.length>0,'set(true) 다시 켜짐');}
// 반자동(Space) 켜짐 → 엔진이 이미 자동 시전하므로 중복하지 않음
{const B=mk({auto:true});B.run(3);ok(B.calls.length===0,'반자동 켜짐 → 이 모듈은 쉼(엔진 자동 시전과 중복 없음)');}
// 길잡이 켜짐 → 엔진이 W·E·R 을 이미 자동 → 이 모듈은 Q·F·T 만
{const B=mk({guide:true,resonance:0});B.run(3);ok(B.calls.includes('q')&&!B.calls.some(c=>/^[wer]$/.test(c)),'길잡이 켜짐 → WER 중복 없음, Q 는 나감('+B.calls.join()+')');}
// R(큰 스킬): 일반 몹 한 마리에겐 아끼고, 둘 이상이거나 보스면 쓴다
{const B=mk({resonance:0,blockWER:['w','e'],reach:{q:0}});B.run(3);ok(!B.calls.includes('r'),'R: 사거리 안 일반 몹 1마리 → 아낌('+B.calls.join()+')');}
{const B=mk({resonance:0,blockWER:['w','e'],reach:{q:0},enemies:[{id:'a',x:2,y:0},{id:'b',x:3,y:1}]});B.run(1);ok(B.calls.includes('r'),'R: 2마리 → 씀('+B.calls.join()+')');}
{const B=mk({resonance:0,blockWER:['w','e'],reach:{q:0},enemies:[{id:'boss',x:2,y:0,boss:true}]});B.run(1);ok(B.calls.includes('r'),'R: 보스 → 씀');}
// E(본편 돌진)는 엔진 반자동과 같이 가까운 적엔 아낀다
{const B=mk({resonance:0,blockWER:['w','r'],reach:{q:0},enemies:[{id:'a',x:5,y:0}]});B.run(1);ok(B.calls.includes('e'),'E: 적이 기본 사거리 0.7배 밖 → 씀');}
{const B=mk({resonance:0,blockWER:['w','r'],reach:{q:0},enemies:[{id:'a',x:1.5,y:0}]});B.run(1);ok(!B.calls.includes('e'),'E: 적이 기본 사거리 0.7배(1.54) 안 → 돌진 아낌(엔진 반자동과 같은 규칙)');}
// EGO(F): 공명 30 이상 + 큰 싸움(보스 또는 3마리 이상)일 때만
{const B=mk({resonance:80,enemies:[{id:'a',x:2,y:0}]});B.run(2);ok(!B.calls.includes('f'),'F: 몹 1마리 → EGO 아낌');}
{const B=mk({resonance:80,enemies:[{id:'a',x:2,y:0},{id:'b',x:3,y:0},{id:'c',x:1,y:2}]});B.run(.4);ok(B.calls[0]==='f','F: 3마리 + 공명 80 → 첫 박자에 EGO('+B.calls.join()+')');}
{const B=mk({resonance:29,enemies:[{id:'a',x:2,y:0,boss:true}]});B.run(2);ok(!B.calls.includes('f'),'F: 공명 29 → 안 씀(경계)');}
{const B=mk({resonance:30,enemies:[{id:'a',x:2,y:0,boss:true}]});B.run(.4);ok(B.calls.includes('f'),'F: 공명 30 + 보스 → 씀(경계)');}
{const B=mk({resonance:80,player:{samong:5},enemies:[{id:'a',x:2,y:0,boss:true}]});B.run(2);ok(!B.calls.includes('f'),'F: 사몽 발현 중 → EGO 안 씀(엔진 규칙)');}
// T 실 춤: 다른 스킬이 다 쿨일 때
{const B=mk({resonance:0});B.run(2);ok(B.calls.includes('t'),'T 실 춤도 자동('+B.calls.join()+')');}
// 미카엘라 W·E 는 R247 이 맡는다
{const B=mk({resonance:0,player:{hero:'michaela'},blockWER:['w','e']});B.run(2);ok(B.calls.includes('mw'),'미카엘라 → R247 fire(w) 로 시전('+B.calls.join()+')');}
// 77% — R274 손플레이 보너스와 같이 올려 실제 피해 배수를 잰다
{const B=mk({with274:true,guide:true,engaged:true,resonance:0});let got=0;const R274=B.ctx.window.__STORYWORLD_MANUAL_R274__;
 ok(!!R274,'R274 함께 올라옴');B.run(1);ok(B.ctx.auto===false,'A 오토 중에도 반자동 auto=false 그대로');
 const dm=R274?.damageMult?.()||0;ok(Math.abs(dm-1.77)<1e-9,'A 오토 중에도 R274 반자동 끔 +77% 피해(길잡이 켠 상태 배수 '+dm+')');
 ok(B.calls.includes('q')&&Math.abs(B.hits[0]-17.7)<1e-9,'실측: A 오토로 나간 Q 피해 10 → '+B.hits[0]+' (+77%)');
 const C=mk({with274:true,guide:true,engaged:true,auto:true});const dm2=C.ctx.window.__STORYWORLD_MANUAL_R274__?.damageMult?.()||0;ok(Math.abs(dm2-1)<1e-9,'대조: 반자동 켜면 +77% 없음(배수 '+dm2+')');}
ok(typeof A.api?.state==='function'&&typeof A.api?.stats==='function','검사용 state·stats');
// 렉: 박자 밖 프레임은 거의 일을 안 한다
{const B=mk({resonance:0});B.run(10);const s=B.api?.stats()||{beats:1e9,errors:1};ok(s.beats<=Math.ceil(10/.35)+1,'10초에 박자 '+s.beats+'번(0.35초 간격 상한)');ok(s.errors===0,'오류 0');}
// 설정 창 체크박스
ok(/A키 오토공격/.test(src)&&/showSettings/.test(src),'설정 창에 "A키 오토공격" 켜기/끄기');
console.log((bad?'FAIL':'PASS')+' r597 auto-a '+(n-bad)+'/'+n);process.exit(bad?1:0);
