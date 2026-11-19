// R1206 CPU 검사 — 사몽 에피소드 몹 그림 정리(사용자 2026-11-19).
//  ① 한 몹에 그림 두 장: R248 이름 시트(R290·R410 손그림)로 그리는 몹 위에 R161 꼭두각시가 또 그려지지 않는다.
//  ② 세뇌당한 기억의 조각은 맵당 1개(R170), 빠진 자리는 그 맵 잡몹으로 채운다. 같은 방에 조각 적이 있으면 장식 조각은 그리지 않는다.
//  ③ 사몽 조각의 바닥 공격은 핏빛 육망성 대신 먹 번짐(임시 코드 그림, Dots CX-0166SM 대기). 본편은 그대로.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..');const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
const dsb={window:{}};vm.createContext(dsb);vm.runInContext(C('mob-unique-r248-data.js'),dsb);const D=dsb.window.__STORYWORLD_MOB_UNIQUE_R248_DATA__;
const PUPPET='assets/r161/puppet/puppet-ego-walk-right-8.webp';
// ---- ① 겹침 ----
function world(enemies){const drawn=[];const ctx={save(){},restore(){},translate(){},scale(){},rotate(){},setTransform(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},arc(){},ellipse(){},fillRect(){},
  drawImage(im,...a){drawn.push(String(im&&im.src||''));},scope(meta,f){f();},filter:'',globalAlpha:1,globalCompositeOperation:'source-over'};
 const sb={console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date,Error,localStorage:{getItem:()=>null,setItem(){}},
  window:{__STORYWORLD_MOB_UNIQUE_R248_DATA__:D,__STORYWORLD_FX_SPRITES_R106__:{on:()=>true,draw(){},along(){}}},
  time:10,layer:'DREAM',ctx,project:(x,y)=>({x:x*10,y:y*10}),actorHeight:()=>60,effects:[],hazards:[],player:{x:10,y:10,hp:100},
  room:{id:'last302',samongR103:{key:'S-01',zone:'sz115-S01-2'},enemies,props:[],exploration:{floorCells:[]}},
  readyImage:p=>({image:{src:p,width:1024,height:640,naturalWidth:1024,naturalHeight:640}}),ensureImages:()=>Promise.resolve(),tick(){},drawEffect(){},drawProp(p){drawn.push('prop:'+p.id);},enterRegion:async()=>true,
  drawEnemy(e){e.rc146BodyFrame={path:'assets/story/body.webp'};sb.sprite('assets/story/body.webp',0,0,60,{});const r=sb.readyImage('assets/story/body.webp');if(r&&r.image)sb.ctx.drawImage({src:'http://x/m0/assets/story/body.webp'});return 'base';}};
 sb.window.window=sb.window;Object.assign(sb.window,{});vm.createContext(sb);
 // index.html 순서: samong-r161 → (…) → mob-unique-r248
 sb.sprite=function(path,x,y,h,opt){drawn.push('sprite:'+path);};sb.drawAssetFrame3=function(path,f,x,y,h,opt){drawn.push('daf:'+path);return true;};sb.zoom=1;sb.setTimeout=()=>0;
 vm.runInContext(C('samong-r161.js'),sb);vm.runInContext(C('mob-unique-r248.js'),sb);vm.runInContext(C('mob-death-r462.js'),sb);return {sb,drawn};}
const named=Object.keys(D.byName).find(k=>k==='뿌리에서 쏟아진 잔영')||Object.keys(D.byName).find(k=>!k.startsWith('사몽:'));
{const e={id:'root1',name:named,samongR103:'S-01',x:3,y:3,hp:10,maxHp:10};const {sb,drawn}=world([e]);sb.drawEnemy(e);
 const sheet=(D.sheets[D.byName[named]].path)||(D.dir+D.sheets[D.byName[named]].file);
 ok('겹침: R248 이름 시트로 그리는 사몽 몹('+named+')에는 꼭두각시를 함께 그리지 않는다(그림 한 장)',drawn.some(p=>p===sheet||p.endsWith(D.sheets[D.byName[named]].file))&&!drawn.includes(PUPPET),{drawn,sheet});
 ok('R248 이 covers(e) 로 같은 판단을 알려 준다',typeof sb.window.__STORYWORLD_MOB_UNIQUE_R248__.covers==='function'&&sb.window.__STORYWORLD_MOB_UNIQUE_R248__.covers(e)===true);}
{const e={id:'np',name:'이름 시트 없는 사몽 몹 R1206',samongR103:'S-01',x:3,y:3,hp:10,maxHp:10};const {sb,drawn}=world([e]);sb.drawEnemy(e);
 ok('회귀: 이름 시트가 없는 사몽 몹은 그대로 꼭두각시 한 장(엔진 몸 그림은 가림)',drawn.filter(p=>p===PUPPET).length===1&&!drawn.some(p=>/^http.*story\/body/.test(p))&&(sb.window.__STORYWORLD_MOB_UNIQUE_R248__.covers?.(e)??false)===false,{drawn});}
{const e={id:'dead1',name:named,samongR103:'S-01',x:3,y:3,hp:0,maxHp:10,deadAt:9.8};const {sb,drawn}=world([e]);sb.drawEnemy(e);
 ok('경계: 죽는 중(0.2초)에도 꼭두각시가 겹치지 않는다',!drawn.includes(PUPPET),{drawn});}
{const e={id:'hid',name:named,samongR103:'S-01',x:3,y:3,hp:10,spawnState:'hidden'};const {sb}=world([e]);
 ok('경계: 아직 안 나온 몹은 R248 이 덮지 않는다고 답한다(엔진 규칙 그대로)',typeof sb.window.__STORYWORLD_MOB_UNIQUE_R248__.covers==='function'&&sb.window.__STORYWORLD_MOB_UNIQUE_R248__.covers(e)===false);}
