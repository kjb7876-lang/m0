// R1229 도형 투사체 지역별 검사(헤드리스): 사용자가 짚은 지역(솔로몬의 봉인식 유리 망령·환자와 중독된 도시 부정의 잔영·주사실 갈망의 약병핵)과
// 엔진 R74 원소 꼬리선이 나오던 카이로 지역 하나에서, 몹·보스를 영웅 둘레로 모아 싸우게 한 뒤 렌더러에 넘어간 명령을 센다.
//  - 적 탄이 실제로 날았는지(전제)
//  - r74-projectile 꼬리선(stroke) 0, 엔진 story-vfx 적 도형 0, R170 육망성 코드 도형 0(있었다면 시트 칸으로 바뀜)
import {chromium,boot,go} from '../r444/lib.mjs';
const ZONES=(process.argv[2]||'ep1b01,ep1a10,ep1a09,kair01').split(','),SECS=+(process.argv[3]||8);
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(String(e.message).slice(0,200)));
await p.evaluate(()=>{player.hero='hunter';});
for(const z of ZONES){await go(p,z);
 const r=await p.evaluate(async secs=>{const keep=room.enemies.filter(e=>e.hp>0);
  keep.forEach((e,i)=>{const a=i/keep.length*Math.PI*2,d=2.5+(i%3)*1.2;if(!e.stationary&&!e.r1229Fixed&&!e.r75Tower&&!e.r251Circle){e.x=player.x+Math.cos(a)*d;e.y=player.y+Math.sin(a)*d;}e.spawnState='active';e.visible=true;e.disabled=false;e.hp=e.maxHp=1e8;});
  room.engaged=true;const R170=window.__STORYWORLD_COMBAT_R170__;const castAll=()=>{try{for(const t of room.enemies.filter(e=>e.r170Tower&&e.hp>0))R170?.cast?.(t);}catch(_){}};castAll();const iv2=setInterval(castAll,1500);const iv=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},250);
  const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const o={shots:0,r74:0,vfx:0,hex:0,hexSheet:0,hexLive:0,frames:0};
  three.render=function(f){const rr=base.apply(this,arguments);try{o.frames++;o.shots+=(projectiles||[]).filter(q=>!q.friendly).length;o.hexLive+=(hazards||[]).filter(h=>h.r170).length;
   for(const c of f.commands||[]){const id=String(c.owner?.id||'');const shape=c.kind==='fill'||c.kind==='stroke';
    if(shape&&/^r74-projectile:/.test(id))o.r74++;
    if(shape&&c.owner?.storyVfx&&(c.owner.ownerType==='hazard'||/hazard-trail/.test(id)))o.vfx++;
    if(shape&&/^r170:hex:/.test(id))o.hex++;
    if(c.kind==='image'&&/r1213\/bomb-warning8/.test(String(c.sourcePath||''))&&/^r170:hex:/.test(id))o.hexSheet++;}}catch(e){}return rr;};
  const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>secs)return r();setTimeout(g,150);};g();});three.render=base;clearInterval(iv);clearInterval(iv2);for(const e of room.enemies)e.hp=0;return o;},SECS);
 ok(`${z}: 적 탄이 날았다(전제)`,r.shots>0||r.hexLive>0,r);
 ok(`${z}: R74 원소 꼬리선(도형) 0`,r.r74===0,r);
 ok(`${z}: 엔진 보조 도형(위험지대·궤적) 0`,r.vfx===0,r);
 ok(`${z}: R170 육망성 코드 도형 0`+(r.hexLive?' · 시트 칸으로 그림':''),r.hex===0&&(!r.hexLive||r.hexSheet>0),r);}
ok('페이지 오류 없음',errs.length===0,errs);
console.log(bad?`FAILED ${bad}/${n}`:`ALL PASS ${n}`);await b.close();process.exit(bad?1:0);
