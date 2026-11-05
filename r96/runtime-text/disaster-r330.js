// R330 보스급 재해 스킬 — 사용자 2026-11-05
//  "적들 스킬에 이펙트 생성해서 볼케이노·토네이도·블리자드 같은 재해 스킬, 재해 스킬은 보스급만. 육망성이 그려지고 위협적인 무언가가
//   날아가거나 소환되어 플레이어에게 위협이 되어야 해" + "생화학 독안개·폭탄 폭발·핵폭탄 폭발+방사능 오염·침수 홍수 등 다양한 재해,
//   보스 특성에 맞게 각각 고유 재해. 동양 요괴·요괴/귀신 작품들 참고".
//  · 보스·중간보스(보스급)만. 영웅이 12칸 안에 있으면 보스 13초·중간보스 18초마다 그 보스의 고유 재해를 한 번 쓴다.
//  · 순서는 늘 같다: 보스 머리 위 허공에 핏빛 육망성(1초, 부적 조각이 돈다) → 재해가 날아오거나 소환된다 → 엔진 위험지대(hazards)로 실제 피해.
//    떨어질 자리에는 바닥에 핏빛 육망성(CX-0043: 바닥 예고는 육망성만 기본으로 보인다)이 먼저 그려져 피할 틈을 준다.
//  · 고유 재해는 보스 이름 → 지역 성격(R81 family) 순으로 고른다. 지역·보스 설정은 지어내지 않고 이미 있는 이름·성격만 읽는다.
//      화산(불·지옥·대장간·잿더미·석조·동굴) / 회오리(바람·하늘·천사·기본) / 눈보라(눈·얼음) / 생화학 독안개(병원·정원·역병·약)
//      폭탄(도시·기계·신경) / 홍수(해안·늪·물) / 도깨비불 행렬(기억·꿈·집·인형·귀신 — 동양 요괴의 귀화(鬼火)·부적 모티프, 원리만)
//      핵폭발+방사능(우주적·최종 보스만, 가장 긴 예고).
//  · 색: SKILL.md 10절 — 적 = 호러 배색(위협 #0B0D0E·#641B25·국소 #D12835 / 부패 #52402D·#929B30 / 불쾌한 골짜기 #568B84·#BCA99F).
//  · 그림은 R106 칠한 스프라이트만(외부 게임 자산 없음). 동시 효과 상한, 이지 난이도 피해 ×0.6.
//  · 끄기: localStorage['storyworld.r330.disaster']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_DISASTER_R330__)return;
const REV='R330-disaster-1',KEY='storyworld.r330.disaster';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={casts:0,byKind:{},hazards:0,draws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,TAU=Math.PI*2;
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const rnd=()=>Math.random();
const C=(a,b)=>({a,b});
// 호러 팔레트(SKILL.md 10절)
const P={blood:C([100,27,37],[209,40,53]),ink:C([11,13,14],[100,27,37]),ember:C([100,27,37],[255,120,60]),ash:C([40,40,42],[104,108,108]),
 rot:C([82,64,45],[146,155,48]),mustard:C([82,64,45],[166,154,66]),frost:C([40,60,70],[188,200,205]),sick:C([30,60,58],[86,139,132]),
 rad:C([40,70,30],[160,210,70]),ashL:C([74,72,74],[176,172,170]),rotL:C([96,88,40],[206,198,92]),waterL:C([24,56,62],[150,206,196]),water:C([10,24,30],[86,139,132]),wisp:C([67,52,71],[188,169,159]),bruise:C([40,30,50],[84,64,94])};
const KINDS=['volcano','tornado','blizzard','poison','bomb','flood','wisp','nuke'];
const NAME={volcano:'화산',tornado:'회오리',blizzard:'눈보라',poison:'생화학 독안개',bomb:'폭탄 폭발',flood:'홍수',wisp:'도깨비불 행렬',nuke:'핵폭발 · 방사능 오염'};
const BYNAME=[[/화염|불꽃|불의|용암|지옥|발록|화로|재의|잿|태양/,'volcano'],[/바람|폭풍|하늘|천사|날개|깃털|까마귀/,'tornado'],[/얼음|눈의|서리|겨울|빙/,'blizzard'],
 [/독|역병|병동|약|부패|시체|환자|중독|수술|의사|간호/,'poison'],[/폭탄|화약|기계|군|무기|공장|전기|코어|관리자/,'bomb'],[/물|바다|익사|비의|홍수|늪|파도|해/,'flood'],
 [/기억|꿈|인형|귀신|유령|무당|그림자|거울|아이|어머니|사몽/,'wisp']];
const BYFAM={clinical:'poison',garden:'poison',swamp:'flood',coast:'flood',cave:'volcano',stone:'volcano',ash:'volcano',forge:'volcano',snow:'blizzard',domestic:'wisp',memory:'wisp',neural:'bomb',regional:'tornado'};
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongMidR162||e.samongR103));
const isBoss=e=>!!(e&&(e.boss||e.persona||e.cosmic));
function fam(){try{const L=room?.exploration;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[room?.id]?.family||'regional';}catch(_){return'regional';}}
function kindOf(e){if(e.r330Kind)return e.r330Kind;let k=null;const n=String(e.name||'');
 if(e.cosmic||/최종|종말|신의|우주/.test(n))k='nuke';
 if(!k)for(const[re,v]of BYNAME)if(re.test(n)){k=v;break;}
 if(!k)k=BYFAM[fam()]||'tornado';
 e.r330Kind=k;return k;}
