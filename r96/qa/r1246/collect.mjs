// R1246 영웅 10명 모션 전수 수집(R1050c 수집부 + EGO·페르소나 + 좌우 뒤집기·발 위치·방향). 판정은 motion-judge.cjs.
// R1050c 브라우저 검사(R1050b 복사본 + 몸 키에서 가는 무기 빼기) — R1050b 검사 겸 전수조사(헤드리스·소프트웨어 렌더링): 영웅마다 생존 판을 새로 시작해 반자동 전투를 SECS 게임 초 동안 두고,
//  조종 영웅 drawHero 마다 상태(공격·스킬·궁극기·피격·이동·서기)·몸 그림 경로·보이는 몸 키(머리~발)·폭을 모은다.
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'',SECS=+process.env.SECS||25;
const HEROES=(process.env.HEROES||'hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner,ego,persona').split(',');
const b=await chromium.launch();const all={};
for(const h of HEROES){
 const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero]').first().waitFor();for(let i=0;i<3;i++)await p.keyboard.press('Digit7');await p.locator(`[data-r600hero="${h}"]`).click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 await A(hero=>{window.__R1050N=[];const vis=new WeakMap();
  const visBox=(im,r)=>{let m=vis.get(im);if(!m){m=new Map();vis.set(im,m);}const k=r.map(Math.round).join(',');if(m.has(k))return m.get(k);let v=null;try{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(r[2]));c.height=Math.max(1,Math.round(r[3]));const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,r[0],r[1],r[2],r[3],0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data;let x0=1e9,x1=-1;
    let t=-1,bt=-1;for(let y=c.height-1;y>=0&&bt<0;y--)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){bt=y;break;}
    /* 머리 꼭대기는 발 가운데 ±0.2×칸 높이 띠에서(칸 너비·꼭 맞춘 자르기와 무관하게 — 창·무기 끝은 띠 밖) */let sx=0,sn=0;for(let y=Math.max(0,bt-8);y<=bt;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){sx+=x;sn++;}const fc=sn?sx/sn:c.width/2,hw=c.height*.2,cx0=Math.max(0,Math.round(fc-hw)),cx1=Math.min(c.width,Math.round(fc+hw));/* R1050c: 창·지팡이처럼 가는 세로 무기(줄 너비 < 칸 높이 6%)는 몸 키에서 뺀다 — 라우렌 서기는 곧게 세운 창끝이 머리보다 30px 높아 서기 '보이는 키'가 몸보다 컸다 */const need=Math.max(3,c.height*.06);for(let y=0;y<c.height&&t<0;y++){let n=0;for(let x=cx0;x<cx1;x++)if(d[(y*c.width+x)*4+3]>40)n++;if(n>=need)t=y;}
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;}
    if(t>=0&&bt>t)v={top:t/c.height,foot:(bt+1)/c.height,fx0:x0/c.width,fx1:(x1+1)/c.width};}catch(_){}m.set(k,v);return v;};
  const base=drawHero;drawHero=function(...a){const P=player;if(!P||P.r720Ally||!Array.isArray(ctx.commands))return base.apply(this,a);
   const pre={dir:P.direction,form:(P.egoSovereignR1046?'ego':P.personaHeroR1113?'persona':P.hero),samong:+P.samong>0,aa:+P.attackAnim||0,sk:+P.skillAnim||0,ul:+P.ultimateAnim||0,hu:+P.hurtAnim||0,da:+P.dashAnim||0,mv:!!P.moving,gd:!!P.guard,x:P.x,y:P.y};const st=ctx.commands.length;const r=base.apply(this,a);
   let best=null;for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const sp=String(c.sourcePath||c.image?.src||'');if(!sp.includes(hero)&&!/hero_direction|hero-authored|heroes\//.test(sp))continue;if(/barrier|aura|glow|shadow|ring|fx\//i.test(sp))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(!best||hh>best.hh)best={hh,c};}
   let row={t:time,...pre,z:typeof zoom==='number'?zoom:1,ah:typeof actorHeight==='function'?actorHeight():null};
   if(best){const c=best.c,rr=c.sourceRect||[0,0,c.image.naturalWidth||c.image.width,c.image.naturalHeight||c.image.height],v=visBox(c.image,rr),ys=c.points.map(q=>q[1]),xs=c.points.map(q=>q[0]),H=Math.max(...ys)-Math.min(...ys),W=Math.max(...xs)-Math.min(...xs);
    const pt=c.points;Object.assign(row,{sr:rr.map(Math.round).join(','),flip:(pt[1][0]-pt[0][0])<0,footY:Math.max(...ys),cx:(Math.max(...xs)+Math.min(...xs))/2,src:sp0(c),walk:!!c.r121Walk,H,visH:v?(v.foot-v.top)*H:null,visW:v?(v.fx1-v.fx0)*W:null});}
   window.__R1050N.push(row);return r;};for(const k of Object.keys(base))if(/^_*r\d+/i.test(k))drawHero[k]=base[k];/* R1246: 표식을 옮겨 달아 수집기가 맨 바깥에서 실제 hurtAnim 을 읽음 */
  function sp0(c){return String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,'').split('?')[0];}},h);
 const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+SECS,{timeout:1800000});
 // 걷기 구간(모션 바뀔 때 크기): 화살표로 좌·우 4 게임 초씩
 for(const k of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown']){const w0=await A(()=>time);await p.keyboard.down(k);await p.waitForFunction(a=>time>=a,w0+4,{timeout:900000});await p.keyboard.up(k);}
 all[h]=await A(()=>window.__R1050N);console.log(h,'rows',all[h].length,'errors',errs.length);await ctx.close();}
if(OUT)fs.writeFileSync(OUT,JSON.stringify(all));await b.close();

