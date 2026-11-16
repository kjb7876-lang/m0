// R1108 브라우저 검사(헤드리스·소프트웨어 렌더링). 사용자 2026-11-16 06:59Z "네온 공격모션시 다른 모션에비해 두께가 더커지는 문제 일관성개선, 서하 대각선이동할때 너무 종이같은 느낌나는거 개선".
//  ① 네온(·라우렌) 좌우 기본 공격(R437 시트) 그림의 실제 몸 크기 — 화면에 그려진 부츠 밑창 길이(굳은 부위)를 서기 그림과 비교 → ±8% 안.
//     (머리 높이는 웅크린 자세라 크기 기준이 못 된다: 웅크린 몸을 서기 키에 맞추면 몸 전체가 커진다)
//  ② 서하 대각선 걷기 — 정면·뒷면 그림(walk-se·walk-ne)이 비스듬히 미끄러지지 않고, 몸이 걷는 쪽을 향한 옆 걷기 그림으로 → 대각 이동 장면 90% 이상.
//     키는 곧은 걷기의 ±6%, 그림을 바꿀 때 발 자리가 튀지 않음(발 가운데 이동 ≤ 키의 6%).
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SECS=+process.env.SECS||22,WALK=+process.env.WALK||2.5,OUT=process.env.OUT||'';
const HEROES=(process.env.HEROES||'neon,lauren,seoha').split(',');
const b=await chromium.launch();const all={};let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
for(const H of HEROES){
 const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${H}"]`).click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 await A(hero=>{window.__R1108=[];window.__R1108tag='auto';const memo=new WeakMap();
  const meas=(im,r)=>{let m=memo.get(im);if(!m){m=new Map();memo.set(im,m);}const k=r.map(Math.round).join(',');if(m.has(k))return m.get(k);let v=null;try{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(r[2]));c.height=Math.max(1,Math.round(r[3]));const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,r[0],r[1],r[2],r[3],0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data,W=c.width,HH=c.height,O=(x,y)=>d[(y*W+x)*4+3]>40;
   let bt=-1;for(let y=HH-1;y>=0&&bt<0;y--)for(let x=0;x<W;x++)if(O(x,y)){bt=y;break;}let sx=0,sn=0;for(let y=Math.max(0,bt-8);y<=bt;y++)for(let x=0;x<W;x++)if(O(x,y)){sx+=x;sn++;}const fc=sn?sx/sn:W/2,hw=HH*.2;let t=-1;for(let y=0;y<HH&&t<0;y++)for(let x=Math.max(0,Math.round(fc-hw));x<Math.min(W,Math.round(fc+hw));x++)if(O(x,y)){t=y;break;}
   /* 부츠 밑창: 발끝 위 3~12줄의 가장 긴 연속 구간(줄마다) 중앙값 */const rs=[];for(let y=Math.max(0,bt-12);y<=bt-3;y++){let best=0,x=0;while(x<W){if(O(x,y)){let x1=x;while(x1<W&&O(x1,y))x1++;best=Math.max(best,x1-x);x=x1;}else x++;}rs.push(best);}rs.sort((a,b)=>a-b);
   v={top:t/HH,foot:(bt+1)/HH,fc:fc/W,boot:rs[rs.length>>1]/HH};}catch(_){}m.set(k,v);return v;};
  const base=drawHero;drawHero=function(...a){const P=player;if(!P||P.r720Ally||!Array.isArray(ctx.commands))return base.apply(this,a);
   const pre={tag:window.__R1108tag,aa:+P.attackAnim||0,sk:+P.skillAnim||0,ul:+P.ultimateAnim||0,hu:+P.hurtAnim||0,da:+P.dashAnim||0,gd:!!P.guard,mv:!!P.moving};const st=ctx.commands.length;const r=base.apply(this,a);
   let best=null;for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const sp=String(c.sourcePath||c.image?.src||'');if(!sp.includes(hero)&&!/hero_direction|hero-authored|heroes\//.test(sp))continue;if(/barrier|aura|glow|shadow|ring|fx\//i.test(sp))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(!best||hh>best.hh)best={hh,c};}
   const row={t:time,...pre,z:typeof zoom==='number'?zoom:1,px:(()=>{try{return project(P.x,P.y).x;}catch(_){return NaN;}})()};
   if(best){const c=best.c,rr=c.sourceRect||[0,0,c.image.naturalWidth||c.image.width,c.image.naturalHeight||c.image.height],v=meas(c.image,rr),ys=c.points.map(q=>q[1]),Hh=Math.max(...ys)-Math.min(...ys),x0=c.points[0][0],x1=c.points[1][0];
    Object.assign(row,{src:String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,'').split('?')[0],Hpx:Hh,visH:v&&(v.foot-v.top)*Hh,boot:v&&v.boot*Hh,footX:v&&(x0+(x1-x0)*v.fc),finite:c.points.flat().every(Number.isFinite)});}
   window.__R1108.push(row);return r;};},H);
 if(H!=='seoha'){const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+SECS,{timeout:1800000});}
 else{await A(()=>{for(const e of room.enemies||[])e.hp=0;});
  const COMBOS={E:['ArrowRight'],SE:['ArrowDown','ArrowRight'],W:['ArrowLeft'],SW:['ArrowDown','ArrowLeft'],N:['ArrowUp'],NE:['ArrowUp','ArrowRight'],S:['ArrowDown'],NW:['ArrowUp','ArrowLeft']};
  for(const [tag,ks] of Object.entries(COMBOS)){await A(t=>{window.__R1108tag=t;for(const e of room.enemies||[])e.hp=0;},tag);const w0=await A(()=>time);for(const k of ks)await p.keyboard.down(k);await p.waitForFunction(a=>time>=a,w0+WALK,{timeout:900000});for(const k of ks)await p.keyboard.up(k);}}
 const rows=await A(()=>window.__R1108);all[H]=rows;console.log(H,'rows',rows.length,'errors',errs.length);ok(`${H}: 페이지 오류 0`,errs.length===0,errs.slice(0,3));ok(`${H}: 그리기 값 유한`,rows.every(r=>r.finite!==false));await ctx.close();}
