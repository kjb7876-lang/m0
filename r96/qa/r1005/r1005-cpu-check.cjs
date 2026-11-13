#!/usr/bin/env node
// R1005: 한서하 패시브(R949) 아르벨리아 둘째 박자(되감긴 시간로)가 맞는 순간을 Dots SE-05 r3 의 터지는 14장으로 그린다.
// 판정·피해는 건드리지 않는다. 시트가 안 읽혔거나 꺼져 있으면 R949 의 보라 고리 번쩍임으로 돌아간다. 좌표가 깨지면(NaN) 그리지 않는다.
// 감기는 1~10장(장마다 같은 그림·구멍 47%·불투명)은 쓰지 않는다: 예고 고리는 R949 코드 그림 그대로.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),repo=path.resolve(root,'..');
let pass=0,fail=0;const ok=(n,c,d)=>{if(c){pass++;console.log('PASS '+n);}else{fail++;console.log('FAIL '+n+(d?' :: '+d:''));}};
const rd=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return '';}};
const NAME='seoha-epoch-fx-r1005.js',ASSET='assets/r1005/seoha-kiln-burst.webp',src=rd(path.join(root,'client-source',NAME)),r949=rd(path.join(root,'client-source','seoha-epoch-r949.js'));
const html=rd(path.join(root,'runtime-text','index.html')),verify=rd(path.join(repo,'scripts','verify-r96-public.py')),yml=rd(path.join(repo,'.github','workflows','pages.yml'));
const man=rd(path.join(root,'runtime-manifest.json'));

