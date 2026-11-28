// R1393 몹 둘레 빨간 선 → 자연스러운 먹빛 테 CPU 검사 (사용자 2026-11-28 "몹들에게 빨간선같은거 둘러있어서 특히 초반몹 뭔가 잘안보임 자연스럽게 해줘")
//  원인(공개판 헤드리스 실측): ① 2D 몹 = R409 적 테두리(바깥 핏빛 rgba(170,22,26,.62) + 안쪽 검은 선) ② 3D 몹 = R1312~R1382 먹 껍질 두 겹 중 바깥 핏빛 껍질(0x7c1a1a·0x6a1616).
//  고침: enemy-rim-r1393.js 가 ① R409 적 테 색을 붉은 기 없는 옅은 먹빛 그늘로(두께 .72배) ② 3D 바깥 핏빛 껍질만 숨김(안쪽 가는 먹선은 둠). 영웅 테·영웅 껍질은 그대로.
//  node r96/qa/r1393/r1393-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
const F='enemy-rim-r1393.js';
// ---- 빌드 연결(다섯 곳) ----
ok(fs.existsSync(path.join(R,'client-source',F)),'client-source 원본 있음');
ok(rd('client-source/'+F)===rd('runtime-text/'+F),'runtime-text 사본과 같음');
{const html=rd('runtime-text/index.html'),tag='<script src="./'+F+'"></script>';
 ok(html.split(tag).length===2,'index.html 태그 한 번');
 ok(html.indexOf(tag)>html.indexOf('"./fx-alpha-rules-r1369.js"')&&html.indexOf(tag)<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: fx-alpha-rules-r1369 뒤, combat-guide-r1249 앞');
 ok(html.includes('\n'+tag+'\n'),'자기 줄');}
ok(/node r96\/qa\/r1393\/r1393-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'공개 확인 목록');
ok(rd('runtime-inputs.json').includes('"'+F+'"')&&rd('runtime-manifest.json').includes('"'+F+'"'),'runtime-inputs·manifest 목록');
// ---- R409 가 R1393 적 테 모양을 실제로 쓰는지(굽기 두 길·두께·캐시 열쇠) ----
{const s=rd('client-source/combat-read-r409.js');ok(s===rd('runtime-text/combat-read-r409.js'),'R409 runtime-text 사본 같음');
 ok(/function enemyLook\(\)/.test(s)&&/__STORYWORLD_ENEMY_RIM_R1393__/.test(s),'R409 enemyLook() 이 R1393 을 물음');
 const uses=(s.match(/lookOf\(side\)/g)||[]).length;ok(uses>=3,'bakeFast·bake0·outline 세 곳이 lookOf(side) 로 색·두께를 고름',uses);
 ok(/enemyLook\(\)\?\.key/.test(s),'캐시 열쇠에 적 테 모양 열쇠가 들어감(바꾸면 다시 구움)');
 ok(/enemy:\{outer:'rgba\(170,22,26,0\.62\)'/.test(s),'R409 원래 값은 지우지 않음(끄면 예전 그대로)');}

// ---- 모래상자 ----
const src=rd('client-source/'+F);
class Color{constructor(hex){this.r=((hex>>16)&255)/255;this.g=((hex>>8)&255)/255;this.b=(hex&255)/255;}}
// 색 관리(선형) 켜진 three 처럼 sRGB→선형 값으로 넣은 색
const lin=v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);class LinColor extends Color{constructor(h){super(h);this.r=lin(this.r);this.g=lin(this.g);this.b=lin(this.b);}}
function makeT(){class Object3D{constructor(name=''){this.name=name;this.children=[];this.parent=null;this.userData={};}
 add(...o){for(const c of o){c.parent=this;this.children.push(c);}return this;}
 traverse(f){f(this);for(const c of this.children)c.traverse(f);}}
 return {Object3D};}
function load({store={},search='',three=true,ColorK=Color}={}){
 const win={},T=makeT(),scene=new T.Object3D('scene');let timers=[];
 const sb={window:win,localStorage:{getItem:k=>store[k]??null,setItem(k,v){store[k]=v;}},location:{search},URLSearchParams,Math,Number,JSON,Object,Array,Set,Map,WeakMap,WeakSet,String,RegExp,isFinite,console,
  setInterval(f){timers.push(f);return timers.length;},clearInterval(){},performance:{now:()=>0},document:{readyState:'complete'},addEventListener(){}};
 if(three)win.__STORYWORLD_PHASE1__={controller:{state:{three:{T,scene}}}};
 vm.createContext(sb);vm.runInContext(src,sb);return {A:win.__STORYWORLD_ENEMY_RIM_R1393__,T,scene,tick:()=>timers.forEach(f=>f()),store,ColorK};}
const rgba=s=>{const m=/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/.exec(s);return m?m.slice(1).map(Number):null;};
const shell=(T,name,hex,K=Color,extra={})=>{const o=new T.Object3D(name);o.material={color:new K(hex),visible:true,...extra};return o;};

{const {A}=load();ok(!!A&&typeof A.look==='function'&&typeof A.apply==='function'&&typeof A.set==='function'&&typeof A.inspect==='function','API(look·apply·set·inspect)');}
// 1) 2D 적 테 색: 붉은 기 없음·옅음·아직 읽힘
{const {A}=load();const L=A.look();ok(!!L&&typeof L.key==='string','켜짐: 모양 돌려줌');
 const O=rgba(L.outer),I=rgba(L.inner);ok(!!O&&!!I,'rgba 형식',L);
 for(const [nm,c] of [['바깥',O],['안쪽',I]])ok(c[0]-Math.max(c[1],c[2])<=16,nm+' 테 붉은 기(R−max(G,B)) ≤16 — 예전 바깥 148',c);
 ok(O[3]<=.25,'바깥 한지빛 여백 알파 ≤.25 (예전 핏빛 .62, 밝은 바닥에서 후광처럼 뜨지 않게)',O[3]);ok(O[3]>=.12,'바깥 여백 알파 ≥.12 (어두운 바탕에서 실루엣이 서게 — R1393b)',O[3]);
 ok(Math.min(...O.slice(0,3))>=170,'바깥 여백은 밝은 한지빛(어두운 나무·벽 앞 대비 — R1393b)',O);
 ok(I[3]<=.75&&I[3]>=.45,'안쪽 먹선 알파 .45~.75 (예전 .92)',I[3]);
 ok(Math.max(...I.slice(0,3))<=40,'안쪽 선은 어두운 먹빛',I);
 ok(L.k>=.6&&L.k<=.85,'두께 배율 .6~.85 (예전 1)',L.k);}
// 2) 끄기: localStorage·주소
{const {A}=load({store:{'storyworld.r1393.enemyRim':'off'}});ok(A.look()===null,'localStorage off → null(R409 예전 핏빛 테)');}
{const {A}=load({search:'?rim93=0'});ok(A.look()===null,'?rim93=0 → null');}
{const {A}=load({store:{'storyworld.r1393.enemyRim':'off'},search:'?rim93=1'});ok(A.look()!==null,'?rim93=1 이 저장값보다 앞섬');}
// 3) 3D 껍질: 바깥 핏빛만 숨김
for(const K of [Color,LinColor]){const {A,T,scene,tick}=load();const tag=K===Color?'(sRGB)':'(선형 색)';
 const mob=new T.Object3D('mob');scene.add(mob);
 const out1=shell(T,'r1312-ink-shell',0x7c1a1a,K),in1=shell(T,'r1312-ink-shell',0x0e0406,K),out2=shell(T,'r1322c-ink-shell',0x6a1616,K),in2=shell(T,'r1382-ink-shell',0x0e0406,K),
  hero=shell(T,'r1305-ink-shell',0x7c1a1a,K),body=shell(T,'body',0x8a1010,K),hw=shell(T,'r1302-ink',0x3a1612,K);
 mob.add(out1,in1,out2,in2,hero,body,hw);const n0=A.apply(scene);
 ok(out1.material.visible===false&&out2.material.visible===false,'바깥 핏빛 껍질(0x7c1a1a·0x6a1616) 숨김 '+tag);
 ok(in1.material.visible&&in2.material.visible,'안쪽 가는 먹 껍질은 그대로 '+tag);
 ok(hero.material.visible&&body.material.visible&&hw.material.visible,'영웅 껍질(r1305)·몸 메시·환도 먹은 안 건드림 '+tag);
 ok(A.inspect().hidden===2&&n0<=2,'숨긴 수 2(add 훅이 먼저 잡았으면 훑기는 0)',[n0,A.inspect().hidden]);ok(A.apply(scene)===0,'두 번째 훑기는 0(중복 없음) '+tag);
 // 새로 붙는 껍질(첫 몹 등장 뒤) — add 훅 또는 주기 훑기로 잡힘
 tick();const late=shell(T,'r1316-ink-shell',0x6a1616,K);mob.add(late);tick();ok(late.material.visible===false,'나중에 붙은 핏빛 껍질도 숨김 '+tag);
 A.set('off');ok(out1.material.visible&&out2.material.visible&&late.material.visible,'끄면 원래대로 보임 '+tag);ok(A.look()===null,'끄면 2D 모양 null');
 A.set('on');ok(out1.material.visible===false&&late.material.visible===false,'다시 켜면 숨김 '+tag);
 const I=A.inspect();ok(I.revision&&I.on===true&&I.hidden>=3&&I.presentationOnly===true&&I.gameplayChanged===false,'inspect',I);}
// 4) 렌더러가 늦게 생겨도(처음엔 없음) 안전
{const {A}=load({three:false});let e=null;try{A.apply(null);A.inspect();}catch(x){e=x;}ok(!e,'렌더러 없을 때 오류 없음',String(e));}


// ==== R1393b 첫 몹 맵(dist00) 3D 뿌리 추적자 크기 ====
//  실측(motion.json, 640×360): 같은 몹 2D 보이는 키 76.2px, 3D 화면 키 57.2px → 3D 가 25% 작음(옆 2D 침식 근위 74px 보다도 작음).
//  R1312 만 2D 키에 맞추지 않고 영웅 키×mul 로 크기를 정함 → stalker mul 을 2D/3D 비(1.33)로. 다른 3D 몹(R1329 등)은 2D 대비 +5~7%.
{const t=rd('client-source/mob-3d-r1312.js');const m=/stalker:\{[^}]*mul:([\d.]+)/.exec(t);const mul=m?+m[1]:NaN;
 ok(mul>=1.25&&mul<=1.42,'R1312 뿌리 추적자 3D 배율이 2D 보이는 키에 맞음(1.25~1.42)',mul);
 const g=/guard:\{[^}]*mul:([\d.]+)/.exec(t);ok(g&&+g[1]===1,'침식 근위(측정 안 함)는 그대로 1',g&&g[1]);
 ok(t===rd('runtime-text/mob-3d-r1312.js'),'R1312 runtime-text 사본 같음');}
console.log('R1393 CPU',n,'passed');
