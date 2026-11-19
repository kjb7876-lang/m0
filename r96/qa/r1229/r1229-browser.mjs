// R1229 브라우저 검사(헤드리스 Chromium 소프트웨어 렌더링 — 실기기 GPU·자연 플레이 아님). 사용자 2026-11-19 영상(추락 dist06)·추가 제보.
//  ① 헌터 걷기: 걷는 동안 몸 그림이 R1229 걷기 시트(실제 보폭)이고 칸이 6개 이상 바뀐다 / 멈추면 걷기 시트가 아니다(경계)
//  ② 소환진 검은기둥(mb-dist06): 싸우는 8초 동안 제자리(이동 < 0.05칸), stationary 표시 / 발록은 계속 움직일 수 있다(회귀)
//  ③ 발록(dist06·결전의 날 ep1a09b): 화면에 보이는 몸 키(알파 테두리) 최대/최소 ≤ 1.15, 옛 그림(actors-normalized·v31511) 몸 0
//  ④ 보스 운석(R241): 운석 그리기가 프레임 시트(r411 boss-meteor) 칸이고 R106 칠 스프라이트(r106fx:) 덩어리는 0
//  ⑤ 엔진 보조 도형(story-vfx): 적 위험지대·궤적·적 탄에 선·원(fill/stroke) 0 (위험지대가 실제로 있었을 때)
//  ⑥ 투사체 시트(R912)·운석 시트·헌터 걷기 시트가 지역을 옮겨도 그림 기억에서 빠지지 않는다(빠지면 한동안 도형 구슬로 대체됨)
//  ⑦ 페이지 오류 0
// 실행: node r96/qa/r1229/r1229-browser.mjs  (SW_URL 기본 http://127.0.0.1:4410/m0/)
import {chromium,boot,go,skip} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d).slice(0,500):''));};
const b=await chromium.launch();const errs=[];
const {p}=await boot(b,{vp:{width:960,height:540}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const waitGame=s=>p.evaluate(async s=>{const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>=s)return r();setTimeout(g,60);};g();});},s);
// 화면 몸 키: 명령의 sourceRect 안 알파 테두리 비율 × 화면 상자 키
await p.evaluate(()=>{const memo=new Map();window.__visH=c=>{try{const im=c.image,sr=c.sourceRect;if(!im||!sr)return null;const k=(im.src||'')+'|'+sr.join(',');let f=memo.get(k);if(f===undefined){const w=Math.max(1,Math.round(sr[2]/2)),h=Math.max(1,Math.round(sr[3]/2)),cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(im,sr[0],sr[1],sr[2],sr[3],0,0,w,h);const d=g.getImageData(0,0,w,h).data;let y0=h,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){if(y<y0)y0=y;y1=y;break;}
  for(let y=h-1;y>=0&&y1<0;y--);f=y1>=y0?(y1-y0+1)/h:0;memo.set(k,f);}const H=Math.abs(c.points[3][1]-c.points[0][1]);return f*H;}catch(e){return null;}};
 window.__grab=(fn,secs)=>new Promise(res=>{const three=window.__STORYWORLD_PHASE1__.controller.state.three,base=three.render;const out=[];const t0=time;three.render=function(f){const r=base.apply(this,arguments);/* 렌더러에 실제로 넘어간 명령(안쪽 감싸기가 걸러 낸 뒤)을 본다 */try{out.push(fn(f.commands||[]));}catch(e){out.push({err:String(e)});}return r;};const g=()=>{if(time-t0>=secs){three.render=base;return res(out);}setTimeout(g,60);};g();});});
// ---------- ① 헌터 걷기 ----------
await p.evaluate(async()=>{loading=true;try{await ensureImages(heroPaths('hunter'));}finally{loading=false;}player.hero='hunter';});
await go(p,'dist06');
await p.evaluate(()=>{for(const e of room.enemies)e.hp=0;});
const walk=await p.evaluate(async()=>{keys.add('ArrowRight');const fn=cs=>{const c=cs.filter(c=>c.kind==='image'&&c.owner?.kind==='hero'&&c.points).sort((a,b)=>Math.abs(b.points[3][1]-b.points[0][1])-Math.abs(a.points[3][1]-a.points[0][1]))[0];return c?{src:String(c.sourcePath||''),sr:String(c.sourceRect)}:null;};
 await new Promise(r=>setTimeout(r,300));const W=await __grab(fn,1.6);keys.delete('ArrowRight');await new Promise(r=>setTimeout(r,200));const t0=time;await new Promise(r=>{const g=()=>{if(time-t0>.5)return r();setTimeout(g,60);};g();});const S=await __grab(fn,.4);return {W,S};});
