// R1249 CPU 검사: 설정창 같은 정지 화면(게임 시간이 멈춘 어두운 창)이 열려 있는 동안 월드를 매 프레임 다시 그리지 않는다.
//   node r96/qa/r1249/static-render-pause-cpu-check.cjs
//  리뷰(사용자 2026-11-20 첨부): 공개판에서 설정창을 연 12.16초 동안 모바일 규격 Chromium 이 월드를 42번 다시 그리고 GPU 그리기 호출 2,394번.
//  → 배경은 한 번 그려 두고(캔버스는 다음 그리기 전까지 그대로 보인다), 밝기·화질 변경(창 안 입력)·화면 회전·크기 변경·창 닫기 때 바로 다시 그린다.
//  · 연결: 소스=런타임 사본, 스크립트 태그(독립 줄, video-render-pause-r619 계열 뒤), verify-r96-public 목록, pages.yml, 매니페스트
//  · 동작(경계·회귀 포함): 플레이 중 매 프레임 그림 / 정지 창 첫 프레임들은 그림(안정화) 뒤 건너뜀 / 1초마다 한 번 다시 그림(늦게 붙는 텍스처 대비)
//    / 창 안 입력·클릭·창 크기·회전·dpr 변화 → 바로 다시 그림 / 게임 시간이 흐르면(협동 손님 등) 늘 그림 / 밝은 막(R255 기억 조각·R667 타이틀 영상) 은 늘 그림
//    / 새 지역이 막 들어오면 그 동안 그림(R1036 미리 만들기와 같은 까닭) / loading·started·booted / 닫으면 바로 / 끄기 / 오류 → 그림
//    / load 뒤 바깥 감싸개도 함께 건너뜀 / tick·updateHUD·musicTick 은 그대로 / R619 와 같이 있어도 서로 방해 없음
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(n,c,extra)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n,extra===undefined?'':JSON.stringify(extra));}};
const C=f=>{try{return fs.readFileSync(path.join(R,'client-source',f),'utf8');}catch(_){return '';}},RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
const F='static-render-pause-r1249.js',src=C(F);
ok(F+' exists',!!src);ok(F+' runtime copy matches source',!!src&&src===RT(F));
try{new vm.Script(src);ok('syntax',!!src);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html'),tag='"./'+F+'"';
ok('script tag once on its own line, after video-render-pause-r619, before combat-r118',html.split(tag).length===2&&html.includes('\n<script src='+tag+'></script>\n')&&html.indexOf(tag)>html.indexOf('"./video-render-pause-r619.js"')&&html.indexOf(tag)<html.lastIndexOf('"./combat-r118.js"'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',/node r96\/qa\/r1249\/static-render-pause-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}
ok('runtime-manifest has overlay',man.includes('"'+F+'"'));
if(!src){console.log(`\n${pass} pass, ${fail} fail`);process.exit(1);}
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');const code=strip(src);
ok('does not touch tick, musicTick, updateHUD, game state, ctx.filter',!/\btick\s*=|musicTick\s*=|updateHUD\s*=|\.hp\s*=|\bmodal\s*=[^=]|\btime\s*=[^=]|saveGame\(|ctx\.filter/.test(code));
ok('no periodic re-wrapping (setInterval) — avoids R1196 ping-pong',!/setInterval\s*\(/.test(code));
// ---- 가짜 브라우저 ----
function env(o={}){const store=new Map(Object.entries(o.store||{}));const dom=new Map();const ev={};const g={__now:0,__load:[],console};
 const cls=new Set(o.cls||[]);let bg=o.bg||'rgba(3, 7, 11, 0.878)';
 const modalEl={id:'modal',classList:{contains:c=>cls.has(c),add:c=>cls.add(c),remove:c=>cls.delete(c)},get className(){return [...cls].join(' ');}};
 dom.set('modal',modalEl);
 Object.assign(g,{localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},performance:{now:()=>g.__now},
  getComputedStyle:el=>{if(g.__cssThrow)throw new Error('css');return {backgroundColor:el===modalEl?bg:'rgba(0, 0, 0, 0)'};},
  document:{getElementById:id=>dom.get(id)||null,addEventListener:(t,f)=>{(ev['d:'+t]=ev['d:'+t]||[]).push(f);}},
  addEventListener:(t,f)=>{if(t==='load')g.__load.push(f);else (ev['w:'+t]=ev['w:'+t]||[]).push(f);},
  innerWidth:812,innerHeight:375,dom,__ev:ev,__cls:cls,__setBg:v=>{bg=v;}});
 g.window=g;vm.createContext(g);
 vm.runInContext('var draws=0,huds=0,ticks=0,musics=0,modal=false,started=true,booted=true,loading=false,time=5,W=812,H=375,dpr=2,room={id:"a"};'+
  'function draw(){draws++;}function updateHUD(){huds++;}function tick(dt){ticks++;if(!modal)time+=dt;}function musicTick(){musics++;}',g);
 for(const s of (o.pre||[]))vm.runInContext(s,g);
 vm.runInContext(src,g);return g;}
const run=(g,js)=>vm.runInContext(js,g);
const frame=(g,n=1,ms=1000/60)=>{for(let i=0;i<n;i++){g.__now+=ms;run(g,'tick(1/60);draw();updateHUD();musicTick();');}};
const fire=(g,k,e={})=>{for(const f of (g.__ev[k]||[]))f(e);};
const openModal=g=>{run(g,'modal=true');g.__cls.delete('hidden');},closeModal=g=>{run(g,'modal=false');g.__cls.add('hidden');};
const api=g=>g.__STORYWORLD_STATIC_PAUSE_R1249__;
const d=g=>run(g,'draws');
// 1. 플레이 중
{const g=env({cls:['hidden']});ok('API exposed',!!api(g)&&typeof api(g).inspect==='function'&&typeof api(g).invalidate==='function');
 frame(g,30);ok('playing: draws every frame',d(g)===30&&run(g,'huds')===30);
 // 2. 정지 창 12.16초(리뷰 측정 길이) 60fps
 openModal(g);const d0=d(g),t0=run(g,'ticks'),h0=run(g,'huds'),m0=run(g,'musics');frame(g,3);ok('settings just opened: first frames still drawn (settle)',d(g)-d0>=2,d(g)-d0);
 frame(g,727);const n=d(g)-d0;ok('settings open 12.16s @60fps: world drawn <= 20 times (was 730)',n<=20,n);ok('settings open: keep-alive redraw about once a second (>= 11)',n>=11,n);
 ok('tick, HUD, musicTick still called every frame',run(g,'ticks')===t0+730&&run(g,'huds')===h0+730&&run(g,'musics')===m0+730);
 ok('stats count skipped frames',api(g).inspect().stats.skipped>=700,api(g).inspect().stats);
 // 3. 창 안 입력(밝기·화질 슬라이더/선택/체크) → 바로 다시 그림, 잠시 뒤 다시 쉼
 for(const t of ['input','change','click']){frame(g,70);const a=d(g);fire(g,'d:'+t,{target:{}});frame(g,1);ok(t+' in panel: redraws on the very next frame',d(g)===a+1);
  frame(g,5);ok(t+' in panel: keeps drawing a few frames so async setting changes land',d(g)>=a+5);frame(g,90);const b=d(g);frame(g,20);ok(t+' in panel: settles back to skipping',d(g)-b<=1,d(g)-b);}
 // 4. 화면 크기·회전·dpr
 for(const [name,js,evk] of [['W change','W=700',null],['H change','H=300',null],['dpr change','dpr=1.5',null],['window resize event',null,'w:resize'],['orientationchange event',null,'w:orientationchange']]){
  frame(g,90);const a=d(g);if(js)run(g,js);if(evk)fire(g,evk);frame(g,1);ok(name+': redraws on the very next frame',d(g)===a+1);}
 // 5. 닫기 → 바로, 매 프레임
 frame(g,90);const a=d(g);closeModal(g);frame(g,1);ok('close: redraws on the very next frame',d(g)===a+1);frame(g,30);ok('closed: every frame again',d(g)===a+31);}
// 6. 게임 시간이 흐르면(협동 손님 스냅샷 등) 늘 그림
{const g=env({cls:['hidden']});frame(g,5);openModal(g);frame(g,10);const a=d(g);for(let i=0;i<60;i++){run(g,'time+=1/60');frame(g,1);}ok('modal but game time moving: draws every frame',d(g)===a+60);}
// 7. 밝은 막(R255 기억 조각·R667 타이틀 영상) · 계산된 막이 옅으면 늘 그림
for(const c of ['r255','r667on']){const g=env({cls:['hidden']});frame(g,5);openModal(g);g.__cls.add(c);frame(g,120);ok('#modal.'+c+' (world visible through a light veil): always draws',d(g)===125);}
{const g=env({cls:['hidden'],bg:'rgba(3, 7, 11, 0.18)'});frame(g,5);openModal(g);frame(g,120);ok('computed veil alpha .18: always draws',d(g)===125);}
{const g=env({cls:['hidden'],bg:'rgb(3, 7, 11)'});frame(g,5);openModal(g);frame(g,120);ok('opaque veil rgb(): skips',d(g)<125-90,d(g));}
// 8. loading·started·booted
for(const [k,v] of [['loading','true'],['started','false'],['booted','false']]){const g=env({cls:['hidden']});frame(g,5);openModal(g);run(g,k+'='+v);frame(g,120);ok(k+'='+v+': always draws',d(g)===125);}
// 9. 정지 창 동안 새 지역이 들어오면(지역 서사 창) 그동안 그려서 장면을 미리 만든다
{const g=env({cls:['hidden']});frame(g,5);openModal(g);frame(g,120);const a=d(g);run(g,'room={id:"b"}');frame(g,60);ok('new room while modal: keeps drawing (warm the new scene, R1036 reason)',d(g)-a>=55,d(g)-a);
 frame(g,600);const b=d(g);frame(g,120);ok('new room warm window ends: skipping again',d(g)-b<=4,d(g)-b);}
// 10. load 뒤 다른 스크립트가 draw 를 감싸도 가장 바깥에서 건너뜀
{const g=env({cls:['hidden'],pre:[]});run(g,'var outerWork=0;(()=>{const b=draw;draw=function(...a){outerWork++;return b.apply(this,a);};})()');for(const f of g.__load)f();
 frame(g,5);openModal(g);frame(g,120);const ow=run(g,'outerWork');ok('after load: later wrappers are skipped too',ow===d(g)&&ow<30,{ow,d:d(g)});}
// 11. 끄기
{const g=env({cls:['hidden'],store:{'storyworld.r1249.staticpause':JSON.stringify({on:false})}});frame(g,5);openModal(g);frame(g,120);ok('turned off: always draws',d(g)===125);}
{const g=env({cls:['hidden']});api(g).setPrefs({on:false});frame(g,5);openModal(g);frame(g,60);ok('setPrefs off at runtime: always draws',d(g)===65);}
// 12. 오류 → 그림
{const g=env({cls:['hidden']});g.__cssThrow=true;frame(g,5);openModal(g);frame(g,60);ok('style lookup error: draws anyway',d(g)===65&&api(g).inspect().stats.errors>0);}
{const g=env({cls:['hidden']});run(g,'document.getElementById=()=>{throw new Error("x")}');frame(g,5);run(g,'modal=true');frame(g,60);ok('dom lookup error: draws anyway',d(g)===65);}
// 13. invalidate() API
{const g=env({cls:['hidden']});frame(g,5);openModal(g);frame(g,90);const a=d(g);api(g).invalidate('test');frame(g,1);ok('invalidate(): redraws next frame',d(g)===a+1);}
// 14. R619 과 함께: 영상이 덮으면 R619 가 쉼, 영상 없고 플레이 중이면 매 프레임
{const s619=C('video-render-pause-r619.js');const g=env({cls:['hidden'],pre:[s619]});for(const f of g.__load)f();frame(g,10);ok('with R619 loaded: playing draws every frame',d(g)===10);
 g.dom.set('r368v',{id:'r368v',isConnected:true});frame(g,30);ok('with R619 loaded: video open still skips',d(g)===10);g.dom.delete('r368v');
 openModal(g);frame(g,240);const n=d(g)-10;ok('with R619 loaded: settings open skips too',n<=8,n);closeModal(g);frame(g,3);ok('with R619 loaded: close draws at once',d(g)===10+n+3);}
console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);
