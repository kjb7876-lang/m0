// R1226 몹 모션 전수: 지역마다 nativeId 한 마리씩 떼어 대기·걷기·공격(영웅 오른쪽/왼쪽)·피격·사망 동안 실제 그려진 몸 명령을 남긴다.
import fs from 'node:fs';import {chromium,boot,go,skip} from './lib.mjs';
const out=process.argv[2]||'census.json';const only=process.argv[3]&&process.argv[3]!=='-'?process.argv[3].split(','):null;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:512,height:288}});
const zones=only||await p.evaluate(()=>Object.keys(regionById).filter(id=>!/mammon/i.test(id)&&id!=='ep1b06'));
console.log('zones',zones.length);
await p.evaluate(()=>{const W=window.__cz={B:null,ph:null,rows:[]};
 if(!window.__czTick){window.__czTick=1;const tb=tick;tick=function(dt,...a){let r=tb.call(this,dt,...a);if(window.__cz.B&&Number.isFinite(dt)&&dt>0&&dt<.1){for(let i=0;i<2;i++){r=tb.call(this,dt,...a);}}return r;};}
 const FX=/r251\/atlas|pixelfx|\/fx\/|effect|vfx|ring|circle|sigil|shadow|smoke|ash|dust/i;
 W.cur=[];const raf=window.requestAnimationFrame.bind(window);
 const tapRec=c=>{if(!c||c.__czw||typeof c.finish!=='function')return;c.__czw=1;const f=c.finish;c.finish=function(...a){const r=f.apply(this,a);try{if(W.B&&W.ph&&Array.isArray(r))W.raw=r.slice();}catch(_){}return r;};};
 const cap=()=>{};const de=drawEnemy;drawEnemy=function(...a){tapRec(ctx);return de.apply(this,a);};
 W.raw=[];
 const pick=()=>{const B=W.B;const q=project(B.x,B.y);for(const k of W.raw){if(!k||k.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const own=k.owner;const mine=own&&own.kind==='enemy'&&(own.id===B.id||String(own.id).endsWith(B.id));if(own&&own.kind==='enemy'&&!W.oid)W.oid=String(own.id)+' vs '+B.id;const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');
    let ok=mine&&!FX.test(src);if(!ok&&B.hp<=0&&!/pixelfx|r251\/atlas/.test(src)){const P=k.points;const cx=(P[0][0]+P[1][0])/2;ok=q&&Math.abs(cx-q.x)<50&&Math.abs(P[3][1]-q.y)<60;}
    if(ok){const P=k.points;W.cur.push({area:Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])),src,sr:k.sourceRect?Array.from(k.sourceRect).map(v=>+(+v).toFixed(1)):null,pts:P.map(v=>[+v[0].toFixed(1),+v[1].toFixed(1)]),flip:(P[1][0]-P[0][0])<0,a:k.alpha,own:own?.kind||null});}}W.raw=[];};
 const after=()=>{try{cap();const B=W.B;if(B&&W.ph)pick();if(B&&W.ph&&W.cur.length){const q=project(B.x,B.y);let best=null;for(const x of W.cur)if(!best||x.area>best.area)best=x;W.cur=[];
   const atk=!!(B.attack&&!B.attack.storyWorldPose5)||B.rangedWindup>0||!!(B.r61Action&&time<B.r61Action.endAt);
   const ps=(player.x-player.y)-(B.x-B.y);
   const F4=window.__STORYWORLD_ENEMY_FACE_R444__;let sd=null;try{sd=F4?.state?.(B)?.side||null;}catch(_){}
   W.rows.push({sd,ph:W.ph,t:+time.toFixed(3),st:B.hp<=0?'dead':atk?'atk':B.hitTimer>0?'hit':B.moving?'walk':'idle',hero:ps>0?'R':'L',q:q?[+q.x.toFixed(1),+q.y.toFixed(1)]:null,b:best});}W.cur=[];}catch(e){W.err=String(e).slice(0,200);}};
 window.requestAnimationFrame=cb=>raf(t=>{cap();W.cur=[];W.raw=[];const r=cb(t);after();return r;});});
