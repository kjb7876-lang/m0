// R720-4 탐침(헤드리스): 조종 영웅을 완전히 묶어 둔 채(공격·스킬 안 함) 배치 영웅만 싸우게 하고, 배치 영웅 몸 차례 밖에서 일어난 적 피해·이펙트를 모은다.
//  배치 영웅이 쓴 기술이 다음 틱에 조종 영웅(player) 기준으로 이어지면 여기 잡힌다(어느 파일인지 호출 자리로).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',MAIN=process.env.HERO||'hwando',ALLIES=(process.env.ALLIES||'neon,slayer,seoha').split(','),SECS=+process.env.SECS||14;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
const waitGame=async secs=>{const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+secs,{timeout:600000});};
await p.goto(URL,{timeout:240000});await p.locator('#survivalStartR600').waitFor({timeout:240000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="'+MAIN+'"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration?.());
await A(ALLIES=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,z=room.survivalR600.centre;d.qaGive(9000);d.qaSkills?.(true);const spots=[[3.2,.4],[-3.2,.4],[.4,-3.2]];ALLIES.forEach((id,i)=>{player.x=z.x+spots[i][0];player.y=z.y+spots[i][1];d.buy(id);});
 let far={x:z.x,y:z.y+6};for(let r=7;r>=4;r-=.5){let okp=null;for(let k=0;k<16&&!okp;k++){const a=k/16*Math.PI*2,x=z.x+Math.cos(a)*r,y=z.y+Math.sin(a)*r;if(!blocked(x,y,.4)&&Math.hypot(x-(z.x+.4),y-(z.y-3.2))>5&&Math.hypot(x-(z.x+3.2),y-z.y)>4&&Math.hypot(x-(z.x-3.2),y-z.y)>4)okp={x,y};}if(okp){far=okp;break;}}window.__far=far;
 const lock=()=>{player.x=far.x;player.y=far.y;try{for(const e of room.enemies)if(Math.hypot(e.x-far.x,e.y-far.y)<3){e.x=z.x+(Math.random()-.5)*3;e.y=z.y+(Math.random()-.5)*3;}}catch(_){}player.invincible=9999;player.attackCD=900;player.specialCD=900;player.blinkCD=900;player.egoCD=900;player.storyWER??={ready:{},buffs:{}};for(const k of ['w','e','r'])player.storyWER.ready[player.hero+':'+k]=time+900;auto=false;try{guide=false;}catch(_){}};lock();window.__lock=lock;
 const W=window.__W={hits:[],fx:[],eff:[],on:false};const st=()=>String(new Error().stack).split('\n').slice(2,14).map(l=>l.trim().replace(/http:[^ )]*\/m0\//,'')).filter(l=>/\.js:/.test(l)&&!/hero-defense-r720/.test(l)).slice(0,3).map(l=>l.replace(/^at /,'').slice(0,70)).join(' | ');
 const hb=hitEnemy;hitEnemy=function(e,amt,src,...r){try{if(W.on&&!player?.r720Ally)W.hits.push({amt:Math.round(+amt||0),src:src?.sourceHero||src?.kind||src?.owner||null,kind:src?.kind||null,st:st()});}catch(_){}return hb.apply(this,[e,amt,src,...r]);};
 const fb=fx;fx=function(type,x,y,opt,...r){try{if(W.on&&!player?.r720Ally&&Math.hypot(x-player.x,y-player.y)<1.6)W.fx.push({type,asset:String(opt?.asset||'').split('/').pop(),st:st()});}catch(_){}return fb.apply(this,[type,x,y,opt,...r]);};
 const ep=effects.push.bind(effects);
 setInterval(()=>{},1000);},ALLIES);
await waitGame(2);
await A(()=>{window.__W.on=true;window.__W.seen=new Set(effects);window.__W.tk=setInterval(()=>{try{window.__lock();for(const e of effects){if(window.__W.seen.has(e))continue;window.__W.seen.add(e);if(e?.type==='r113Layer')continue;if(Number.isFinite(e?.x)&&Math.hypot(e.x-player.x,e.y-player.y)<1.6)window.__W.eff.push({type:e.type,keys:Object.keys(e).slice(0,12).join(',')});}}catch(_){}},20);});
const kinds=['basic','q','w','e','r'];for(let k=0;k<SECS;k++){await A(([k,kinds])=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__;for(let i=0;i<3;i++){const E=room.enemies;try{d.qaCast(i,kinds[(k+i)%kinds.length]);}catch(_){}}},[k,kinds]);await waitGame(1.1);}
const r=await A(()=>{const W=window.__W;W.on=false;clearInterval(W.tk);const grp=(a,k)=>{const m={};for(const x of a){const kk=k(x);m[kk]=(m[kk]||0)+1;}return Object.entries(m).sort((a,b)=>b[1]-a[1]);};
 return {hits:grp(W.hits,h=>h.src+' <- '+h.st),fx:grp(W.fx,f=>f.type+' '+f.asset+' <- '+f.st),eff:grp(W.eff,f=>f.type),casts:window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().stats.casts,allyHits:window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().stats.hits};});
const allyFile=new RegExp('(?:^|[ |(])('+ALLIES.join('|')+')-[a-z0-9-]*\\.js');
const bad=r.hits.filter(([k])=>ALLIES.includes(k.split(' <- ')[0])||allyFile.test(k)),badFx=r.fx.filter(([k])=>allyFile.test(k));
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,900):'');if(!c)fail++;};
ok('배치 영웅이 실제로 기술을 썼다(기본·Q·W·E·R)',r.casts.basic>10&&r.casts.q+r.casts.w+r.casts.e+r.casts.r>=6,r.casts);
ok('배치 영웅 기술의 피해가 조종 영웅 차례(조종 영웅 기준)로 새지 않는다',bad.length===0,bad);
ok('배치 영웅 기술 이펙트가 조종 영웅 자리에 생기지 않는다',badFx.length===0,badFx);
ok('페이지 오류 없음',errs.length===0,errs);
if(process.env.DEBUG)console.log(JSON.stringify({main:MAIN,allies:ALLIES,...r},null,1));
console.log(fail?'FAIL '+fail:'ALL PASS');await b.close();process.exit(fail?1:0);
