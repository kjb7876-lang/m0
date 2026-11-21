// R1284 헤드리스 장면: 보스 운석 v2 — 예고 고리만 / 낙하 / 착탄 / 잔불, 보스 고유색 2곳(발록 dist06, 보라검천사 dist01)
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1284/meteor-v2-browser.mjs /tmp/r1284
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.argv[2]||'/tmp/r1284';const res=[];
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
async function scene(z,pick,name){await go(p,z);
 const info=await p.evaluate(pick=>{const B=room.enemies.find(e=>(e.boss||e.midboss)&&new RegExp(pick).test((e.id||'')+' '+(e.name||'')))||room.enemies.find(e=>e.boss||e.midboss);
  for(const e of room.enemies)if(e!==B)e.hp=0;player.x=B.x+3.5;player.y=B.y+1.5;room.engaged=true;B.spawnState='active';B.visible=true;B.disabled=false;B.hp=B.maxHp=1e8;
  window.__hold=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);}catch(_){}},200);
  window.__B=B;return {boss:B.name,id:B.id};},pick);
 await p.waitForTimeout(6000);/* 카메라가 영웅 자리로 따라올 때까지(헤드리스는 게임 시간이 느림) */
 Object.assign(info,await p.evaluate(()=>{const B=window.__B;
  const r=window.__STORYWORLD_BOSS_METEOR_R241__.cast(B);const hz=hazards.filter(h=>h.r241Meteor);
  return {boss:B.name,id:B.id,cast:r,n:hz.length,dmg:hz[0]?.damage,radius:hz[0]?.radius,pal:hz[0]?.r241Meteor?.pal?.main?.b,tint:window.__STORYWORLD_MOTION_FX_R1229__.meteorTint(hz[0]?.r241Meteor?.pal?.main?.b)};}));
 for(const [tag,rel] of [['ring',null],['fall',-.22],['impact',.08],['ember',.32]]){
  /* 나이 고정: 매 틱 뒤 같은 나이로 되돌린다(헤드리스 시간 흐름과 상관없이 같은 단계) */
  const d=await p.evaluate(rel=>{clearInterval(window.__pin);const set=()=>{for(const h of hazards)if(h.r241Meteor){h.age=rel===null?h.warning*.35:h.warning+rel;h.r1284Hold=true;}};set();window.__pin=setInterval(set,5);
   const v0=window.__STORYWORLD_MOTION_FX_R1229__.inspect().stats.meteorV2||0;return {v0,sent:effects.some(e=>e.type==='r241-fx'),n:hazards.filter(h=>h.r241Meteor).length};},rel);
  await p.waitForTimeout(1200);await p.screenshot({path:`${out}-${name}-${tag}.png`});
  d.v1=await p.evaluate(()=>window.__STORYWORLD_MOTION_FX_R1229__.inspect().stats.meteorV2||0);(info.phases=info.phases||{})[tag]=d;}
 await p.evaluate(()=>clearInterval(window.__pin));
 info.stats=await p.evaluate(()=>window.__STORYWORLD_MOTION_FX_R1229__.inspect());await p.evaluate(()=>clearInterval(__hold));res.push(info);}
await scene('dist06','발록|boss','balrog');
await scene('dist01','보라|mb-dist01','purple');
console.log(JSON.stringify(res,null,1));await b.close();
