// R1192 흐린 보스 이펙트(운석·낙하·범위류) 더 잘 보이게 — CPU/정적 검사.
// 실행: node r96/qa/r1192/r1192-boss-fx-vis-cpu-check.cjs
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let n=0,bad=0;const ok=(m,c,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const rd=p=>{try{return fs.readFileSync(p,'utf8');}catch(_){return null;}};
const F='boss-fx-vis-r1192.js',src=rd(path.join(R,'client-source',F)),rt=rd(path.join(R,'runtime-text',F));
ok('overlay exists in client-source',!!src);
ok('runtime-text copy is identical (sync-r99 ran)',!!src&&src===rt);
const html=rd(path.join(R,'runtime-text','index.html'))||'';
const at=s=>html.indexOf('<script src="./'+s+'"></script>');
ok('index.html has the script tag',at(F)>0);
ok('tag comes right after R1040 pattern (after R106 sprites)',at(F)>at('fx-sprites-r106.js')&&html.includes('<script src="./boss-pattern-fx-r1040.js"></script>\n<script src="./'+F+'"></script>'));
ok('re-wraps drawEffect·drawHazard when a later overlay wraps them (outermost, so R241 등 표지를 먼저 잡음)',!!src&&/drawEffect!==myDE/.test(src)&&/drawHazard!==myDH/.test(src));
ok('tag is not after the fixed tail (combat-r118·world-tiles-r118)',at(F)<at('combat-r118.js'));
ok('verify-r96-public expects it',(rd(path.join(ROOT,'scripts','verify-r96-public.py'))||'').includes("'"+F+"'"));
ok('pages.yml runs this check',(rd(path.join(ROOT,'.github','workflows','pages.yml'))||'').includes('r96/qa/r1192/r1192-boss-fx-vis-cpu-check.cjs'));
const man=rd(path.join(R,'runtime-manifest.json'))||'',inp=rd(path.join(R,'runtime-inputs.json'))||'';
ok('runtime manifest·inputs list it',man.includes(F)&&inp.includes(F));
// R106: 큰 덧셈 조각 옅게(R181 tame)를 보스 이펙트에서 끌 수 있어야 한다
const r106=rd(path.join(R,'client-source','fx-sprites-r106.js'))||'';
ok('R106 sprite draw honours o.noTame (보스 이펙트는 R181 옅게 빼기)',/o\.noTame/.test(r106));
ok('R106 runtime-text copy matches',r106===rd(path.join(R,'runtime-text','fx-sprites-r106.js')));
ok('no forbidden ctx filters (drop-shadow·blur)',!!src&&!/drop-shadow|blur\(/.test(src));
ok('off switch key storyworld.r1192.bossFxVis',!!src&&src.includes('storyworld.r1192.bossFxVis'));
// 모듈을 가짜 창에 올려 순수 함수를 잰다
let API=null,sb=null;
if(src){const store={};const win={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}}};
 sb={window:win,localStorage:win.localStorage,setTimeout:()=>0,console,Math,JSON,Number,String,Array,Object,Set,Map,WeakMap,WeakSet,Symbol,Error,isFinite,
  room:{enemies:[{id:'z:boss',boss:true,hp:10},{id:'z:mob',hp:5},{id:'z:mid',midboss:true,hp:3},{id:'z:sum',boss:true,r61Summoned:true,hp:3}]}};
 sb.globalThis=sb;try{vm.runInNewContext(src,sb,{filename:F});API=win.__STORYWORLD_BOSS_FX_VIS_R1192__;}catch(e){ok('module loads in a stub window',false,String(e));}}
