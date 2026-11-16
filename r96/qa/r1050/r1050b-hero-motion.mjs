// R1050b 브라우저 검사 겸 전수조사(헤드리스·소프트웨어 렌더링): 영웅마다 생존 판을 새로 시작해 반자동 전투를 SECS 게임 초 동안 두고,
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
  const visBox=(im,r,band=.2)=>{let m=vis.get(im);if(!m){m=new Map();vis.set(im,m);}const k=r.map(Math.round).join(',')+':'+band;if(m.has(k))return m.get(k);let v=null;try{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(r[2]));c.height=Math.max(1,Math.round(r[3]));const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,r[0],r[1],r[2],r[3],0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data;let x0=1e9,x1=-1;
    let t=-1,bt=-1;for(let y=c.height-1;y>=0&&bt<0;y--)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){bt=y;break;}
    /* 머리 꼭대기는 발 가운데 ±0.2×칸 높이 띠에서(칸 너비·꼭 맞춘 자르기와 무관하게 — 창·무기 끝은 띠 밖) */let sx=0,sn=0;for(let y=Math.max(0,bt-8);y<=bt;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){sx+=x;sn++;}const fc=sn?sx/sn:c.width/2,hw=c.height*band,cx0=Math.max(0,Math.round(fc-hw)),cx1=Math.min(c.width,Math.round(fc+hw));for(let y=0;y<c.height&&t<0;y++)for(let x=cx0;x<cx1;x++)if(d[(y*c.width+x)*4+3]>40){t=y;break;}
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;}
    if(t>=0&&bt>t)v={top:t/c.height,foot:(bt+1)/c.height,fx0:x0/c.width,fx1:(x1+1)/c.width};}catch(_){}m.set(k,v);return v;};
  const base=drawHero;drawHero=function(...a){const P=player;if(!P||P.r720Ally||!Array.isArray(ctx.commands))return base.apply(this,a);
   const pre={samong:+P.samong>0,aa:+P.attackAnim||0,sk:+P.skillAnim||0,ul:+P.ultimateAnim||0,hu:+P.hurtAnim||0,da:+P.dashAnim||0,mv:!!P.moving,gd:!!P.guard,x:P.x,y:P.y};const st=ctx.commands.length;const r=base.apply(this,a);
   let best=null;for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const sp=String(c.sourcePath||c.image?.src||'');if(!sp.includes(hero)&&!/hero_direction|hero-authored|heroes\//.test(sp))continue;if(/barrier|aura|glow|shadow|ring|fx\//i.test(sp))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(!best||hh>best.hh)best={hh,c};}
   let row={t:time,...pre,z:typeof zoom==='number'?zoom:1,ah:typeof actorHeight==='function'?actorHeight():null};
   if(best){const c=best.c,rr=c.sourceRect||[0,0,c.image.naturalWidth||c.image.width,c.image.naturalHeight||c.image.height],v=visBox(c.image,rr,/r425\/hunter\//.test(sp0(c))?.12:.2)/* R1102(사용자 2026-11-16 07:08Z 허락 '헌터 활 칸만 띠 좁히기'): 헌터 활 당기기 칸(3·4)은 들어 올린 활 윗날개가 머리 띠(±0.2) 안에 들어와 몸 키로 잡혔다(머리 꼭대기는 7칸 모두 35~36px) → 헌터 R425 칸만 ±0.12 띠 */,ys=c.points.map(q=>q[1]),xs=c.points.map(q=>q[0]),H=Math.max(...ys)-Math.min(...ys),W=Math.max(...xs)-Math.min(...xs);
    Object.assign(row,{src:sp0(c),walk:!!c.r121Walk,H,visH:v?(v.foot-v.top)*H:null,visW:v?(v.fx1-v.fx0)*W:null});}
   window.__R1050N.push(row);return r;};
  function sp0(c){return String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,'').split('?')[0];}},h);
 const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+SECS,{timeout:1800000});
 // 걷기 구간(모션 바뀔 때 크기): 화살표로 좌·우 4 게임 초씩
 for(const k of ['ArrowRight','ArrowLeft']){const w0=await A(()=>time);await p.keyboard.down(k);await p.waitForFunction(a=>time>=a,w0+4,{timeout:900000});await p.keyboard.up(k);}
 all[h]=await A(()=>window.__R1050N);console.log(h,'rows',all[h].length,'errors',errs.length);await ctx.close();}
