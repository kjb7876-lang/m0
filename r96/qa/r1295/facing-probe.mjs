// R1295 탐침 — 윤서하 전투 중 '도리도리'(좌우가 짧은 간격으로 뒤집힘) 측정.
//  drawHero 직후 기록기 명령에서 영웅 몸 그림(가장 큰 hero 이미지)의 좌우(points 좌상→우상 x 감소 = 뒤집힘)·그림 경로를 프레임마다 기록.
//  모드 MODE=hold(제자리 공격키) | auto(자동전투) | kite(공격키+0.6초마다 짧게 움직임). 게임 time 기준.
import {chromium,boot,go} from '../r444/lib.mjs';
const HEROES=(process.env.HEROES||'seoha,michaela,hunter').split(','),ZONE=process.env.ZONE||'cult02',SEC=+(process.env.SEC||8),MODE=process.env.MODE||'hold';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await go(p,ZONE);
await p.evaluate(()=>{const W=window.__R1295={rec:[],on:false};const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:0;const r=base.apply(this,a);
 try{if(W.on&&rec&&Array.isArray(rec.commands)&&(a[0]===player||a[0]==null)){let best=null,ba=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!Array.isArray(c.points)||c.points.length<4)continue;const path=String(c.sourcePath||c.image?.src||'');if(/fx|effect|shadow|aura|ring|orb|shot|proj|barrier/i.test(path))continue;const w=Math.hypot(c.points[1][0]-c.points[0][0],c.points[1][1]-c.points[0][1]),h=Math.hypot(c.points[3][0]-c.points[0][0],c.points[3][1]-c.points[0][1]);if(w*h>ba){ba=w*h;best={flip:c.points[1][0]<c.points[0][0],path:path.replace(/^.*assets\//,'').slice(0,60),sr:c.sourceRect?String(c.sourceRect):''}}}
  if(best){const ne=liveEnemies().sort((a,b)=>distance(a,player)-distance(b,player))[0];W.rec.push({t:+time.toFixed(3),...best,ndx:ne?+(ne.x-player.x).toFixed(2):null,ndy:ne?+(ne.y-player.y).toFixed(2):null,anim:+(+player.attackAnim||0).toFixed(2),mv:!!player.moving,fx:+(+player.facingX||0).toFixed(2),dir:player.direction||player.dir||null})}}}catch(e){W.err=String(e)}return r};});
async function waitT(dt){const t0=await p.evaluate(()=>time);for(;;){const s=await p.evaluate(t=>{if(storyScene)for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.hp=maxHP();return time>=t},t0+dt);if(s)return;await p.waitForTimeout(150);}}
// 그림 본래 방향(경로 끝 -e/-se/-ne=오른쪽, -w/-sw/-nw/-left=왼쪽, -s=앞, -n=뒤) × 좌우 뒤집힘 = 화면에 보이는 방향
function face(x){const m=/-(se|ne|sw|nw|e|w|s|n|left|right)(?:[-_.][^/]*)?\.webp/.exec(x.path);if(!m)return null;const k=m[1];const nat=/^(e|se|ne|right)$/.test(k)?'R':/^(w|sw|nw|left)$/.test(k)?'L':k==='s'?'F':'B';if(nat==='F'||nat==='B')return nat;return x.flip?(nat==='R'?'L':'R'):nat}
const out=[];let fail=0;
for(const h of HEROES){
 await p.evaluate(([h,MODE])=>{ensureImages?.(heroPaths?.(h)||[]);player.hero=h;const es=liveEnemies().filter(e=>!e.boss).sort((a,b)=>distance(a,player)-distance(b,player));const e=es[0];if(e){player.x=e.x-1.6;player.y=e.y+.2;}
  const W=window.__R1295;W.rec.length=0;W.on=true;keys.add('attack');if(MODE==='kite'){W.k=setInterval(()=>{const d=Math.random()<.5?'ArrowLeft':'ArrowRight';keys.add(d);setTimeout(()=>keys.delete(d),90)},600)}if(MODE==='auto'){try{window.__STORYWORLD_AUTO_MOVE_R1022__?.set?.({on:true})}catch(_){}}},[h,MODE]);
 await waitT(SEC);
 const r=await p.evaluate(()=>{const W=window.__R1295;W.on=false;clearInterval(W.k);keys.delete('attack');keys.delete('ArrowLeft');keys.delete('ArrowRight');return {rec:W.rec.slice(),err:W.err}});
 const R=r.rec;for(const x of R)x.face=face(x);let flips=0,fast=0,last=null,lastT=-9,axis=0,lastAx=null,lastAxT=-9;const fastS=[];for(const x of R){if(x.face==='L'||x.face==='R'){if(last!==null&&x.face!==last){flips++;if(x.t-lastT<.5){fast++;if(fastS.length<6)fastS.push(x)}}if(x.face!==last)lastT=x.t;last=x.face}
  const ax=x.face==='L'||x.face==='R'?'side':x.face;if(ax&&lastAx&&ax!==lastAx){if(x.t-lastAxT<.4)axis++;}if(ax&&ax!==lastAx){lastAxT=x.t;lastAx=ax}}
 let pathSw=0,lp=null;for(const x of R){if(lp&&x.path!==lp)pathSw++;lp=x.path}
 const res={h,all:process.env.DUMP?R:undefined,frames:R.length,fastAxis:axis,dur:R.length?+(R.at(-1).t-R[0].t).toFixed(2):0,flips,fastFlips:fast,pathSwitches:pathSw,paths:[...new Set(R.map(x=>x.path))].slice(0,12),fastS,err:r.err};out.push(res);
 if(fast>0){fail++;console.log('FAIL',h,'0.5초 안 화면 좌우 뒤집힘',fast,'번 /',flips)}if(axis>2){fail++;console.log('FAIL',h,'0.4초 안 옆↔앞/뒤 자세 오감',axis)}
}
if(process.env.DUMP)(await import("node:fs")).writeFileSync(process.env.DUMP,JSON.stringify(out,null,0));await b.close();console.log(JSON.stringify(out,null,1));console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);