// ── 연결 ──
ok('overlay file exists',src.length>500);
ok('runtime copy matches source',src&&rd(path.join(root,'runtime-text',NAME))===src);
ok('R949 runtime copy matches source',r949&&rd(path.join(root,'runtime-text','seoha-epoch-r949.js'))===r949);
ok('script tag right after seoha-epoch-fx-r995',html.includes('<script src="./seoha-epoch-fx-r995.js"></script>\n<script src="./'+NAME+'"></script>'));
ok('script tag before story-reader line',html.indexOf('./'+NAME)<html.indexOf('./story-reader-r122.js'));
ok('verify list has overlay and assets',verify.includes("'"+NAME+"'")&&verify.includes("'assets/r1005/'"));
ok('pages.yml runs this check',yml.includes('node r96/qa/r1005/r1005-cpu-check.cjs'));
ok('manifest lists overlay and sheet',man.includes('"'+NAME+'"')&&man.includes(ASSET));
ok('asset present',fs.existsSync(path.join(root,'runtime-text',ASSET)));
ok('R949 asks the burst hook at the hit, else keeps its violet flash rings',/if\(since!=null&&X1005\(\)&&X1005\(\)\.burst&&X1005\(\)\.burst\(p,R1,since,cid,c,sc\)\)\{\}else if\(f>0\)\{ctx\.globalAlpha\*=f;for\(let i=1;i<=4;i\+\+\)/.test(r949));
ok('R949 wind-up telegraph (two rings + 12 ticks) is untouched',r949.includes('ring(p,R0,VIO,Math.max(1.5,2.5*z),.45+.4*w,0);ring(p,R1,VIO,Math.max(1.5,2.5*z),.45+.4*w,0);')&&r949.includes('for(let i=0;i<12;i++){const an=-t*2.2+i*Math.PI/6'));
ok('no damage or judgement calls in overlay',!/hitEnemy|killEnemy|\.hp\s*[-+]?=|room\.enemies/.test(src));
ok('no blur/drop-shadow filter and no gradients',!/blur\(|drop-shadow|createRadialGradient|createLinearGradient/.test(src));

// ── 동작(가짜 캔버스) ──
function boot(opt){opt=opt||{};const calls=[],store={};if(opt.off)store['storyworld.r1005.seohaFx']=JSON.stringify({on:false});
  const ctx={globalAlpha:.7,globalCompositeOperation:'lighter',save(){this._s=(this._s||[]);this._s.push([this.globalAlpha,this.globalCompositeOperation]);},restore(){const s=this._s.pop();this.globalAlpha=s[0];this.globalCompositeOperation=s[1];},
    drawImage(...a){calls.push({a,alpha:this.globalAlpha,comp:this.globalCompositeOperation});}};
  const asked=[];const g={console,Math,Number,JSON,Date,Object,Array,String,isFinite,ctx,time:10,
    localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},
    readyImage:p=>opt.ready===false?null:{image:{src:p}},
    ensureImages:p=>{asked.push(...p);return Promise.resolve();}};
  g.window=g;vm.createContext(g);vm.runInContext(src,g,{filename:NAME});
  return {g,ctx,calls,asked,api:g.__STORYWORLD_SEOHA_FX_R1005__,sc:(o,f)=>{calls.push({scope:o});f();}};}
const fin=c=>c.a.slice(1).every(Number.isFinite);
if(src){
  let E=boot();const A=E.api,p={x:500,y:300},c={x:7,y:8};
  ok('API exposed with revision',!!A&&typeof A.burst==='function'&&/^R1005/.test(A.revision)&&A.paths.length===1&&A.paths[0]===ASSET);
  ok('burst draws at the hit and claims',A.burst(p,150,0,'cid',c,E.sc)===true&&E.calls.filter(x=>x.a).length===1);
  let d=E.calls.find(x=>x.a);
  ok('first frame = cell 0 (362x181)',d.a[1]===0&&d.a[2]===0&&d.a[3]===362&&d.a[4]===181);
  ok('ring outer width = 2·R1 and height = R1 (2:1 on the floor)',Math.abs(d.a[7]*315/362-300)<1e-6&&Math.abs(d.a[8]*148/181-150)<1e-6);
  ok('ring centre (182,104.5 in the cell) sits on the projected point',Math.abs(d.a[5]+182*d.a[7]/362-500)<1e-6&&Math.abs(d.a[6]+104.5*d.a[8]/181-300)<1e-6);
  ok('drawn source-over inside a ground-aligned hero effect scope at the cast',d.comp==='source-over'&&E.calls.some(x=>x.scope&&x.scope.kind==='effect'&&x.scope.pxfSide==='hero'&&x.scope.groundAligned===true&&x.scope.x===7&&x.scope.y===8&&x.scope.id==='r1005:burst:cid'));
  ok('canvas state restored',E.ctx.globalAlpha===.7&&E.ctx.globalCompositeOperation==='lighter');
  const seen=[];for(let s=0;s<.52;s+=.005){E.calls.length=0;A.burst(p,150,s,'cid',c,E.sc);d=E.calls.find(x=>x.a);if(d){const fr=d.a[1]/362+6*d.a[2]/181;if(seen[seen.length-1]!==fr)seen.push(fr);}}
  ok('plays all 14 frames in order over 0.52s',seen.join()===[0,1,2,3,4,5,6,7,8,9,10,11,12,13].join(),seen.join());
  E.calls.length=0;A.burst(p,150,.519,'cid',c,E.sc);d=E.calls.find(x=>x.a);
  ok('last frame = 13 (col 1,row 2)',d.a[1]===362&&d.a[2]===362);
  E.calls.length=0;ok('after the last frame: claims without drawing (ends before the second hit at 0.58s)',A.burst(p,150,.52,'cid',c,E.sc)===true&&A.burst(p,150,5,'cid',c,E.sc)===true&&!E.calls.some(x=>x.a));
  E.calls.length=0;A.burst(p,150,-3,'cid',c,E.sc);d=E.calls.find(x=>x.a);ok('negative time clamps to frame 0 with finite numbers',!!d&&d.a[1]===0&&d.a[2]===0&&fin(d));
  for(const [n,args] of [['NaN point',[{x:NaN,y:1},150,0]],['NaN radius',[p,NaN,0]],['zero radius',[p,0,0]],['negative radius',[p,-4,0]],['Infinity radius',[p,Infinity,0]],['NaN time',[p,150,NaN]],['null time (not hit yet)',[p,150,null]],['no point',[null,150,0]]]){
    E.calls.length=0;let r,threw=false;try{r=A.burst(...args,'cid',c,E.sc);}catch(_){threw=true;}ok('burst refuses '+n+' without drawing',!threw&&r===false&&!E.calls.some(x=>x.a));}
  E.calls.length=0;let r0,th0=false;try{r0=A.burst(p,150,.1,undefined,null,null);}catch(_){th0=true;}
  ok('works without scope function, cast or id',!th0&&r0===true&&E.calls.filter(x=>x.a).every(fin));
  ok('stats count draws and no errors',A.inspect().burstDraws>=14&&A.inspect().errors===0&&A.inspect().fallbacks>=7);
  E=boot({ready:false});
  ok('sheet not ready → falls back and asks for the image',E.api.burst(p,150,0,'cid',c,E.sc)===false&&E.asked.some(x=>x.includes('seoha-kiln-burst'))&&!E.calls.some(x=>x.a));
  E=boot({off:true});
  ok('switched off → falls back',E.api.burst(p,150,0,'cid',c,E.sc)===false&&E.api.on()===false);
  E=boot();E.ctx.drawImage=()=>{throw new Error('boom');};
  let r1,threw=false;try{r1=E.api.burst(p,150,0,'cid',c,E.sc);}catch(_){threw=true;}
  ok('draw error is swallowed, counted, and falls back',!threw&&r1===false&&E.api.inspect().errors===1&&E.ctx.globalAlpha===.7);
}
console.log('\nR1005 CPU: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
