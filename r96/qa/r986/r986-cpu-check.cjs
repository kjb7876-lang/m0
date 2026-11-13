#!/usr/bin/env node
// R986: 한서하 패시브(R949) 소집 문·초침 일격·열린 시간방 고리를 Dots 시트(CX-0091SE SE-07·SE-04·SE-06)로 그린다.
// 판정·피해는 건드리지 않는다. 시트가 안 읽혔거나 꺼져 있으면 R949 의 기존 그림으로 돌아간다. 좌표가 깨지면(NaN) 그리지 않는다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),repo=path.resolve(root,'..');
let pass=0,fail=0;const ok=(n,c,d)=>{if(c){pass++;console.log('PASS '+n);}else{fail++;console.log('FAIL '+n+(d?' :: '+d:''));}};
const rd=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return '';}};
const NAME='seoha-epoch-fx-r986.js',src=rd(path.join(root,'client-source',NAME)),r949=rd(path.join(root,'client-source','seoha-epoch-r949.js'));
const html=rd(path.join(root,'runtime-text','index.html')),verify=rd(path.join(repo,'scripts','verify-r96-public.py')),yml=rd(path.join(repo,'.github','workflows','pages.yml'));
const man=rd(path.join(root,'runtime-manifest.json'));

// ── 연결 ──
ok('overlay file exists',src.length>500);
ok('runtime copy matches source',src&&rd(path.join(root,'runtime-text',NAME))===src);
ok('script tag after seoha-epoch-r949',html.indexOf('./'+NAME)>html.indexOf('./seoha-epoch-r949.js')&&html.indexOf('./seoha-epoch-r949.js')>0);
ok('script tag before story-reader line',html.indexOf('./'+NAME)<html.indexOf('./story-reader-r122.js'));
ok('verify list has overlay and assets',verify.includes("'"+NAME+"'")&&verify.includes("'assets/r986/'"));
ok('pages.yml runs this check',yml.includes('node r96/qa/r986/r986-cpu-check.cjs'));
ok('manifest lists overlay and both sheets',man.includes('"'+NAME+'"')&&man.includes('assets/r986/seoha-summon-gate.webp')&&man.includes('assets/r986/seoha-room-dial.webp')&&man.includes('assets/r986/seoha-hand-strike.webp'));
for(const f of ['seoha-summon-gate.webp','seoha-room-dial.webp','seoha-hand-strike.webp'])ok('asset present '+f,fs.existsSync(path.join(root,'runtime-text','assets','r986',f)));
ok('R949 asks the gate hook before its rift sheets',/__STORYWORLD_SEOHA_FX_R986__/.test(r949)&&/\.gate\(b,t,q,AH,sc\)\)continue/.test(r949));
ok('R949 asks the room hook before its code rings',/\.room\(p,R,f,cid,c,sc\)/.test(r949));
ok('R949 asks the hand hook',/\.hand\(a,b,lift,w,/.test(r949));
ok('rewind ring (SE-05) is not wired: it failed the in-game review',!/donut\(/.test(src)&&!/\.donut\(/.test(r949)&&!man.includes('seoha-rewind-ring'));
ok('R949 keeps its own drawings as fallback',r949.includes("cell(rb,'riftB'")&&r949.includes('ring(p,R,VIO'));
ok('no damage or judgement calls in overlay',!/hitEnemy|killEnemy|\.hp\s*[-+]?=|room\.enemies/.test(src));
ok('no blur/drop-shadow filter and no gradients',!/blur\(|drop-shadow|createRadialGradient|createLinearGradient/.test(src));

// ── 동작(가짜 캔버스) ──
function boot(opt){opt=opt||{};const calls=[],store={};if(opt.off)store['storyworld.r986.seohaFx']=JSON.stringify({on:false});
  const ctx={globalAlpha:1,globalCompositeOperation:'lighter',save(){this._s=(this._s||[]);this._s.push([this.globalAlpha,this.globalCompositeOperation]);},restore(){const s=this._s.pop();this.globalAlpha=s[0];this.globalCompositeOperation=s[1];},
    translate(x,y){this._t=[x,y];},rotate(r){this._r=r;},scale(x,y){this._f=[x,y];},
    drawImage(...a){calls.push({a,alpha:this.globalAlpha,comp:this.globalCompositeOperation,t:this._t,r:this._r,f:this._f});this._f=null;}};
  const asked=[];const g={console,Math,Number,JSON,Date,Object,Array,String,isFinite,ctx,time:10,
    localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
    readyImage:p=>opt.ready===false?null:{image:{src:p}},
    ensureImages:p=>{asked.push(...p);return Promise.resolve();}};
  g.window=g;vm.createContext(g);vm.runInContext(src,g,{filename:NAME});
  return {g,ctx,calls,asked,api:g.__STORYWORLD_SEOHA_FX_R986__,sc:(o,f)=>{calls.push({scope:o});f();}};}
const fin=c=>c.a.slice(1).every(Number.isFinite);
if(src){
  let E=boot();const A=E.api;
  ok('API exposed with revision',!!A&&typeof A.gate==='function'&&typeof A.room==='function'&&/^R986/.test(A.revision));
  // 소집 문
  const b={x:5,y:6,t0:10,k:1},q={x:400,y:300};
  ok('gate draws and claims the blink',A.gate(b,10.0,q,120,E.sc)===true&&E.calls.filter(c=>c.a).length===1);
  let d=E.calls.find(c=>c.a);
  ok('gate first frame = cell 0 (128x256)',d.a[1]===0&&d.a[2]===0&&d.a[3]===128&&d.a[4]===256);
  ok('gate drawn source-over (not additive)',d.comp==='source-over');
  ok('gate foot pivot sits on the projected point',Math.abs((d.a[6]+235*(d.a[8]/256))-300)<.01&&Math.abs((d.a[5]+d.a[7]/2)-400)<.01);
  ok('gate height follows hero height',Math.abs(d.a[8]-256*120/179)<.01);
  ok('gate scope is a hero-side effect at the blink',E.calls.some(c=>c.scope&&c.scope.kind==='effect'&&c.scope.pxfSide==='hero'&&c.scope.x===5&&/^r986:gate:/.test(c.scope.id)));
  E.calls.length=0;A.gate(b,10.4,q,120,E.sc);d=E.calls.find(c=>c.a);
  ok('gate mid frame = 12 (col 0,row 2)',d.a[1]===0&&d.a[2]===512);
  E.calls.length=0;A.gate(b,10.79,q,120,E.sc);d=E.calls.find(c=>c.a);
  ok('gate last frame = 23 and fades out',d.a[1]===5*128&&d.a[2]===3*256&&d.alpha<.2);
  E.calls.length=0;A.gate({x:5,y:6,t0:10,k:1.7},10.2,q,120,E.sc);d=E.calls.find(c=>c.a);
  ok('gate scales with k (Arbelia 1.7)',Math.abs(d.a[8]-256*120/179*1.7)<.01);
  E.calls.length=0;A.gate(b,9.5,q,120,E.sc);d=E.calls.find(c=>c.a);
  ok('time before start clamps to frame 0',!!d&&d.a[1]===0&&d.a[2]===0&&fin(d));
  E.calls.length=0;A.gate(b,99,q,120,E.sc);d=E.calls.find(c=>c.a);
  ok('time after end clamps to frame 23 with finite numbers',!!d&&d.a[2]===768&&fin(d)&&d.alpha>=0);
  for(const [n,args] of [['NaN point',[b,10.1,{x:NaN,y:300},120]],['NaN height',[b,10.1,q,NaN]],['zero height',[b,10.1,q,0]],['NaN start',[{x:5,y:6,t0:NaN,k:1},10.1,q,120]],['no blink',[null,10.1,q,120]]]){
    E.calls.length=0;let r,threw=false;try{r=A.gate(...args,E.sc);}catch(_){threw=true;}
    ok('gate refuses '+n+' without drawing',!threw&&r===false&&!E.calls.some(c=>c.a));}
  // 열린 시간방 물결
  const p={x:500,y:400},c={x:3,y:4};
  E.calls.length=0;ok('room draws and claims the pulse',A.room(p,200,.6,'cid',c,E.sc)===true&&E.calls.filter(c=>c.a).length===1);
  d=E.calls.find(c=>c.a);
  ok('room ring half-width equals R, flattened 2:1',Math.abs(d.a[3]*(335/2)/384-200)<.5&&Math.abs(d.a[4]*(199/2)/320-100)<.5);
  ok('room ring centred on the projected point',Math.abs(d.a[1]+d.a[3]/2-500)<.01&&Math.abs(d.a[2]+d.a[4]/2-400)<.01);
  ok('room alpha follows fade',Math.abs(d.alpha-.6)<.05&&d.comp==='source-over');
  for(const [n,args] of [['NaN radius',[p,NaN,.5]],['negative radius',[p,-5,.5]],['NaN fade',[p,200,NaN]],['NaN point',[{x:NaN,y:1},200,.5]]]){
    E.calls.length=0;let r,threw=false;try{r=A.room(...args,'cid',c,E.sc);}catch(_){threw=true;}
    ok('room refuses '+n+' without drawing',!threw&&r===false&&!E.calls.some(c=>c.a));}
  E.calls.length=0;A.room(p,200,7,'cid',c,E.sc);d=E.calls.find(c=>c.a);ok('room fade above 1 clamps to 1',!!d&&d.alpha<=1.0001);
  E.calls.length=0;ok('room fade 0 draws nothing but still claims',A.room(p,200,0,'cid',c,E.sc)===true&&!E.calls.some(c=>c.a));
  ok('stats count draws and no errors',A.inspect().gateDraws>=5&&A.inspect().roomDraws>=2&&A.inspect().errors===0);
  // 초침 일격
  const a0={x:100,y:200},b0={x:406.5,y:200};
  E.calls.length=0;ok('hand wind-up draws frame 0..5 by progress',A.hand(a0,b0,30,0,null,'cid',c,E.sc)===true&&E.calls.find(c=>c.a).a[1]===0&&(E.calls.length=0,A.hand(a0,b0,30,.99,null,'cid',c,E.sc))&&E.calls.find(c=>c.a).a[1]===5*384);
  E.calls.length=0;A.hand(a0,b0,30,1,0,'cid',c,E.sc);d=E.calls.find(c=>c.a);
  ok('hand strike starts at frame 6 (row 1), cell 384x96',d.a[1]===0&&d.a[2]===96&&d.a[3]===384&&d.a[4]===96);
  ok('hand root pivots on the start point lifted, unrotated for a rightward strike',d.t[0]===100&&d.t[1]===170&&Math.abs(d.r)<1e-9&&!d.f);
  ok('hand blade length spans start→end',Math.abs(d.a[7]-384)<.01&&Math.abs(d.a[5]+44)<.01&&Math.abs(d.a[6]+59)<.01);
  E.calls.length=0;A.hand(b0,a0,30,1,.1,'cid',c,E.sc);d=E.calls.find(c=>c.a);
  ok('leftward strike rotates half a turn and flips vertically',Math.abs(Math.abs(d.r)-Math.PI)<1e-9&&d.f&&d.f[1]===-1&&d.a[1]===(8%6)*384&&d.a[2]===96);
  E.calls.length=0;ok('hand after the last frame claims without drawing',A.hand(a0,b0,30,1,5,'cid',c,E.sc)===true&&!E.calls.some(c=>c.a));
  for(const [n,args] of [['NaN start',[{x:NaN,y:1},b0,30,1,0]],['zero length',[a0,a0,30,1,0]],['NaN lift',[a0,b0,NaN,1,0]]]){
    E.calls.length=0;let r,threw=false;try{r=A.hand(...args,'cid',c,E.sc);}catch(_){threw=true;}ok('hand refuses '+n+' without drawing',!threw&&r===false&&!E.calls.some(c=>c.a));}
  E.calls.length=0;A.hand(a0,b0,30,NaN,-3,'cid',c,E.sc);d=E.calls.find(c=>c.a);ok('hand negative time clamps to frame 6 with finite numbers',!!d&&d.a[2]===96&&d.a[1]===0&&fin(d));
  // 대체 길
  E=boot({ready:false});
  ok('sheet not ready → gate falls back and asks for the image',E.api.gate(b,10.1,q,120,E.sc)===false&&E.asked.some(p=>p.includes('seoha-summon-gate')));
  ok('sheet not ready → room falls back',E.api.room(p,200,.5,'cid',c,E.sc)===false&&!E.calls.some(c=>c.a));
  E=boot({off:true});
  ok('switched off → both fall back',E.api.gate(b,10.1,q,120,E.sc)===false&&E.api.room(p,200,.5,'cid',c,E.sc)===false&&E.api.hand(a0,b0,30,1,0,'cid',c,E.sc)===false&&E.api.on()===false);
  E=boot();E.ctx.drawImage=()=>{throw new Error('boom');};
  let r1,threw=false;try{r1=E.api.gate(b,10.1,q,120,E.sc);}catch(_){threw=true;}
  ok('draw error is swallowed, counted, and falls back',!threw&&r1===false&&E.api.inspect().errors===1&&E.ctx.globalAlpha===1);
}
console.log('\nR986 CPU: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
