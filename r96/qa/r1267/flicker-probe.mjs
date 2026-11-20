// R1267 광과민 깜빡임 측정(헤드리스, 소프트웨어 렌더 — GPU·실기기 미검증).
//  게임 시간을 매 프레임 1/60초로 고정해 돌리며, 화면(phase1-webgl)의 영웅 둘레 420×320 을 프레임마다 읽어 상대 휘도를 잰다.
//  WCAG 2.3.1 방식: 앞 프레임보다 휘도가 .1 이상 오르고(어두운 쪽 <.8) 그 넓이가 창의 AREA(기본 4%) 이상이면 '밝아짐', 반대는 '어두워짐'.
//  밝아짐→어두워짐 한 쌍 = 섬광 1회. 어느 1초(게임 시간) 창에서든 섬광 3회 초과면 실패.
//  SCEN=all|Q|W|E|R|Z|X|A|heart  OFF=모듈끄기(쉼표) DUR=초 OUT=폴더  FULL=1 이면 화면 전체(HUD 포함)를 105×80 으로 줄여 잰다  DPR=기기 배율
import fs from 'node:fs';import {boot} from './boot.mjs';
const SCEN=process.env.SCEN||'all',DUR=+(process.env.DUR||6),OUT=process.env.OUT||'out/r1267',AREA=+(process.env.AREA||.04),ZONE=process.env.ZONE||'dist01';
fs.mkdirSync(OUT,{recursive:true});
const VW=+(process.env.VW||640),VH=Math.round(VW*9/16),RS=VW/960;
const {b,p,errors}=await boot({zone:ZONE,w:VW,h:VH,init:(off)=>{try{for(const [k,v] of off)localStorage.setItem(k,v);}catch(_){}
 const gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,o){if(/webgl/.test(String(t)))o={...(o||{}),preserveDrawingBuffer:true};return gc.call(this,t,o);};},initArg:(process.env.OFFKV||'').split(',').filter(Boolean).map(s=>s.split('='))});
