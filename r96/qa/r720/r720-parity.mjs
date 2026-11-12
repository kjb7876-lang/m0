// R720 배치 영웅 = 기본 모드 영웅 (사용자 2026-11-12 "모든모션및 스킬 및 공격등 기본모드 랑 동일하게 … 크기랑 규격등도 모두 동일하게 외곽선처리까지").
//  한 판에서: ① 조종 영웅 혼자(기준) ② 배치 영웅 3명을 둔 뒤 조종 영웅(배치 때문에 조종 영웅 모션이 바뀌지 않는지) ③ 배치 영웅 각각 — 걷기·대기·기본 공격·고유기를 시키고
//  엔진 영웅 그리기(drawHero)가 남긴 그리기 명령에서 몸 그림(시트·칸)·몸 높이·외곽선/접지 명령 수를 잰다. 결과는 JSON 으로 쓰고 r720-parity-compare.cjs 가 영웅별로 맞춰 본다.
//  헤드리스(소프트웨어 렌더링) 측정이다. 실기기·GPU 는 따로.
import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',HERO=process.env.HERO||'hwando',ALLIES=(process.env.ALLIES||'').split(',').filter(Boolean),OUT=process.env.OUT;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="'+HERO+'"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
const waitGame=async secs=>{const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+secs,{timeout:300000});};
await A(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,z=room.survivalR600.centre;d.qaFreeze(true);d.qaSkills(true);player.x=z.x-1;player.y=z.y+3;player.invincible=9999;player.shield=0;auto=false;
 window.__log=[];window.__phase='';window.__only='';{const sink=[];/* 재는 동안 적을 없앤다: 영웅이 적 쪽으로 몸을 돌려 방향이 판마다 달라지는 것을 막는다 */Object.defineProperty(room,'enemies',{configurable:true,get(){sink.length=0;return sink;},set(){}});}const base=drawHero;drawHero=function(...a){try{for(const e of room.enemies)e.visible=false;}catch(_){}/* 겨눌 적을 없애 방향을 고정한다(걷던 방향 그대로 공격) */const c=ctx,n0=Array.isArray(c.commands)?c.commands.length:-1,r=base.apply(this,a);
  const who=(player.r720Ally?'ally:':'main:')+player.hero;if(window.__phase&&n0>=0&&(!window.__only||window.__only===who)){let best=null,bh=0,strokes=0,contact=0,extra=[];for(let i=n0;i<c.commands.length;i++){const k=c.commands[i];if(k.kind==='stroke')strokes++;if(k.kind!=='image')continue;if(k.owner?.kind==='contact')contact++;
    const sp=String(k.sourcePath||k.image?.src||'');if(k.owner?.kind!=='hero'||!k.points){if(/auras?-|aura/.test(sp+String(k.key||'')))extra.push(String(k.key||sp).replace(/:\d+$/,''));continue;}if(/vfx|barrier|sigil|aura|glow/.test(sp))continue;const hh=Math.abs(k.points[3][1]-k.points[0][1]);if(hh>bh){bh=hh;best=k;}}
   window.__log.push({ph:window.__phase,who,path:best?(String(best.sourcePath||'').split('/').slice(-4).join('/')||'(canvas '+(best.imageSize||[]).join('x')+')'):null,fx:best?.sourceRect?best.sourceRect.join(','):null,mov:!!player.moving,dir:player.direction,full:best?String(best.sourcePath||'').split('/').slice(-4).join('/'):null,h:Math.round(bh*10)/10,w:best?Math.round(Math.abs(best.points[1][0]-best.points[0][0])*10)/10:0,alpha:best?.style?.globalAlpha,filter:best?.style?.filter,n:c.commands.length-n0,strokes,contact,extra:[...new Set(extra)].sort().join('|'),zoom:typeof zoom==='number'?zoom:null});}return r;};});
