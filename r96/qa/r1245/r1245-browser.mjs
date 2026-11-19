// R1245 브라우저(헤드리스 소프트웨어 렌더링) 검사: 스토리(murder01 STORY)·스토리 사몽(murder01 DREAM)·사몽 에피소드(S-06 sz115-S06-1)의
//  카메라 기본 시야(zoom·보이는 칸·영웅 화면 위치)를 같은 창 크기에서 잰다. R1245 켬/끔 비교. PC 1280×720 과 모바일 흉내 844×390. GPU·실기기 아님.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const b=await chromium.launch();const res={errors:[]};const OFF=process.env.R1245_OFF==='1';
fs.mkdirSync(new URL('./screens/',import.meta.url),{recursive:true});
for(const kind of (process.env.KINDS||'pc,mobile').split(',')){
 const vp=kind==='mobile'?{width:844,height:390}:{width:1280,height:720};
 const init=OFF?{'storyworld.r1245.dreamCamera':'{"on":false}'}:null;
 const ctxOpt=kind==='mobile'?{vp,init}:{vp,init};
 const {ctx,p}=await boot(b,ctxOpt);p.on('pageerror',e=>res.errors.push(kind+': '+String(e).slice(0,200)));
 if(kind==='mobile')await p.evaluate(()=>{window.mobile=()=>true;});
 const m=async(tag)=>{const r=await p.evaluate(async()=>{const t0=time;await new Promise(r=>{const st=performance.now();const f=()=>{if(time-t0>1.2||performance.now()-st>30000)r();else requestAnimationFrame(f)};requestAnimationFrame(f)});
  for(const e of liveEnemies?.()||[])e.speed=0;const q=project(player.x,player.y),c=window.__STORYWORLD_CAMERA_R63__.inspect();
  return {zone,layer,samong:room?.samongR115?.id||room?.samongR115?.zone||null,zoom:+zoom.toFixed(4),range:{u:+(W/(TILE*zoom)).toFixed(2),v:+(H/(TILE*.5*zoom)).toFixed(2)},heroPx:{x:+(q.x-W/2).toFixed(1),y:+(q.y-H/2).toFixed(1)},r81:!!window.__STORYWORLD_WORLD_PRESENTATION_R81__?.ownsCamera?.(),r1245:window.__STORYWORLD_DREAM_CAMERA_R1245__?.inspect?.()};});
  await p.screenshot({path:new URL(`./screens/${kind}-${tag}${OFF?'-off':''}.png`,import.meta.url).pathname});return r;};
 res[kind]={};
 await go(p,'murder01');res[kind].story=await m('story');
 await p.evaluate(()=>enterRegion('murder01',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:150000});await skip(p);res[kind].dream=await m('dream');
 await p.evaluate(async()=>{const SM=__STORYWORLD_SAMONG_R103__;await SM.go(SM.episodes.findIndex(e=>e.key==='S-06'),null,{zone:'sz115-S06-1'});});await p.waitForFunction(()=>!loading&&layer==='DREAM'&&zone!=='murder01'&&!!room?.samongR115,null,{timeout:240000});await skip(p);res[kind].episode=await m('episode');
 // 가장자리: 에피소드 바닥 칸 중 경계에 가장 가까운 칸으로 옮겨 영웅 화면 위치
 res[kind].edge=await p.evaluate(async()=>{const L=room.exploration,c=(L.floorCells||[]).reduce((a,q)=>!a||q[0]+q[1]<a[0]+a[1]?q:a,null);if(!c)return null;player.x=c[0]+.5;player.y=c[1]+.5;
  const t0=time;await new Promise(r=>{const st=performance.now();const f=()=>{if(time-t0>1||performance.now()-st>30000)r();else requestAnimationFrame(f)};requestAnimationFrame(f)});const q=project(player.x,player.y);return {cell:c,heroPx:{x:+(q.x-W/2).toFixed(1),y:+(q.y-H/2).toFixed(1)}};});
 for(const k of ['story','dream','episode'])console.log(kind,k,JSON.stringify({...res[kind][k],r1245:res[kind][k].r1245?{on:res[kind][k].r1245.on,updates:res[kind][k].r1245.stats.updates,errors:res[kind][k].r1245.stats.errors}:null}));
 console.log(kind,'edge',JSON.stringify(res[kind].edge));
 await ctx.close();}
const near=(a,b)=>Math.abs(a-b)/b<.01;const checks=[];
for(const kind of Object.keys(res).filter(k=>k!=='errors')){const s=res[kind].story;for(const k of ['dream','episode']){const d=res[kind][k];
 checks.push([kind+' '+k+' zoom == story',near(d.zoom,s.zoom),d.zoom+' vs '+s.zoom]);checks.push([kind+' '+k+' hero screen offset == story',Math.abs(d.heroPx.x-s.heroPx.x)<2&&Math.abs(d.heroPx.y-s.heroPx.y)<2,JSON.stringify(d.heroPx)]);}
 if(kind==='pc')checks.push(['pc edge: hero stays centred',res.pc.edge&&Math.abs(res.pc.edge.heroPx.x-s.heroPx.x)<2&&Math.abs(res.pc.edge.heroPx.y-s.heroPx.y)<2,JSON.stringify(res.pc.edge)]);}
checks.push(['no page errors',res.errors.length===0,res.errors.slice(0,3).join(' | ')]);
for(const [n,pass,d] of checks)console.log((pass?'PASS ':'FAIL ')+n+' '+d);
fs.writeFileSync(new URL(`./r1245-browser-result${OFF?'-off':''}.json`,import.meta.url),JSON.stringify({res,checks},null,1));
await b.close();process.exit(checks.every(c=>c[1])?0:1);