await p.evaluate(([h,hk,d,f])=>{window.__HIDE=h;window.__HIDEKIND=hk;window.__DUMP=d;window.__FULL=f;},[process.env.HIDE||'',process.env.HIDEKIND||'',!!process.env.DUMP,!!process.env.FULL]);
await p.evaluate((RS)=>{
 const tb=tick;tick=function(dt,...a){return tb.call(this,window.__FIX>0?window.__FIX:dt,...a);};
 const S=window.__fl={on:false,frames:[]};const cv=document.getElementById('phase1-webgl');const sm=document.createElement('canvas');sm.width=105;sm.height=80;const sx=sm.getContext('2d',{willReadFrequently:true});
 const lin=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};const LUT=new Float32Array(256);for(let i=0;i<256;i++)LUT[i]=lin(i);
 const grab=()=>{if(!S.on||time===S.lastT)return;S.lastT=time;try{const q=project(player.x,player.y),W=cv.width/(cv.clientWidth||cv.width);sx.clearRect(0,0,105,80);if(window.__FULL)sx.drawImage(cv,0,0,cv.width,cv.height,0,0,105,80);else{const x=(q.x-210*RS)*W,y=(q.y-200*RS)*W;sx.drawImage(cv,x,y,420*RS*W,320*RS*W,0,0,105,80);}
   const d=sx.getImageData(0,0,105,80).data,L=new Float32Array(105*80);let m=0;for(let i=0,j=0;i<d.length;i+=4,j++){L[j]=.2126*LUT[d[i]]+.7152*LUT[d[i+1]]+.0722*LUT[d[i+2]];m+=L[j];}
   let up=0,dn=0;const a=S.prev;if(a){for(let j=0;j<L.length;j++){const df=L[j]-a[j],lo=Math.min(L[j],a[j]);if(lo>=.8)continue;if(df>=.1)up++;else if(df<=-.1)dn++;}}
   S.prev=L;S.frames.push({t:time,up:up/L.length,dn:dn/L.length,L:m/L.length,first:!a});if(S.dump){const u=new Uint8Array(L.length);for(let j=0;j<L.length;j++)u[j]=Math.min(255,Math.round(Math.pow(L[j],1/2.2)*255));(S.raw||(S.raw=[])).push(btoa(String.fromCharCode(...u)));}}catch(e){S.err=String(e);}};
 // 가상 60fps: 실제 rAF 한 번마다 시각을 16.67ms 만 올린다 → 엔진 고정 스텝(1/60)이 프레임당 정확히 한 번, 매 프레임 그림을 읽는다.
 let lastReal=-1,virt=0;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=function(cb){return raf(ts=>{if(ts!==lastReal){lastReal=ts;virt=S.virt?virt+1000/60:ts;}const r=cb(S.virt?virt:ts);grab();return r;});};
 // 묶음별 밝기 에너지(알파×넓이, 덧셈 합성) — 원인 찾기용
 S.en={};const P=window.StoryPhase1?.DrawCommands?.prototype;const grp=o=>{const id=String(o?.id||o?.kind||'?');const m=/^([a-z0-9]+)(?::([a-z0-9-]+))?/i.exec(id);return m?(m[1]+(m[2]&&!/^\d/.test(m[2])?':'+m[2]:'')):'?';};
 const area=d=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const pts=d?.points?[d.points]:(d?.paths||[]).map(p=>p.points||[]);for(const ps of pts)for(const q of ps||[]){if(!Number.isFinite(q[0]))continue;x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);}return x1>x0?(x1-x0)*(y1-y0):0;};
 const wrapE=f=>{const w=function(kind,data){try{if(S.on){const add=/lighter|screen/.test(String(this.globalCompositeOperation||''));if(add&&(kind==='image'||kind==='fill')){const g=grp(this.owner),k=time.toFixed(4);const e=(S.en[k]||(S.en[k]={}));e[g]=(e[g]||0)+area(data)*(+this.globalAlpha||0);}}}catch(_){}return f.call(this,kind,data);};w.__r1267e=true;return w;};
 S.wrapE=()=>{try{if(P&&!P.push.__r1267e)P.push=wrapE(P.push);if(ctx&&Object.prototype.hasOwnProperty.call(ctx,'push')&&!ctx.push.__r1267e)ctx.push=wrapE(ctx.push);}catch(_){}};setInterval(S.wrapE,200);S.wrapE();
 // 원인 찾기: HIDE 정규식(owner.id)에 맞는 명령을 렌더 직전에 지운다(측정용)
 if(window.__HIDE){const re=new RegExp(window.__HIDE),KIND=window.__HIDEKIND;const hook=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.__hide)return;r.__hide=true;const base=r.render;r.render=function(frame){try{if(Array.isArray(frame?.commands))frame.commands=frame.commands.filter(c=>!(re.test(String(c?.owner?.id||''))&&(!KIND||c?.owner?.kind===KIND)));}catch(_){}return base.apply(this,arguments);};};hook();setInterval(hook,300);}
 for(const e of room.enemies){if(e.hp>0){e.hp=1e7;e.maxHp=1e7;}}
 const es=room.enemies.filter(v=>v.hp>0&&!v.boss);es.slice(8).forEach(v=>{v.x=player.x-60;v.y=player.y-60;v.speed=0;});
 es.slice(0,8).forEach((e,i)=>{e.x=player.x+1.6+(i%4)*.9;e.y=player.y-1.6+Math.floor(i/4)*1.4;e.speed=0;e.attack=null;});
 room.engaged=true;player.invincible=999;},RS);
const casts={Q:'player.specialCD=0;special();',W:'window.__STORYWORLD_WER__.cast("w")',E:'window.__STORYWORLD_WER__.cast("e",true)',R:'window.__STORYWORLD_WER__.cast("r")',
 Z:'window.__STORYWORLD_MICHAELA_R247__.castZ()',X:'window.__STORYWORLD_MICHAELA_R247__.castX()'};
const plan=SCEN==='all'?[['Q',0],['W',.6],['E',1.2],['R',1.8],['Z',2.6],['X',3.2],['R',4.4]]:SCEN==='A'||SCEN==='heart'?[]:[[SCEN,0]];
const t0=await p.evaluate(async(sc)=>{player.hp=maxHP();window.__fl.virt=true;await new Promise(r=>setTimeout(r,300));window.__fl.frames=[];window.__fl.prev=null;window.__fl.raw=[];window.__fl.dump=!!window.__DUMP;window.__fl.on=true;
 if(sc==='heart'){window.__STORYWORLD_MICHAELA_HEART_R948__?.qaForce?.('volley');}
 if(sc==='A'||sc==='heart'||sc==='all'){window.__iv=setInterval(()=>{try{basicAttack(false);}catch(_){}},60);}return time;},SCEN);
