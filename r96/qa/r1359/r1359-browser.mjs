// R1359 헤드리스 장면(SwiftShader — 그래픽 검증 아님): 몹 죽음 재 구름(D08, 작은·큰 몹)과 투사체 적중 영웅 피격(D09).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1359/r1359-browser.mjs /tmp/r1359 [zone]
import {chromium,boot,go} from '../r444/lib.mjs';
const out=process.argv[2]||'/tmp/r1359',zone=process.argv[3]||'dist01',off=process.env.R1359_OFF==='1';let fail=0;const ok=(c,m,d)=>{console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?' '+JSON.stringify(d):''));if(!c)fail++;};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:off?{'storyworld.r1359':'{"on":false}'}:null});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await go(p,zone);
const r=await p.evaluate(()=>{const live=room.enemies.filter(e=>!e.boss&&!e.midboss&&e.hp>0);if(live.length<2)return null;
 const h=e=>Number(e.combatProfile?.spriteRect?.height)||0;live.sort((a,b)=>h(a)-h(b));const A=live[0],B=live[live.length-1];
 for(const e of room.enemies){e.speed=0;}player.x=A.x;player.y=A.y+2.2;A.x=player.x-1.6;A.y=player.y-.4;B.x=player.x+1.6;B.y=player.y-.4;player.hp=player.maxHp=1e7;player.invincible=0;
 room.enemies=room.enemies.filter(e=>e===A||e===B);
 window.__AB=[A,B];return {a:A.name,b:B.name};});
ok(!!r,'몹 둘 고름',r);
await p.waitForTimeout(1500);
const t0=await p.evaluate(()=>{window.__dc={};const P=CanvasRenderingContext2D.prototype,D=P.drawImage;P.drawImage=function(im,...a){try{const k=String(im?.src||im?.__src||'').split('/').pop();if(/death-ash|smoke|hero-hit/.test(k)){const c=window.__dc[k]||(window.__dc[k]={n:0,last:null});c.n++;c.last=[a.length,...a.slice(4,8).map(Math.round),this.globalAlpha,this.filter];}}catch(_){}return D.call(this,im,...a);};const [A,B]=window.__AB;hitEnemy(A,A.hp+1);hitEnemy(B,B.hp+1);return time;});
await p.waitForFunction(t=>time>=t+.55,t0,{timeout:60000});console.log('DC',JSON.stringify(await p.evaluate(()=>({dc:window.__dc,sd:window.__STORYWORLD_MOB_DEATH_R462__.inspect().sheetDraws,ready:['small','medium','boss'].map(v=>!!readyImage('assets/r1359/death-ash-'+v+'-16.webp')?.image),ctxType:ctx&&ctx.constructor&&ctx.constructor.name,hasCmd:Array.isArray(ctx.commands)}))));console.log('CMDS',JSON.stringify(await p.evaluate(()=>{const cs=(ctx.commands||[]);return cs.filter(c=>/death-ash|r108\/eden\/smoke/.test((c.sourcePath||c.image?.src||''))).map(c=>[String(c.sourcePath||c.image?.src).split('/').pop(),c.points?.[0]?.map(Math.round),c.points?.[2]?.map(Math.round),c.style?.globalAlpha,c.style?.filter]);})));await p.evaluate(()=>{window.__speed=window.tickScale;});
await p.screenshot({path:`${out}-death.png`});console.log('POS',JSON.stringify(await p.evaluate(()=>window.__AB.map(e=>{const q=project(e.x,e.y);return [Math.round(q.x),Math.round(q.y),e.name];}))));
await p.waitForFunction(t=>time>=t+.85,t0,{timeout:60000});await p.screenshot({path:`${out}-death2.png`});
const s=await p.evaluate(()=>({ash:window.__STORYWORLD_DOTS_FX_R1359__.inspect(),r462:window.__STORYWORLD_MOB_DEATH_R462__?.inspect?.()?.style}));
ok(off?s.ash.ash.small+s.ash.ash.medium+s.ash.ash.boss===0:(s.ash.ash.small+s.ash.ash.medium+s.ash.ash.boss)>0,'D08 재 구름 물음 수',s);
const h0=await p.evaluate(()=>{player.invincible=0;const src={x:player.x+2,y:player.y-1,owner:'x',kind:'shot'};const r=hurt(3,src);return {r,t:time,ready:!!readyImage('assets/r163/pixelfx/r1359/hero-hit-8f.webp')?.image};});
await p.waitForFunction(t=>time>=t+.12,h0.t,{timeout:60000});await p.screenshot({path:`${out}-hit.png`});
const s2=await p.evaluate(()=>window.__STORYWORLD_DOTS_FX_R1359__.inspect());console.log('DC2',JSON.stringify(await p.evaluate(()=>window.__dc)));console.log('PX',JSON.stringify(await p.evaluate(()=>{const X=window.__STORYWORLD_PIXELFX_R163__;return {row:X.meta()['mob-r1359-herohit'],ins:X.inspect?.(),hv:window.__STORYWORLD_HERO_VISIBILITY_R350__?.inspect?.()};})).slice(0,1500));
ok(off?s2.hits===0:s2.hits===1&&s2.errors===0,'D09 영웅 피격 1회',{h0,s2});
ok(errs.length===0,'페이지 오류 0',errs.slice(0,3));
await b.close();console.log(fail?`R1359 browser FAIL ${fail}`:'R1359 browser OK');process.exit(fail?1:0);
