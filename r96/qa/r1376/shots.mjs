// R1376 전후 장면(헤드리스 소프트웨어 렌더, 그래픽 검증 아님): 체력 90/65/40/20% 에서 교주 주변을 잘라 한 줄로. node shots.mjs <off|on> <outdir>
import {chromium,boot,go} from '../r444/lib.mjs';
const MODE=process.argv[2]||'on',OUT=process.argv[3]||'.';const fs=await import('node:fs');fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r790.npc':'{"on":false}',...(MODE==='off'?{'storyworld.r1376.cultConsist':'0'}:{})}});
await go(p,'cult04');
await p.evaluate(()=>{for(let k=0;k<200&&storyScene;k++)advanceScene();if(modal)closePanel(true);room.enemies=room.enemies.filter(e=>!Number.isInteger(e.fieldWaveIndex6)&&e.boss&&!e.midboss);room.minionKills=3;room.encounterStage='bossReady';room.engaged=false;player.invincible=1e9;player.hp=9e8;auto=false;guide=false;player.x=room.objective.x+.6;player.y=room.objective.y+.6;interact();for(let i=0;i<40;i++){for(let j=0;j<40&&storyScene;j++)advanceScene();tick(.05);}});
let k=0;for(const r of [.9,.65,.4,.2])for(const ph of ['idle','atk']){
 const q=await p.evaluate(([r,ph])=>{const e=room.enemies.find(e=>e.nativeId==='c104-boss'&&e.hp>0);if(!e)return null;e.hp=e.maxHp*r;player.x=e.x+2.2;player.y=e.y+.4;
  for(let i=0;i<6;i++){for(let j=0;j<40&&storyScene;j++)advanceScene();if(modal&&!storyScene)try{closePanel(true)}catch(_){}e.hp=e.maxHp*r;if(ph==='idle'){e.attack=null;e.rangedWindup=0;e.r61Action=null;}tick(.05);}
  if(ph==='atk'){for(let i=0;i<120&&!e.attack;i++){e.hp=e.maxHp*r;e.cd=0;tick(.05);}for(let i=0;i<4;i++)tick(.05);}
  try{draw();}catch(_){}const s=project(e.x,e.y);return {x:s.x,y:s.y,atk:!!e.attack};},[r,ph]);
 if(!q)continue;await p.screenshot({path:`${OUT}/${MODE}-${String(k++).padStart(2,'0')}-${Math.round(r*100)}-${ph}${q.atk?'':'-noatk'}.png`,clip:{x:Math.max(0,Math.min(960-260,q.x-130)),y:Math.max(0,Math.min(540-260,q.y-200)),width:260,height:260}});}
await b.close();
