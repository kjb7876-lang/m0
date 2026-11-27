// R1374 헤드리스 검사 — 2D 영웅 좌우 공격 모션만·이동은 블링크로만(사용자 2026-11-27 07:17Z).
//  A) 서하 '평행세계 소집'(R949) 소환 영웅 몸: 주인을 끌고 다니며 적과 싸우게 하고, 엔진 heroPose 가 실제로 보는 몸 상태를 매 그림마다 기록.
//  B) 3D 를 끈 조종 영웅(2D)도 같은 규칙. C) 3D 조종 영웅은 그대로(걷기 자세 유지).
//  기대: 소환 몸 방향 좌·우만, 걷기(moving) 0, 그림 자리는 블링크 기록이 있을 때만 바뀜.
import {chromium,boot,go} from '../r444/lib.mjs';
const MODE=process.env.MODE||'A';let fail=0;const F=(c,m,x)=>{console.log(c?'ok  ':'FAIL',m,x===undefined?'':JSON.stringify(x).slice(0,400));if(!c)fail++;};
const b=await chromium.launch();
const init=MODE==='B'?{'storyworld.r1302.hwando3d':'off','storyworld.r1374d.qa2d':'on'}:MODE==='C'?{'storyworld.r1302.hwando3d':'on'}:null;
const {p}=await boot(b,{vp:{width:640,height:360},init});await go(p,process.env.ZONE||'dist00');
await p.evaluate(async(MODE)=>{
 window.__log=[];window.__walkN=0;window.__pids=new WeakMap();window.__idn=0;window.__bodies=0;window.__atkImg=0;const A=window.__STORYWORLD_HERO2D_RULES_R1374__;
 const BODY=/assets\/.*\/(?:walk|run|idle|attack|skill|guard|dash)[^/]*\.webp/i,WALK=/\/(?:walk|run)[^/]*\.webp|\/walk\/|\/run_/i;
 const scan=(st,isAlly)=>{const rec=ctx;if(!Array.isArray(rec?.commands)||st<0)return;for(const c of rec.commands.slice(st)){if(c?.kind!=='image'||c.owner?.kind!=='hero')continue;const src=String(c.sourcePath||'');if(!BODY.test(src))continue;if((MODE==='A')!==isAlly)continue;window.__bodies++;if(c.r121Walk===true||(c.r121Walk!==false&&WALK.test(src))){/* 걷기 시트 그림이라도 칸이 그대로면 선 자세(환도 R283 대기 = 걷기 시트 한 칸 고정) → 칸이 바뀌는(보폭이 도는) 그림만 걷기로 센다 */const oid=String(c.owner?.id||'?')+'|'+src,fr=JSON.stringify(c.sourceRect||null),pv=(window.__wf=window.__wf||{})[oid];window.__wf[oid]={fr,t:time};if(!pv||pv.fr===fr||time-pv.t>.3)continue;/* 걷기 표시(r121Walk) 기준 — 환도 대기는 걷기 시트 한 칸(R283, r121Walk:false)이라 경로만으로 세지 않는다 */window.__walkN++;if(!window.__walkEx)window.__walkEx=src+' | '+Object.keys(c).filter(k=>!/^(image|points|style|clips|owner)$/.test(k)).map(k=>k+'='+(typeof c[k]==='object'?'{}':String(c[k]).slice(0,30))).join(',')+' | t='+time+' atk='+player.attackAnim+' sk='+player.skillAnim+' dash='+player.dashAnim+' hurt='+player.hurtAnim;}if(/attack/i.test(src)){window.__atkImg++;const k=src.replace(/^.*assets\//,'')+(c.points&&c.points[1][0]<c.points[0][0]?'#flip':'');(window.__atkP=window.__atkP||{})[k]=(window.__atkP[k]||0)+1;}}};
 if(A){let st=-1;A.qaProbe({pre(q){st=Array.isArray(ctx?.commands)?ctx.commands.length:-1;window.__log.push({t:time,hero:q.hero,ally:!!q.r720Ally,x:+q.x.toFixed(3),y:+q.y.toFixed(3),d:q.direction,m:!!q.moving,atk:q.attackAnim>0||q.skillAnim>0,id:__pids.get(q)||(__pids.set(q,'b'+(++__idn)),__pids.get(q))});if(window.__log.length>6000)window.__log.shift();},post(q){scan(st,!!q.r720Ally);}});}
 else{const dh=drawHero;drawHero=function(...a){const q=player,st=Array.isArray(ctx?.commands)?ctx.commands.length:-1;const r=dh.apply(this,a);try{window.__log.push({t:time,hero:q.hero,ally:!!q.r720Ally,x:+q.x.toFixed(3),y:+q.y.toFixed(3),d:q.direction,m:!!q.moving,atk:q.attackAnim>0,id:__pids.get(q)||(__pids.set(q,'b'+(++__idn)),__pids.get(q))});scan(st,!!q.r720Ally);}catch(_){}return r;};}
 player.hp=player.maxHp=99999;
 if(MODE==='A'){await ensureImages(heroPaths('seoha'));player.hero='seoha';for(const z of ['dreamRest','restEp1b','u201','restU2','kair01'])visited.add('STORY:'+z);
  const lv=window.__STORYWORLD_SKILL_UNLOCK_R1275__?.passiveLevels?.('story')||[5,15,30];player.level=lv[1]+30;
  for(const h of ['hunter','slayer','michaela','gunner','hwando'])try{await ensureImages(heroPaths(h));}catch(_){}}
 const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,5);for(const e of live){e.x=player.x+3.2;e.y=player.y+.4;e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.spawnState='active';}window.__ids=live.map(e=>e.id);
},MODE);
await p.waitForTimeout(2500);
const t0=await p.evaluate(([MODE,WANT])=>{window.__log.length=0;if(MODE==='A'){const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;for(let i=0;i<40;i++){api.qaReset();api.qaForce('heroes');hitEnemy(room.enemies.find(v=>v.id===window.__ids[0]),1,{kind:'basic',sourceHero:'seoha'});if(!WANT||api.has(WANT))break;}}
 // 주인(조종 영웅)을 게임 시간으로 왕복시켜 소환 몸이 따라 걷게 한다(벽이면 그 자리)
 const o={x:player.x,y:player.y};window.__walk={o,t0:time};const tk=tick;window.__tk=tk;tick=function(...a){const r=tk.apply(this,a);try{const w=window.__walk;if(w){const u=time-w.t0,k=Math.sin(u*1.3)*2.6,nx=w.o.x+k,ny=w.o.y-k*.5;const dx=nx-player.x,dy=ny-player.y;if(typeof moveActor==='function')moveActor(player,dx,dy,.27);player.moving=Math.hypot(dx,dy)>1e-3;}}catch(_){}return r;};return time;},[MODE,process.env.HERO||'']);
await p.waitForFunction(t0=>time-t0>5.5,t0,{timeout:600000,polling:500});
const out=await p.evaluate((MODE)=>{const A=window.__STORYWORLD_HERO2D_RULES_R1374__;const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;
 return {walk:window.__walkN,bodies:window.__bodies,atkImg:window.__atkImg,walkEx:window.__walkEx||null,atkP:window.__atkP||{},log:window.__log.slice(),snaps:A?A.snaps():[],insp:A?A.inspect():null,has:MODE==='A'?['hunter','slayer','michaela','gunner','hwando'].filter(h=>api.has(h)):[]};},MODE);
await p.screenshot({path:new URL(`./shot-${MODE}.png`,import.meta.url).pathname});
await b.close();
const rows=out.log.filter(r=>MODE==='A'?r.ally:!r.ally);
console.log(JSON.stringify({mode:MODE,samples:rows.length,walk:out.walk,bodies:out.bodies,atkImg:out.atkImg,walkEx:out.walkEx,atkP:out.atkP,has:out.has,insp:out.insp&&{stats:out.insp.stats,lastError:out.insp.lastError}}));
const byId={};for(const r of rows)(byId[r.id]=byId[r.id]||[]).push(r);
let changes=0,unexplained=[];for(const [id,L] of Object.entries(byId))for(let i=1;i<L.length;i++){const a=L[i-1],c=L[i];if(a.x!==c.x||a.y!==c.y){changes++;const s=out.snaps.find(s=>Math.abs(s.x-c.x)<.002&&Math.abs(s.y-c.y)<.002&&s.t<=c.t+1e-6&&s.t>=a.t-1e-6);if(!s)unexplained.push({a,c});}}
const dirs=[...new Set(rows.map(r=>r.d))],mov=rows.filter(r=>r.m).length;
if(MODE==='C'){F(out.insp&&out.insp.stats.passed>20,'3D 조종 영웅 그림은 규칙을 건너뜀(손대지 않음)',out.insp&&out.insp.stats);F(rows.length===0,'3D 조종 영웅에는 2D 규칙 관찰 기록 없음',rows.length);}
else{
 F(rows.length>=30,`${MODE==='A'?'소환 몸':'2D 조종 영웅'} 그림 표본 30개 이상`,rows.length);
 F(dirs.every(d=>d==='left'||d==='right'),'방향은 좌·우만',dirs);
 F(mov===0,'걷는 자세(moving) 0',mov);
 F(out.bodies>=20&&out.walk===0,'그려진 몸 그림에 걷기·달리기 시트 0장',{bodies:out.bodies,walk:out.walk,ex:out.walkEx});
 F(changes>=1,'자리가 실제로 바뀐 적 있음(블링크로 이동)',changes);
 F(unexplained.length===0,'그림 자리 바뀜은 모두 블링크 기록과 맞음',unexplained.slice(0,3));
 F(!Object.keys(out.atkP||{}).some(k=>/attack-(?:se|ne|sw|nw|n|s)\d*\.webp/.test(k)),'공격 그림은 좌·우 시트만(대각·위·아래 없음)',out.atkP);
 if(MODE==='A')F(rows.some(r=>r.atk)&&out.atkImg>0,'소환 몸이 공격 그림으로 공격함',out.atkImg);
}
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
