// R440 CPU check — ① 피의 육망성 조형물 소환 균열 문(반복 시트)이 끝 시간과 함께 불리고, pixelfx 가 until 에 지우며 fade 동안 옅어진다.
//  ② 적 공격 바닥 예고 그림(drawNativeGroundArt154 'warning'·'flight')을 예고 표시 꺼짐(기본)에서 그리지 않고, 터짐·잔흔은 그대로. ③ R52 돌진 길 색이 예고 목록에 있다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
for(const f of ['pixelfx-r163.js','combat-r170.js','combat-flow-r425.js']){ok(f+' runtime copy matches client source',RT(f)===C(f));try{new vm.Script(C(f));ok(f+' syntax',true);}catch(e){ok(f+' syntax '+e.message,false);}}
const r170=C('combat-r170.js');
ok('R170 rift portal call has until + fade',/X\.play\('pvfx-rift-portal',m\.x,m\.y,\{k:\.75,until:T\(\)\+1\.6,fade:\.5,/.test(r170));
const idx=JSON.parse(fs.readFileSync(path.join(R,'runtime-text','assets','r163','pixelfx','index.json'),'utf8')).effects;
ok('rift portal sheet is a loop sheet (why until is needed)',idx['pvfx-rift-portal']?.loop===true);
// 모든 반복 시트 호출에 until 이 있어야 한다(없으면 지역을 나갈 때까지 남는다)
const loops=Object.keys(idx).filter(k=>idx[k].loop);const files=fs.readdirSync(path.join(R,'client-source')).filter(f=>f.endsWith('.js'));let missing=[];
for(const f of files){const s=C(f);for(const k of loops){const re=new RegExp("play\\('"+k.replace(/[-]/g,'\\-')+"',[^;]*?\\{([^}]*)\\}","g");let m;while((m=re.exec(s))){if(!/until:/.test(m[1])&&!/loop:false/.test(m[1]))missing.push(f+':'+k);}}}
ok('every loop-sheet play() passes until (or loop:false): '+(missing.join(',')||'none missing'),missing.length===0);
// pixelfx 동작: 가짜 전역으로 play → tick → until 지나면 빠짐, fade 동안 globalAlpha 줄어듦
{const g={console,localStorage:{getItem:()=>null,setItem:()=>{}},fetch:()=>({then:f=>({then:h=>{h({effects:idx});return{catch:()=>{}};},catch:()=>{}})}),time:0,effects:[],Promise,Date,Math,JSON,Number,Map,document:{createElement:()=>({getContext:()=>null})}};
 g.window=g;g.actorHeight=()=>60;g.project=(x,y)=>({x:x*10,y:y*10});g.readyImage=()=>({image:{width:960,height:768,naturalWidth:960,naturalHeight:768}});
 const alphas=[];g.ctx={save(){},restore(){},translate(){},scale(){},drawImage(){alphas.push(this.globalAlpha);},globalAlpha:1};
 g.drawEffect=function(){};g.tick=function(){};g.enterRegion=async function(){};vm.createContext(g);vm.runInContext(C('pixelfx-r163.js'),g);
 const X=g.__STORYWORLD_PIXELFX_R163__;g.time=10;X.play('pvfx-rift-portal',1,1,{k:.75,until:g.time+1.6,fade:.5});
 const drawAt=t=>{g.time=t;g.ctx.globalAlpha=1;alphas.length=0;g.drawEffect({type:'r163-pixelfx'});return alphas[0];};
 ok('drawn at full alpha before fade',Math.abs(drawAt(10.5)-1)<1e-9);const a=drawAt(11.35);ok('fading in last .5 s (alpha '+(a?.toFixed?.(2))+')',a>0.4&&a<0.6);
 g.time=11.7;g.tick(1/60);ok('removed after until',X.inspect().active.length===0);
 g.time=20;X.play('pvfx-rift-portal',1,1,{k:.75});g.time=60;g.tick(1/60);ok('control: loop sheet without until stays (old bug mechanism)',X.inspect().active.length===1);}
// R425 바닥 예고: 가짜 drawNativeGroundArt154 로 단계별 호출
{const src=C('combat-flow-r425.js');ok('R52 lane stroke colour in TELE_WORLD',/'rgba\(211,193,151,\.72\)'/.test(src));ok('R52 lane fill mapped to world tell',/fillStyle==='rgba\(186,165,119,\.075\)'\)return 'world'/.test(src));
 const m=src.match(/if\(typeof drawNativeGroundArt154==='function'\)\{[\s\S]*?\};\}/);ok('ground-art wrapper present',!!m);
 if(m){const calls=[];const g={stats:{},prefs:{tele:false},solo:()=>true,drawNativeGroundArt154:(p,r,gg,a,stage)=>{calls.push(stage);return true;}};vm.createContext(g);vm.runInContext(m[0],g);
  const res=['warning','flight','active','recovery','confirmed-contact'].map(s=>g.drawNativeGroundArt154('x',null,{},.2,s));
  ok('tele off: warning/flight not drawn, active/recovery/contact drawn',JSON.stringify(calls)==='["active","recovery","confirmed-contact"]'&&res[0]===false&&res[1]===false&&res[2]===true);
  calls.length=0;g.prefs.tele=true;g.drawNativeGroundArt154('x',null,{},.2,'warning');ok('tele on: warning drawn (setting restores)',calls.length===1);
  calls.length=0;g.prefs.tele=false;g.solo=()=>false;g.drawNativeGroundArt154('x',null,{},.2,'warning');ok('co-op: warning kept',calls.length===1);}
 ok('presentation only: no hp/damage/save writes added',!/groundTeleHidden[^;]*\.hp\s*=/.test(src));}
console.log(JSON.stringify({ok:bad===0,checks:n,failed:bad}));process.exit(bad?1:0);