const wb=walk.W.filter(x=>x&&/walk1229-/.test(x.src));ok('① hunter body while walking is the R1229 stride sheet (≥ 80% of frames)',wb.length>=walk.W.length*.8&&walk.W.length>5,{n:walk.W.length,hit:wb.length,sample:walk.W.slice(0,2)});
ok('① walk frames advance (≥ 6 distinct cells)',new Set(wb.map(x=>x.sr)).size>=6,{cells:new Set(wb.map(x=>x.sr)).size});
ok('① boundary: standing still does not draw the walk sheet',walk.S.length>0&&walk.S.every(x=>!x||!/walk1229-|\/walk-/.test(x.src)),walk.S.slice(0,2));
// ---------- ② 소환진 검은기둥 · ③ 발록(dist06) · ⑤ 보조 도형 ----------
await go(p,'dist06');
await p.evaluate(()=>{for(const e of room.enemies)if(!e.boss&&!e.midboss)e.hp=0;const B=room.enemies.find(e=>e.boss),M=room.enemies.find(e=>e.midboss);window.__B=B;window.__M=M;
 player.x=B.x+3;player.y=B.y+1.5;room.engaged=true;for(const e of [B,M]){e.spawnState='active';e.visible=true;e.disabled=false;e.hp=e.maxHp=1e8;}
 window.__keep=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},250);});
await waitGame(.6);
const m0=await p.evaluate(()=>({x:__M.x,y:__M.y,bx:__B.x,by:__B.y}));
const fnB=cs=>{const own='enemy:'+__B.id,ownM='enemy:'+__M.id;const body=cs.filter(c=>c.kind==='image'&&c.points&&c.owner?.id===own).sort((a,b)=>Math.abs(b.points[3][1]-b.points[0][1])-Math.abs(a.points[3][1]-a.points[0][1]))[0];
 const geo=cs.filter(c=>c.owner?.storyVfx&&c.kind!=='image'&&c.kind!=='text'&&(c.owner.ownerType==='hazard'||/hazard-trail/.test(c.owner.id))).length;
 const q=project(__B.x,__B.y);const on=q.x>40&&q.x<W-40&&q.y>40&&q.y<H-40;return {h:body?__visH(body):null,src:body?String(body.sourcePath||'').split('/').slice(-2).join('/'):null,on,geo,haz:(hazards||[]).filter(h=>h.owner===__B.id||h.owner===__M.id||h.row150).length,M:[__M.x,__M.y]};};
