// R1102 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽·실기기 검증 아님).
//  사용자 2026-11-16 06:12Z "헌터 기본화살이 너무크고 활에서 안나가는 문제 개선 및 헌터 공격및 스킬시전시 항상 공격모션나가도록".
//  헌터 생존 판(반자동)을 STILL 게임 초 멈춰서, MOVE 게임 초 좌우로 걸으며 싸우게 두고 잰다.
//   ① 기본 화살 몸통 긴 변 = 영웅 화면 키의 0.45~0.56배(이전 0.80배)
//   ② 기본 화살이 처음 그려진 자리가 그 순간 공격 그림(R425)의 활 손잡이에서 영웅 키 0.25배 안(90% 이상) — R1102b: 시위 줄 기준·꼬리(오늬) 0.2배 안(이전 손잡이 기준 0.25배, 중앙값 0.164 → 0.115)
//   ③ 공격·스킬 중(대시·EGO/사몽 변신 제외) 몸 그림이 활 당기기 공격 그림(R425 좌·우 7칸) — 멈춰서 95%, 걸으며 85% 이상
//   ④ 한 화면에 헌터 몸 그림은 하나(보호막 돔이 몸 그림으로 바뀌어 헌터가 둘로 보이던 것 금지)
//   ⑤ 그리기 값 유한·페이지 오류 0
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'',STILL=+process.env.STILL||16,MOVE=+process.env.MOVE||10;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hunter"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
await A(()=>{const R=window.__R1102={frames:[],shots:[],arrows:[],phase:'still'};const GRIP={r:[125,79],l:[67,79]};/* R1102b: 시위 줄 */
 const BODY=/hero_direction|hero-authored|heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r130\/[a-z]+\/|r143\/|r164\/|r425\/hunter\/|r437\/|r710\/|^blob:/;
 const sp=c=>String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,'').split('?')[0];let lastGrip=null;
 const mk=makeShot;makeShot=function(...a){const s=mk.apply(this,a);try{if(s&&s.friendly&&s.owner==='hero'&&player.hero==='hunter'&&!player.r720Ally&&s.r160Basic){const q=project(s.x,s.y);const q2=project(s.x+s.vx*.05,s.y+s.vy*.05),dl=Math.hypot(q2.x-q.x,q2.y-q.y)||1;const en=nearestEnemy(8.3),pp=project(player.x,player.y),ep=en?project(en.x,en.y):null;R.shots.push({t:time,id:s.id,phase:R.phase,ed:ep?Math.hypot(ep.x-pp.x,ep.y-pp.y):1e9,ox:q.x,oy:q.y-18*(typeof zoom==='number'?zoom:1),dx:(q2.x-q.x)/dl,dy:(q2.y-q.y)/dl});}}catch(e){}return s;};
 const dp=drawProjectile;drawProjectile=function(pr,...a){if(!pr||!pr.friendly||!pr.r160Basic||!Array.isArray(ctx.commands)||!(pr.age<.4)||player?.r720Ally)return dp.call(this,pr,...a);const st=ctx.commands.length;const r=dp.call(this,pr,...a);
  try{const c0=ctx.commands.slice(st).find(c=>c.kind==='image'&&c.points&&/r912\/pj02-fly/.test(sp(c)));if(c0&&R.arrows.length<3000){const P=c0.points,side=Math.hypot(P[1][0]-P[0][0],P[1][1]-P[0][1]),cx=(P[0][0]+P[2][0])/2,cy=(P[0][1]+P[2][1])/2;
   R.arrows.push({t:time,id:pr.id,age:pr.age,phase:R.phase,side,cx,cy,ah:actorHeight(),grip:lastGrip&&lastGrip.t>=time-.06?lastGrip:null});}}catch(e){}return r;};
 const dh=drawHero;drawHero=function(...a){const P=player;if(!P||P.r720Ally||!Array.isArray(ctx.commands))return dh.apply(this,a);
  const pre={aa:+P.attackAnim||0,sk:+P.skillAnim||0,ul:+P.ultimateAnim||0,hu:+P.hurtAnim||0,da:+P.dashAnim||0,mv:!!P.moving,gd:!!P.guard,form:+P.samong>0||+P.ego>0,x:P.x,y:P.y};const st=ctx.commands.length;const r=dh.apply(this,a);
  const bodies=[];for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const s=sp(c);if(BODY.test(s)&&/hunter/.test(s))bodies.push(c);}
  const row={t:time,phase:R.phase,...pre,n:bodies.length,src:bodies.map(sp).join('|')};const c=bodies.sort((a,b)=>Math.abs(b.points[3][1]-b.points[0][1])-Math.abs(a.points[3][1]-a.points[0][1]))[0];
  if(c){const m=/r425\/hunter\/attack-([lr])/.exec(sp(c));if(m&&c.sourceRect){const [gx,gy]=GRIP[m[1]],P0=c.points[0],P1=c.points[1],P3=c.points[3],cw=c.sourceRect[2],ch=c.sourceRect[3];lastGrip={t:time,side:m[1],x:P0[0]+(P1[0]-P0[0])*gx/cw,y:P0[1]+(P3[1]-P0[1])*gy/ch};}row.fin=c.points.flat().every(Number.isFinite);}
  R.frames.push(row);return r;};});