for(const [k,at] of plan){await p.waitForFunction(t=>time>=t,t0+at,{timeout:3000000});
 await p.evaluate(src=>{try{const W=window.__STORYWORLD_WER__;if(W?.cooldowns)for(const s of['w','e','r'])try{W.cooldowns[s]=0;}catch(_){}
  const M=window.__STORYWORLD_MICHAELA_R247__;(0,eval)(src);}catch(e){window.__fl.castErr=String(e).slice(0,200);}},casts[k]);
 if(k==='R'&&at<1)null;}
await p.waitForFunction(t=>time>=t,t0+DUR,{timeout:3000000});
const fr=await p.evaluate(()=>{clearInterval(window.__iv);window.__fl.on=false;window.__fl.virt=false;return{frames:window.__fl.frames,err:window.__fl.err,castErr:window.__fl.castErr,en:window.__fl.en,raw:window.__fl.raw,guard:window.__STORYWORLD_FLASH_GUARD_R1267__?.inspect?.()||null};});
// 분석
const F=fr.frames;const ev=F.filter(f=>!f.first);
const seq=[];for(const e of ev){if(e.up>=AREA&&e.up>=e.dn)seq.push({t:e.t,s:1,a:e.up});else if(e.dn>=AREA)seq.push({t:e.t,s:-1,a:e.dn});}
// 같은 방향 연속은 하나로
const tr=[];for(const s of seq){if(tr.length&&tr[tr.length-1].s===s.s){continue;}tr.push(s);}
const flashes=[];for(let i=1;i<tr.length;i++)if(tr[i-1].s===1&&tr[i].s===-1)flashes.push(tr[i].t);
let worst=0,worstAt=null;for(const f of flashes){const n=flashes.filter(g=>g>=f&&g<f+1).length;if(n>worst){worst=n;worstAt=f-t0;}}
const dt=F.length>1?(F[F.length-1].t-F[0].t)/(F.length-1):0;
const res={scen:SCEN,off:process.env.OFFKV||'',frames:F.length,dtAvg:+dt.toFixed(4),flashes:flashes.length,worstPerSec:worst,worstAt:worstAt==null?null:+worstAt.toFixed(2),
 maxUp:+Math.max(0,...ev.map(e=>e.up)).toFixed(3),maxDn:+Math.max(0,...ev.map(e=>e.dn)).toFixed(3),
 flashTimes:flashes.map(f=>+(f-t0).toFixed(2)),guard:fr.guard,errors,err:fr.err,castErr:fr.castErr};
fs.writeFileSync(`${OUT}/flicker-${SCEN}${process.env.TAG?'-'+process.env.TAG:''}.json`,JSON.stringify({res,series:ev.map((e,i)=>({t:+(e.t-t0).toFixed(3),up:+e.up.toFixed(3),dn:+e.dn.toFixed(3),L:+e.L.toFixed(4)}))},null,0));
console.log(JSON.stringify(res));if(process.env.DUMP&&fr.raw)fs.writeFileSync(`${OUT}/raw-${SCEN}${process.env.TAG?'-'+process.env.TAG:''}.json`,JSON.stringify({t0,times:F.map(f=>f.t),raw:fr.raw}));
{const ks=Object.keys(fr.en||{}).sort((a,b)=>a-b),G={};for(const k of ks)for(const g of Object.keys(fr.en[k]))G[g]=1;const reg=420*320*RS*RS;const rep={};
 for(const g of Object.keys(G)){let prev=0,rises=0,max=0,sum=0;for(const k of ks){const v=(fr.en[k][g]||0)/reg;if(v-prev>.15)rises++;max=Math.max(max,v);sum+=v;prev=v;}rep[g]={rises,max:+max.toFixed(2),mean:+(sum/ks.length).toFixed(3)};}
 const top=Object.entries(rep).sort((a,b)=>b[1].rises-a[1].rises||b[1].mean-a[1].mean).slice(0,25);console.log('ENERGY',JSON.stringify(top));
 fs.writeFileSync(`${OUT}/energy-${SCEN}${process.env.TAG?'-'+process.env.TAG:''}.json`,JSON.stringify(fr.en));}
const ok=worst<=3&&!errors.length;console.log(ok?'PASS 섬광 1초당 3회 이하':'FAIL 섬광 1초당 '+worst+'회 (>3)');await b.close();process.exit(ok?0:1);
