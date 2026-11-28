// R1386 헤드리스 검사 — 2D 기억사수만 8방향 공격(사용자 2026-11-28 01:51Z "기억사수 2d만 q스킬 레이져있으니까 8방향공격모션적용해").
//  서하 '평행세계 소집'(R949)으로 2D 소환 몸을 부르고, 적 하나를 기억사수 몸 둘레 8방향(45°씩, 게임 0.9초마다)으로 옮겨 가며 쏘게 한다.
//  기대: 기억사수 공격 그림에 위·아래·대각 시트가 나옴(3가족 이상), 다른 2D 영웅은 좌·우 시트·좌우 방향만, 모든 몸 걷는 자세 0.
//  GUNNER8=off 면 예전 R1374(좌우만)로 돌려 실패를 확인하는 용도.
import {chromium,boot,go} from '../r444/lib.mjs';
let fail=0;const F=(c,m,x)=>{console.log(c?'ok  ':'FAIL',m,x===undefined?'':JSON.stringify(x).slice(0,500));if(!c)fail++;};
const b=await chromium.launch();
const init=process.env.GUNNER8==='off'?{'storyworld.r1374.hero2d':'{"gunner8":false}'}:null;
const {p}=await boot(b,{vp:{width:640,height:360},init});await go(p,process.env.ZONE||'dist00');
await p.evaluate(async()=>{
 window.__rows=[];window.__atk={};const A=window.__STORYWORLD_HERO2D_RULES_R1374__;
 const BODY=/assets\/.*\/(?:walk|run|idle|attack|skill|guard|dash|g-)[^/]*\.webp/i;
 let st=-1;A.qaProbe({pre(q){st=Array.isArray(ctx?.commands)?ctx.commands.length:-1;if(q.r720Ally&&q.hero==='gunner')window.__g={x:q.x,y:q.y};
   window.__rows.push({t:time,hero:q.hero,ally:!!q.r720Ally,d:q.direction,m:!!q.moving,atk:q.attackAnim>0||q.skillAnim>0});if(window.__rows.length>8000)window.__rows.shift();},
  post(q){if(!q.r720Ally||st<0)return;for(const c of ctx.commands.slice(st)){if(c?.kind!=='image'||c.owner?.kind!=='hero')continue;const src=String(c.sourcePath||'');if(!BODY.test(src)||!/attack/i.test(src))continue;
   const k=q.hero+'|'+src.replace(/^.*assets\//,'')+(c.points&&c.points[1][0]<c.points[0][0]?'#flip':'');window.__atk[k]=(window.__atk[k]||0)+1;}}});
 player.hp=player.maxHp=99999;await ensureImages(heroPaths('seoha'));player.hero='seoha';for(const z of ['dreamRest','restEp1b','u201','restU2','kair01'])visited.add('STORY:'+z);
 const lv=window.__STORYWORLD_SKILL_UNLOCK_R1275__?.passiveLevels?.('story')||[5,15,30];player.level=lv[1]+30;
 for(const h of ['hunter','slayer','michaela','gunner','hwando'])try{await ensureImages(heroPaths(h));}catch(_){}
 const live=room.enemies.filter(e=>!e.boss&&!e.midboss).slice(0,1);for(const e of live){e.x=player.x+3;e.y=player.y;e.hp=e.maxHp=9e6;e.damage=0;e.speed=0;e.spawnState='active';}
 for(const e of room.enemies)if(!live.includes(e)){e.x=player.x+60;e.y=player.y+60;e.speed=0;e.damage=0;}window.__foe=live[0];
});
await p.waitForTimeout(1500);
const t0=await p.evaluate((WANT)=>{const api=window.__STORYWORLD_SEOHA_EPOCH_R949__;for(let i=0;i<60;i++){api.qaReset();api.qaForce('heroes');hitEnemy(window.__foe,1,{kind:'basic',sourceHero:'seoha'});if(api.has(WANT))break;}
 window.__rows.length=0;window.__atk={};const t0=time,tk=tick;tick=function(...a){const r=tk.apply(this,a);try{const g=window.__g||player,k=Math.floor((time-t0)/.9)%8,an=k*Math.PI/4,
  /* 화면 각 an(0=오른쪽, 시계방향) → 땅 좌표: 화면 x ∝ x−y, 화면 y ∝ (x+y)/2 */sx=Math.cos(an)*3,sy=Math.sin(an)*3,e=window.__foe;e.x=g.x+(sx/2+sy);e.y=g.y+(sy-sx/2);e.hp=e.maxHp;}catch(_){}return r;};
 return {t0,has:['hunter','slayer','michaela','gunner','hwando'].filter(h=>api.has(h))};},'gunner');
console.log('summoned',JSON.stringify(t0.has));
await p.waitForFunction(t0=>time-t0>7.4,t0.t0,{timeout:900000,polling:500});
const out=await p.evaluate(()=>({rows:window.__rows.slice(),atk:window.__atk,insp:window.__STORYWORLD_HERO2D_RULES_R1374__.inspect()}));
await p.screenshot({path:new URL('./shot-r1386.png',import.meta.url).pathname});await b.close();
console.log(JSON.stringify({atk:out.atk,stats:out.insp.stats,prefs:out.insp.prefs,lastError:out.insp.lastError}));
const ally=out.rows.filter(r=>r.ally),gun=ally.filter(r=>r.hero==='gunner'),oth=ally.filter(r=>r.hero!=='gunner');
const fam=k=>{const m=/attack-(se|ne|n|s|e)\d*\.webp(#flip)?/.exec(k);if(!m)return null;const f=m[1],fl=!!m[2];return fl?{e:'w',se:'sw',ne:'nw',n:'n',s:'s'}[f]:f;};
const gk=Object.keys(out.atk).filter(k=>k.startsWith('gunner|')),gf=[...new Set(gk.map(k=>fam(k.split('|')[1])).filter(Boolean))];
F(t0.has.includes('gunner'),'기억사수 2D 소환 몸이 불려 옴',t0.has);
F(gun.filter(r=>r.atk).length>=10,'기억사수 소환 몸이 쏘는 그림 표본 10개 이상',gun.filter(r=>r.atk).length);
F(gf.length>=4,'기억사수 공격 그림이 4방향 가족 이상(8방향 공격)',{fam:gf,keys:gk});
F(gf.some(f=>f==='n'||f==='s'||f==='ne'||f==='se'||f==='nw'||f==='sw'),'위·아래·대각 공격 칸이 실제로 그려짐',gf);
F(ally.every(r=>!r.m),'모든 2D 소환 몸 걷는 자세 0',ally.filter(r=>r.m).length);
const ok2=oth.filter(r=>r.d!=='left'&&r.d!=='right');F(oth.length===0||ok2.length===0,'다른 2D 영웅 방향은 좌·우만',[...new Set(ok2.map(r=>r.hero+':'+r.d))]);
const ok3=Object.keys(out.atk).filter(k=>!k.startsWith('gunner|')&&/attack-(?:se|ne|sw|nw|n|s)\d*\.webp/.test(k));F(ok3.length===0,'다른 2D 영웅 공격 그림은 좌·우 시트만',ok3);
F(!out.insp.lastError,'R1374 오류 없음',out.insp.lastError);
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
