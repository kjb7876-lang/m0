// R720-4 브라우저 검사(헤드리스): 사용자 2026-11-12 14:05Z "맵 바뀌면 배치한 영웅들 이미지 사라지는 버그 + 배치한 영웅들 공격이 조종하는 영웅에게서 나가는 문제".
//  ① 지역을 옮긴 뒤에도 배치 영웅 몸 그림(엔진 drawHero 의 영웅 이미지 명령)이 그려지는가 ② 배치 영웅 공격의 탄·이펙트가 그 영웅 자리에서 나가는가(조종 영웅 자리가 아니라).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',MAIN=process.env.HERO||'hwando',ALLIES=(process.env.ALLIES||'neon,slayer,seoha').split(','),SHOTS=process.env.SHOTS||'';let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,600):'');if(!c)fail++;};
const b=await chromium.launch(process.env.HTTPS_PROXY&&/^https/.test(URL)?{proxy:{server:process.env.HTTPS_PROXY}}:{});const ctx=await b.newContext({viewport:{width:960,height:540},ignoreHTTPSErrors:true});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
const waitGame=async secs=>{const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+secs,{timeout:300000});};
await p.goto(URL,{timeout:240000,waitUntil:'domcontentloaded'});await p.locator('#survivalStartR600').waitFor({timeout:240000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="'+MAIN+'"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration?.());
// 탐침: 배치 몸으로 그린 drawHero 마다 영웅 이미지 명령 수, 배치 몸 차례에 생긴 탄·이펙트 위치
await A(()=>{window.__pr={draws:{},shots:[],fx:[]};const base=drawHero;drawHero=function(...a){const c=ctx,n0=Array.isArray(c.commands)?c.commands.length:-1,r=base.apply(this,a);
  if(player&&player.r720Ally&&n0>=0){let img=0;for(let i=n0;i<c.commands.length;i++){const k=c.commands[i];if(k.kind==='image'&&k.owner?.kind==='hero')img++;}const d=window.__pr.draws[player.hero]||(window.__pr.draws[player.hero]={n:0,img:0,empty:0});d.n++;d.img+=img;if(!img)d.empty++;}return r;};
 const ms=makeShot;makeShot=function(x,y,...r){const s=ms.apply(this,[x,y,...r]);if(player&&player.r720Ally&&window.__pr.shots.length<200){const m=window.__STORYWORLD_HERO_DEFENSE_R720__.realPlayer?.()||null;window.__pr.shots.push({hero:player.hero,x,y,bx:player.x,by:player.y});}return s;};
 window.__pr.miss={};const rb=readyImage;readyImage=function(path,...r){const v=rb.apply(this,[path,...r]);if(!v&&player&&player.r720Ally){const k=player.hero+' '+String(path);window.__pr.miss[k]=(window.__pr.miss[k]||0)+1;}return v;};window.__pr.cache=()=>imageCache.size;window.__pr.fxc=[];const fb=fx;fx=function(type,x,y,opt,...r){try{if(window.__pr.on&&window.__pr.fxc.length<400){const m=window.__STORYWORLD_HERO_DEFENSE_R720__;window.__pr.fxc.push({type,x:+(+x).toFixed(2),y:+(+y).toFixed(2),ally:!!player?.r720Ally,hero:player?.hero,asset:String(opt?.asset||'').split('/').slice(-2).join('/'),st:String(new Error().stack).split('\n').slice(2,9).map(l=>l.trim().replace(/http:[^ )]*\/m0\//,'').slice(0,60)).join(' | ')});}}catch(_){}return fb.apply(this,[type,x,y,opt,...r]);};});
const place=await A(ALLIES=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,z=room.survivalR600.centre;d.qaGive(9000);const spots=[[3.2,.4],[-3.2,.4],[.4,-3.2]];const r=ALLIES.map((id,i)=>{player.x=z.x+spots[i][0];player.y=z.y+spots[i][1];return d.buy(id);});player.x=z.x;player.y=z.y+4.5;player.invincible=9999;auto=false;return r;},ALLIES);
ok('배치 3명',place.every(r=>r&&r.ok),place);
const measure=async label=>{await A(()=>{window.__pr.draws={};window.__pr.shots=[];window.__pr.fxStart=effects.length;window.__pr.fxSeen=new Set(effects);window.__pr.fx=[];window.__pr.fxc=[];window.__pr.on=true;
   window.__pr.tk=setInterval(()=>{try{const D=window.__STORYWORLD_HERO_DEFENSE_R720__,al=D.allies();for(const e of effects){if(window.__pr.fxSeen.has(e))continue;window.__pr.fxSeen.add(e);window.__pr.fx.push({kind:e.kind||e.type||e.name,asset:String(e.asset||e.path||'').split('/').slice(-2).join('/'),keys:Object.keys(e).slice(0,30).join(','),st:(window.__pr.lastAs||''),x:e.x,y:e.y,owner:e.r720Owner||null,px:player.x,py:player.y,al:al.map(a=>[+a.x.toFixed(2),+a.y.toFixed(2)])});}}catch(_){}} ,16);
   const z=room.survivalR600.centre;player.x=z.x;player.y=z.y+4.5;player.attackCD=900;player.specialCD=900;});
  await waitGame(6);
  return A(()=>{clearInterval(window.__pr.tk);const D=window.__STORYWORLD_HERO_DEFENSE_R720__;window.__pr.on=false;const mm=window.__pr.miss;window.__pr.miss={};return {fxc:window.__pr.fxc,miss:Object.entries(mm).sort((a,b)=>b[1]-a[1]).slice(0,25),cache:imageCache.size,draws:window.__pr.draws,shots:window.__pr.shots,fx:window.__pr.fx.slice(0,300),allies:D.allies().map(a=>({x:a.x,y:a.y})),main:{x:player.x,y:player.y},ins:D.inspect().stats};});};
const judge=(label,m)=>{
 for(const id of ALLIES){const d=m.draws[id];ok(label+': '+id+' 몸 그림이 그려진다(drawHero 마다 영웅 이미지 1개 이상)',!!d&&d.n>20&&d.empty===0,d);}
 const far=m.shots.filter(s=>Math.hypot(s.x-s.bx,s.y-s.by)>1.2);ok(label+': 배치 영웅 탄은 그 영웅 자리에서 나간다',m.shots.length>0&&far.length===0,{n:m.shots.length,far:far.slice(0,4)});
 const nearMain=m.fx.filter(f=>/^r(425|561|562|563|564|535|590|348|247)/.test(String(f.kind||''))&&Number.isFinite(f.x)&&Math.hypot(f.x-m.main.x,f.y-m.main.y)<.8&&m.allies.every(a=>Math.hypot(f.x-a.x,f.y-a.y)>2));
 ok(label+': 조종 영웅은 공격하지 않는데 그 자리에 공격 이펙트가 생기지 않는다',nearMain.length===0,{n:m.fx.length,nearMain:nearMain.slice(0,6)});};
await waitGame(3);/* 막 산 영웅의 그림을 받는 동안(스토리 모드 영웅 교체와 같은 지연)은 재지 않는다 */
const m1=await measure('첫 지역');judge('첫 지역',m1);if(SHOTS)await p.screenshot({path:SHOTS+'/region-1.png'});
await A(()=>{room.enemies.length=0;return window.__STORYWORLD_SURVIVAL_R600__.qaGo(1);});
await p.waitForFunction(()=>{const z=window.__STORYWORLD_SURVIVAL_R600__.state();return z.i===1&&z.ready&&!loading;},null,{timeout:300000});await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration?.());await waitGame(1);
const m2=await measure('다음 지역');if(process.env.DEBUG){const near=(m)=>m.fxc.filter(f=>Math.hypot(f.x-m.main.x,f.y-m.main.y)<.8);console.log('FXNEAR1',JSON.stringify(near(m1).slice(0,12)));console.log('FXNEAR2',JSON.stringify(near(m2).slice(0,12)));}if(process.env.DEBUG)console.log('MISS1',JSON.stringify(m1.miss),m1.cache,'\nMISS2',JSON.stringify(m2.miss),m2.cache);judge('다음 지역',m2);if(SHOTS)await p.screenshot({path:SHOTS+'/region-2.png'});
const ins=await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.inspect());ok('배치 모듈 오류 없음',ins.stats.errors===0,ins.lastError);ok('페이지 오류 없음',errs.length===0,errs);
console.log(fail?'FAIL '+fail:'ALL PASS');await b.close();process.exit(fail?1:0);
