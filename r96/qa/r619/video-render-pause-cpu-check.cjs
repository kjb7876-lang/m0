// R619 CPU 검사: 전체 화면 서사 영상이 열려 있는 동안 게임 화면 그리기(draw)·HUD 갱신을 쉰다.  node r96/qa/r619/video-render-pause-cpu-check.cjs
//  사용자 2026-11-10 "결전의 날 시네마틱영상 나올때 렉이 너무심함" — 헤드리스 측정: R368 재생 중 게임 draw 를 계속 돌리면 3.5fps,
//  draw 를 쉬면 57fps(같은 영상, 1280×720). 영상이 화면을 다 덮는 동안 뒤의 3D 장면을 그릴 까닭이 없다.
//  · 연결: 소스=런타임 사본, 스크립트 태그(독립 줄, combat-r118 앞), verify-r96-public 목록, pages.yml, 매니페스트
//  · 동작: 영상 루트(r309v·r368v·r369v·r372v·r617v)가 있으면 draw·updateHUD 건너뜀, 없으면 그대로, load 뒤에도 가장 바깥 감싸개,
//    60초 넘게 붙어 있으면 다시 그림(안전장치), 끄기 설정, 게임 tick·musicTick 은 건드리지 않음, 오류가 나도 그리기는 이어감
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..'),ROOT=path.join(R,'..');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return '';}};
const F='video-render-pause-r619.js';let src='';try{src=C(F);}catch(_){}
ok(F+' exists',!!src);ok(F+' runtime copy matches source',!!src&&src===RT(F));
try{new vm.Script(src);ok('syntax',!!src);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html'),tag='"./'+F+'"';
ok('script tag once on its own line, before combat-r118',html.split(tag).length===2&&html.includes('\n<script src='+tag+'></script>\n')&&html.indexOf(tag)<html.lastIndexOf('"./combat-r118.js"'));
ok('listed in verify-r96-public.py',fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',/node r96\/qa\/r619\/video-render-pause-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
let man='';try{man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');}catch(_){}
ok('runtime-manifest has overlay',man.includes('"'+F+'"'));
// 영상 오버레이 루트 id 가 실제 모듈과 같은지
for(const [f,id] of [['intro-video-r309.js','r309v'],['betrayal-video-r368.js','r368v'],['poison-city-video-r369.js','r369v'],['root-gate-video-r372.js','r372v'],['hwando-fall-video-r617.js','r617v']])
 ok(id+' is the root id used by '+f+' and listed here',C(f).includes("root.id='"+id+"'")&&src.includes("'"+id+"'"));
if(!src){console.log(`\n${pass} pass, ${fail} fail`);process.exit(1);}
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/.*$/gm,'$1');const code=strip(src);
ok('does not touch tick, musicTick, game state',!/\btick\s*=|musicTick\s*=|\.hp\s*=|saveGame\(|ctx\.filter/.test(code));
// ---- 가짜 브라우저 ----
function env(o={}){const store=new Map(Object.entries(o.store||{}));const dom=new Map();const g={__now:0,__load:[],console};
 Object.assign(g,{localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},performance:{now:()=>g.__now},
  document:{getElementById:id=>dom.get(id)||null},addEventListener:(t,f)=>{if(t==='load')g.__load.push(f);},dom});
 g.window=g;vm.createContext(g);
 vm.runInContext('var draws=0,huds=0,ticks=0,musics=0;function draw(){draws++;}function updateHUD(){huds++;}function tick(){ticks++;}function musicTick(){musics++;}',g);
 vm.runInContext(src,g);return g;}
const run=(g,js)=>vm.runInContext(js,g);
const frame=(g,n=1,ms=16)=>{for(let i=0;i<n;i++){g.__now+=ms;run(g,'tick(1/60);draw();updateHUD();musicTick();');}};
const open=(g,id)=>g.dom.set(id,{id,isConnected:true}),shut=(g,id)=>g.dom.delete(id);
const api=g=>g.__STORYWORLD_VIDEO_RENDER_PAUSE_R619__;
{const g=env();ok('API exposed',!!api(g)&&typeof api(g).inspect==='function');
 frame(g,10);ok('no video: game draws every frame',run(g,'draws')===10&&run(g,'huds')===10);
 for(const id of ['r309v','r368v','r369v','r372v','r617v']){open(g,id);const d0=run(g,'draws'),h0=run(g,'huds'),t0=run(g,'ticks'),m0=run(g,'musics');frame(g,30);
  ok(id+' open: draw and HUD skipped',run(g,'draws')===d0&&run(g,'huds')===h0);ok(id+' open: tick and musicTick still called (game pause stays with the video module, BGM can fade)',run(g,'ticks')===t0+30&&run(g,'musics')===m0+30);
  shut(g,id);frame(g,3);ok(id+' closed: draws again at once',run(g,'draws')===d0+3);}
 ok('stats count skipped frames',api(g).inspect().stats.skipped>=150);}
// load 뒤에 다른 스크립트가 draw 를 감싸도 가장 바깥에서 건너뜀
{const g=env();run(g,'var outerWork=0;(()=>{const b=draw;draw=function(...a){outerWork++;return b.apply(this,a);};})()');for(const f of g.__load)f();
 open(g,'r368v');frame(g,10);ok('after load: outermost wrapper skips later wrappers too',run(g,'outerWork')===0&&run(g,'draws')===0);
 shut(g,'r368v');frame(g,2);ok('after load: later wrappers run again when closed',run(g,'outerWork')===2&&run(g,'draws')===2);}
// 안전장치: 영상 루트가 60초 넘게 남아 있으면 다시 그림
{const g=env();open(g,'r372v');frame(g,10,1000);ok('within 60s: still skipped',run(g,'draws')===0);frame(g,55,1000);ok('stuck root over 60s: drawing resumes',run(g,'draws')>0&&api(g).inspect().stats.expired>0);
 shut(g,'r372v');frame(g,1);open(g,'r617v');const d=run(g,'draws');frame(g,5);ok('new video after that: skipped again (timer resets)',run(g,'draws')===d);}
// 끄기
{const g=env({store:{'storyworld.r619.videopause':JSON.stringify({on:false})}});open(g,'r368v');frame(g,5);ok('turned off: always draws',run(g,'draws')===5);}
// 오류가 나도 그리기는 이어감
{const g=env();run(g,'document.getElementById=()=>{throw new Error("x")}');frame(g,3);ok('lookup error: draws anyway',run(g,'draws')===3);}
console.log(`\n${pass} pass, ${fail} fail`);process.exit(fail?1:0);
