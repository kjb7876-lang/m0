'use strict';
// R1311 CPU 검사: 오프닝(악마화 나무) 영상을 새 게임 직후 피난 거점(hub, 몹 0)이 아니라 몹이 처음 나오는 맵(헤드리스 실측: 악마화 나무의 정원 dist00, 몹 40)에 들어갈 때 튼다.
//  사용자 2026-11-25 08:06Z "맨처음몹있는맵들어갈때 나오게해줘 즉 지금보다 하나 늦게 나오는거지".
//  기대: 새 게임 → 거점에선 안 나옴(대기) → 살아 있는 몹이 있는 첫 맵 입장 때 한 번 → 영상이 닫힌 뒤 그 맵 입장 서사창 → 다시는 안 나옴.
//  경계: 몹 없는 맵·이미 깬 맵은 넘김(대기 유지), noStory 입장, 진입 실패, newGame 실패, 무한생존(skip·active), 꺼짐, 자동 검사, 저장/불러오기(대기 상태 저장, 옛 저장은 안 틂).
//  회귀: 영상 경로·건너뛰기·불러오기 때 안 나옴.
// 실제 엔진 serializeSave + 실제 intro-video-r309.js, 가짜 DOM·타이머. 그래픽·실플레이 주장 없음.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),ROOT=path.join(R,'..'),read=f=>fs.readFileSync(path.join(R,f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const src=read('client-source/intro-video-r309.js'),html=read('runtime-text/index.html');
const serialize=html.slice(html.indexOf('function serializeSave(){'),html.indexOf('function saveGame(notice=true){'));
function fixture({webdriver=false,stored=null,survival=false}={}){
 let now=0,serial=0;const timers=new Map(),nodes=[],log=[];
 class El{constructor(t='div'){this.tagName=t.toUpperCase();this.listeners=new Map();this.style={};this.classes=new Set();this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x)};this.children=[];this.connected=false;this.currentTime=0;nodes.push(this);}
  setAttribute(){}removeAttribute(){}appendChild(n){this.children.push(n);n.connected=true;return n;}insertBefore(n){return this.appendChild(n);}querySelector(s){return this.parts?.[s]||null;}
  set innerHTML(s){this.parts={'.ttl':new El(),'.fade':new El(),'.skip':new El('button')};}
  addEventListener(t,f){const a=this.listeners.get(t)||[];a.push(f);this.listeners.set(t,a);}removeEventListener(t,f){this.listeners.set(t,(this.listeners.get(t)||[]).filter(x=>x!==f));}
  pause(){}load(){}play(){return Promise.resolve();}remove(){this.connected=false;}get firstChild(){return this.children[0];}}
 const mk=(n,alive=n)=>({enemies:Array.from({length:n},(_,i)=>({id:i,hp:i<alive?10:0}))});
 const rooms={hub:mk(0),dist00:mk(40),dist01:mk(12),cleared:mk(5,0),camp:mk(0)};
 const regionById={hub:{id:'hub',safe:true},dist00:{id:'dist00',safe:false},dist01:{id:'dist01',safe:false},cleared:{id:'cleared',safe:false},camp:{id:'camp',safe:true}};
 const c={console,Math,Promise,JSON,performance:{now:()=>now},localStorage:{getItem:k=>k==='storyworld.r309.opening'?stored:null,setItem(){}},navigator:{webdriver},location:{search:''},
  settings:{bgm:.6,music:true,sound:true,volume:.35,voice:.4},keys:new Set(),time:0,started:false,player:{hero:'hwando',hp:80,x:0,y:0},room:null,zone:'title',layer:'STORY',world:{},VERSION:6,COMBAT_HEALTH_R26:1,COMBAT_RHYTHM_R26:1,PIN:'cpu',auto:false,
  progress:{STORY:{},DREAM:{}},visited:new Set(),readScenes:new Set(),ending:{},lastHub:'hub',zoom:1,effects:[],regionById,log,failEnter:false,failNew:false,
  addEventListener(){},removeEventListener(){},setTimeout:(f,ms)=>{const i=++serial;timers.set(i,{f,at:now+ms});return i;},clearTimeout:i=>timers.delete(i),requestAnimationFrame:()=>++serial,
  __STORYWORLD_INTRO_TREE_R309__:{play(){log.push('tree');return true;}},
  __STORYWORLD_SURVIVAL_R600__:{inspect:()=>({active:survival})},
  document:{readyState:'complete',createElement:t=>new El(t),querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>nodes.find(n=>n.id===id&&n.connected)||null}};
 c.document.head=new El('head');c.document.body=new El('body');c.window=c;c.rooms=rooms;vm.createContext(c);vm.runInContext(serialize,c);
 vm.runInContext(`function enterNarrative(def){log.push('story:'+def.id);}
  async function enterRegion(id,from=null,options={}){const def=regionById[id];if(!def||failEnter)return false;zone=id;room=rooms[id];if(options.layer)layer=options.layer;log.push('enter:'+id);if(!options.noStory)enterNarrative(def);return true;}
  async function newGame(id){if(failNew)return false;started=true;const ok=await enterRegion('hub',null,{restore:true});return ok;}
  async function restoreSave(raw){zone=raw.zone;room=rooms[raw.zone];log.push('restore');return true;}`,c);
 vm.runInContext(src,c);
 const api=c.__STORYWORLD_INTRO_VIDEO_R309__;
 const advance=ms=>{const end=now+ms;for(;;){const d=[...timers].filter(([,x])=>x.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!d)break;timers.delete(d[0]);now=d[1].at;d[1].f();}now=end;};
 const vid=()=>!!c.document.getElementById('r309v');
 return {c,api,log,advance,vid,run:s=>vm.runInContext(s,c),plays:()=>api.inspect().stats.plays};}
