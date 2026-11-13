#!/usr/bin/env node
// R995: 한서하 패시브(R949) 아르벨리아 마지막 박자의 퍼지는 고리를 Dots 수정본 SE-06 r2(18장)로 그린다.
// 판정·피해는 건드리지 않는다. 시트가 안 읽혔거나 꺼져 있으면 R986(한 장) → R949 코드 그림 순으로 돌아간다. 좌표가 깨지면(NaN) 그리지 않는다.
// SE-05 r2(되감긴 시간로)는 게임 화면 심사에서 다시 떨어져 연결하지 않는다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),repo=path.resolve(root,'..');
let pass=0,fail=0;const ok=(n,c,d)=>{if(c){pass++;console.log('PASS '+n);}else{fail++;console.log('FAIL '+n+(d?' :: '+d:''));}};
const rd=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return '';}};
const NAME='seoha-epoch-fx-r995.js',src=rd(path.join(root,'client-source',NAME)),r949=rd(path.join(root,'client-source','seoha-epoch-r949.js'));
const html=rd(path.join(root,'runtime-text','index.html')),verify=rd(path.join(repo,'scripts','verify-r96-public.py')),yml=rd(path.join(repo,'.github','workflows','pages.yml'));
const man=rd(path.join(root,'runtime-manifest.json'));

