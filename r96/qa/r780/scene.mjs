// R780 헤드리스 실측: 실제 엔진에서 대상별 커서·클릭 표시·엔진 클릭 결과 일치, 커서 그림 시트와 장면 캡처.
// 헤드리스 캡처에는 OS 커서가 찍히지 않으므로, 캡처 순간에만 같은 커서 그림(data URL)을 마우스 자리에 <img> 로 얹어 찍는다(검토용).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r780/scene.mjs <outdir> [zone]
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.',ZONE=process.argv[3]||'last303';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const res={zone:ZONE};
// 커서 그림 그대로 저장
const icons=await p.evaluate(()=>{const A=window.__STORYWORLD_CURSOR_R780__;return Object.fromEntries(A.kinds.map(k=>[k,A.icon(k)]));});
for(const [k,u] of Object.entries(icons))fs.writeFileSync(`${OUT}/icon-${k}.png`,Buffer.from(u.split(',')[1],'base64'));
await go(p,ZONE);
const wait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:120000}).catch(()=>{});};
const top=await p.evaluate(()=>document.getElementById('game').getBoundingClientRect().top);
const fake=async(x,y,kind)=>p.evaluate(([x,y,k,top])=>{let i=document.getElementById('r780Fake');if(!i){i=document.createElement('img');i.id='r780Fake';i.style.cssText='position:fixed;z-index:99999;pointer-events:none;width:32px;height:32px';document.body.appendChild(i);}
 const A=window.__STORYWORLD_CURSOR_R780__,h=k==='aim'?16:2;i.src=A.icon(k);i.style.left=(x-h)+'px';i.style.top=(y+top-h)+'px';},[x,y,kind,top]);
const at=async(x,y,opt={})=>{await p.mouse.move(x,y+top);await wait(.12);const r=await p.evaluate(()=>({...window.__STORYWORLD_CURSOR_R780__.inspect(),cursor:document.getElementById('game').style.cursor.slice(-30)}));return r;};
// 장면 준비: 몹 셋을 영웅 앞에 세우고 멈춤
const setup=await p.evaluate(()=>{player.hp=player.maxHp=1e9;player.invincible=1e9;const L=liveEnemies().filter(e=>!e.boss).slice(0,3);
 // 영웅 둘레에서 걸을 수 있는 칸을 골라 몹을 세운다(벽 속이면 엔진 클릭이 '막힘'이 된다)
 const spots=[];for(let r=1.6;r<5&&spots.length<3;r+=.4)for(let a=0;a<6.28&&spots.length<3;a+=.5){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(!blocked(x,y,.4)&&!spots.some(s=>Math.hypot(s.x-x,s.y-y)<1.2))spots.push({x,y});}
 L.forEach((e,i)=>{const s=spots[i]||{x:player.x+2,y:player.y};e.x=e.homeX=s.x;e.y=e.homeY=s.y;e.speed=0;e.spawnState='active';e.explorationLeash=null;e.hp=e.maxHp=1e9;});
 window.__pin=L.map(e=>({e,x:e.x,y:e.y}));
 for(const e of room.enemies)if(!L.includes(e)&&!e.boss){e.hp=0;}
 const npc=(room.props||[]).filter(p=>p.visible!==false&&(p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson)).length,doors=(room.props||[]).filter(p=>p.r74Door).length;
 return {mobs:L.map(e=>e.id),spots,npc,doors,player:[player.x,player.y]};});