const wait=async(s)=>{const t0=Date.now();while(Date.now()-t0<45000){const ok=await p.evaluate(s=>{try{for(let i=0;i<40&&storyScene;i++)advanceScene();if(modal)closePanel(true);}catch(_){}return time>=window.__cz.t1+s;},s);if(ok)return;await p.waitForTimeout(250);}throw new Error('timeout wait');};
const res={};const t00=Date.now();
for(const z of zones){try{await go(p,z);}catch(e){res[z]={err:'enter '+String(e).slice(0,80)};continue;}
 const reps=await p.evaluate(()=>{const seen=new Set(),L=[];for(const e of room.enemies){if(!(e.hp>0)||e.persona||e.r170Tower||e.r446Pillar||e.r251Circle)continue;const k=(e.nativeId||e.id)+'|'+(e.boss?'B':e.midboss?'M':'')+'|'+String(e.name).replace(/^중간보스 · /,'').replace(/ \d+$/,'').replace(/ (우두머리|증원|추격대|후속 증원)$/,'').replace(/ \d+$/,'');if(seen.has(k)||e.boss)continue;seen.add(k);L.push({id:e.id,k});}return L;});
 const FIL=process.argv[4]?new RegExp(process.argv[4]):null;res[z]={mobs:[]};
 for(const {id,k} of reps){if(FIL&&!FIL.test(k))continue;try{
  await p.evaluate(id=>{const W=window.__cz;const B=room.enemies.find(e=>e.id===id);W.B=B;W.rows=[];W.ph='idle';W.t1=time;
   for(const e of room.enemies)if(e!==B){e.__ss=e.__ss??e.spawnState;e.spawnState='hidden';e.attack=null;e.rangedWindup=0;}
   B.spawnState='active';B.graceUntil=0;B.attack=null;B.rangedWindup=0;room.engaged=true;player.maxHp=player.hp=1e9;player.invincible=1e9;auto=false;guide=false;
   W.ax=B.x;W.ay=B.y;const put=(d)=>{for(const s of [1,.8,.6,.45]){const tx=W.ax+d*s,ty=W.ay-d*s;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;return;}}player.x=W.ax+d*.3;player.y=W.ay-d*.3;};W.put=put;put(7);},id);
  await wait(.6);
  await p.evaluate(()=>{const W=window.__cz;W.ph='R';W.t1=time;W.put(.9);});await wait(2.5);
  await p.evaluate(()=>{const W=window.__cz;W.ph='L';W.t1=time;W.ax=W.B.x;W.ay=W.B.y;W.put(-.9);});await wait(2.5);
  await p.evaluate(()=>{const W=window.__cz;W.ph='hit';W.t1=time;W.ax=W.B.x;W.ay=W.B.y;W.put(2.4);W.B.attack=null;W.B.rangedWindup=0;W.hk=setInterval(()=>{try{if(W.B.hp>1)hitEnemy(W.B,Math.max(1,W.B.maxHp*.004));}catch(_){}},250);});await wait(.9);
  await p.evaluate(()=>{const W=window.__cz;clearInterval(W.hk);W.ph='death';W.t1=time;try{hitEnemy(W.B,W.B.hp+10);}catch(_){}if(W.B.hp>0){W.B.hp=0;try{killEnemy(W.B);}catch(_){}}});await wait(1.0);
  const rows=await p.evaluate(()=>{const W=window.__cz;const r=W.rows;W.rows=[];W.ph=null;const B=W.B;W.B=null;return {rows:r,name:B.name,nid:B.nativeId,boss:!!B.boss,mid:!!B.midboss,ai:B.ai,err:W.err||null,oid:W.oid};});
  res[z].mobs.push({k,id,...rows});console.log(' ',k,Math.round((Date.now()-t00)/1000)+'s');
 }catch(e){res[z].mobs.push({k,id,err:String(e).slice(0,160)});await p.evaluate(()=>{const W=window.__cz;clearInterval(W.hk);W.B=null;W.ph=null;});}}
 await p.evaluate(()=>{for(const e of room.enemies)if(e.__ss!=null){e.spawnState=e.__ss;delete e.__ss;}});
 fs.writeFileSync(out,JSON.stringify(res));console.log(z,res[z].mobs.length,Math.round((Date.now()-t00)/1000)+'s');}
await b.close();
