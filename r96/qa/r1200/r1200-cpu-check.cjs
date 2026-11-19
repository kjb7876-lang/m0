// R1200 CPU 검사: 그림 조각(명령 메시) 재사용 — 같은 자리(열쇠)에서 그림만 바뀌면 메시를 버리고 새로 만들지 않고 텍스처만 바꿔 끼운다
//  (사용자 2026-11-19 "싹다확인해서 그리기 위주로 전수조사해서 렉파격적개선").
//  헤드리스 실측(사몽 4장 3구역 ep1b08, 환도 777, 640×360): 장면당 명령 메시를 약 90개 새로 만들고 버렸다(geometry·material·GPU 버퍼·VAO 생성/해제,
//   three getProgram·cloneUniforms 포함). 그중 57개는 '열쇠는 그대로인데 그림(image)만 바뀐' 경우(scene:N·몹 걷기 칸·효과 칸)였다.
//  고침(오버레이 draw-reuse-r1200.js, CommandScene.render 앞): 열쇠 같고·그림만 다르고·모양(style, globalAlpha·filter 제외)과 주인 종류가 같은 그림 명령이면
//   지금 재질의 map 만 새 텍스처로 바꾸고(참조 수 맞춤) 옛 그림 참조를 놓는다. 그 뒤는 엔진의 원래 '같은 그림' 길(자리·UV·필터 갱신)이 그대로 돈다.
//  ① 바꿔 끼움: 맞는 경우 map·row.image 바뀜, 참조 수(새 +1, 옛 -1), 메시·재질 그대로
//  ② 안 바꿈: 모양 다름·주인 종류 다름·깊이 재질 있음·MeshBasic 아님·필터 정보 없음·객체 모양 값(그라디언트 등)·끔 → 손대지 않음(엔진이 예전처럼 새로 만듦)
//  ③ 오류가 나도 엔진 render 는 그대로 불림 ④ 연결(런타임 사본·index.html·sync 목록·CI·verify 목록)
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(m,c,x)=>{if(c)pass++;else{fail++;console.log('FAIL '+m+(x!==undefined?' '+JSON.stringify(x).slice(0,300):''));}};
const FILE=path.join(R,'client-source/draw-reuse-r1200.js');ok('overlay exists',fs.existsSync(FILE));
const SRC=fs.existsSync(FILE)?fs.readFileSync(FILE,'utf8'):'';
function setup(store={}){let renders=0;
 class CommandScene{constructor(){this.rows=new Map();this.textures=new Map();this.disposed=false;this.seenArgs=null;}
  texture(image,mutable){let r=this.textures.get(image);if(!r){r={texture:{image,id:Math.random()},refs:0};this.textures.set(image,r);}r.refs++;return r.texture;}
  release(image){const r=this.textures.get(image);if(!r)return;if(--r.refs===0)this.textures.delete(image);}
  render(commands){renders++;this.seenArgs=commands;return 'base';}}
 const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Number,Error,setTimeout:()=>0,setInterval:()=>0,clearInterval:()=>0,performance:{now:()=>0}};g.window=g;g.globalThis=g;
 g.localStorage={s:store,getItem(k){return this.s[k]??null;},setItem(k,v){this.s[k]=String(v);},removeItem(k){delete this.s[k];}};
 g.StoryPhase1={CommandScene};vm.createContext(g);if(SRC)vm.runInContext(SRC,g,{filename:'draw-reuse-r1200.js'});
 const S=new CommandScene();return{g,S,API:g.__STORYWORLD_DRAW_REUSE_R1200__,renders:()=>renders};}
const style={globalCompositeOperation:'source-over',imageSmoothingEnabled:false,globalAlpha:.7,filter:'none'};
function row(S,key,image,o={}){const tex=S.texture(image,false);const m={isMeshBasicMaterial:o.basic!==false,map:tex,userData:o.noFilter?{}:{filter:{m:1}}};
 const r={mesh:{material:m,customDepthMaterial:o.depth?{}:undefined},image,styleState:{kind:'image',propFrame:null,style:{globalCompositeOperation:'source-over',imageSmoothingEnabled:false,...(o.styleExtra||{})}},geometryState:{owner:{kind:o.kind||'effect'}}};S.rows.set(key,r);return r;}
const cmd=(key,image,o={})=>({key,kind:'image',image,mutable:false,style:{...style,...(o.style||{})},owner:{kind:o.kind||'effect'}});
// ①
{const {S,API,renders}=setup();ok('API present',!!API&&typeof API.inspect==='function');
 const A={n:'a'},B={n:'b'};const r=row(S,'k1',A);const m0=r.mesh.material,mesh0=r.mesh;
 const out=S.render([cmd('k1',B)]);
 ok('base render still called with same commands',out==='base'&&renders()===1&&S.seenArgs.length===1);
 ok('image swapped in place: row.image, material.map',r.image===B&&m0.map&&m0.map.image===B&&r.mesh===mesh0&&r.mesh.material===m0,{img:r.image&&r.image.n});
 ok('texture refs balanced: old released, new held once',!S.textures.has(A)&&S.textures.get(B)?.refs===1);
 ok('stats count swaps',API&&(API?API.inspect():{stats:{}}).stats.swaps===1);
 // 같은 그림이면 아무것도 안 함
 S.render([cmd('k1',B)]);ok('same image: untouched',S.textures.get(B)?.refs===1&&(API?API.inspect():{stats:{}}).stats.swaps===1);
 // 옛 그림을 다른 행이 같이 쓰면 텍스처는 남는다
 const C={n:'c'};const r2=row(S,'k2',B);S.render([cmd('k1',C)]);ok('shared old texture kept for the other row',S.textures.get(B)?.refs===1&&r2.mesh.material.map.image===B&&r.image===C);}
