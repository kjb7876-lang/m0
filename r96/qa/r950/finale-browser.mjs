// R950 최종보스(교주의 사몽, cult04) 브라우저 검사 — 헤드리스.
//  빠른 진행: 777 → cult04 → 제단 상호작용(interact) → 보스 체력을 hitEnemy 로 깎아 단계마다 넘김 → 엔딩(마을)까지.
//  사용: node r96/qa/r950/finale-browser.mjs [on|off]   (기본 on, 서버 SW_URL 기본 http://127.0.0.1:4410/m0/)
//  on : R950 이 켜진 상태에서 완료 조건을 모두 확인한다.
//  off: localStorage storyworld.r950.finale {"on":false} 로 끈 상태 — 옛 동작(최종 형태 체력 버그)이 그대로인지(끄기 단추가 실제로 끄는지) 확인한다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const MODE=process.argv[2]||'on';
const init={'storyworld.r790.npc':'{"on":false}'};if(MODE==='off')init['storyworld.r950.finale']='{"on":false}';
const b=await chromium.launch();
const {p}=await boot(b,{vp:{width:800,height:450},init});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,240)));
await go(p,'cult04');
let R=await p.evaluate(async()=>{
 const out={stages:[],scenes:[],errors:[]};
 const seenScene=new Set();const step=n=>{for(let i=0;i<n;i++){if(storyScene&&!seenScene.has(storyScene)&&String(storyScene.part||storyScene.items?.[0]?.part||JSON.stringify(storyScene).slice(0,400)).includes('post')){seenScene.add(storyScene);out.scenesShown=(out.scenesShown||0)+1;}if(storyScene&&out.finalDeathT!=null&&out.sceneAfterFinal==null)out.sceneAfterFinal=+time.toFixed(2);for(let k=0;k<60&&storyScene;k++)advanceScene();tick(.05);}};
 const ps=playScenes;playScenes=function(list,...a){try{for(const s of list||[])out.scenes.push({part:s.part,t:+time.toFixed(2)});}catch(_){}return ps.call(this,list,...a);};
 player.invincible=1e9;
 const boss=()=>room.enemies.find(e=>(e.boss||e.midboss||e.cosmic)&&e.hp>0&&!e.deadRecorded);
 const open=()=>{player.x=room.objective.x+.6;player.y=room.objective.y+.6;interact();};
 const kill=e=>{e.hp=Math.min(e.hp,1);hitEnemy(e,1e9,{friendly:true,kind:'qa-r950',eventId:'qa:'+e.id+':'+time});};
 let guard=0,finalSeen=null,firstSeen=null,finalDeathT=null;
 while(guard++<60&&room.id==='cult04'&&room.encounterStage!=='complete'){
  open();step(40);
  const e=boss();if(!e){step(20);continue;}
  // 깨어날 때까지(소환 문양 0.9초 + 깨어남)
  for(let i=0;i<60&&e.spawnState!=='active';i++){e.spawnState==='hidden'&&Math.hypot(e.x-player.x,e.y-player.y)>2&&(player.x=e.x-1,player.y=e.y);step(1);}
  const row={act:room.activeEncounter,id:e.nativeId||e.id,name:e.name,max:Math.round(e.maxHp),hp:Math.round(e.hp),frac:+(e.hp/e.maxHp).toFixed(3)};out.stages.push(row);
  if(row.act==='boss'&&row.id==='c104-boss')firstSeen=row;
  if(row.act==='finalBoss'){finalSeen=row;
   // 체력 절반 아래로 깎아 '절반' 박자가 나오는지
   e.hp=e.maxHp*.45;step(30);
  }
  step(10);kill(e);if(row.act==='finalBoss'){finalDeathT=time;out.finalDeathT=time;}step(30);
 }
 // 마지막 서사·엔딩까지(완료 뒤 마을로 가는 길은 길잡이가 실제 이동으로 걷는다 — 실플레이와 같은 길)
 guide=true;window.__qaStep=step;window.__qaOut=out;
 for(let i=0;i<100&&(storyScene||modal);i++){step(2);if(modal&&typeof closePanel==='function')try{closePanel(true)}catch(_){}}
 out.endState={modal:!!modal,scene:!!storyScene,guide,px:+player.x.toFixed(1),py:+player.y.toFixed(1),stage:room.encounterStage,exits:Object.keys(regionById[zone]?.exits||{}),panel:(document.querySelector('#panel,.panel')?.innerText||'').slice(0,160),started,loading,paused:typeof paused!=='undefined'?paused:null,t:+time.toFixed(1)};
 const api=window.__STORYWORLD_FINALE_R950__;
 out.first=firstSeen;out.final=finalSeen;out.room=room.id;out.ending=typeof ending!=='undefined'?{...ending}:null;
 out.inspect=api?api.inspect():null;out.beats=api?api.beatTexts():null;
 return out;});
