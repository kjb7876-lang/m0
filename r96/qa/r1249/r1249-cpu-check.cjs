// R1249 CPU 검사: 외부 제안 ① "큰 이펙트가 겹쳐도 위험 경계가 보이게 + 첫 전투 안내를 터치 기준으로".
//  (① 위험 경계는 사용자 지시로 뺌)  옛 설명: 적의 예고(먹 번짐·육망성·시전 인장 등 적 쪽 바닥 예고) 위에 영웅 쪽 큰 이펙트가 덮이면 그 이펙트만 옅게 한다.
//     새 도형을 그리지 않는다(#712 주황 예고 도형 삭제·도형 투사체 금지와 충돌하지 않음). 예고 자체·적 쪽 그림·타격 불꽃은 그대로.
//  ② 첫 전투 안내: 터치 기기에서 처음 적과 마주치면 '바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기'를 한 번 띄운다. PC 는 키보드 안내 그대로(새 안내 없음).
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..'),ROOT=path.resolve(R,'..');const F='combat-guide-r1249.js';
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,400):''));};
let src='';try{src=fs.readFileSync(path.join(R,'client-source',F),'utf8');}catch(_){}
ok('client-source/'+F+' 있음',!!src);
function boot(o={}){const store=new Map(Object.entries(o.store||{}));const toasts=[];
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Error,isFinite,RegExp,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},performance:{now:()=>0},
  document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],head:{appendChild(){}},addEventListener(){},createElement:()=>({style:{}})},
  matchMedia:q=>({matches:/coarse/.test(q)?!!o.touch:false}),addEventListener(){},setInterval:()=>0,setTimeout:()=>0,requestAnimationFrame:()=>0,
  toast:(t,s)=>{toasts.push([t,s]);},started:true,loading:false,modal:null,storyScene:null,
  player:{x:5,y:5,hp:100},room:{enemies:o.enemies||[]}};
 sb.window=sb;sb.__STORYWORLD_MOBILE_R63__={isMobile:()=>!!o.touch};
 if(o.scene)sb.storyScene=o.scene;if(o.modal)sb.modal=o.modal;
 vm.createContext(sb);try{vm.runInContext(src,sb);}catch(e){console.log('load error',e.message);}return {sb,toasts,store,A:sb.__STORYWORLD_COMBAT_GUIDE_R1249__};}