// ②
for(const [label,o,c] of [['different style key',{},{style:{imageSmoothingEnabled:true}}],['different owner kind',{kind:'enemy'},{}],['depth material',{depth:true},{}],['not MeshBasic',{basic:false},{}],['no filter info',{noFilter:true},{}],['object style value',{styleExtra:{fillStyle:{kind:'radial'}}},{style:{fillStyle:{kind:'radial'}}}]]){
 const {S,API}=setup();const A={n:'a'},B={n:'b'};const r=row(S,'k',A,o);S.render([cmd('k',B,c)]);
 ok('no swap when '+label,r.image===A&&r.mesh.material.map.image===A&&S.textures.get(A)?.refs===1&&!S.textures.has(B)&&(API?API.inspect():{stats:{}}).stats.swaps===0);}
{const store={'storyworld.r1200.reuse':'0'};const {S,API}=setup(store);const A={n:'a'},B={n:'b'};const r=row(S,'k',A);S.render([cmd('k',B)]);ok('switched off by localStorage: untouched',r.image===A&&(API?API.inspect():{stats:{}}).on===false);
 const t=setup();t.API?.set(false);const r2=row(t.S,'k',A);t.S.render([cmd('k',B)]);ok('set(false): untouched, remembered',r2.image===A&&t.g.localStorage.s['storyworld.r1200.reuse']==='0');t.API?.set(true);ok('set(true) clears',!('storyworld.r1200.reuse' in t.g.localStorage.s));}
// ①b 새 열쇠 재활용: 이번 장면에 열쇠가 없어 곧 지워질 행을 같은 종류(숫자만 다른 열쇠)·같은 모양·같은 주인 종류의 새 명령이 넘겨받는다
{const {S,API}=setup();const A={n:'a'},B={n:'b'},C={n:'c'};const old=row(S,'r113:dust:41',A);const mesh0=old.mesh;const keep=row(S,'r113:dust:7',C);
 S.render([cmd('r113:dust:7',C),cmd('r113:dust:42',B)]);
 const moved=S.rows.get('r113:dust:42');
 ok('vanishing row re-keyed to the new key of the same family',moved===old&&moved.mesh===mesh0&&!S.rows.has('r113:dust:41')&&moved.image===B&&moved.mesh.material.map.image===B,{keys:[...S.rows.keys()]});
 ok('re-key: refs balanced (old image released, new held)',!S.textures.has(A)&&S.textures.get(B)?.refs===1&&S.textures.get(C)?.refs===1);
 ok('row still present this frame is never taken',S.rows.get('r113:dust:7')===keep&&keep.image===C);
 ok('stats count re-keys',(API?API.inspect():{stats:{}}).stats.rekeys===1);}
{const {S}=setup();const A={n:'a'},B={n:'b'};const old=row(S,'r106fx:smoke:3',A);S.render([cmd('r113:dust:42',B)]);
 ok('different family: not re-keyed',S.rows.get('r106fx:smoke:3')===old&&!S.rows.has('r113:dust:42')&&old.image===A);}
{const {S}=setup();const A={n:'a'},B={n:'b'};const old=row(S,'r113:dust:1',A,{kind:'scene'});S.render([cmd('r113:dust:2',B)]);
 ok('different owner kind: not re-keyed',S.rows.get('r113:dust:1')===old&&!S.rows.has('r113:dust:2'));}
{const {S}=setup();const A={n:'a'},B={n:'b'};const old=row(S,'r113:dust:1',A,{depth:true});S.render([cmd('r113:dust:2',B)]);
 ok('depth-material row: not re-keyed',S.rows.get('r113:dust:1')===old&&!S.rows.has('r113:dust:2'));}
{const {S}=setup();const A={n:'a'},B={n:'b'};const old=row(S,'r113:dust:1',A);S.render([cmd('r113:dust:2',B),cmd('r113:dust:3',B)]);
 ok('one vanishing row is given to one new command only',[...S.rows.values()].filter(r=>r===old).length===1&&S.rows.size===1&&S.textures.get(B)?.refs===1);}
// ③
{const {S,API,renders}=setup();S.rows.set('bad',{get mesh(){throw Error('boom');},image:{},styleState:{kind:'image',style:{}},geometryState:{owner:{kind:'effect'}}});const out=S.render([cmd('bad',{n:'x'})]);ok('error contained, base render called',out==='base'&&renders()===1&&(API?API.inspect():{stats:{}}).stats.errors>=1);}
// ④
const has=(f,s)=>fs.existsSync(f)&&fs.readFileSync(f,'utf8').includes(s);
ok('runtime copy matches',fs.existsSync(path.join(R,'runtime-text/draw-reuse-r1200.js'))&&fs.readFileSync(path.join(R,'runtime-text/draw-reuse-r1200.js'),'utf8')===SRC);
ok('index.html script tag',has(path.join(R,'runtime-text/index.html'),'<script src="./draw-reuse-r1200.js"></script>'));
ok('runtime-inputs lists it',has(path.join(R,'runtime-inputs.json'),'draw-reuse-r1200.js'));
ok('CI step',has(path.join(ROOT,'.github/workflows/pages.yml'),'node r96/qa/r1200/r1200-cpu-check.cjs'));
ok('public verify list',has(path.join(ROOT,'scripts/verify-r96-public.py'),'draw-reuse-r1200.js'));
console.log('R1200 CPU check: '+pass+' passed, '+fail+' failed');process.exit(fail?1:0);