// 지역 이동(페이드·불러오기)은 실제 시간 비동기라 evaluate 를 나눠 기다린다. 결말 창(사람이 고름)은 닫고 길잡이가 걷게 둔다 — play.mjs 실플레이와 같은 처리.
for(let i=0;i<600;i++){const r=await p.evaluate(()=>{if(!loading){window.__qaStep(4);if(modal&&typeof closePanel==='function'&&!storyScene)try{closePanel(true)}catch(_){}}return {room:room?.id,loading:!!loading};});if(r.room!=='cult04'&&!r.loading)break;await p.waitForTimeout(40);}
Object.assign(R,await p.evaluate(()=>{const api=window.__STORYWORLD_FINALE_R950__,o=window.__qaOut;return {room:room.id,ending:typeof ending!=='undefined'?{...ending}:null,inspect:api?api.inspect():null,scenesShown:o.scenesShown,sceneAfterFinal:o.sceneAfterFinal,finalDeathT:o.finalDeathT};}));
await b.close();
const fails=[];const ok=(c,m)=>{if(!c)fails.push(m);console.log((c?'PASS ':'FAIL ')+m);};
console.log(JSON.stringify({endState:R.endState,room:R.room,ending:R.ending,scenes:R.scenes,sceneAfterFinal:R.sceneAfterFinal,finalDeathT:R.finalDeathT,inspect:R.inspect}).slice(0,2500));console.log(JSON.stringify({stages:R.stages,first:R.first,final:R.final,room:R.room,ending:R.ending,inspect:R.inspect,scenes:R.scenes},null,0).slice(0,3000));
// 공통(켜짐·꺼짐 모두): 진행·엔딩·오류
ok(R.first&&R.first.max>100000,'1형태(c104-boss boss 단계) 체력이 원래대로 크다(>100000): '+R.first?.max);
ok(R.stages.filter(s=>s.act==='cosmic').length===6,'지배 연결(대수문장) 6단계 그대로');
ok(R.room==='village'&&R.ending?.STORY===true,'엔딩: 마을 도착·STORY 엔딩 기록');
ok(errs.length===0,'페이지 오류 0: '+errs.slice(0,3).join(' | '));
const cosm=R.stages.filter(s=>s.act==='cosmic').map(s=>s.max);
if(MODE==='off'){
 ok(R.inspect===null||R.inspect.on===false,'꺼짐: R950 꺼짐 상태');
 ok(R.final&&R.final.max<R.first.max*.5,'꺼짐: 옛 동작(최종 형태 최대 체력이 1형태 절반 미만) 그대로: '+R.final?.max+' vs '+R.first?.max);
}else{
 ok(!!R.inspect,'R950 API 있음');
 ok(R.final&&Math.abs(R.final.max-R.first.max)<=R.first.max*.01,'최종 형태 최대 체력 = 1형태 최대 체력(±1%): '+R.final?.max+' vs '+R.first?.max);
 ok(R.final&&R.final.frac>=.66&&R.final.frac<=.70,'최종 형태는 원래 의도대로 68% 체력에서 시작: '+R.final?.frac);
 ok(cosm.length===6&&cosm.every(m=>m<R.first.max),'지배 연결 체력은 바꾸지 않음(1형태보다 작음): '+cosm.join(','));
 const bt=R.beats||{};
 for(const k of ['boss-engage','cosmic-engage','final-engage','final-half'])ok(typeof bt[k]==='string'&&bt[k].length>8,'정본 문장 박자 '+k+': '+(bt[k]||'없음').slice(0,40));
 const st=R.inspect?.stats||{};
 ok((st.beatsShown||0)>=4,'박자 줄 4개 이상 표시: '+st.beatsShown);
 ok((st.linkSnaps||0)>=6,'지배 연결 끊김 연출 6회: '+st.linkSnaps);
 ok((st.stitch||0)>=1,'최종 형태 소환 때 신경선 꿰매기 연출: '+st.stitch);
 ok((st.unstitched||0)>=1,'최종 처치 때 신경선이 다시 꿰매지 못하는 연출: '+st.unstitched);
 ok((st.hpFixed||0)===1,'최종 형태 체력 보정 정확히 1번: '+st.hpFixed);
 const gap=R.sceneAfterFinal!=null&&R.finalDeathT!=null?R.sceneAfterFinal-R.finalDeathT:null;
 ok(gap!=null&&gap>=2.0&&gap<=4.5,'최종 처치 뒤 마지막 서사 창은 2~4.5초 뒤에 열림(무너짐 연출을 본 뒤): '+(gap!=null?gap.toFixed(2):'없음'));
 ok((R.inspect?.stats?.flushed||0)===1&&!R.inspect?.pending,'미룬 마지막 서사는 정확히 한 번 열림(flushed=1): '+R.inspect?.stats?.flushed);
 ok(R.scenesShown===1,'마지막 서사 창이 실제로 한 번만 열림: '+R.scenesShown);
 ok(!R.inspect?.lastError,'R950 오류 없음: '+R.inspect?.lastError);
}
console.log(fails.length?'RESULT FAIL '+fails.length:'RESULT PASS');process.exit(fails.length?1:0);
