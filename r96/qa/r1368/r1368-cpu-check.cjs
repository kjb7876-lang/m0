// R1368 CPU 검사 — 공실 표기 잔재(우두머리 포함, murder04-e1)가 R1368 시트로 그려지고, 공격 칸이 영웅 쪽을 보는지.
//  vm 에 R248 표·R248 그리기·R290·R1368 을 싣고 그린 명령(drawImage 칸·scale 부호)을 본다. 그림이 보는 쪽은 시트 칸의 불투명 질량
//  (pivot x=128 오른쪽 - 왼쪽)으로 미리 잰 값(qa/r1368/r1368-check.py 가 같은 값을 그림으로 다시 잼)을 쓴다.
'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const R=path.resolve(__dirname,'../..'),CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');let n=0;const ok=(c,m,x)=>{assert.ok(c,m+(x?' '+JSON.stringify(x).slice(0,200):''));n++;};
function mk(store={}){const drawn=[],scales=[];const ctx={save(){},restore(){},translate(){},scale(x,y){scales.push([x,y]);},drawImage(im,...a){drawn.push({src:im.src,a,sx:scales.at(-1)?.[0]});},scope(m,f){f();},filter:'',globalAlpha:1};
 const ls={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,localStorage:ls,window:{__STORYWORLD_FX_SPRITES_R106__:{on:()=>true,draw(){},along(){}}},
  time:10,layer:'STORY',ctx,project:(x,y)=>({x:(x-y)*10,y:(x+y)*5}),actorHeight:()=>60,effects:[],player:{x:10,y:10,hp:100},room:{enemies:[]},
  readyImage:p=>({image:{src:p}}),ensureImages:()=>Promise.resolve(),tick(){},drawEffect(){},drawEnemy(){return 'base';}};
 sb.window.localStorage=ls;vm.createContext(sb);for(const f of ['mob-unique-r248-data.js','mob-unique-r248.js','mob-art-r290.js','mob-m052-face-r1368.js'])vm.runInContext(CS(f),sb,{filename:f});return {sb,drawn};}
const sheet=d=>d.find(x=>/assets\/r(2\d\d|1368)\/mobs?\/|assets\/r1368\//.test(x.src));
for(const name of ['공실 표기 잔재','공실 표기 잔재 우두머리']){
 // 영웅이 오른쪽(+화면 x) → 공격 각 0(오른쪽 아래) 은 화면 오른쪽: face +1. 그림이 오른쪽을 보면 scale x>0 로 그대로 그려야 한다.
 for(const [px,ang,want] of [[14,0,1],[6,Math.PI,-1]]){
  const {sb,drawn}=mk();sb.player={x:px,y:10,hp:100};const e={id:'e1',name,nativeId:'murder04-e1',x:10,y:10,hp:10};
  sb.drawEnemy(e);e.attack={elapsed:.3,angle:ang,shape154:{windup:.45,active:.15,recovery:.35}};sb.time=12;drawn.length=0;sb.drawEnemy(e);const d=sheet(drawn);
  ok(`${name}: 공격 칸을 R1368 시트(3줄)에서`,d&&d.src==='assets/r1368/m052.webp'&&d.a[1]===640,d);
  ok(`${name}: 영웅 ${want>0?'오른쪽':'왼쪽'} 공격 → 그림 오른쪽 기준 face ${want}`,d&&Math.sign(d.sx)===want,d);}
 const {sb,drawn}=mk();sb.drawEnemy({id:'w',name,nativeId:'murder04-e1',x:10,y:10,hp:10});ok(`${name}: 걷기·대기도 R1368 시트`,sheet(drawn)?.src==='assets/r1368/m052.webp');}
{const {sb,drawn}=mk({'storyworld.r1368.m052':'{"on":false}'});sb.drawEnemy({id:'o',name:'공실 표기 잔재',nativeId:'murder04-e1',x:10,y:10,hp:10});ok('끄기 → 원래 R290 시트',sheet(drawn)?.src==='assets/r290/mobs/m052.webp');}
{const {sb,drawn}=mk();sb.drawEnemy({id:'x',name:'제출되지 못한 문장',nativeId:'murder04-e2',x:10,y:10,hp:10});ok('다른 몹(m053)은 그대로',!drawn.some(d=>/r1368/.test(d.src)));}
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
ok(rd('runtime-text/mob-m052-face-r1368.js')===CS('mob-m052-face-r1368.js'),'runtime-text 사본 같음');
const html=rd('runtime-text/index.html');const i0=html.indexOf('<script src="./mob-art-r290.js">'),i1=html.indexOf('<script src="./mob-m052-face-r1368.js">');ok(i0>0&&i1>i0,'R290 뒤 태그');
ok(rd('../scripts/verify-r96-public.py').includes("'mob-m052-face-r1368.js'"),'공개 확인 목록');
ok(rd('../.github/workflows/pages.yml').includes('r96/qa/r1368/r1368-cpu-check.cjs'),'CI 줄');
ok(rd('runtime-inputs.json').includes('assets/r1368/m052.webp'),'runtime inputs');
console.log('R1368 CPU check passed:',n,'assertions');
