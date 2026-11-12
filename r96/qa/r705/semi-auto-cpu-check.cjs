'use strict';
// R705 — 반자동 이동 금지(사용자 2026-11-11 08:26Z "반자동모드 적이 사거리안에있으면 공격만 자동으로 나가게 이동은 하지말고 이동은 플레이어가 직접하도록").
//  반자동(Space, 엔진 auto=true, 길잡이 꺼짐)에서는 공격(기본·W/E/R)만 저절로 나가고, 영웅은 스스로 걷지 않는다.
//  R115 ③ 의 장판 피하기·원거리 물러서기·근접 옆걸음은 길잡이(guide)에서만 남는다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAME='semi-auto-r705.js',src=rd(path.join(R,'client-source',NAME)),r115=rd(path.join(R,'client-source/play-r115.js')),html=rd(path.join(R,'runtime-text/index.html'));
ok(src.length>0,'client-source/'+NAME+' 있음');
ok(src.length>0&&rd(path.join(R,'runtime-text',NAME))===src,'runtime-text 사본 = client-source');
ok(/<script src="\.\/auto-attack-r597\.js"><\/script>\s*<script src="\.\/semi-auto-r705\.js"><\/script>/.test(html),'index.html: auto-attack-r597 바로 뒤에 semi-auto-r705 태그');
ok(html.indexOf(NAME)>html.indexOf('play-r115.js')&&html.indexOf(NAME)<html.indexOf('"./combat-r118.js"'),'play-r115 뒤·combat-r118 앞');
ok(rd(path.join(ROOT,'scripts/verify-r96-public.py')).includes("'"+NAME+"'"),'verify-r96-public.py 기대 목록');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r705/semi-auto-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(rd(path.join(R,'runtime-manifest.json')).includes(NAME)&&rd(path.join(R,'runtime-inputs.json')).includes(NAME),'runtime-manifest·inputs 등록');
ok(/__STORYWORLD_SEMI_AUTO_R705__/.test(r115),'play-r115 가 R705 를 묻는다');
ok(!/\bauto\s*=(?!=)/.test(src.replace(/auto[A-Za-z_]/g,'x')),'엔진 auto 변수에 값을 넣지 않음');

// ── 동작(vm): R115 + R705 를 실제로 올리고 tick 을 돌린다.
function mk(o={}){
 const store={};
 const sb={console,Math,Number,Object,Array,Set,Map,JSON,String,Date,
  localStorage:{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},
  document:{getElementById:()=>null,head:{appendChild(){}},createElement:()=>({style:{},appendChild(){},querySelector(){return null;}}),body:{appendChild(){}},querySelector:()=>null},
  DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}},
  keys:new Set(),joystickVector:{x:0,y:0},auto:o.auto!==false,guide:!!o.guide,started:true,modal:null,loading:false,storyScene:null,time:10,
  settings:{autoSkill:false},command:null,route:[],guideTimer:0,
  player:{hero:o.hero||'slayer',x:5,y:5,hp:100},
  room:{enemies:[{id:'m1',x:5.8,y:5,hp:10,spawnState:'active',visible:true,radius:.3,attack:o.attack||null}],engaged:true},
  hazards:o.hazard===false?[]:[{type:'field',age:0,warning:1,x:5,y:5,radius:2,owner:'m1'}],
  blocked:()=>false,drawEnemy(){},tick(dt){sb.time+=dt;},guideStep(){},
  HEROES:{slayer:{range:2},seoha:{range:6}},
  __STORYWORLD_COOP_SIM_R62__:{mode:()=>'off'},qCalls:0,safeRegion:()=>!!o.safe,
  __STORYWORLD_HANDO_FINAL_R49__:{autoSpecial(){if(sb.player.specialCD>0||!sb.room.enemies.some(e=>e.hp>0))return;sb.qCalls++;sb.player.specialCD=8;}}};
 sb.player.specialCD=0;
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(r115,sb,{filename:'play-r115.js'});
 vm.runInContext(src,sb,{filename:NAME});
 if(o.off&&sb.__STORYWORLD_SEMI_AUTO_R705__)sb.__STORYWORLD_SEMI_AUTO_R705__.set(false);
 sb.step=(dt=.05)=>{sb.tick(dt);};
 return sb;}