// ---- ③ 죽음 그림자 = 그 몹 자기 그림 ----
{const e={id:'d1',name:named,samongR103:'S-01',x:3,y:3,hp:10,maxHp:10};const {sb}=world([e]);sb.drawEnemy(e);const L=sb.window.__STORYWORLD_MOB_DEATH_R462__?.lookOf?.('d1');
 const file=D.sheets[D.byName[named]].file;ok('사망 그림: 이름 시트 몹이 죽을 때 쓰는 몸 그림은 그 몹 이름 시트(가려진 엔진 몸 = 다른 몹 그림이 아님)',!!L&&String(L.path).endsWith(file)&&!/story\/body/.test(String(L.path))&&Array.isArray(L.frame?.assetFrame?.sourceRect),L);}
{const e={id:'d2',name:'이름 시트 없는 사몽 몹 R1206',samongR103:'S-01',x:3,y:3,hp:10,maxHp:10};const {sb}=world([e]);sb.drawEnemy(e);const L=sb.window.__STORYWORLD_MOB_DEATH_R462__?.lookOf?.('d2');
 ok('사망 그림: 꼭두각시로 그린 몹은 꼭두각시 칸을 쓴다',!!L&&L.path===PUPPET&&L.h>4,L);}
{const e={id:'d3',name:'본편 몹 R1206',x:3,y:3,hp:10,maxHp:10};const {sb}=world([e]);sb.layer='STORY';sb.room.samongR103=null;sb.drawEnemy(e);const L=sb.window.__STORYWORLD_MOB_DEATH_R462__?.lookOf?.('d3');
 ok('회귀: 엔진이 직접 그린 몹은 예전처럼 엔진 그림(sprite)을 쓴다',!!L&&L.path==='assets/story/body.webp',L);}
// ---- ② 조각 1개 ----
{const sb={window:{},localStorage:{getItem:()=>null,setItem(){}},console,Math,JSON,Object,Array,Set,Map,WeakMap,Number,String,Promise,Date};sb.window=sb;vm.createContext(sb);vm.runInContext(C('combat-r170.js'),sb);
 const A=sb.__STORYWORLD_COMBAT_R170__;const P=A&&A.samongPlan;ok('combat-r170 이 samongPlan 을 내보낸다',typeof P==='function');
 if(typeof P==='function'){const t={F:[1,5],B:[1,1],D:[1,1],G:[1,1],H:[1,0],C:[1,0],combat:[1,0],explore:[0,0],'':[0,0]};
  ok('조각은 어느 구역이든 많아야 1개, 빠진 수만큼 잡몹으로 채움(F 6→1+5, B·D·G 2→1+1, H·C 1→1+0, 탐색 0)',Object.entries(t).every(([m,[a,b]])=>{const r=P(m);return r.towers===a&&r.fill===b&&r.towers+r.fill===r.old;}),Object.fromEntries(Object.keys(t).map(m=>[m,P(m)])));}
 ok('먹 번짐 그리기 함수(inkBlot)가 있고 육망성 경로를 그리지 않는다',typeof A.inkBlot==='function'&&(()=>{const calls=[];const g=new Proxy({},{get:(o,k)=>k==='fillStyle'||k==='strokeStyle'?'':(...a)=>calls.push(k),set:()=>true});A.inkBlot(g,40,1,.37);return calls.includes('fill')&&!calls.includes('stroke');})());
 const src=C('combat-r170.js');ok('사몽에서만 먹 번짐(본편 1부 피의 육망성은 그대로), 끄기 키 inkHex',/const inkHex=\(\)=>prefs\.inkHex!==false&&samongRoom\(\)/.test(src)&&/if\(inkHex\(\)\)\{inkBlot\(/.test(src)&&/hexPath\(ctx,w\*\.86/.test(src));
 ok('채우는 잡몹은 조각을 본뜬 몹과 같은 몹(같은 snap), 한 구역에 한 번(placedKey 안)',/id:'r1206:fill:'\+room\.id/.test(src)&&/r1206Fill:true/.test(src));}
{const tower={id:'tw',name:'세뇌당한 기억의 조각',r170Tower:{art:'x'},x:5,y:5,hp:10};const sc={id:'r161:sculpt:k:0',path:'assets/r161/sculpture/memory-fragment.webp',r161Sculpture:true,x:2,y:2};
 const {sb,drawn}=world([tower]);sb.drawProp(sc);ok('같은 방에 조각 적이 있으면 장식 조각은 안 그림(맵당 조각 하나)',!drawn.includes('prop:'+sc.id),{drawn});
 const w2=world([]);w2.sb.drawProp(sc);ok('회귀: 조각 적이 없는 방은 장식 조각을 그대로 그림',w2.drawn.includes('prop:'+sc.id),{d:w2.drawn});}
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+String(JSON.stringify(c.detail)??'').slice(0,500)));
console.log(`R1206 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
