// R1050 자연 전투 전수조사(헤드리스·소프트웨어 렌더링): 영웅마다 생존 판을 새로 시작해 반자동 전투를 SECS 게임 초 동안 두고,
//  조종 영웅 drawHero 마다 상태(공격·스킬·궁극기·피격·이동·서기)·몸 그림 경로·보이는 몸 키(머리~발)·폭을 모은다.
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'',SECS=+process.env.SECS||25;
const HEROES=(process.env.HEROES||'hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner').split(',');
const b=await chromium.launch();const all={};
for(const h of HEROES){
 const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${h}"]`).click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 await A(hero=>{window.__R1050N=[];const vis=new WeakMap();
  const visBox=(im,r)=>{let m=vis.get(im);if(!m){m=new Map();vis.set(im,m);}const k=r.map(Math.round).join(',');if(m.has(k))return m.get(k);let v=null;try{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(r[2]));c.height=Math.max(1,Math.round(r[3]));const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,r[0],r[1],r[2],r[3],0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data;let x0=1e9,x1=-1;
    const cx0=Math.round(c.width*.3),cx1=Math.round(c.width*.7);let t=-1,bt=-1;for(let y=0;y<c.height&&t<0;y++)for(let x=cx0;x<cx1;x++)if(d[(y*c.width+x)*4+3]>40){t=y;break;}for(let y=c.height-1;y>=0&&bt<0;y--)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){bt=y;break;}
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;}
    if(t>=0&&bt>t)v={top:t/c.height,foot:(bt+1)/c.height,fx0:x0/c.width,fx1:(x1+1)/c.width};}catch(_){}m.set(k,v);return v;};
  const base=drawHero;drawHero=function(...a){const P=player;if(!P||P.r720Ally||!Array.isArray(ctx.commands))return base.apply(this,a);
   const pre={aa:+P.attackAnim||0,sk:+P.skillAnim||0,ul:+P.ultimateAnim||0,hu:+P.hurtAnim||0,da:+P.dashAnim||0,mv:!!P.moving,gd:!!P.guard,x:P.x,y:P.y};const st=ctx.commands.length;const r=base.apply(this,a);
   let best=null;for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const sp=String(c.sourcePath||c.image?.src||'');if(!sp.includes(hero)&&!/hero_direction|hero-authored|heroes\//.test(sp))continue;if(/barrier|aura|glow|shadow|ring|fx\//i.test(sp))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(!best||hh>best.hh)best={hh,c};}
   let row={t:time,...pre,z:typeof zoom==='number'?zoom:1,ah:typeof actorHeight==='function'?actorHeight():null};
   if(best){const c=best.c,rr=c.sourceRect||[0,0,c.image.naturalWidth||c.image.width,c.image.naturalHeight||c.image.height],v=visBox(c.image,rr),ys=c.points.map(q=>q[1]),xs=c.points.map(q=>q[0]),H=Math.max(...ys)-Math.min(...ys),W=Math.max(...xs)-Math.min(...xs);
    Object.assign(row,{src:sp0(c),walk:!!c.r121Walk,H,visH:v?(v.foot-v.top)*H:null,visW:v?(v.fx1-v.fx0)*W:null});}
   window.__R1050N.push(row);return r;};
  function sp0(c){return String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,'').split('?')[0];}},h);
 const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+SECS,{timeout:1800000});
 all[h]=await A(()=>window.__R1050N);console.log(h,'rows',all[h].length,'errors',errs.length);await ctx.close();}
if(OUT)fs.writeFileSync(OUT,JSON.stringify(all));await b.close();