if(OUT)fs.writeFileSync(OUT,JSON.stringify(all));await b.close();
const med=a=>{const s=a.filter(Number.isFinite).sort((x,y)=>x-y);return s.length?s[s.length>>1]:null;};
const plain=r=>!(r.aa>0||r.sk>0||r.ul>0||r.hu>0||r.da>0||r.gd);
for(const H of ['neon','lauren'].filter(h=>all[h])){const R=all[H].filter(r=>r.boot>0);
 const idle=R.filter(r=>plain(r)&&!r.mv&&new RegExp(`r130/${H}/idle-[ew]\\.webp`).test(r.src)),atk=R.filter(r=>/r437\/attack\//.test(r.src));
 const I=med(idle.map(r=>r.boot/r.z)),K=med(atk.map(r=>r.boot/r.z));
 if(idle.length<3||atk.length<3){console.log('NOTE',H,'표본 부족',idle.length,atk.length);continue;}
 ok(`${H}: 좌우 공격 몸 크기(부츠 밑창) = 옆 서기의 ±8%`,K/I>=.92&&K/I<=1.08,{ratio:+(K/I).toFixed(3),idle:+I.toFixed(2),atk:+K.toFixed(2),n:[idle.length,atk.length]});
 const ih=med(idle.map(r=>r.visH/r.z)),ah=med(atk.map(r=>r.visH/r.z));ok(`${H}: 공격 자세 키는 서기보다 크지 않음(웅크림 반영, 0.72~1.0)`,ah/ih>=.72&&ah/ih<=1.0,{ratio:+(ah/ih).toFixed(3)});}
if(all.seoha){const R=all.seoha.filter(r=>r.src&&r.mv&&plain(r));
 const diag=R.filter(r=>/^(SE|SW|NE|NW)$/.test(r.tag)),flat=diag.filter(r=>/r130\/seoha\/walk-(se|ne)\.webp/.test(r.src)),side=diag.filter(r=>/r130\/seoha\/walk-e\.webp/.test(r.src));
 ok('서하: 대각 이동에 정면·뒷면 걷기 그림(walk-se·ne) 대신 옆 걷기 그림 90% 이상',diag.length>=10&&side.length/diag.length>=.9,{n:diag.length,side:side.length,flat:flat.length});
 const straight=R.filter(r=>/^(E|W|N|S)$/.test(r.tag)),sh=med(straight.map(r=>r.visH/r.z)),dh=med(diag.map(r=>r.visH/r.z));
 ok('서하: 대각 걷기 키 = 곧은 걷기의 ±6%',sh&&dh&&dh/sh>=.94&&dh/sh<=1.06,{ratio:sh&&dh&&+(dh/sh).toFixed(3)});
 /* 발 자리: 그려진 발 가운데가 영웅 발밑점(화면 투영)에서 벗어나는 정도 — 대각 걷기 장면의 95% 이상이 곧은 걷기 중앙값 ±키의 6% 안 */
 const off=r=>(r.footX-r.px)/(r.Hpx||1),base=med(straight.map(off).map(Math.abs)),dev=diag.map(off).filter(Number.isFinite),bad=dev.filter(v=>Math.abs(v)>Math.max(.06,(base||0)+.06)).length;
 ok('서하: 대각 걷기 발 자리가 영웅 발밑에(벗어남 5% 이하)',dev.length>=10&&bad/dev.length<=.05,{n:dev.length,bad,base:base&&+base.toFixed(3),max:+Math.max(0,...dev.map(Math.abs)).toFixed(3)});}
console.log(fail?`\nR1108 실패 ${fail}`:'\nR1108 모두 통과');process.exit(fail?1:0);
