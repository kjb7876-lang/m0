// R1375 교주의 사몽(cult04 STORY) 마지막 기억의 전투 — 교주의 '지배 연결' 대수문장 6마리 동시 소환 헤드리스 검사(그래픽·GPU 검증 아님).
//  사용자 2026-11-27 07:21Z "교주의사몽에서 마지막 기억의전투에서 교주가 사몽쓰는거 적보스 6마리가 한번에 나오게 하라니까 차례대로 하나씩나오는게 아니라".
//  R1114 는 DREAM 층 사몽 시련(cult04:trial)만 한꺼번에로 바꿨고, STORY 층 최종 결전의 지배 연결(spawnCosmic3, kair-great-01~06)은 1마리씩 6번 그대로였다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1375/cosmic-six-browser.mjs
import {chromium,boot,go,skip} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();
async function run(init,body){const {ctx,p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r790.npc':'{"on":false}',...init}});
 const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,240)));await go(p,'cult04');
 await p.evaluate(()=>{window.__q={
  step:n=>{for(let i=0;i<n;i++){for(let k=0;k<60&&storyScene;k++)advanceScene();if(modal&&!storyScene)try{closePanel(true)}catch(_){}tick(.05);}},
  kill:e=>{e.hp=Math.min(e.hp,1);hitEnemy(e,1e9,{friendly:true,kind:'qa-r1375',eventId:'qa:'+e.id+':'+time});},
  cosm:()=>room.enemies.filter(e=>e.cosmic&&e.hp>0&&!e.deadRecorded),
  ready:(ci)=>{for(let k=0;k<200&&storyScene;k++)advanceScene();if(modal)try{closePanel(true)}catch(_){}room.enemies=room.enemies.filter(e=>!e.boss&&!e.midboss&&!e.cosmic);room.enemies=room.enemies.filter(e=>!Number.isInteger(e.fieldWaveIndex6));room.finalStage=2;player.finalAwakening=true;room.cosmicIndex=ci;room.engaged=false;room.finalizing=false;room.encounterStage='cosmicReady';player.invincible=1e9;player.x=room.objective.x+.6;player.y=room.objective.y+.6;},
 };});
 const r=await body(p);await ctx.close();return {r,errs};}

// ① 켜짐: 처음부터
const A=await run({},p=>p.evaluate(()=>{const q=window.__q,out={};q.ready(0);
 const px=player.x,py=player.y;interact();
 const s0=q.cosm();out.spawnPts=s0.map(e=>({id:e.nativeId||e.id,x:e.x,y:e.y,blk:blocked(e.x,e.y,.2,room)}));out.hero={x:px,y:py};
 q.step(80);const s=q.cosm();out.count=s.length;out.ids=s.map(e=>e.nativeId||e.id).sort();out.states=s.map(e=>e.spawnState);
 out.hp=Object.fromEntries(s.map(e=>[e.nativeId||e.id,e.maxHp]));out.act=room.activeEncounter;out.engaged=room.engaged;
 const live=s.slice();for(const e of live.slice(0,5))q.kill(e);q.step(30);
 out.mid={left:q.cosm().length,engaged:room.engaged,stage:room.encounterStage,ci:room.cosmicIndex,final:room.enemies.some(e=>e.nativeId==='c104-boss'&&e.hp>0&&e.spawnState!=='hidden'&&room.activeEncounter==='finalBoss')};
 for(const e of q.cosm())q.kill(e);q.step(30);
 out.after={left:q.cosm().length,stage:room.encounterStage,ci:room.cosmicIndex,engaged:room.engaged};
 player.x=room.objective.x+.6;player.y=room.objective.y+.6;interact();q.step(40);
 out.final={act:room.activeEncounter,leader:room.enemies.some(e=>e.nativeId==='c104-boss'&&e.hp>0),cosm:q.cosm().length};
 out.api=window.__STORYWORLD_COSMIC_SIX_R1375__?.inspect?.()||null;
 return out;}));