// ── 연결 ──
ok('overlay file exists',src.length>500);
ok('runtime copy matches source',src&&rd(path.join(root,'runtime-text',NAME))===src);
ok('R949 runtime copy matches source',r949&&rd(path.join(root,'runtime-text','seoha-epoch-r949.js'))===r949);
ok('script tag right after seoha-epoch-fx-r986',html.includes('<script src="./seoha-epoch-fx-r986.js"></script>\n<script src="./'+NAME+'"></script>'));
ok('script tag before story-reader line',html.indexOf('./'+NAME)<html.indexOf('./story-reader-r122.js'));
ok('verify list has overlay and assets',verify.includes("'"+NAME+"'")&&verify.includes("'assets/r995/'"));
ok('pages.yml runs this check',yml.includes('node r96/qa/r995/r995-cpu-check.cjs'));
ok('manifest lists overlay and sheet',man.includes('"'+NAME+'"')&&man.includes('assets/r995/seoha-room-wave.webp'));
ok('asset present',fs.existsSync(path.join(root,'runtime-text','assets','r995','seoha-room-wave.webp')));
ok('R949 asks the R995 wave first, then R986, then its own rings',/X995\(\)\.wave\(p,R,ARB_ROOM\.r\*T1\*\.5,f,cid,c,sc\)\)&&!\(X986\(\)&&X986\(\)\.room&&X986\(\)\.room\(p,R,f,cid,c,sc\)\)\)\{ring\(p,R,VIO/.test(r949));
ok('rewind sheet (SE-05 r2) is not wired: it failed the in-game review again',!/burst|donut|rewind/.test(src.replace(/\/\/.*$/gm,''))&&!man.includes('seoha-rewind'));
ok('no damage or judgement calls in overlay',!/hitEnemy|killEnemy|\.hp\s*[-+]?=|room\.enemies/.test(src));
ok('no blur/drop-shadow filter and no gradients',!/blur\(|drop-shadow|createRadialGradient|createLinearGradient/.test(src));

// ── 동작(가짜 캔버스) ──
function boot(opt){opt=opt||{};const calls=[],store={};if(opt.off)store['storyworld.r995.seohaFx']=JSON.stringify({on:false});
  const ctx={globalAlpha:1,globalCompositeOperation:'lighter',save(){this._s=(this._s||[]);this._s.push([this.globalAlpha,this.globalCompositeOperation]);},restore(){const s=this._s.pop();this.globalAlpha=s[0];this.globalCompositeOperation=s[1];},
    drawImage(...a){calls.push({a,alpha:this.globalAlpha,comp:this.globalCompositeOperation});}};
  const asked=[];const g={console,Math,Number,JSON,Date,Object,Array,String,isFinite,ctx,time:10,
    localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
    readyImage:p=>opt.ready===false?null:{image:{src:p}},
    ensureImages:p=>{asked.push(...p);return Promise.resolve();}};
  g.window=g;vm.createContext(g);vm.runInContext(src,g,{filename:NAME});
  return {g,ctx,calls,asked,api:g.__STORYWORLD_SEOHA_FX_R995__,sc:(o,f)=>{calls.push({scope:o});f();}};}
const fin=c=>c.a.slice(1).every(Number.isFinite);
const W=[112,136,167,205,250,306,343,382,400,416,432,448,456,510,560,594,607,690],H=[77,87,103,120,144,160,176,174,214,204,203,197,249,249,268,264,290,293];
if(src){
  let E=boot();const A=E.api,p={x:500,y:300},c={x:7,y:8};
  ok('API exposed with revision',!!A&&typeof A.wave==='function'&&/^R995/.test(A.revision)&&A.paths.length===1);
  // 장 고르기: 폭이 지금 반지름 비율을 넘지 않는 가장 큰 장
  ok('frame choice: tiny → 0, full → 17',A.waveFrame(0)===0&&A.waveFrame(1)===17&&A.waveFrame(5)===17&&A.waveFrame(-1)===0&&A.waveFrame(NaN)===0);
  let mono=true,prev=0;for(let u=0;u<=1.0001;u+=.01){const f=A.waveFrame(u);if(f<prev)mono=false;prev=f;}
  ok('frame choice never goes back as the ring grows',mono);
  ok('frame choice at the start radius (safe 2.4 of 9) is an early small dial',A.waveFrame(2.4/9)>=2&&A.waveFrame(2.4/9)<=4);
  let never=true;for(let u=.17;u<=1;u+=.01){const f=A.waveFrame(u);if(W[f]>u*690+1e-6)never=false;}
  ok('chosen frame is never wider than the wanted ring (no shrinking mismatch)',never);
  // 그리기
  ok('wave draws and claims',A.wave(p,90,180,.9,'cid',c,E.sc)===true);
  let d=E.calls.find(x=>x.a),fr=A.waveFrame(.5);
  ok('wave picks the cell for the frame (768x384, 6 per row)',d.a[1]===(fr%6)*768&&d.a[2]===Math.floor(fr/6)*384&&d.a[3]===768&&d.a[4]===384);
  ok('ring outer width = 2R and height = R exactly (2:1 on the floor)',Math.abs(d.a[7]*W[fr]/768-180)<1e-6&&Math.abs(d.a[8]*H[fr]/384-90)<1e-6);
  ok('ring centred on the projected point',Math.abs(d.a[5]+d.a[7]/2-500)<1e-6&&Math.abs(d.a[6]+d.a[8]/2-300)<1e-6);
  ok('first pass source-over; scope is a ground-aligned hero effect at the cast',d.comp==='source-over'&&E.calls.some(x=>x.scope&&x.scope.kind==='effect'&&x.scope.pxfSide==='hero'&&x.scope.groundAligned===true&&x.scope.x===7&&x.scope.y===8&&x.scope.id==='r995:wave:cid'));
  E.calls.length=0;A.wave(p,60,180,1,'cid',c,E.sc);
  ok('thick early frames are drawn once',E.calls.filter(x=>x.a).length===1&&A.waveFrame(60/180)<8);
  E.calls.length=0;A.wave(p,170,180,.6,'cid',c,E.sc);let ds=E.calls.filter(x=>x.a);
  ok('thin late frames get a second additive pass at the same place',A.waveFrame(170/180)>=8&&ds.length===2&&ds[1].comp==='lighter'&&ds[0].a.slice(1).join()===ds[1].a.slice(1).join());
  ok('canvas state restored after drawing',E.ctx.globalAlpha===1&&E.ctx.globalCompositeOperation==='lighter');
  // 옅어짐: 앞 절반은 또렷, 뒤 절반에 사라짐
  E.calls.length=0;A.wave(p,100,180,.8,'cid',c,E.sc);const a1=E.calls.find(x=>x.a).alpha;
  E.calls.length=0;A.wave(p,170,180,.25,'cid',c,E.sc);const a2=E.calls.find(x=>x.a).alpha;
  ok('full strength through the first half, fading in the second',a1===1&&Math.abs(a2-.5)<1e-9);
  E.calls.length=0;ok('fully faded: claims without drawing',A.wave(p,180,180,0,'cid',c,E.sc)===true&&!E.calls.some(x=>x.a));
  E.calls.length=0;A.wave(p,400,180,5,'cid',c,E.sc);d=E.calls.find(x=>x.a);
  ok('radius beyond the end and alpha above 1 clamp (last frame, alpha 1, finite numbers)',d.a[1]===5*768&&d.a[2]===2*384&&d.alpha===1&&fin(d));
  // 깨진 값
  for(const [n,args] of [['NaN point',[{x:NaN,y:1},90,180,.5]],['NaN radius',[p,NaN,180,.5]],['zero radius',[p,0,180,.5]],['negative radius',[p,-5,180,.5]],['NaN end radius',[p,90,NaN,.5]],['zero end radius',[p,90,0,.5]],['Infinity radius',[p,Infinity,180,.5]],['NaN alpha',[p,90,180,NaN]],['no point',[null,90,180,.5]]]){
    E.calls.length=0;let r,threw=false;try{r=A.wave(...args,'cid',c,E.sc);}catch(_){threw=true;}ok('wave refuses '+n+' without drawing',!threw&&r===false&&!E.calls.some(x=>x.a));}
  E.calls.length=0;let r0,th0=false;try{r0=A.wave(p,90,180,.5,undefined,null,null);}catch(_){th0=true;}
  ok('works without scope function, cast or id',!th0&&r0===true&&E.calls.filter(x=>x.a).every(fin));
  ok('stats count draws and no errors',A.inspect().waveDraws>=6&&A.inspect().errors===0&&A.inspect().fallbacks>=8);
  // 대체 길
  E=boot({ready:false});
  ok('sheet not ready → falls back and asks for the image',E.api.wave(p,90,180,.5,'cid',c,E.sc)===false&&E.asked.some(x=>x.includes('seoha-room-wave'))&&!E.calls.some(x=>x.a));
  E=boot({off:true});
  ok('switched off → falls back',E.api.wave(p,90,180,.5,'cid',c,E.sc)===false&&E.api.on()===false);
  E=boot();E.ctx.drawImage=()=>{throw new Error('boom');};
  let r1,threw=false;try{r1=E.api.wave(p,90,180,.5,'cid',c,E.sc);}catch(_){threw=true;}
  ok('draw error is swallowed, counted, and falls back',!threw&&r1===false&&E.api.inspect().errors===1&&E.ctx.globalAlpha===1);
}
console.log('\nR995 CPU: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