const pin=()=>p.evaluate(()=>{for(const q of window.__pin){q.e.x=q.x;q.e.y=q.y;q.e.hp=1e9;}});
res.setup=setup;await wait(.3);
const S=async n=>{await pin();const f=`${OUT}/${n}.png`;await p.screenshot({path:f,clip:{x:240,y:top+80,width:800,height:470}});return f;};
const shots=[];
// ① 적 위: 엔진 클릭 판정과 같은 몸 가운데
await pin();const eq=await p.evaluate(id=>{const e=room.enemies.find(e=>e.id===id),q=project(e.x,e.y);return {x:q.x,y:q.y-actorHeight()*.5};},setup.mobs[0]);
let r=await at(eq.x,eq.y);await pin();await p.mouse.move(eq.x+1,eq.y+top);await p.mouse.move(eq.x,eq.y+top);res.overEnemy={hover:r.hover,cursor:r.cursor};await fake(eq.x,eq.y,r.hover?.kind||'ui');shots.push(await S('1-hover-enemy'));
await p.evaluate(()=>{window.__STORYWORLD_CURSOR_R780__.freeze(true);window.addEventListener('pointerdown',()=>{window.__cmdAtClick=command;},{once:true});});await p.mouse.down();await p.mouse.up();await wait(.15);res.clickEnemy={engineCommand:await p.evaluate(()=>window.__cmdAtClick),lastClick:await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.inspect().lastClick),hovered:r.hover?.targetId,markers:(await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.markers().map(m=>m.kind)))};shots.push(await S('2-click-enemy'));await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.freeze(false));await wait(.2);
// ② 바닥: 이동 커서 → 클릭 → 금실 고리
const gq=await p.evaluate(()=>{let best=null;for(let r=2;r<6&&!best;r+=.5)for(let a=0;a<6.28&&!best;a+=.4){const x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(!blocked(x,y,.5)&&window.__pin.every(q=>Math.hypot(q.x-x,q.y-y)>2)){const q=project(x,y);if(window.__STORYWORLD_CURSOR_R780__.classify(q.x,q.y,0).kind==='move')best={x,y};}}const q=project(best.x,best.y);return {x:q.x,y:q.y,w:best};});
await p.evaluate(()=>{command=null;target=null;});r=await at(gq.x,gq.y);res.overGround={hover:r.hover};await fake(gq.x,gq.y,r.hover?.kind||'ui');
await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.freeze(true));await p.mouse.down();await p.mouse.up();await wait(.1);res.clickGround={lastClick:await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.inspect().lastClick),route:await p.evaluate(()=>route.length),markers:await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.markers().map(m=>m.kind))};shots.push(await S('3-click-ground'));await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.freeze(false));await wait(.2);
await p.evaluate(()=>{route=[];player.x=player.x;});
// ③ 오른쪽 단추 누른 채 → 조준
await p.mouse.move(gq.x+40,gq.y+top);await p.mouse.down({button:'right'});await wait(.12);r=await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.inspect());res.rightHeld={hover:r.hover};await fake(gq.x+40,gq.y,'aim');shots.push(await S('4-aim'));await p.mouse.up({button:'right'});
// ⑤ 사람·문·목표: 영웅을 그 곁으로 옮기고(카메라가 따라옴) 그 위에 커서
for(const [key,sel,lift] of [['npc','p=>p.visible!==false&&(p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson)',25],['door','p=>p.r74Door&&p.visible!==false',30],['objective','null',30]]){
 const ok=await p.evaluate(sel=>{const f=eval(sel),P=f?(room.props||[]).find(f):room.objective;if(!P)return false;for(const [dx,dy] of [[1.6,1.2],[-1.6,1.2],[1.6,-1.2],[-1.6,-1.2],[2.4,0],[0,2.4]]){if(!blocked(P.x+dx,P.y+dy,.3)){player.x=P.x+dx;player.y=P.y+dy;break;}}route=[];command=null;window.__P=P;return true;},sel);
 if(!ok){res['over_'+key]={skipped:'none in zone'};continue;}
 await wait(.5);const q=await p.evaluate(lift=>{const q=project(__P.x,__P.y);return {x:q.x,y:q.y-lift};},lift);
 r=await at(q.x,q.y);res['over_'+key]={hover:r.hover,cursorKind:r.cursor.slice(-12)};await fake(q.x,q.y,r.hover?.kind||'ui');shots.push(await S('5-'+key));}
// ⑥ 창 열림 → 맨 바늘
await p.evaluate(()=>showMenu());await wait(.05);await p.mouse.move(640,400);await p.waitForTimeout(400);res.modal=await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.inspect().hover);await p.evaluate(()=>closePanel(true));
res.inspect=await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__.inspect());res.pageErrors=errs;res.shots=shots;
fs.writeFileSync(`${OUT}/scene.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1));await b.close();