if(OUT)fs.writeFileSync(OUT,JSON.stringify(all));await b.close();
// 판정(사용자 2026-11-15 10:09Z "스킬이나 공격할때 항상 공격모션 사용 … 모션변경시 부피나 크기 달라지는거 전수조사해서 개선")
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const ART=/attack|skill|atk|slash|strike/i,med=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[s.length>>1]:null;};
for(const [h,rows] of Object.entries(all)){const R=rows.filter(r=>r.visH!=null);
 const idle=R.filter(r=>!(r.aa>0||r.sk>0||r.ul>0||r.hu>0||r.da>0||r.gd||r.mv));const skill=R.filter(r=>(r.sk>0||r.ul>0)&&!(r.da>0)&&!r.gd&&!r.samong&&!r.mv)/* 이동 입력 중 스킬은 R895 규칙 2(커밋 뒤 걷기 캔슬)가 걷기로 보이는 게 맞다 */;const atk=R.filter(r=>r.aa>0&&!(r.sk>0||r.ul>0||r.hu>0||r.da>0||r.gd||r.mv));
 const fr=a=>a.length?a.filter(r=>ART.test(r.src)&&!r.walk).length/a.length:null;const I=med(idle.map(r=>r.visH/r.z));
 const odd=a=>{const m={};for(const r of a)if(!(ART.test(r.src)&&!r.walk)){const k=(r.walk?'W:':'')+r.src;m[k]=(m[k]||0)+1;}return Object.entries(m).sort((x,y)=>y[1]-x[1]).slice(0,4);};
 ok(`${h}: 스킬 장면 85% 이상 공격·스킬 그림`,skill.length<5||fr(skill)>=.85,{n:skill.length,frac:fr(skill)&&+fr(skill).toFixed(2),odd:odd(skill)});
 ok(`${h}: 기본 공격 장면 85% 이상 공격 그림`,atk.length<5||fr(atk)>=.85,{n:atk.length,frac:fr(atk)&&+fr(atk).toFixed(2),odd:odd(atk)});
 for(const [k,a] of [['공격',atk],['스킬',skill],['피격',R.filter(r=>r.hu>0&&!(r.sk>0||r.ul>0))]]){if(a.length<5||!I)continue;const v=med(a.map(r=>r.visH/r.z))/I;ok(`${h}: ${k} 몸 키 = 서기의 ±6%`,v>=.94&&v<=1.06,{ratio:+v.toFixed(3),idle:+I.toFixed(1)});}
 {const walk=R.filter(r=>r.mv&&!(r.aa>0||r.sk>0||r.ul>0||r.hu>0||r.da>0||r.gd));if(walk.length>=5&&I){const v=med(walk.map(r=>r.visH/r.z))/I;ok(`${h}: 걷기 몸 키 = 서기의 ±6%`,v>=.94&&v<=1.06,{n:walk.length,ratio:+v.toFixed(3)});}else console.log('NOTE',h,'걷기 표본 부족',walk.length);}
 if(['neon','lauren'].includes(h)){const diag=atk.filter(r=>/attack[-_](se|ne)\b/i.test(r.src)).length;ok(`${h}: 기본 공격은 좌·우 시트 위주(대각 시트 0)`,diag===0,{n:atk.length,diag,side:atk.filter(r=>/r437/.test(r.src)).length});}
 ok(`${h}: 그리기 값 유한`,rows.every(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)));}
console.log(fail?`\nR1050b 실패 ${fail}`:'\nR1050b 모두 통과');process.exit(fail?1:0);