const sq=(x,y,s)=>[[x,y],[x+s,y],[x+s,y+s],[x,y+s]];
const img=(id,pts,o={})=>({kind:'image',points:pts,sourceRect:[0,0,64,64],sourcePath:o.path||'assets/fx/'+id+'.webp',style:{globalAlpha:o.a??1},owner:{id,kind:o.kind||'effect',...(o.owner||{})}});
const danger=()=>img('r170:hex:1',sq(100,100,100),{path:'assets/r1206/fx/ink-bloom-warn8.webp',owner:{groundAligned:true}});
const a=boot();const A=a.A;
ok('전역 API __STORYWORLD_COMBAT_GUIDE_R1249__ (tick·inspect·set)',!!A&&['tick','inspect','set'].every(k=>typeof A[k]==='function'));
if(A){
 // 위험 경계 옅게 하기는 빼기로 함(사용자 11-20 00:44Z '바닥예고는 빼셈 예고 안쓰니까') → 그림 명령·렌더러를 건드리지 않음을 고정
 ok('렌더러를 감싸지 않음(ThreeRenderer·render 언급 없음), 그림 알파를 바꾸지 않음',!/ThreeRenderer|\.render\b|globalAlpha/.test(src)&&typeof A.process==='undefined');
 ok('새 도형을 그리지 않음(arc·fillRect·strokeRect·beginPath·lineTo 없음 — #712·도형 투사체 금지 준수)',!/\.(arc|fillRect|strokeRect|beginPath|lineTo|ellipse)\(/.test(src));
}
// ② 첫 전투 안내
const near=[{x:7,y:5,hp:10}],farE=[{x:40,y:40,hp:10}];
{const t=boot({touch:true,enemies:near});t.A&&t.A.tick();t.A&&t.A.tick();
 ok('터치: 처음 적이 가까우면 안내 한 번',t.toasts.length===1,t.toasts);
 ok('터치 안내 글 = 바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기',t.toasts[0]&&t.toasts[0][0]==='바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기',t.toasts[0]);
 ok('안내가 키보드 글자를 담지 않음',t.toasts[0]&&!/(WASD|방향키|Space|Shift|[A-Z]\s*\/\s*\d)/.test(t.toasts[0][0]));
 ok('본 기록이 저장됨',/touch/.test(t.store.get('storyworld.r1249.guide')||''));
 const t2=boot({touch:true,enemies:near,store:Object.fromEntries(t.store)});t2.A&&t2.A.tick();ok('다시 열어도 또 띄우지 않음',t2.toasts.length===0,t2.toasts);}
{const t=boot({touch:true,enemies:farE});t.A&&t.A.tick();ok('터치: 적이 멀면 안 띄움',t.toasts.length===0);}
{const t=boot({touch:true,enemies:[{x:6,y:5,hp:0}]});t.A&&t.A.tick();ok('터치: 죽은 적은 안 셈',t.toasts.length===0);}
{const t=boot({touch:true,enemies:[{x:6,y:5,hp:10,ally:true}]});t.A&&t.A.tick();ok('터치: 아군은 안 셈',t.toasts.length===0);}
{const t=boot({touch:false,enemies:near});t.A&&t.A.tick();ok('PC: 키보드 안내 그대로 — 새 안내 없음',t.toasts.length===0,t.toasts);}
{const t=boot({touch:true,enemies:near,scene:{}});t.A&&t.A.tick();ok('터치: 서사 장면 중엔 안 띄움',t.toasts.length===0);}
{const t=boot({touch:true,enemies:near,modal:'x'});t.A&&t.A.tick();ok('터치: 창이 열려 있으면 안 띄움',t.toasts.length===0);}
// ③ 첫 화면 아래 안내(#hint)·도움말 첫 줄(2차 리뷰: 공개판 812×375 터치 첫 화면에 9px '방향키 이동 · A/J/1 공격 · S/2 블링크')
const KB='방향키 이동 · A/J/1 공격 · S/2 블링크 · D/3 공명 · Q/4 고유기 · F/5 EGO · W/E/R 기술 · C 상호작용',TOUCH='바닥을 탭해 이동 · 끌어서 방향 조절 · 회피 버튼으로 피하기';
function bootDom(touch,text){const hint={id:'hint',textContent:text};const grid={children:[],firstChild:null,insertBefore(n,ref){this.children.unshift(n);this.firstChild=n;},html:''};
 const t=boot({touch});const sb=t.sb;sb.started=false;sb.document.getElementById=id=>id==='hint'?hint:null;sb.document.querySelector=q=>/keygrid/.test(q)?grid:null;
 sb.document.createElement=tag=>({tag,textContent:'',className:''});return {...t,hint,grid};}
{const t=bootDom(true,KB);t.A&&t.A.tick();ok('터치: 첫 화면 아래 키보드 안내를 터치 안내로',t.hint.textContent===TOUCH,t.hint.textContent);}
{const t=bootDom(true,'WASD/방향키 이동 · J/1 공격');t.A&&t.A.tick();ok('터치: 엔진 기본 WASD 안내도 바꿈',t.hint.textContent===TOUCH,t.hint.textContent);}
{const t=bootDom(true,'포탈 · 버튼을 눌러 이동 · 마수궁 피난 거점');t.A&&t.A.tick();ok('터치: 키보드 안내가 아닌 길 안내는 그대로',t.hint.textContent==='포탈 · 버튼을 눌러 이동 · 마수궁 피난 거점');}
{const t=bootDom(false,KB);t.A&&t.A.tick();ok('PC: 아래 키보드 안내 그대로',t.hint.textContent===KB);}
{const t=bootDom(true,KB);const A=t.A;ok('도움말 보조 helpRow 있음',A&&typeof A.helpRow==='function');if(A?.helpRow){A.helpRow();ok('터치 도움말: 첫 줄이 터치 조작',t.grid.children.length===2&&t.grid.children[1].textContent===TOUCH&&/터치/.test(t.grid.children[0].textContent),t.grid.children);A.helpRow();ok('도움말 첫 줄은 한 번만',t.grid.children.length===2);}}
{const t=bootDom(false,KB);t.A?.helpRow?.();ok('PC 도움말: 그대로(키 표만)',t.grid.children.length===0);}
// 헤드리스 실측: 첫 화면에서 엔진이 HUD 를 계속 다시 써서 한 번 바꾼 글이 되돌아갔다 → setHudTextR63R2('hint',…) 단계에서 바꿔야 한다
function bootHud(touch){const got=[];const pre={setHudTextR63R2:(id,t)=>{got.push([id,t]);}};const store=new Map();
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Error,isFinite,RegExp,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},
  document:{getElementById:()=>null,querySelector:()=>null,createElement:()=>({})},matchMedia:()=>({matches:false}),setInterval:()=>0,setTimeout:()=>0,...pre};
 sb.window=sb;sb.__STORYWORLD_MOBILE_R63__={isMobile:()=>touch};vm.createContext(sb);vm.runInContext(src,sb);return {sb,got};}
{const t=bootHud(true);t.sb.setHudTextR63R2('hint',KB);t.sb.setHudTextR63R2('bossTitle','방향키 이동');ok('터치: HUD 쓰기 단계에서 키보드 안내 → 터치 안내(다시 써도 유지)',t.got[0]&&t.got[0][1]===TOUCH&&t.got[1][1]==='방향키 이동',t.got);}
{const t=bootHud(false);t.sb.setHudTextR63R2('hint',KB);ok('PC: HUD 쓰기 그대로',t.got[0]&&t.got[0][1]===KB,t.got);}
// 빌드 연결
const idx=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('runtime-text/index.html 스크립트 태그',idx.includes('src="./'+F+'"'));
ok('runtime-text 사본이 client-source 와 같음',(()=>{try{return fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src;}catch(_){return false;}})());
ok('verify-r96-public 기대 목록',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes(F));
ok('pages.yml 에 이 검사 줄',fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1249/r1249-cpu-check.cjs'));
console.log(`R1249 CPU ${bad?'FAILED':'PASSED'} ${n-bad}/${n}`);process.exit(bad?1:0);
