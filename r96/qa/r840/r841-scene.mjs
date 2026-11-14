// R841 장면 사진(헤드리스 소프트웨어 렌더링 — 그래픽 검증 아님): 경성의 밤 두 구역과 병원 세 맵의 NPC·곁 인물·조형물을 몹 없이 찍는다. 사용: node r96/qa/r840/r841-scene.mjs <outdir>
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {ctx,p}=await boot(b);
/* 게임 시간으로 기다린다. 기다리는 동안 지역 서사 창이 뜨면 넘긴다(불면귀 마을은 들어선 뒤 한 번 더 뜬다) */
const waitT=async dt=>{const t0=await p.evaluate(()=>time);for(let i=0;i<1500;i++){if(await p.evaluate(([t,d])=>time>t+d,[t0,dt]))return;await skip(p);await p.waitForTimeout(200);}throw new Error('waitT timeout');};
const clear=()=>p.evaluate(()=>{player.hp=player.maxHp=1e9;guide=false;for(const e of room.enemies){if(e.r170Tower)continue;e.x=-900;e.y=-900;e.speed=0;}});
const shot=name=>p.screenshot({path:`${OUT}/${name}.png`,clip:{x:340,y:110,width:600,height:400}});
// 길 위에서 대상에 가장 가까운 걸을 수 있는 점에 선다(벽 속에 서지 않게)
const stand=(sel,near)=>p.evaluate(([sel,near])=>{const q=room.props.find(q=>q[sel]);if(!q)return null;let best=null;for(const [dx,dy] of near?[[1.1,1.1],[1.2,-1.1],[-1.1,1.2],[-1.1,-1.1],[1.4,0],[0,1.4]]:[[2.0,2.4],[2.4,2.0],[2.6,-.4],[-.4,2.6],[1.6,1.8],[1.8,-1.6],[-1.6,1.8],[-1.8,-1.6],[2.2,0],[0,2.2],[-2.2,0],[0,-2.2],[1.1,1.1]]){const x=q.x+dx,y=q.y+dy;if(!blocked(x,y,.3,room)){best={x,y};break;}}if(!best)best={x:q.x,y:q.y};player.x=best.x;player.y=best.y;return {id:q.id,d:Math.hypot(best.x-q.x,best.y-q.y)};},[sel,near]);
const one=async z=>{await clear();await waitT(.4);
 let r=await stand('r840NPC');await clear();await waitT(2);await shot(z+'-1-npc');console.log(z,'npc',JSON.stringify(r));
 r=await stand('r840Amb');if(r){await clear();await waitT(2);await shot(z+'-2-amb');console.log(z,'amb',JSON.stringify(r));}
 await stand('r840NPC',true);await waitT(.3);await p.evaluate(()=>interact());await p.waitForTimeout(900);await p.screenshot({path:`${OUT}/${z}-3-panel.png`});
 if(await p.locator('#questTakeR840').count()){await p.locator('#questTakeR840').click();await waitT(.3);}
 r=await stand('r840Prop');if(r){await clear();await waitT(2);await shot(z+'-4-prop');console.log(z,'prop',JSON.stringify(r));}};
const ONLY=process.env.R841_SCENE||'';/* R841_SCENE=dys 면 R842 디스토피아 다섯 구역만 */
if(ONLY==='vil'){/* R843: 불면귀 마을 어부·약방 아낙(Dots CX-0076QN) */for(const z of ['last302','last303']){await go(p,z);/* 들어선 뒤 1초쯤 지역 서사 창이 한 번 뜬다 */await p.waitForTimeout(5000);await skip(p);await one(z);}await b.close();process.exit(0);}
if(ONLY==='dys'){await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSamong(6,'survival',{force:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});
 for(const k of ['2','3','15','18','22']){const z='sz115-S06-'+k;await p.evaluate(z=>window.__STORYWORLD_SAMONG_R103__.go(6,'explore',{zone:z}),z);await p.waitForFunction(z=>!loading&&room.samongR103?.zone===z,z,{timeout:150000});await one('S06-'+k);}
 await b.close();process.exit(0);}
for(const z of ['ep1a08','ep1a09','ep1a10']){await go(p,z);await one(z);}
await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSamong(5,'survival',{force:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await one('S05-1');
await p.evaluate(()=>window.__STORYWORLD_SAMONG_R103__.go(5,'explore',{zone:'sz115-S05-3'}));await p.waitForFunction(()=>!loading&&room.samongR103?.zone==='sz115-S05-3',null,{timeout:150000});await one('S05-3');
await b.close();