await p.mouse.move(630,180);/* 조준(마우스)을 화면 오른쪽에 둬 방향을 동쪽으로 고정 */
await waitGame(.4);
const phases=async(who,act)=>{await A(w=>{window.__only=w;},who);
 await A(()=>{window.__phase='walk';});await act('walk');await waitGame(1.0);await act('stop');
 await A(()=>{window.__phase='idle';});await waitGame(.7);
 await A(()=>{window.__phase='attack';});await act('attack');await waitGame(.45);
 await A(()=>{window.__phase='';});await waitGame(.5);
 await A(()=>{window.__phase='special';});await act('special');await waitGame(.7);
 await A(()=>{window.__phase='';});await waitGame(.6);};
const mainAct=async k=>{if(k==='walk')await p.keyboard.down('ArrowRight');else if(k==='stop')await p.keyboard.up('ArrowRight');else if(k==='attack')await A(()=>{const E=room.enemies;room.enemies=[];try{player.attackCD=0;basicAttack(true);}finally{room.enemies=E;}});else if(k==='special')await A(()=>{const E=room.enemies;room.enemies=[];try{player.specialCD=0;special();}finally{room.enemies=E;}});};/* 적 목록을 잠깐 비워 걷던 방향 그대로 쓴다 */
const out={hero:HERO,allies:ALLIES,runs:{}};
const take=async name=>{out.runs[name]=await A(()=>{const l=window.__log;window.__log=[];return l;});};
await phases('main:'+HERO,mainAct);await take('warm');/* 첫 바퀴는 그림 받기용(버림) */await A(()=>{const z=room.survivalR600.centre;player.x=z.x-1;player.y=z.y+3;});await waitGame(.3);
await phases('main:'+HERO,mainAct);await take('solo');await A(()=>{const z=room.survivalR600.centre;player.x=z.x-1;player.y=z.y+3;});
if(ALLIES.length){
 out.placed=await A(ALLIES=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,z=room.survivalR600.centre,px=player.x,py=player.y;d.qaGive(5000);const spots=[[2.6,.6],[-2.6,.6],[.6,-2.6]];const r=ALLIES.map((id,i)=>{player.x=z.x+spots[i][0];player.y=z.y+spots[i][1];return d.buy(id);});for(let i=0;i<ALLIES.length;i++)for(let k=0;k<5;k++)d.upgrade(i,'radius');player.x=z.x-1;player.y=z.y+3;return r;},ALLIES);
 await waitGame(1.2);
 await phases('main:'+HERO,mainAct);await take('withAllies');
 for(let i=0;i<ALLIES.length;i++){const allyAct=async k=>{const cast=(i,kind)=>A(([i,kind])=>{const E=room.enemies;room.enemies=[];try{return window.__STORYWORLD_HERO_DEFENSE_R720__.qaCast(i,kind);}finally{room.enemies=E;}},[i,kind]);if(k==='walk')await A(i=>window.__STORYWORLD_HERO_DEFENSE_R720__.qaNudge(i,2.4,-2.4),i);else if(k==='attack')await cast(i,'basic');else if(k==='special')await cast(i,'q');};
  await phases('ally:'+ALLIES[i],allyAct);await take('warm');await A(i=>window.__STORYWORLD_HERO_DEFENSE_R720__.qaNudge(i,-2.4,2.4),i);await waitGame(1.4);/* 첫 바퀴는 그림 받기용(버림), 둘째 바퀴를 잰다 */
  await phases('ally:'+ALLIES[i],allyAct);await take('ally:'+ALLIES[i]);await A(i=>window.__STORYWORLD_HERO_DEFENSE_R720__.qaNudge(i,-2.4,2.4),i);}
}
out.inspect=await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.inspect());out.errors=errs;
if(OUT)writeFileSync(OUT,JSON.stringify(out));console.log(HERO,'done',Object.keys(out.runs).map(k=>k+':'+out.runs[k].length).join(' '),'errors',errs.length,out.inspect.stats.errors);
await b.close();