(async()=>{
 // ① 정상 경로
 {const f=fixture();await f.run("newGame('hwando')");
  ok('newGame: hub(몹 0)에서는 영상이 안 나옴',f.plays()===0&&!f.vid());
  ok('newGame: 몹 맵 대기 상태(pending)',f.api.inspect().pending===true);
  ok('거점 저장에 대기 상태가 들어감',f.run('serializeSave()').introPendingR1311===true);
  await f.run("enterRegion('camp','hub',{})");
  ok('몹 없는 안전 지역은 넘김(안 나옴, 서사 바로)',f.plays()===0&&f.log.includes('story:camp')&&f.api.inspect().pending===true);
  await f.run("enterRegion('cleared','camp',{})");
  ok('살아 있는 몹이 없는 맵은 넘김(대기 유지, 서사 바로)',f.plays()===0&&f.log.includes('story:cleared')&&f.api.inspect().pending===true);
  const n0=f.log.length;await f.run("enterRegion('dist00','hub',{})");
  ok('첫 몹 맵(dist00) 입장 때 오프닝 영상이 나옴',f.plays()===1&&f.vid());
  ok('영상이 열린 동안 입장 서사창은 아직 안 염',!f.log.slice(n0).includes('story:dist00'));
  ok('대기 상태가 풀림 + 저장에서 빠짐',f.api.inspect().pending===false&&f.run('serializeSave()').introPendingR1311!==true);
  ok('영상 경로는 그대로(assets/r372/opening-book.mp4)',f.api.src==='assets/r372/opening-book.mp4');
  f.api.skip();f.advance(600);
  ok('영상이 닫힌 뒤 dist00 입장 서사창을 한 번 엶',!f.vid()&&f.log.filter(x=>x==='story:dist00').length===1);
  await f.run("enterRegion('dist01','dist00',{})");await f.run("enterRegion('dist00','dist01',{})");
  ok('다음 몹 맵·재입장에서는 다시 안 나옴(한 번만)',f.plays()===1&&f.log.includes('story:dist01'));}
 // ② 경계
 {const f=fixture();await f.run("newGame('hwando')");await f.run("enterRegion('dist00','hub',{noStory:true})");f.api.skip();f.advance(600);
  ok('noStory 입장: 영상은 나오고 서사창은 끝까지 안 엶',f.plays()===1&&!f.log.includes('story:dist00'));}
 {const f=fixture();await f.run("newGame('hwando')");f.c.failEnter=true;const r=await f.run("enterRegion('dist00','hub',{})");
  ok('진입 실패: 영상 없음·대기 유지',r===false&&f.plays()===0&&f.api.inspect().pending===true);
  f.c.failEnter=false;await f.run("enterRegion('dist00','hub',{})");ok('진입 실패 뒤 다시 들어가면 그때 나옴',f.plays()===1);}
 {const f=fixture();f.c.failNew=true;await f.run("newGame('hwando')");ok('newGame 실패: 대기 없음',f.api.inspect().pending===false);}
 {const f=fixture();await f.run("newGame('hwando')");f.api.skip();await f.run("enterRegion('dist00','hub',{})");
  ok('무한생존(newGame 뒤 skip): 몹 맵에서도 안 나옴, 서사 그대로',f.plays()===0&&f.log.includes('story:dist00')&&f.api.inspect().pending===false);}
 {const f=fixture({survival:true});await f.run("newGame('hwando')");await f.run("enterRegion('dist00','hub',{})");
  ok('무한생존 진행 중(active): 안 나옴',f.plays()===0&&f.log.includes('story:dist00'));}
 {const f=fixture({stored:'{"on":false}'});await f.run("newGame('hwando')");await f.run("enterRegion('dist00','hub',{})");
  ok('설정 꺼짐: 안 나옴, 서사 그대로',f.plays()===0&&f.log.includes('story:dist00'));}
 {const f=fixture({webdriver:true});await f.run("newGame('hwando')");await f.run("enterRegion('dist00','hub',{})");
  ok('자동 검사(webdriver): 안 나옴, 서사 그대로',f.plays()===0&&f.log.includes('story:dist00'));}
 // ③ 저장/불러오기
 {const f=fixture();await f.run("restoreSave({zone:'hub',introPendingR1311:true})");await f.run("enterRegion('dist00','hub',{})");
  ok('거점 저장(대기 중)을 불러오면 첫 몹 맵에서 나옴',f.plays()===1);}
 {const f=fixture();await f.run("newGame('hwando')");await f.run("restoreSave({zone:'dist03'})");await f.run("enterRegion('dist00','hub',{})");
  ok('옛 저장(필드 없음)을 불러오면 대기가 풀려 안 나옴',f.plays()===0&&f.log.includes('story:dist00'));}
 {const f=fixture();await f.run("restoreSave({zone:'hub'})");ok('불러오기 자체로는 영상이 안 나옴',f.plays()===0&&!f.vid());}
 // ④ 연결
 ok('pages.yml 이 이 검사를 돌림',/node r96\/qa\/r1311\/r1311-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')));
 ok('runtime-text 사본이 소스와 같음',read('runtime-text/intro-video-r309.js')===src);
 console.log(`\nR1311 CPU ${pass}/${pass+fail}`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