const R=A.r;
ok(R.count===6,'지배 연결 제단 한 번에 대수문장 6마리가 한꺼번에(기존 1마리씩)',{count:R.count,act:R.act});
ok(JSON.stringify(R.ids)===JSON.stringify(['kair-great-01','kair-great-02','kair-great-03','kair-great-04','kair-great-05','kair-great-06']),'6마리 = 정본 대수문장 01~06 하나씩',R.ids);
ok(R.count===6&&R.states.every(s=>s==='active'),'6마리 모두 실체화(active)',R.states);
const pts=R.spawnPts;let minD=1e9;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)minD=Math.min(minD,Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y));
const pd=Math.min(...pts.map(q=>Math.hypot(q.x-R.hero.x,q.y-R.hero.y)));
ok(pts.length===6&&pts.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&!q.blk),'소환 자리: NaN 없음·벽 속 아님',pts.map(q=>[+q.x.toFixed(1),+q.y.toFixed(1),q.blk]));
ok(pts.length===6&&minD>=3.5,'소환 자리: 서로 3.5칸 이상',{minD});
ok(pts.length===6&&pd>=3,'소환 자리: 영웅 곁에 바로 붙지 않음(3칸 이상)',{pd});
ok(R.mid.left===1&&R.mid.engaged&&!R.mid.final,'5마리 잡아도 전투 계속·최종 형태 아직',R.mid);
ok(R.mid.ci===5,'끊긴 연결 수 = 잡은 대수문장 수(신경선 한 가닥씩 끊김)',R.mid);
ok(R.after.left===0&&R.after.stage==='cosmicReady'&&R.after.ci>=6,'6마리 다 잡으면 최종 형태 준비(cosmicReady, 연결 6 끊김)',R.after);
ok(R.final.act==='finalBoss'&&R.final.leader&&R.final.cosm===0,'다음 제단에서 되살아난 교주(최종 형태) 결전',R.final);
ok(R.api&&R.api.installed&&R.api.stats.errors===0,'R1375 API·오류 0',R.api);
ok(A.errs.length===0,'페이지 오류 0',A.errs.slice(0,3));

// ② 경계: 저장 뒤 3개 끊긴 상태(cosmicIndex 3)에서 다시 시작하면 남은 3마리(04~06)만
const B=await run({},p=>p.evaluate(()=>{const q=window.__q;q.ready(3);interact();q.step(80);return {ids:q.cosm().map(e=>e.nativeId||e.id).sort()};}));
ok(JSON.stringify(B.r.ids)===JSON.stringify(['kair-great-04','kair-great-05','kair-great-06']),'경계: 연결 3 끊긴 뒤면 남은 3마리(04~06)만 한꺼번에',B.r.ids);
ok(B.errs.length===0,'경계: 페이지 오류 0',B.errs.slice(0,3));

// ③ 끄기 스위치: 예전 동작(1마리씩 6번) — 그때 대수문장마다 받은 최대 체력을 기준값으로 잰다
const C=await run({'storyworld.r1375.cosmicSix':'0'},p=>p.evaluate(()=>{const q=window.__q;q.ready(0);const out={first:null,hp:{}};
 for(let g=0;g<6&&room.encounterStage==='cosmicReady';g++){player.x=room.objective.x+.6;player.y=room.objective.y+.6;interact();q.step(80);const s=q.cosm();if(out.first===null)out.first=s.length;for(const e of s){out.hp[e.nativeId]=e.maxHp;q.kill(e);}q.step(30);}
 return out;}));
ok(C.r.first===1,'끄기(storyworld.r1375.cosmicSix=0): 예전처럼 1마리',C.r);
const h=R.hp||{},h0=C.r.hp;
ok(Object.keys(h0).length===6&&Object.keys(h0).every(k=>h[k]>0&&Math.abs(h[k]/h0[k]-1)<.01),'대수문장마다 최대 체력 = 예전 1마리씩일 때 값(±1%) — 밸런스 그대로',{six:h,seq:h0});

// ④ 회귀: DREAM 사몽 시련은 R1114 대로(이 덧씌우기가 건드리지 않음) — 시련 단계에서 cosmic 생성 없음
const D=await run({},async p=>{await p.evaluate(async()=>{await enterRegion('cult04',null,{layer:'DREAM',restore:true});});await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);
 return p.evaluate(()=>{const q=window.__q;room.enemies=room.enemies.filter(e=>e.boss&&e.midboss);room.minionKills=3;room.encounterStage='field';player.invincible=1e9;player.x=room.objective.x;player.y=room.objective.y+1.2;interact();q.step(60);
  return {trial:room.enemies.filter(e=>e.trial&&e.hp>0).length,cosm:q.cosm().length};});});
ok(D.r.trial===6&&D.r.cosm===0,'회귀: DREAM 사몽 시련 6마리 동시(R1114) 그대로·대수문장 없음',D.r);
await b.close();console.log(`\n${n-bad}/${n} 통과`);process.exit(bad?1:0);