// 섞이는 시간 표본(사냥 분대·EGO 등)이 매번 같도록 난수는 그대로 둔다 — 비율 기준.
let t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+STILL,{timeout:1800000});
await A(()=>{window.__R1102.phase='move';});
for(let i=0;i<MOVE/2;i++){const k=i%2?'ArrowLeft':'ArrowRight';const w0=await A(()=>time);await p.keyboard.down(k);await p.waitForFunction(a=>time>=a,w0+2,{timeout:900000});await p.keyboard.up(k);}
const R=await A(()=>({...window.__R1102,aim:window.__STORYWORLD_HUNTER_AIM_R1102__.inspect().stats}));if(OUT)fs.writeFileSync(OUT,JSON.stringify(R));await b.close();
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const first=new Map();for(const a of R.arrows)if(!first.has(a.id))first.set(a.id,a);const F=[...first.values()];
const ratio=F.map(a=>a.side*213/256/a.ah).sort((x,y)=>x-y),med=ratio[ratio.length>>1];
ok('① 기본 화살 몸통 긴 변 = 영웅 키 0.45~0.56배',F.length>=10&&med>=.45&&med<=.56,{n:F.length,median:med&&+med.toFixed(3),min:ratio[0]&&+ratio[0].toFixed(3),max:ratio.at(-1)&&+ratio.at(-1).toFixed(3)});
// ② 출발점: 쏜 순간 화살 자리(엔진 출발점 = 탄 자리)와 그때 그린 활 손잡이 거리
const near=[],nearMove=[];for(const s of R.shots){/* 표적이 영웅 키 1.5배 안(코앞)이면 출발점이 표적을 넘어가 방향이 뒤집힐 수 있어 제외 */const f=R.frames.find(f=>f.t>=s.t-1e-6&&f.t<=s.t+.06&&f.phase===s.phase);const g=R.arrows.find(a=>a.id===s.id)?.grip||null;const gr=g||(()=>null)();if(!gr)continue;const ah=R.arrows.find(a=>a.id===s.id)?.ah||44;/* 화살 몸통 가운데에서 몸통 절반(0.25배)만큼 뒤 = 꼬리(오늬) */if(s.ed<1.5*ah)continue;(s.phase==='move'?nearMove:near).push(Math.hypot(s.ox-s.dx*.25*ah-gr.x,s.oy-s.dy*.25*ah-gr.y)/ah);}
const okN=near.filter(d=>d<=.2).length;ok('② 기본 화살 꼬리가 활시위에서 출발(영웅 키 0.2배 안) 90% 이상(멈춰 있을 때)',near.length>=10&&okN/near.length>=.9,{n:near.length,frac:near.length&&+(okN/near.length).toFixed(2),median:near.length&&+[...near].sort((a,b)=>a-b)[near.length>>1].toFixed(3)});
/* 걸으며 쏠 때는 쏜 틱과 그린 프레임 사이에 영웅이 걸어 한두 걸음 어긋난다(헤드리스는 틱이 길다) → 참고만: 0.35배 안 60% 이상 */
ok('② 걸으며 쏠 때도 대체로 시위 근처(0.35배 안 60% 이상)',nearMove.length<5||nearMove.filter(d=>d<=.35).length/nearMove.length>=.6,{n:nearMove.length,frac:nearMove.length&&+(nearMove.filter(d=>d<=.35).length/nearMove.length).toFixed(2)});
for(const ph of ['still','move']){const act=R.frames.filter(f=>f.phase===ph&&(f.aa>0||f.sk>0||f.ul>0)&&!(f.da>0)&&!f.gd&&!f.form);const atk=act.filter(f=>/r425\/hunter\/attack-/.test(f.src)).length;
 const need=ph==='still'?.95:.85;const odd={};for(const f of act)if(!/r425\/hunter\/attack-/.test(f.src)){const k=f.src.split('|').map(s=>s.split('/').slice(-2).join('/')).join('|')+(f.hu>0?' (hurt)':'');odd[k]=(odd[k]||0)+1;}
 ok(`③ ${ph==='still'?'멈춰서':'걸으며'} 공격·스킬 중 활 당기기 공격 그림 ${need*100}% 이상`,act.length>=10&&atk/act.length>=need,{n:act.length,frac:act.length&&+(atk/act.length).toFixed(2),odd:Object.entries(odd).sort((a,b)=>b[1]-a[1]).slice(0,5)});}
const dbl=R.frames.filter(f=>f.n>1);ok('④ 한 화면에 헌터 몸 그림 하나',dbl.length===0,{frames:R.frames.length,double:dbl.length,ex:dbl.slice(0,2).map(f=>f.src)});
ok('⑤ 그리기 값 유한·페이지 오류 0',R.frames.every(f=>f.fin!==false)&&errs.length===0,{errs:errs.slice(0,3)});
console.log(fail?`\nR1102 브라우저 실패 ${fail}`:'\nR1102 브라우저 모두 통과');process.exit(fail?1:0);
