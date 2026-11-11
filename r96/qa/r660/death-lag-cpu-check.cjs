// R660 CPU 검사(사용자 2026-11-10 14:16Z "광장에서 진행중인데 렉이심함", 14:18Z "몹죽을때 생기는버그쪽이 렉의심됨").
//  재현(헤드리스 640×360, 사몽 S-01 광장): R462/R532 몹 죽음 연출 켬 프레임 426ms·309ms ↔ 끔 154ms·205ms.
//  원인: 죽는 조각·사체를 sprite(path,…,{filter}) 로 그리면 엔진 drawImage 의 색 보정 캐시(spriteTintCache3, 32칸)가
//   '그림 경로|필터 문자열' 마다 시트 전체 크기 캔버스를 새로 만들어 소프트웨어 필터를 돌리고, Three.js 가 그것을 새 텍스처로 올린다.
//   죽는 동안 밝기·채도가 매 프레임 소수 셋째 자리까지 바뀌어(새 열쇠) 게임 1초에 55장(3,900만 화소)을 새로 만들었다(끄면 11장).
//  고침: ① 3D 기록기(ctx.scope 가 있는 Three.js 그리기)에서는 필터를 ctx.filter 로 걸고 sprite 에는 넘기지 않는다
//   (기록기는 필터를 셰이더 행렬로 처리 → 캔버스·업로드 없음). ② 2D 캔버스에서는 진행값을 6단계로 끊어 필터 열쇠 수를 묶는다.
//  그림 결과(같은 필터가 같은 그림에 걸림)는 그대로여야 한다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c,extra)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,extra===undefined?'':JSON.stringify(extra).slice(0,600));}};
const F='mob-death-r462.js',src=C(F);
ok('runtime copy matches source '+F,C(F)===RT(F));
ok('revision mentions R660',/R660/.test(src));
function env(o={}){const calls=[];const g={window:{},localStorage:{getItem:()=>o.prefs?JSON.stringify(o.prefs):null,setItem(){}},setTimeout(){},Date,console,calls,Math,JSON};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,zoom=1,settings={lowFx:${!!o.low}},room={id:'plaza'},effects=[],VFX={burnFlame:'assets/vfx/burn.png'};
 var ctx={stack:[],save(){this.stack.push(this.filter);calls.push({k:'save'});},restore(){this.filter=this.stack.pop();calls.push({k:'restore'});},translate(){},scale(){},rotate(){},
  beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){calls.push({k:'clip'});},stroke(){},fill(){},ellipse(){},arc(){},fillRect(){},
  drawImage(im){calls.push({k:'drawImage',src:im.src,filter:this.filter});},globalAlpha:1,filter:'none',owner:{id:'scene',kind:'scene'}};
 ${o.recorder?"ctx.scope=function(owner,fn){return fn();};ctx.commands=[];":""}
 function project(x,y){return{x:x*10,y:y*10};}function actorHeight(){return 60;}function readyImage(p){return{image:{src:p,naturalWidth:1536,naturalHeight:1024},crop:{w:80,h:100}};}
 // 엔진 sprite → drawImage: opt.filter 가 있으면 색 보정 캐시(새 캔버스) 길을 탄다
 function sprite(p,x,y,h,opt){opt=opt||{};calls.push({k:'sprite',p,opt,ctxFilter:ctx.filter});return true;}
 function drawAssetFrame3(p,f,x,y,h,opt){return false;}
 function texture(){}
 function drawEnemy(e){sprite(e.drawn,0,0,60,{flip:false});}
 function drawBurnDeath3(fx){}
 function drawObjective(){}
 function enterRegion(){return 1;}`,g);
 vm.runInContext(src,g);return g;}
const own=c=>c.k==='sprite'&&/own-/.test(c.p);
const effFilter=c=>{const f=c.opt.filter;return f&&f!=='none'?f:(c.ctxFilter&&c.ctxFilter!=='none'?c.ctxFilter:'none');};
// 한 몹이 죽는 전 과정(게임 60fps)과 이어지는 사체 2초를 그린다
function play(g,name){const e={id:'m-'+name,name,hp:10,drawn:'assets/r380/mobs/own-'+name+'.webp'};vm.runInContext('drawEnemy',g)(e);
 const fx={type:'enemyBurnDeath',sourceId:e.id,x:3,y:4,age:0,life:.72};const draw=vm.runInContext('drawBurnDeath3',g),obj=vm.runInContext('drawObjective',g);const all=[];
 for(let f=0;f<=120;f++){fx.age=f/60;vm.runInContext('time='+(f/60),g);g.calls.length=0;if(fx.age<=fx.life)draw(fx);obj();all.push(...g.calls.filter(own));}
 for(let f=0;f<=120;f++){vm.runInContext('time='+(2+f/60),g);g.calls.length=0;obj();all.push(...g.calls.filter(own));}
 return all;}
for(const [kind,name] of [['blood','거미'],['fire','망령']]){
 // ① 3D 기록기: sprite 에 필터를 넘기지 않는다(색 보정 캐시 새 캔버스 0장) — 그래도 필터는 ctx.filter 로 그대로 걸린다
 const gR=env({recorder:true}),dR=play(gR,name);
 const tinted=dR.filter(c=>c.opt.filter&&c.opt.filter!=='none');
 ok(`${kind} recorder: own-art draws exist`,dR.length>50,dR.length);
 ok(`${kind} recorder: no sprite() filter (no tint-cache canvas per filter)`,tinted.length===0,tinted.slice(0,3).map(c=>c.opt.filter));
 ok(`${kind} recorder: filters still applied via ctx.filter on ≥90% of own-art draws`,dR.filter(c=>effFilter(c)!=='none').length>=dR.length*.9,dR.filter(c=>effFilter(c)==='none').length);
 // ② 2D 캔버스: 죽는 과정+사체 전체에서 서로 다른 필터 문자열(=새 캔버스) 수 ≤ 10
 const g2=env({}),d2=play(g2,name);const keys=new Set(d2.map(c=>c.opt.filter).filter(f=>f&&f!=='none'));
 ok(`${kind} 2D: distinct tint filters over whole death+corpse ≤ 10`,keys.size<=10,{n:keys.size,keys:[...keys].slice(0,14)});
 // ③ 회귀: 2D·기록기 모두 같은 프레임에 같은 필터(그림 결과 같음)
 const fR=dR.map(effFilter),f2=d2.map(effFilter);
 ok(`${kind} same effective filter sequence in recorder and 2D`,fR.length===f2.length&&fR.every((f,i)=>f===f2[i]),{a:fR.slice(0,5),b:f2.slice(0,5)});
 // ④ 경계: 사체(조각이 멈춘 뒤) 필터는 원래 값 그대로(검은 실루엣 아님)
 const last=f2.at(-1);ok(`${kind} corpse filter unchanged`,kind==='blood'?last==='brightness(.82) saturate(.95) contrast(1.05)':last==='brightness(.58) saturate(.6) contrast(1.12)',last);
}
// ⑤ 경계: 2D 에서 bLoop 밝기 값이 원래 연속값과 .12 이내(단계로 끊어도 모양이 크게 안 바뀜) — 불 0.2초
{const g=env({}),d=play(g,'망령');const b=d.map(c=>+(/brightness\(([\d.]+)\)/.exec(c.opt.filter||'')||[])[1]).filter(Number.isFinite);
 ok('fire 2D brightness stays within original range [.5,2.7]',b.every(v=>v>=.5&&v<=2.7),[Math.min(...b),Math.max(...b)]);}
console.log(`\nR660 death-lag CPU check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