const G=await p.evaluate(fn=>__grab(eval(fn),14),fnB.toString());
const m1=await p.evaluate(()=>({x:__M.x,y:__M.y,st:!!__M.stationary,sp:__M.speed,bx:__B.x,by:__B.y,bsp:__B.speed}));
const drift=Math.hypot(m1.x-m0.x,m1.y-m0.y),bdrift=Math.hypot(m1.bx-m0.bx,m1.by-m0.by);
ok('② summoning black pillar stays put (drift < 0.05 tiles over the fight)',drift<.05,{drift,m0,m1});
ok('② pillar is marked stationary with speed 0',m1.st&&m1.sp===0,m1);
ok('② regression: Balrog itself still moves (speed > 0)',m1.bsp>0,{bsp:m1.bsp,bdrift});
const hs=G.filter(x=>x.on&&x.h>0).map(x=>x.h);const old=G.filter(x=>x.src&&/actors-normalized\/|v31511\//.test(x.src));
ok('③ dist06 Balrog visible body height max/min ≤ 1.15',hs.length>40&&Math.max(...hs)/Math.min(...hs)<=1.15,{n:hs.length,min:Math.min(...hs),max:Math.max(...hs),srcs:[...new Set(G.map(x=>x.src))]});
ok('③ dist06 Balrog never drawn with old small art (actors-normalized / v31511)',old.length===0,{old:old.length,srcs:[...new Set(old.map(x=>x.src))]});
// ③ 두 번 나오는 발록 모두 66% 크게(사용자 12:06Z): 같은 장면에서 끔/켬 평균 보이는 키 비율 1.55~1.77, 판정 반지름도 커짐 표시
const big=await p.evaluate(async fn=>{const F=window.__STORYWORLD_MOTION_FX_R1229__;const avg=a=>{const v=a.filter(x=>x.on&&x.h>0).map(x=>x.h);return v.length?v.reduce((p,c)=>p+c,0)/v.length:0;};
 F.set({balrogBig:false});const off=avg(await __grab(eval(fn),2.5));F.set({balrogBig:true});const on=avg(await __grab(eval(fn),2.5));return {off,on,ratio:on/off,big:!!__B.r1229Big,r:__B.radius};},fnB.toString());
ok('③ Balrog drawn 66% larger than before (ratio 1.55~1.77)',big.ratio>=1.55&&big.ratio<=1.77,big);
ok('③ Balrog body radius grown once with the art',big.big,big);
const geo=G.reduce((a,x)=>a+x.geo,0),haz=G.reduce((a,x)=>Math.max(a,x.haz),0);
ok('⑤ precondition: enemy hazards existed during the fight',haz>0,{haz});
ok('⑤ no story-vfx line/circle shapes on enemy hazards or their trails',geo===0,{geo});
// ---------- ④ 보스 운석 ----------
const met=await p.evaluate(async()=>{const M=window.__STORYWORLD_BOSS_METEOR_R241__;if(!M.cast(__B)){const t0=time;await new Promise(r=>{const g=()=>{if(hazards.some(h=>h.r241Meteor&&h.age<.3)||time-t0>16)return r();setTimeout(g,60);};g();});}
 const fn=cs=>{const r=cs.filter(c=>/^r241:|^r1192:/.test(String(c.owner?.id||'')));return {n:r.length,sheet:r.filter(c=>c.kind==='image'&&/r411\/fx\/boss-meteor/.test(String(c.sourcePath||''))).length,spr:r.filter(c=>/r106fx:/.test(String(c.sourcePath||''))).length,shape:r.filter(c=>c.kind!=='image'&&c.kind!=='text').length,live:hazards.filter(h=>h.r241Meteor).length};};
 return __grab(fn,1.4);});
const mm=met.filter(x=>x.live>0);
ok('④ precondition: meteors were live',mm.length>5,{frames:mm.length});
ok('④ meteors are drawn from the frame sheet (r411 boss-meteor) every live frame',mm.length>0&&mm.every(x=>x.sheet>=Math.min(4,x.live)),mm.slice(0,3));
ok('④ no R106 painted-sprite blobs or shapes left in meteor drawing',mm.every(x=>x.spr===0&&x.shape===0),mm.slice(0,3));
// ---------- ③ 결전의 날 발록 ----------
await p.evaluate(()=>clearInterval(__keep));
await go(p,'ep1a09b');
await p.evaluate(()=>{const B=room.enemies.find(e=>e.boss&&/발록/.test(e.name))||room.enemies.find(e=>/발록/.test(e.name||''));window.__B=B;window.__M=B;for(const e of room.enemies)if(e!==B&&!/발록/.test(e.name||''))e.hp=0;
 player.x=B.x+3;player.y=B.y+1.5;room.engaged=true;B.spawnState='active';B.visible=true;B.disabled=false;B.hp=B.maxHp=1e8;
 window.__keep=setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},250);});
const G2=await p.evaluate(fn=>__grab(eval(fn),12),fnB.toString());
const hs2=G2.filter(x=>x.on&&x.h>0).map(x=>x.h),old2=G2.filter(x=>x.src&&/actors-normalized\/|v31511\//.test(x.src)),miss2=G2.filter(x=>x.on&&!x.src).length;
ok('③ 결전의 날 Balrog visible body height max/min ≤ 1.15',hs2.length>40&&Math.max(...hs2)/Math.min(...hs2)<=1.15,{n:hs2.length,min:Math.min(...hs2),max:Math.max(...hs2),srcs:[...new Set(G2.map(x=>x.src))]});
ok('③ 결전의 날 Balrog never swaps to old small art (flicker)',old2.length===0,{old:old2.length});
ok('③ 결전의 날 Balrog body never missing while on screen',miss2===0,{miss:miss2});
{const md=a=>{const b=[...a].sort((x,y)=>x-y);return b[b.length>>1];},a=md(hs),b2=md(hs2);ok('③ the two Balrogs (dist06 · 결전의 날) are the same size (median within 8%)',a>0&&b2>0&&Math.max(a,b2)/Math.min(a,b2)<=1.08,{dist06:a,ep1a09b:b2});}
// ---------- ⑥ 지역 이동 뒤에도 시트가 남는다 ----------
const PIN=['assets/r912/pj09a-fly.webp','assets/r411/fx/boss-meteor.webp','assets/r130/hunter/walk1229-e.webp'];
await p.evaluate(async P=>{await ensureImages(P).catch(()=>{});},PIN);
await go(p,'ep1a10');
const kept=await p.evaluate(P=>P.map(x=>[x,!!readyImage(x)]),PIN);
ok('⑥ projectile / meteor / walk sheets survive the region change (no fallback gap)',kept.every(x=>x[1]),kept);
const big2=await p.evaluate(()=>!!__B.r1229Big);ok('③ 결전의 날 Balrog also grown',big2);
ok('⑦ no page errors',errs.length===0,errs);
await b.close();console.log(bad?`FAILED ${bad}/${n}`:`ALL PASS ${n}`);process.exit(bad?1:0);
