// R1337 헤드리스 조사: 보스 하나를 대기·걷기·공격·피격·사망 상태로 몰고, 실제로 그려진 몸 그림(가장 큰 적 이미지 명령)을 칸 단위로 모은다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1337/census.mjs <out폴더> zone:nativeId[:label] ...
// 결과: <out>/<label>/census.json (상태별 칸 키·화면 높이·발 위치·횟수) + <label>/<state>-NN.png (그려진 칸 원본 잘라 저장, R409 외곽선 포함)
import {chromium,boot,go,skip} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2];const JOBS=process.argv.slice(3).map(s=>s.split(':'));
const INIT=process.env.INIT?JSON.parse(process.env.INIT):null;
const b=await chromium.launch();
async function waitGame(p,sec){const t0=await p.evaluate(()=>time);for(let i=0;i<400;i++){await skip(p);if(await p.evaluate(([t,s])=>time>t+s,[t0,sec]))return;await p.waitForTimeout(120);}}
for(const [z,id,label0] of JOBS){const label=label0||id;fs.mkdirSync(OUT+'/'+label,{recursive:true});
 const {ctx,p}=await boot(b,{init:INIT,vp:{width:960,height:540}});
 await go(p,z);await skip(p);
 const ok=await p.evaluate(id=>{const B=room.enemies.find(e=>String(e.nativeId)===id);if(!B)return room.enemies.map(e=>e.nativeId+'/'+e.name).join(',');
  for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';B.hidden=false;B.hp=B.maxHp=1e8;player.hp=player.maxHp=1e9;player.invincible=1e9;
  window.__B=B;window.__S='idle';window.__R={};window.__home={x:B.x,y:B.y};
  const ctl=()=>{const B=window.__B,S=window.__S;if(B&&B.hp>0){
    if(S==='idle'){B.attack=null;B.speed=0;B.attackCooldown=99;B.cooldown=99;B.x=window.__home.x;B.y=window.__home.y;player.x=B.x+1.2;player.y=B.y+.4;}
    else if(S==='walk'){B.attack=null;B.attackCooldown=99;B.cooldown=99;B.speed=0;const a=time*.5,h=window.__home;B.x=h.x+Math.cos(a)*2.5;B.y=h.y+Math.sin(a)*2.5;B.moving=true;player.x=h.x+4.5;player.y=h.y+4.5;}
    else if(S==='attack'){B.speed=0;B.x=window.__home.x;B.y=window.__home.y;player.x=B.x+1.2;player.y=B.y+.4;if(B.attackCooldown>1)B.attackCooldown=0;if(B.cooldown>1)B.cooldown=0;}
    else if(S==='hit'){B.attack=null;B.speed=0;B.attackCooldown=99;B.cooldown=99;B.x=window.__home.x;B.y=window.__home.y;player.x=B.x+1.2;player.y=B.y+.4;if(!(B.hitTimer>0)&&Math.random()<.5)try{hitEnemy(B,1,{kind:'qa'});}catch(_){B.hitTimer=.14;B.flash=.14;}}
   }requestAnimationFrame(ctl);};B.__sp=B.speed;requestAnimationFrame(ctl);
  // 렌더러로 넘어가는 마지막 명령에서 잰다(R1229 발록 맞춤처럼 렌더 단계에서 몸을 다시 놓는 오버레이까지 반영)
  const grab=cm=>{const B=window.__B;if(!B||!Array.isArray(cm))return;const own='enemy:'+B.id;let best=null,bh=0;for(const k of cm){if(k?.kind!=='image'||!Array.isArray(k.points)||k.owner?.id!==own)continue;const s=String(k.sourcePath||'');if(/shadow|aura|ring|fx|effect|sword/i.test(s))continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
    if(best){const S=window.__S;const R=window.__R[S]||(window.__R[S]={});const sp=String(best.sourcePath||best.image?.src||'').replace(/^.*?assets\//,'assets/');const sr=Array.isArray(best.sourceRect)?best.sourceRect.map(Math.round):null;
     const key=sp+'|'+(sr?sr.join(','):'whole')+'|'+(best.image?.width||0)+'x'+(best.image?.height||0);let o=R[key];
     if(!o){o=R[key]={n:0,first:time,pts:best.points.map(q=>q.map(v=>Math.round(v*10)/10)),flip:best.points[1][0]<best.points[0][0],alpha:best.alpha??1,filter:best.filter||''};
      try{const im=best.image,[sx,sy,sw,sh]=sr||[0,0,im.width,im.height];const c=document.createElement('canvas');c.width=Math.max(1,Math.round(sw));c.height=Math.max(1,Math.round(sh));c.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,c.width,c.height);o.png=c.toDataURL('image/png');}catch(err){o.err=String(err).slice(0,80);}}
     o.n++;o.last=time;try{const L=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(B);const mir=best.points[1][0]<best.points[0][0];const kk=(L?'L':'R')+(mir?'m':'n');o.face=o.face||{};o.face[kk]=(o.face[kk]||0)+1;}catch(_){}}};
  const hook=()=>{try{const h=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(h?.commands?.render&&!h.commands.render.__r1337c){const base=h.commands.render;const w=function(cmds){const r=base.apply(this,arguments);try{grab(cmds);}catch(_){}return r;};w.__r1337c=true;h.commands.render=w;}}catch(_){}requestAnimationFrame(hook);};hook();
  return true;},id);
 if(ok!==true){console.log('NOTFOUND',z,id,ok);await ctx.close();continue;}
 for(const S of ['idle','walk','attack','hit']){await p.evaluate(S=>{window.__S=S;},S);await waitGame(p,S==='attack'?6:3);}
 await p.evaluate(()=>{window.__S='death';const B=window.__B;B.maxHp=100;try{hitEnemy(B,1e9,{kind:'qa'});}catch(_){B.hp=0;}if(B.hp>0)B.hp=0;});await waitGame(p,2.5);
 const R=await p.evaluate(()=>window.__R);const meta={zone:z,id,states:{},r1337:await p.evaluate(()=>window.__STORYWORLD_BOSS2D_R1337__?.inspect?.()||null)};
 for(const [S,ks] of Object.entries(R)){meta.states[S]=[];let i=0;for(const [k,o] of Object.entries(ks)){const f=`${S}-${String(i++).padStart(2,'0')}.png`;if(o.png)fs.writeFileSync(OUT+'/'+label+'/'+f,Buffer.from(o.png.split(',')[1],'base64'));delete o.png;meta.states[S].push({key:k,file:f,...o});}}
 fs.writeFileSync(OUT+'/'+label+'/census.json',JSON.stringify(meta,null,1));console.log(label,Object.fromEntries(Object.entries(meta.states).map(([k,v])=>[k,v.length])));
 await ctx.close();}
await b.close();
