// R764 헤드리스 실측: 불면귀 보스 2페이즈 대기·피격·죽음, 중간보스 시트(대기·공격·피격·죽음)의 실제 그리기 명령과 화면 캡처.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r760/r764-scene.mjs <outdir>
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.argv[2]||'.';fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const {p}=await boot(b);const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const wait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t,s])=>time>t+s,[t0,s],{timeout:120000}).catch(()=>{});};
const shot=async n=>{const q=await p.evaluate(()=>{const B=window.__B,q=project(B.x,B.y);return [q.x,q.y];});const f=`${OUT}/${n}.png`;await p.screenshot({path:f,clip:{x:Math.max(0,q[0]-300),y:Math.max(0,q[1]-420),width:600,height:520}});return f;};
const res={};
for(const [z,sel] of [['last303',"e=>e.boss&&!e.midboss"],['last302',"e=>e.midboss"]]){await go(p,z);
 await p.evaluate(sel=>{const f=eval(sel);const B=room.enemies.find(f);for(const e of room.enemies)if(e!==B)e.hp=0;B.spawnState='active';player.x+=3;player.y+=1;B.x=B.homeX=player.x-2.6;B.y=B.homeY=player.y-2.6;B.explorationLeash=null;
  player.hp=player.maxHp=1e9;player.invincible=1e9;window.__B=B;window.__S=[];window.__D=[];
  const de=drawEnemy;drawEnemy=function(e,...a){const c=ctx,s0=c.commands?.length??-1;const r=de.call(this,e,...a);if(e===window.__B&&s0>=0&&window.__S.length<6000){const im=[];for(let i=s0;i<c.commands.length;i++){const k=c.commands[i];if(k.kind!=='image'||k.owner?.kind!=='enemy')continue;
     im.push({s:String(k.sourcePath||''),f:Math.round((k.sourceRect?.[0]||0)/512),h:+Math.abs(k.points[3][1]-k.points[0][1]).toFixed(1),g:!!k.r760Ghost});}
   window.__S.push({t:+time.toFixed(2),att:!!e.attack,hit:e.hitTimer>0,hp:+(e.hp/e.maxHp).toFixed(2),im});}return r;};
  const db=drawBurnDeath3;drawBurnDeath3=function(fx){const c=ctx,s0=c.commands?.length??-1;const r=db.apply(this,arguments);if(s0>=0&&fx.sourceId===window.__B.id){const k=c.commands.slice(s0).filter(k=>k.kind==='image').map(k=>({s:String(k.sourcePath||''),f:Math.round((k.sourceRect?.[0]||0)/512),a:+(k.style?.globalAlpha??1).toFixed(2)}));window.__D.push({age:+fx.age.toFixed(2),tag:fx.r764?.who||null,k});}return r;};},sel);
 const shots=[];for(let i=0;i<4;i++){await wait(.6);shots.push(await shot(`r764-${z}-a${i}`));}
 if(z==='last303'){await p.evaluate(()=>{__B.hp=__B.maxHp*.45;__B.attack=null;});for(let i=0;i<3;i++){await wait(.5);shots.push(await shot(`r764-${z}-p2-${i}`));}}
 // 피격: 서 있을 때 맞기
 await p.evaluate(()=>{__B.attack=null;__B.state='idle';hitEnemy(__B,50,{kind:'hero'});});await wait(.08);shots.push(await shot(`r764-${z}-hit`));await wait(1.6);await p.evaluate(()=>{hitEnemy(__B,50,{kind:'hero'});});await wait(.4);
 // 죽음
 await p.evaluate(()=>{__B.hp=0;killEnemy(__B);});for(let i=0;i<4;i++){await wait(.35);shots.push(await shot(`r764-${z}-death${i}`));}
 const S=await p.evaluate(()=>window.__S),D=await p.evaluate(()=>window.__D);
 const body=f=>f.im.filter(x=>!x.g).sort((a,b)=>b.h-a.h)[0];const sheets={};for(const f of S){const x=body(f);if(!x)continue;const k=x.s.replace(/^assets\//,'');sheets[k]=(sheets[k]||0)+1;}
 res[z]={frames:S.length,bodySheets:sheets,hitFrames:S.filter(f=>body(f)&&/sheet-hit/.test(body(f).s)).map(f=>body(f).f).join(''),
  lowHpIdle:[...new Set(S.filter(f=>f.hp<=.5&&!f.att).map(f=>body(f)?.s.split('/').pop()))],
  death:{draws:D.length,tagged:D.filter(d=>d.tag).length,frames:D.map(d=>d.k.filter(k=>/sheet-death/.test(k.s)).map(k=>k.f).join('')).join(','),engineBurn:D.filter(d=>d.k.some(k=>!/sheet-death/.test(k.s))).length},
  inspect:await p.evaluate(()=>window.__STORYWORLD_BULMYEONGWI_R760__?.inspect()),shots};}
res.pageErrors=errs;fs.writeFileSync(`${OUT}/r764-scene.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1));await b.close();
