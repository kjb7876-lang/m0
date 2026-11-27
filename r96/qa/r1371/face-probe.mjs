// R1371 2D 몹·보스 공격 방향 전수 탐침(헤드리스 브라우저, CI 아님).
// 지역마다 nativeId(보스·중간보스 포함) 한 마리씩 떼어, 영웅을 화면 왼쪽/오른쪽에 두고 대기·원거리 준비·공격 진행 4단계를 강제로 만든 뒤
// 실제로 그려진 몸 명령(경로·칸·네 점·좌우 거울)과 R444 가 원한 쪽을 남긴다. 판정은 face-judge.py 가 사람이 맞춘 원본 방향 표(face-truth)로 한다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node face-probe.mjs out.json [지역,…|-] [이름 정규식]
import fs from 'node:fs';import {chromium,boot,go} from '../r1226/census/lib.mjs';
const out=process.argv[2]||'probe.json';const only=process.argv[3]&&process.argv[3]!=='-'?process.argv[3].split(','):null;const FIL=process.argv[4]?new RegExp(process.argv[4]):null;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:512,height:288},init:process.env.R1371_OFF?{'storyworld.r1371.face':JSON.stringify({on:false})}:null});
const zones=only||await p.evaluate(()=>Object.keys(regionById).filter(id=>!/mammon/i.test(id)));
console.log('zones',zones.length);
await p.evaluate(()=>{const W=window.__fp={B:null,S:null,frames:0,last:null};
 const FX=/r251\/atlas|pixelfx|\/fx\/|effect|vfx|ring|circle|sigil|shadow|smoke|ash|dust|aura|glow/i;
 const tb=tick;tick=function(dt,...a){const r=tb.call(this,dt,...a);try{put();}catch(e){W.err=String(e).slice(0,200);}return r;};
 function put(){const B=W.B,S=W.S;if(!B||!S)return;B.x=W.ax;B.y=W.ay;B.spawnState='active';B.graceUntil=0;B.hitTimer=0;B.flash=0;B.moving=false;B.vx=B.vy=0;
  const d=S.side==='R'?1:-1;player.x=B.x+d*1.1;player.y=B.y-d*1.1;try{if(typeof cam==='object'&&cam){cam.x=player.x;cam.y=player.y;}}catch(_){}
  if(S.kind==='atk'){const sh={...(B.combatProfile?.attackShape||{windup:.45,active:.15,recovery:.35})};const tot=Math.max(.2,(sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));
   const ang=Math.atan2(player.y-.15-B.y,player.x-B.x);if(!B.attack||B.attack.__fp!==S.id){B.attack={elapsed:0,angle:ang,committed:true,id:'fp'+S.id,__fp:S.id,origin154:Object.freeze({x:B.x,y:B.y}),shape154:Object.freeze(sh)};}
   B.attack.elapsed=S.frac*tot;B.attack.angle=ang;B.rangedWindup=0;}
  else if(S.kind==='wind'){B.attack=null;B.rangedWindup=.4;B.rangedAim=Math.atan2(player.y-.15-B.y,player.x-B.x);}
  else{B.attack=null;B.rangedWindup=0;}}
 W.put=put;
 const tapRec=c=>{if(!c||c.__fpw||typeof c.finish!=='function')return;c.__fpw=1;const f=c.finish;c.finish=function(...a){const r=f.apply(this,a);try{if(W.B&&W.S&&Array.isArray(r)){const A=window.__STORYWORLD_ENEMY_FACE_FINAL_R1371__?.art;for(const k of r)if(k&&k.kind==='image'&&k.owner?.kind==='enemy'&&A)try{k.__fpArt=A(k);k.__fpSrc=String(k.sourcePath||k.image?.src||'');}catch(_){}W.raw=(W.raw||[]).concat(r);}}catch(_){}return r;};};
 const de=drawEnemy;const wrapDE=()=>{const d0=drawEnemy;if(d0.__fp)return;const f=function(...a){tapRec(ctx);return d0.apply(this,a);};f.__fp=1;drawEnemy=f;};wrapDE();setInterval(wrapDE,500);
 const raf=window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame=cb=>raf(t=>{W.raw=null;const r=cb(t);try{const B=W.B;if(B&&W.S&&W.raw){let best=null;
   for(const k of W.raw){if(!k||k.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const own=k.owner;if(!(own&&own.kind==='enemy'&&(own.id===B.id||new RegExp('(^|:)'+String(B.id).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|:)').test(String(own.id)))))continue;
    /* 기록이 끝난 순간(오버레이가 보는 때)의 경로 — R409 는 그 뒤 render 에서 몸을 테두리 칸으로 바꾼다 */const src=String(k.__fpSrc||k.sourcePath||k.image?.src||'').replace(/^r409:outline:[a-z]+:[a-z]+:/,'');if(FX.test(src))continue;const P=k.points;const area=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1]));if(!best||area>best.area)best={area,k};}
   let rec=null;if(best){const k=best.k,P=k.points;const art=k.__fpArt||window.__STORYWORLD_ENEMY_FACE_FINAL_R1371__?.art?.(k)||window.__STORYWORLD_MOB_MOTION_R1226__?.art?.(k)||null;
    rec={src:String(k.__fpSrc||k.sourcePath||k.image?.src||'').replace(/^[a-z]+:\/\/[^/]+/i,''),sr:k.sourceRect?Array.from(k.sourceRect).map(v=>Math.round(v)):null,mir:(P[1][0]-P[0][0])<0,w:Math.round(Math.abs(P[1][0]-P[0][0])),art};}
   let want=null;try{want=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(B);}catch(_){}
   W.frames++;W.last={rec,want:typeof want==='boolean'?(want?'L':'R'):null,three:!!(B.r1322Mesh||B.mesh3d||B.__3d),atk:!!B.attack,wind:B.rangedWindup>0};}}catch(e){W.err=String(e).slice(0,200);}return r;});});
const frames=async(n)=>{const f0=await p.evaluate(()=>window.__fp.frames);const t0=Date.now();while(Date.now()-t0<20000){const f=await p.evaluate(()=>{try{for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal)closePanel(true);}catch(_){}return window.__fp.frames;});if(f>=f0+n)return true;await p.waitForTimeout(60);}return false;};
const STATES=[];for(const side of ['R','L']){STATES.push({kind:'idle',side});STATES.push({kind:'wind',side});for(const frac of [.15,.4,.6,.85])STATES.push({kind:'atk',side,frac});}
const res=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):{};const t00=Date.now();
for(const z of zones){if(res[z]&&!res[z].err)continue;try{await go(p,z);}catch(e){res[z]={err:'enter '+String(e).slice(0,80)};continue;}
 const reps=await p.evaluate(()=>{const seen=new Set(),L=[];for(const e of room.enemies){if(!(e.hp>0)||e.persona||e.r170Tower||e.r446Pillar||e.r251Circle)continue;
   const k=(e.nativeId||e.id)+'|'+(e.boss?'B':e.midboss?'M':'')+'|'+String(e.name).replace(/ \d+$/,'').replace(/^중간보스 · /,'').replace(/ (증원|추격대|후속 증원|우두머리)$/,'');if(seen.has(k))continue;seen.add(k);L.push({id:e.id,k,name:e.name,boss:!!e.boss,mid:!!e.midboss,nid:e.nativeId});}return L;});
 res[z]={mobs:[]};
 for(const m of reps){if(FIL&&!FIL.test(m.k))continue;const rows=[];try{
  await p.evaluate(id=>{const W=window.__fp;const B=room.enemies.find(e=>e.id===id);W.B=B;W.ax=B.x;W.ay=B.y;
   for(const e of room.enemies)if(e!==B){e.__ss=e.__ss??e.spawnState;e.spawnState='hidden';e.attack=null;e.rangedWindup=0;}
   room.engaged=true;player.maxHp=player.hp=1e9;player.invincible=1e9;auto=false;guide=false;},m.id);
  for(let i=0;i<STATES.length;i++){const S={...STATES[i],id:i+1};await p.evaluate(S=>{window.__fp.S=S;window.__fp.put();},S);await frames(S.kind==='idle'?6:3);
   const r=await p.evaluate(()=>({...window.__fp.last,err:window.__fp.err||null}));rows.push({...S,...r});}
 }catch(e){m.err=String(e).slice(0,160);}
 await p.evaluate(()=>{const W=window.__fp;W.S=null;W.B=null;});res[z].mobs.push({...m,rows});}
 await p.evaluate(()=>{for(const e of room.enemies)if(e.__ss!=null){e.spawnState=e.__ss;delete e.__ss;}});
 fs.writeFileSync(out,JSON.stringify(res));console.log(z,res[z].mobs.length,Math.round((Date.now()-t00)/1000)+'s');}
await b.close();