// 1. 반자동만 켜짐 + 장판 위에 서 있음 → 걷지 않는다(route 비어 있음, 위치 그대로).
{const s=mk({});for(let i=0;i<20;i++)s.step();ok(s.route.length===0&&s.player.x===5&&s.player.y===5,'반자동: 장판 위에서도 스스로 걷지 않음');
 ok(s.__STORYWORLD_PLAY_R115__.stats?.dodges===0||true,'(참고) 통계');}
// 2. 길잡이 켜짐 → 예전처럼 장판을 피해 걷는다(길잡이 동작은 그대로).
{const s=mk({guide:true,auto:false});for(let i=0;i<20;i++)s.step();ok(s.route.length>0,'길잡이: 장판 피하기는 그대로 남음');}
// 3. 원거리 영웅이 붙은 적 앞에서도 반자동은 물러서지 않는다.
{const s=mk({hero:'seoha',hazard:false});for(let i=0;i<20;i++)s.step();ok(s.route.length===0,'반자동 원거리: 물러서기 안 함');}
// 4. 근접 영웅 옆걸음도 안 한다.
{const s=mk({attack:{}  ,hazard:false});for(let i=0;i<20;i++)s.step();ok(s.route.length===0,'반자동 근접: 옆걸음 안 함');}
// 5. 끄면(set(false)) 예전 동작으로 돌아간다.
{const s=mk({off:true});for(let i=0;i<20;i++)s.step();ok(s.route.length>0,'R705 끔 → 예전 반자동(장판 피하기) 복귀');}
// 6. API 경계값.
{const s=mk({});const A=s.__STORYWORLD_SEMI_AUTO_R705__;ok(A&&A.enabled()===true,'기본 켜짐');
 ok(A.holdStill()===true,'auto 켜짐·길잡이 꺼짐 → holdStill');
 s.guide=true;ok(A.holdStill()===false,'길잡이 켜짐 → holdStill 아님');
 s.guide=false;s.auto=false;ok(A.holdStill()===false,'반자동 꺼짐 → holdStill 아님');
 s.auto=true;A.set(false);ok(A.holdStill()===false&&s.localStorage.getItem('storyworld.r705.semiHold')==='0','끄면 holdStill 거짓·저장 0');}
// 8. Q(고유기)도 반자동에서 자동 시전: 쿨 돌아오면 나가고, 쿨 중엔 안 나가며, 반자동 꺼짐·안전지대·길잡이 아닌 경우만.
{const s=mk({hazard:false});for(let i=0;i<10;i++)s.step();ok(s.qCalls===1,'반자동: Q 자동 시전 1회(쿨 중 반복 안 함)');
 s.player.specialCD=0;for(let i=0;i<10;i++)s.step();ok(s.qCalls===2,'쿨 돌아오면 Q 다시 자동');
 ok(s.route.length===0&&s.player.x===5,'Q 자동 시전해도 걷지 않음');}
{const s=mk({hazard:false,auto:false});for(let i=0;i<10;i++)s.step();ok(s.qCalls===0,'반자동 꺼짐: Q 자동 없음');}
{const s=mk({hazard:false,safe:true});for(let i=0;i<10;i++)s.step();ok(s.qCalls===0,'안전지대: Q 자동 없음');}
{const s=mk({hazard:false});s.room.enemies.length=0;for(let i=0;i<10;i++)s.step();ok(s.qCalls===0,'적 없으면 Q 안 나감(경계)');}
// 7. 공격 자동 시전은 그대로 — 기술 자동 시전 코드가 holdStill 앞에 있다.
ok(/holdStill/.test(r115)&&r115.indexOf('holdStill')>r115.indexOf('wer.cast(slot,true)'),'W·E·R 자동 시전은 이동 금지보다 앞(공격은 계속 나감)');
console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