ok('API exposed',!!API);
if(API){const c=API.curve,iv=API.inverse;
 ok('curve(0)=0, curve(1)=1',c(0)===0&&Math.abs(c(1)-1)<1e-9);
 ok('curve lifts faint alpha (.35 → ≥ .5, .2 → ≥ .3)',c(.35)>=.5&&c(.2)>=.3,{a35:c(.35),a20:c(.2)});
 ok('curve keeps order and never exceeds 1',[0,.05,.1,.3,.5,.7,.9,1].every((v,i,a)=>i===0||c(v)>c(a[i-1]))&&c(5)<=1);
 ok('curve is clamped for NaN·Infinity·negative',c(NaN)===0&&c(-1)===0&&c(Infinity)===1);
 ok('inverse(curve(x)) ≈ x',[.1,.33,.5,.8].every(v=>Math.abs(iv(c(v))-v)<1e-6));
 const hz=API.isBossHazard;
 ok('R241 meteor·R330 disaster·samong pattern·story-pattern hazards count as boss',hz({r241Meteor:{}})&&hz({r330:{}})&&hz({samongPattern:'meteor'})&&hz({type:'story-pattern'}));
 ok('hazard owned by boss·midboss counts, by an ordinary mob·summoned copy does not',hz({type:'field',owner:'z:boss'})&&hz({type:'field',owner:'z:mid'})&&!hz({type:'field',owner:'z:mob'})&&!hz({type:'field',owner:'z:sum'}));
 ok('player-owned·ownerless·null hazards do not count',!hz({type:'field',owner:'player'})&&!hz({type:'field'})&&!hz(null));
 const ef=API.isBossEffect;
 ok('boss effect sentinels count (r241-fx·r105-meteor·r330-fx·r1040-fx·r162-samong)',['r241-fx','r105-meteor','r330-fx','r1040-fx','r162-samong'].every(t=>ef({type:t})));
 ok('hero·text·status effects do not',!ef({type:'text'})&&!ef({type:'r1153-status'})&&!ef({type:'r411-sheet-fx'})&&!ef(null));
 const cmds=[{kind:'image',style:{globalAlpha:.3,filter:'none'}},{kind:'image',style:{globalAlpha:.5,filter:'brightness(1.1)'}},{kind:'path',style:{globalAlpha:.2,filter:'none'}},{kind:'text',style:{globalAlpha:.4,filter:'none'}},{kind:'image',style:{globalAlpha:NaN,filter:'none'}}];
 const done=API.boostCommands(cmds,0);
 ok('boostCommands lifts image·path alpha with the curve',Math.abs(cmds[0].style.globalAlpha-c(.3))<1e-9&&Math.abs(cmds[2].style.globalAlpha-c(.2))<1e-9,cmds.map(x=>x.style.globalAlpha));
 ok('text commands are left alone',cmds[3].style.globalAlpha===.4&&cmds[3].style.filter==='none');
 const known=/^(?:(?:brightness|contrast|saturate|grayscale|hue-rotate)\([^)]+\)\s*)+$/;
 ok('image filters gain saturation·contrast using only recorder-known functions',known.test(cmds[0].style.filter)&&/saturate/.test(cmds[0].style.filter)&&known.test(cmds[1].style.filter)&&/^brightness\(1\.1\)/.test(cmds[1].style.filter),[cmds[0].style.filter,cmds[1].style.filter]);
 ok('NaN alpha becomes a finite number',Number.isFinite(cmds[4].style.globalAlpha));
 const a0=cmds[0].style.globalAlpha,f0=cmds[0].style.filter;API.boostCommands(cmds,0);
 ok('boosting twice does not compound (marked once)',cmds[0].style.globalAlpha===a0&&cmds[0].style.filter===f0&&done>=4);
 const ink=[{kind:'image',owner:{id:'r163:mob-memory:12.5'},style:{globalAlpha:.4,filter:'none'}},{kind:'image',owner:{id:'r163:mob-forge:3'},style:{globalAlpha:.4,filter:'none'}},{kind:'path',owner:{id:'r163:mob-memory:1'},style:{globalAlpha:.4,filter:'none'}}];
 ok('ink hit (R1177f mob-memory) image gets brightness·contrast and the alpha curve',API.inkCommands(ink,0)===1&&/brightness\(1\.4\)/.test(ink[0].style.filter)&&known.test(ink[0].style.filter)&&Math.abs(ink[0].style.globalAlpha-c(.4))<1e-9,ink[0].style);
 ok('other mob hit sheets and non-image commands are untouched',ink[1].style.filter==='none'&&ink[1].style.globalAlpha===.4&&ink[2].style.globalAlpha===.4);
 ok('ink boost does not compound',API.inkCommands(ink,0)===0&&Math.abs(ink[0].style.globalAlpha-c(.4))<1e-9);
 ok('set(false) turns off and persists',API.set(false)===false&&API.inspect().on===false&&/false/.test(String(sb.window.localStorage.getItem('storyworld.r1192.bossFxVis'))));}
console.log(`${n-bad}/${n} passed`);process.exit(bad?1:0);