function easy(){try{const d=String(room?.difficultyR63||'');return/easy|이지|쉬움/i.test(d);}catch(_){return false;}}
function dmgBase(e){const d=Number(e.damage)||20;return Math.max(4,d)*(easy()?.6:1)*(isBoss(e)?1:.7);}
let uidN=0;
function hz(e,x,y,radius,warning,life,damage,extra){try{if(typeof hazards==='undefined'||!Array.isArray(hazards))return null;
 const h={id:typeof uid!=='undefined'?++uid:'r330:'+(++uidN),type:'r330-'+(extra?.kind||'hit'),owner:e.id,x,y,radius,age:0,warning,life,asset:null,damage,lastHit:-99,r330:true,...(extra||{})};
 hazards.push(h);stats.hazards++;return h;}catch(err){fail(err);return null;}}
const fx=[];const SENT={type:'r330-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function push(f){if(fx.length>40)fx.shift();fx.push(f);arm();return f;}
function near(x,y,r){const a=rnd()*TAU,d=Math.sqrt(rnd())*r;let px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;try{if(typeof blocked==='function'&&blocked(px,py,.3,room)){px=x;py=y;}}catch(_){}return{x:px,y:py};}
// ---- 재해별 시전(육망성 1초 뒤 phase 'go') --------------------------------------------------------------------
const SIGIL=1.0;
const GO={
 volcano(e,t,D){for(let i=0;i<6;i++){const p=i===0?{x:player.x,y:player.y}:near(player.x,player.y,3.2),d=t+i*.38,w=.95;
   push({k:'meteor',x:p.x,y:p.y,t0:d,warn:w,R:.95,pal:P.ember,seed:rnd()*6});
   later(d,()=>{hz(e,p.x,p.y,.95,w,w+.3,D*.55,{kind:'magma'});hz(e,p.x,p.y,.8,w+.3,w+1.8,D*.12,{kind:'lava'});});}},
 tornado(e,t,D){const f=push({k:'tornado',x:e.x,y:e.y,t0:t,warn:.6,life:5,R:1.15,pal:P.ash,seed:rnd()*6,owner:e});
   later(t,()=>{f.h=hz(e,f.x,f.y,1.15,.6,5,D*.22,{kind:'tornado'});});},
 blizzard(e,t,D){const cx=player.x,cy=player.y;push({k:'snowcloud',x:cx,y:cy,t0:t,life:3.6,R:3,pal:P.frost});
   for(let i=0;i<11;i++){const p=near(cx,cy,3),d=t+.25+i*.28;push({k:'icicle',x:p.x,y:p.y,t0:d,warn:.75,R:.7,pal:P.frost,seed:rnd()*6});later(d,()=>hz(e,p.x,p.y,.7,.75,1.05,D*.35,{kind:'ice'}));}},
 poison(e,t,D){const x=player.x,y=player.y;push({k:'fog',x,y,t0:t,warn:.8,life:6.5,R:2.3,pal:P.rot,seed:rnd()*6});later(t,()=>hz(e,x,y,2.3,.8,6.5,D*.16,{kind:'poison'}));
   for(let i=0;i<3;i++){const p=near(e.x,e.y,1.4);push({k:'canister',x:p.x,y:p.y,tx:x,ty:y,t0:t,life:.8,pal:P.mustard});}},
 bomb(e,t,D){for(let i=0;i<3;i++){const p=i===0?{x:player.x,y:player.y}:near(player.x,player.y,2.6),d=t+i*.3,fuse=1.35;
   push({k:'bomb',x:p.x,y:p.y,sx:e.x,sy:e.y,t0:d,warn:fuse,R:1.45,pal:P.blood,seed:rnd()*6});later(d,()=>hz(e,p.x,p.y,1.45,fuse,fuse+.3,D*.8,{kind:'bomb'}));}},
 flood(e,t,D){const dx=player.x-e.x,dy=player.y-e.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
   for(let i=0;i<7;i++){const s=1.2+i*1.15,x=e.x+ux*s,y=e.y+uy*s,d=t+i*.22;push({k:'wave',x,y,ux,uy,t0:d,warn:.55,R:1.35,pal:P.water,seed:rnd()*6});
    later(d,()=>hz(e,x,y,1.35,.55,.95,D*.42,{kind:'flood',push:{x:ux,y:uy}}));}
   push({k:'puddle',x:player.x,y:player.y,t0:t+1.4,life:3,R:2.4,pal:P.water});},
 wisp(e,t,D){const n=7;for(let i=0;i<n;i++){const d=t+.5+i*.32;push({k:'wisp',e,i,n,t0:t,launch:d,life:d-t+1.4,pal:P.wisp,seed:rnd()*6});
   later(d,()=>{const x=player.x,y=player.y;const f=fx.find(q=>q.k==='wisp'&&q.e===e&&q.i===i&&q.launch===d);if(f){f.tx=x;f.ty=y;}hz(e,x,y,.85,.7,1,D*.3,{kind:'wisp'});push({k:'mark',x,y,t0:T(),warn:.7,R:.85,pal:P.blood});});}},
 nuke(e,t,D){const x=player.x,y=player.y,w=2.6;push({k:'nuke',x,y,t0:t,warn:w,R:4,pal:P.blood,seed:rnd()*6});
   later(t,()=>{hz(e,x,y,4,w,w+.35,D*1.6,{kind:'nuke'});hz(e,x,y,3.4,w+.4,w+7.4,D*.12,{kind:'radiation'});});
   push({k:'rad',x,y,t0:t+w+.3,life:7,R:3.4,pal:P.rad,seed:rnd()*6});}
};
const queue=[];function later(at,fn){queue.push({at,fn});}
function cast(e){const k=kindOf(e),t=T(),D=dmgBase(e);stats.casts++;stats.byKind[k]=(stats.byKind[k]||0)+1;
 push({k:'sigil',e,t0:t,life:SIGIL+.35,kind:k,sc:isBoss(e)?1.3:1});
 try{GO[k](e,t+SIGIL,D);}catch(err){fail(err);}
 try{if(typeof toast==='function'&&(stats.byKind[k]<=2))toast('재해 · '+NAME[k]+' — '+(e.name||'보스'),2.2);}catch(_){}}
function live(){return typeof started!=='undefined'&&started&&typeof player==='object'&&player&&player.hp>0&&typeof room==='object'&&room&&Array.isArray(room.enemies);}
function tickAll(dt){if(!live())return;const t=T();
 for(let i=queue.length-1;i>=0;i--)if(t>=queue[i].at){const q=queue.splice(i,1)[0];try{q.fn();}catch(err){fail(err);}}
 if(on)for(const e of room.enemies){if(!major(e)||!(e.hp>0)||e.r251Circle||e.spawnState&&e.spawnState!=='active')continue;
  const d=Math.hypot(player.x-e.x,player.y-e.y);if(d>12){if(e.r330Next)e.r330Next=Math.max(e.r330Next,t+2);continue;}
  if(!e.r330Next){e.r330Next=t+5+rnd()*2;continue;}
  if(t>=e.r330Next&&!(e.attack&&e.attack.committed)){e.r330Next=t+(isBoss(e)?13:18)+rnd()*2;cast(e);}}
 // 회오리: 영웅을 쫓아가며 빨아들인다 / 홍수: 밀어낸다
 for(const f of fx){if(f.k==='tornado'&&t>=f.t0&&t-f.t0<f.life){const e=f.owner,dx=player.x-f.x,dy=player.y-f.y,L=Math.hypot(dx,dy)||1,sp=1.9*dt;
   let nx=f.x+dx/L*Math.min(sp,L),ny=f.y+dy/L*Math.min(sp,L);try{if(typeof blocked==='function'&&blocked(nx,ny,.3,room)){nx=f.x;ny=f.y;}}catch(_){}f.x=nx;f.y=ny;if(f.h){f.h.x=nx;f.h.y=ny;}
   if(L<2.4&&L>.25&&typeof moveActor==='function'&&!(player.invincible>0))try{moveActor(player,-dx/L*dt*1.1,-dy/L*dt*1.1);}catch(_){}}}
 if(typeof hazards!=='undefined'&&Array.isArray(hazards)&&typeof moveActor==='function')for(const h of hazards){if(h.r330&&h.push&&h.age>=h.warning&&h.age<h.life&&Math.hypot(player.x-h.x,player.y-h.y)<h.radius&&!(player.invincible>0))try{moveActor(player,h.push.x*dt*2.2,h.push.y*dt*2.2);}catch(_){}}
 for(let i=fx.length-1;i>=0;i--){const f=fx[i],end=(f.launch??f.t0)+(f.life??((f.warn||0)+1.2));if(t>end+.2||f.k==='sigil'&&!(f.e.hp>0))fx.splice(i,1);}
 if(!fx.length)disarm();}
// ---- 그림 ------------------------------------------------------------------------------------------------
function ground(S,pal,q,w,a,ang){S.draw('rune',P.ink,q.x,q.y,w*2.05,w*2.05,{squash:.5,angle:ang,alpha:.55*a,blend:'source-over'});S.draw('rune',pal,q.x,q.y,w*2,w*2,{squash:.5,angle:ang,alpha:a});}
function px(x,y){const a=project(x,y),b=project(x+1,y),c=project(x,y+1);return Math.max(Math.hypot(b.x-a.x,b.y-a.y),Math.hypot(c.x-a.x,c.y-a.y))*1.25;}/* 바닥 1칸의 화면 길이 */
function drawAll(){const S0=SPR();if(!S0||typeof project!=='function')return;/* 재해는 영웅 자리에 떨어지므로 R106 의 '영웅 근처 흐리게'를 끈다 */const S={draw:(n,F,x,y,w,hh,o={})=>S0.draw(n,F,x,y,w,hh,{overHero:true,...o})};const t=T(),h=H();stats.draws++;
 for(const f of fx){const el=t-f.t0;if(el<0)continue;const q=project(f.x??f.e?.x??0,f.y??f.e?.y??0);
  const sc=(fn)=>{if(typeof ctx.scope==='function')ctx.scope({id:'r330:'+f.k+':'+f.t0,kind:'effect',x:f.x??0,y:f.y??0},fn);else fn();};
  sc(()=>{switch(f.k){
  case'sigil':{const e=f.e,g=project(e.x,e.y),v=Math.min(1,el/SIGIL),out=el>SIGIL?Math.max(0,1-(el-SIGIL)/.35):1,R=h*(.38+.26*(1-(1-v)**3))*f.sc,y=g.y-h*1.75*f.sc;
   S.draw('glow',P.blood,g.x,y,R*1.6,R*1.6,{alpha:.4*out,overHero:true});S.draw('rune',P.ink,g.x,y,R*2.12,R*2.12,{angle:t*1.3,alpha:out,blend:'source-over',overHero:true});
   S.draw('rune',P.blood,g.x,y,R*2,R*2,{angle:t*1.3,alpha:.85*out,overHero:true});
   for(let i=0;i<6;i++){const a=t*2.2+i*TAU/6;S.draw('shard',C([120,96,70],[214,198,172]),g.x+Math.cos(a)*R*1.15,y+Math.sin(a)*R*.55,h*.16,h*.3,{angle:a+Math.PI/2,alpha:.8*out,blend:'source-over',overHero:true});}/* 부적 조각 */
   if(v>.75)S.draw('flare',P.blood,g.x,y,R*1.2,R*1.2,{alpha:.7*out*(v-.75)*4,overHero:true});break;}
  case'meteor':{const w=f.R*px(f.x,f.y),warn=el<f.warn;if(warn){const u=el/f.warn;ground(S,P.blood,q,w,.5+.5*u,f.seed+el);
    const sy=q.y-h*7,sx=q.x-h*2.2,mx=sx+(q.x-sx)*u*u,my=sy+(q.y-sy)*u*u;S.draw('smoke',P.ash,mx-(q.x-sx)*.08,my-(q.y-sy)*.08,h*.9,h*.9,{alpha:.55,overHero:true,blend:'source-over'});
    S.draw('flame',P.ember,mx,my,h*.75,h*.95,{alpha:.95,angle:Math.atan2(q.y-sy,q.x-sx)-Math.PI/2,overHero:true});S.draw('glow',P.ember,mx,my,h*.9,h*.9,{alpha:.6,overHero:true});}
   else{const v=el-f.warn,u=Math.min(1,v/.5);if(v<1.9){S.draw('crack',P.ink,q.x,q.y,w*2.3,w*1.15,{squash:.5,alpha:.9*(1-v/1.9),blend:'source-over',angle:f.seed});
     S.draw('flame',P.ember,q.x,q.y-h*.1,w*1.1,h*(.9-.4*u),{alpha:.85*(1-v/1.9),overHero:true});if(v<.5)S.draw('flare',P.ember,q.x,q.y-h*.3,w*2.4*u,w*2.4*u,{alpha:1-u,overHero:true});
     S.draw('smoke',P.ash,q.x+w*.2,q.y-h*(.5+.6*u),w*1.6,w*1.6,{alpha:.55*(1-v/1.9),blend:'source-over'});}}break;}
  case'tornado':{if(el>f.life)break;const w=f.R*px(f.x,f.y),a=el<f.warn?el/f.warn:Math.min(1,(f.life-el)/.6);S.draw('pillar',P.ashL,q.x,q.y,w*1.3,h*2.6,{alpha:.55*a,overHero:true});for(let i=0;i<7;i++){const k=i/6,r=w*(.5+1.1*k),yy=q.y-h*(.1+2.3*k);S.draw('ring',i%2?P.ashL:P.blood,q.x+Math.sin(t*5+i)*w*.12,yy,r*2,r*.7,{angle:t*(6-i*.5),alpha:(.85-.4*k)*a,overHero:true});}
   for(let i=0;i<6;i++){const k=i/5,r=w*(.45+.75*k),y=q.y-h*(.15+1.9*k),sp=t*(5-i*.4)+i;S.draw('smoke',i%2?P.ashL:P.ash,q.x+Math.cos(sp)*r*.25,y,r*1.5,r*.75,{angle:sp,alpha:.8*a,blend:'source-over',overHero:true});}S.draw('glow',P.blood,q.x,q.y-h*.9,w*1.6,h*1.6,{alpha:.35*a,overHero:true});
   S.draw('ring',P.blood,q.x,q.y,w*2.2,w*1.1,{angle:t*4,alpha:.5*a});for(let i=0;i<4;i++){const sp=t*6+i*1.6;S.draw('spark',P.blood,q.x+Math.cos(sp)*w*.9,q.y-h*(.3+i*.35),h*.18,h*.06,{angle:sp,alpha:.8*a,overHero:true});}break;}
  case'snowcloud':{if(el>f.life)break;const w=f.R*px(f.x,f.y),a=Math.min(1,el/.4,(f.life-el)/.6);S.draw('glow',P.frost,q.x,q.y-h*2.6,w*2.6,w*1,{alpha:.55*a,overHero:true});S.draw('glow',P.frost,q.x,q.y,w*2.2,w*1.1,{alpha:.3*a});S.draw('smoke',P.frost,q.x,q.y-h*2.6,w*2.4,w*.9,{alpha:.55*a,blend:'source-over',overHero:true});
   S.draw('smoke',P.ash,q.x+w*.4,q.y-h*2.75,w*1.8,w*.7,{alpha:.45*a,blend:'source-over',overHero:true});for(let i=0;i<10;i++){const sx=q.x+(((i*97+Math.floor(el*7))%20)/20-.5)*w*2.2,sy=q.y-h*2.4+((el*h*2.4+i*h*.31)%(h*2.6));S.draw('shard',P.frost,sx,sy,h*.08,h*.18,{angle:.3,alpha:.7*a});}break;}
  case'icicle':{const w=f.R*px(f.x,f.y);if(el<f.warn){const u=el/f.warn;ground(S,P.blood,q,w,.45+.55*u,f.seed);S.draw('shard',P.frost,q.x,q.y-h*(2.6-2.6*u*u),h*.28,h*.75,{alpha:.95,overHero:true});}
   else{const v=el-f.warn;if(v<.6){S.draw('shard',P.frost,q.x,q.y-h*.3,h*.3,h*.7*(1-v),{alpha:1-v/.6,overHero:true});S.draw('spark',P.frost,q.x,q.y-h*.2,w*1.6,w*.6,{alpha:1-v/.6});}}break;}
  case'fog':{if(el>f.life)break;const w=f.R*px(f.x,f.y),grow=Math.min(1,el/f.warn),a=Math.min(1,(f.life-el)/.8);for(let i=0;i<5;i++){const a2=f.seed+i*1.3+el*.3,r=w*.55*grow;S.draw('glow',i%2?P.rotL:P.rad,q.x+Math.cos(a2)*r,q.y+Math.sin(a2)*r*.5-h*.3,w*1.3*grow,w*.8*grow,{alpha:.45*a});}for(let i=0;i<6;i++){const a2=f.seed*3+i*1.7,r=w*.7*((i*29)%6)/6,yy=q.y+Math.sin(a2)*r*.5-((el*h*.5+i*h*.25)%(h*1.2));S.draw('orb',P.mustard,q.x+Math.cos(a2)*r,yy,h*.09,h*.09,{alpha:.8*a*grow});}if(el<f.warn)ground(S,P.blood,q,w*.8,.4+.6*grow,f.seed);
   for(let i=0;i<7;i++){const a2=f.seed+i*TAU/7+el*.25,r=w*(.35+.45*((i*37)%7)/7)*grow;S.draw('smoke',i%3?P.rotL:P.mustard,q.x+Math.cos(a2)*r,q.y+Math.sin(a2)*r*.5-h*.25,w*1.1,w*.7,{alpha:.7*a*grow,blend:'source-over',angle:a2});}
   S.draw('glow',P.rad,q.x,q.y-h*.2,w*2.2,w*1.1,{alpha:.4*a*grow});break;}
  case'canister':{const v=Math.min(1,el/f.life),a=project(f.x,f.y),b=project(f.tx,f.ty),x=a.x+(b.x-a.x)*v,y=a.y+(b.y-a.y)*v-Math.sin(v*Math.PI)*h*1.6;if(el<f.life){S.draw('orb',P.mustard,x,y,h*.22,h*.22,{alpha:.95,overHero:true});S.draw('smoke',P.rot,x-(b.x-a.x)*.05,y,h*.3,h*.3,{alpha:.5,blend:'source-over'});}break;}
  case'bomb':{const w=f.R*px(f.x,f.y);if(el<f.warn){const u=el/f.warn,fl=Math.min(1,el/.45),a=project(f.sx,f.sy),x=a.x+(q.x-a.x)*fl,y=a.y+(q.y-a.y)*fl-Math.sin(fl*Math.PI)*h*1.8;
    ground(S,P.blood,q,w,.35+.65*u,f.seed);S.draw('orb',P.ink,x,y-h*.12,h*.32,h*.32,{alpha:1,blend:'source-over',overHero:true});if(Math.sin(el*(8+16*u))>0)S.draw('glow',P.blood,x,y-h*.2,h*.35,h*.35,{alpha:.9,overHero:true});}
   else{const v=el-f.warn,u=Math.min(1,v/.45);if(v<1.3){S.draw('flare',P.ember,q.x,q.y-h*.35,w*3*u,w*3*u,{alpha:1-u,overHero:true});S.draw('crack',P.ink,q.x,q.y,w*2.2,w*1.1,{squash:.5,alpha:.85*(1-v/1.3),blend:'source-over'});
     S.draw('smoke',P.ashL,q.x,q.y-h*(.4+.8*u),w*2*u,w*1.6*u,{alpha:.7*(1-v/1.3),blend:'source-over'});for(let i=0;i<6;i++){const a2=f.seed+i;S.draw('spark',P.ember,q.x+Math.cos(a2)*w*u*1.4,q.y-h*.3+Math.sin(a2)*w*u*.7,h*.25,h*.07,{angle:a2,alpha:1-u});}}}break;}
  case'wave':{const w=f.R*px(f.x,f.y);if(el<f.warn){ground(S,P.blood,q,w*.7,.35+.65*el/f.warn,f.seed);}else{const v=el-f.warn;if(v<.8){const u=v/.8;S.draw('pillar',P.waterL,q.x,q.y,w*2.2,h*(1.4-.9*u),{alpha:.7*(1-u),overHero:true});S.draw('ring',C([120,170,165],[230,240,235]),q.x,q.y-h*(1-.6*u),w*2,w*.5,{alpha:.8*(1-u),overHero:true});
    S.draw('smoke',P.waterL,q.x,q.y-h*.35,w*2.2,h*(1.3-.8*u),{alpha:.85*(1-u),blend:'source-over',overHero:true});S.draw('glow',P.waterL,q.x,q.y-h*.3,w*2,h,{alpha:.45*(1-u),overHero:true});S.draw('ring',P.water,q.x,q.y,w*2.2*(.6+.6*u),w*1.1*(.6+.6*u),{alpha:.7*(1-u)});
    S.draw('spark',C([60,80,80],[214,220,215]),q.x,q.y-h*(.9-.5*u),w*1.4,h*.12,{alpha:.7*(1-u),overHero:true});}}break;}
  case'puddle':{if(el>f.life)break;const w=f.R*px(f.x,f.y),a=Math.min(1,el/.3,(f.life-el)/.8);S.draw('ring',P.waterL,q.x,q.y,w*2,w,{alpha:.55*a});S.draw('glow',P.waterL,q.x,q.y,w*2,w,{alpha:.3*a});break;}
  case'wisp':{const e=f.e,g=project(e.x,e.y),sl=t-f.launch;let x,y;if(sl<0||f.tx==null){const a2=t*2.4+f.i*TAU/f.n,R=h*1.1;x=g.x+Math.cos(a2)*R;y=g.y-h*1.4+Math.sin(a2)*R*.45;}
    else{const v=Math.min(1,sl/.7),b=project(f.tx,f.ty),s0x=g.x+Math.cos(f.i*TAU/f.n)*h*1.1,s0y=g.y-h*1.4;x=s0x+(b.x-s0x)*v;y=s0y+(b.y-h*.3-s0y)*v-Math.sin(v*Math.PI)*h*.8;if(sl>.9)break;}
    S.draw('glow',P.sick,x,y,h*.5,h*.5,{alpha:.55,overHero:true});S.draw('flame',P.wisp,x,y,h*.32,h*.5,{alpha:.95,overHero:true});S.draw('orb',P.blood,x,y+h*.06,h*.1,h*.1,{alpha:.9,overHero:true});break;}
  case'mark':{const w=f.R*px(f.x,f.y);if(el<f.warn)ground(S,P.blood,q,w,.4+.6*el/f.warn,el);else if(el<f.warn+.5){const u=(el-f.warn)/.5;S.draw('flame',P.wisp,q.x,q.y-h*.3,w*1.2,h*(.9-.6*u),{alpha:1-u,overHero:true});S.draw('glow',P.sick,q.x,q.y-h*.2,w*1.8,w,{alpha:.6*(1-u)});}break;}
  case'nuke':{const w=f.R*px(f.x,f.y);if(el<f.warn){const u=el/f.warn,pulse=.5+.5*Math.sin(el*(6+10*u));ground(S,P.blood,q,w,.45+.55*u,el*.3);ground(S,P.blood,q,w*.45,.5+.5*pulse,-el*.6);
    S.draw('glow',P.blood,q.x,q.y,w*2.2,w*1.1,{alpha:.18+.25*pulse*u});const sy=q.y-h*9,my=sy+(q.y-h*.4-sy)*u*u;S.draw('orb',P.ink,q.x+h*.6*(1-u),my,h*.5,h*.5,{alpha:1,blend:'source-over',overHero:true});S.draw('glow',P.blood,q.x+h*.6*(1-u),my,h*.7,h*.7,{alpha:.7,overHero:true});}
   else{const v=el-f.warn;if(v<3.2){const u=Math.min(1,v/.6),o=Math.max(0,1-v/3.2);S.draw('pillar',P.ember,q.x,q.y,w*.7*u,h*3.4*u,{alpha:.8*o,overHero:true});S.draw('glow',P.ember,q.x,q.y-h*3.4*u,w*1.8*u,w*1.1*u,{alpha:.85*o,overHero:true});S.draw('orb',P.ember,q.x,q.y-h*3.4*u,w*1.1*u,w*.6*u,{alpha:.7*o,overHero:true});S.draw('ring',P.ember,q.x,q.y,w*2*(.3+1.7*Math.min(1,v/1.2)),w*(.3+1.7*Math.min(1,v/1.2)),{alpha:.9*Math.max(0,1-v/1.2)});S.draw('flare',C([255,220,180],[255,255,240]),q.x,q.y-h*.5,w*3*u,w*3*u,{alpha:o*(v<.4?1:.6),overHero:true});
     S.draw('smoke',P.ember,q.x,q.y-h*(1+2.2*u),w*1.4*u,h*2.4*u,{alpha:.75*o,blend:'source-over',overHero:true});S.draw('smoke',P.ashL,q.x,q.y-h*(2.8+1.6*u),w*2.4*u,w*1.2*u,{alpha:.85*o,blend:'source-over',overHero:true});S.draw('glow',P.ember,q.x,q.y-h*(2.4+1.4*u),w*2*u,w*1.2*u,{alpha:.5*o,overHero:true});/* 버섯구름 */
     S.draw('ring',P.ember,q.x,q.y,w*2.6*u,w*1.3*u,{alpha:.8*o});S.draw('crack',P.ink,q.x,q.y,w*2,w,{squash:.5,alpha:.9*o,blend:'source-over'});}}break;}
  case'rad':{if(el>f.life)break;const w=f.R*px(f.x,f.y),a=Math.min(1,el/.6,(f.life-el)/1);S.draw('glow',P.rad,q.x,q.y,w*2,w,{alpha:.5*a});S.draw('ring',P.sick,q.x,q.y,w*2,w,{angle:t*.4,alpha:.55*a});
   for(let i=0;i<8;i++){const a2=f.seed+i*.8,r=w*(.2+.7*((i*53)%8)/8),yy=q.y+Math.sin(a2)*r*.5-((el*h*.6+i*h*.2)%(h*1.2));S.draw('spark',P.rad,q.x+Math.cos(a2)*r,yy,h*.12,h*.05,{angle:-Math.PI/2,alpha:.75*a});}break;}
  }});}}
function install(){
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r330-fx'){try{drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof drawHazard==='function'){const base=drawHazard;drawHazard=function(h,...a){if(h&&h.r330)return;return base.apply(this,[h,...a]);};}
 if(typeof tick==='function'){const base=tick;let last=null;tick=function(...a){const r=base.apply(this,a);try{const t=T(),dt=last==null?0:Math.max(0,Math.min(.1,t-last));last=t;tickAll(dt);}catch(e){fail(e);}return r;};}
 return true;}
const installed=(()=>{try{return install();}catch(e){fail(e);return false;}})();
function set(v){on=v!==false;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}
window.__STORYWORLD_DISASTER_R330__=Object.freeze({revision:REV,installed,KINDS:KINDS.slice(),NAME:{...NAME},set,kindOf:e=>kindOf(e),
 cast:(e,k)=>{if(k&&GO[k])e.r330Kind=k;cast(e);},
 inspect:()=>({revision:REV,on,installed,stats:{...stats,byKind:{...stats.byKind}},fx:fx.length,queued:queue.length,lastError})});
})();
