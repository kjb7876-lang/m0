// R372 CPU check — 오프닝은 책 영상만(R309), 실사 영상은 dist00 뿌리의 문지기 보스 문 상호작용 때 보스 입장 영상. 정적 + 가짜 엔진.
//  node r96/qa/r372/r372-cpu-check.cjs
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..','..','..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,name,info)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,200)));};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const src=fs.readFileSync(path.join(R,'client-source','root-gate-video-r372.js'),'utf8'),r309=fs.readFileSync(path.join(R,'client-source','intro-video-r309.js'),'utf8');
ok(RT('root-gate-video-r372.js')===src,'runtime-text 사본이 client-source 와 같음(sync)');
ok(/<script src="\.\/poison-city-video-r369\.js"><\/script><script src="\.\/root-gate-video-r372\.js"><\/script>/.test(RT('index.html'))&&RT('index.html').split('root-gate-video-r372.js').length===2,'스크립트 태그 한 번, R369 뒤');
ok(/node r96\/qa\/r372\/r372-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const vp=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');ok(vp.includes("'root-gate-video-r372.js'")&&vp.includes("startswith('assets/r372/')")&&!/'[^',]+\.js''/.test(vp),'공개 확인 목록(쉼표 포함)·assets/r372');
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));
ok(['root-gate-video-r372.js','assets/r372/opening-book.mp4','assets/r372/root-gate.mp4','assets/r372/root-gate-poster.jpg','assets/r372/index.json'].every(p=>inputs.textPaths.includes(p)),'런타임 입력 목록');
const A=path.join(R,'runtime-text','assets','r372'),idx=JSON.parse(fs.readFileSync(path.join(A,'index.json'),'utf8'));
ok(idx.files.every(f=>{const b=fs.readFileSync(path.join(R,'runtime-text',f.path));return b.length===f.bytes&&crypto.createHash('sha256').update(b).digest('hex')===f.sha256;}),'자산 표 해시·크기 일치');
const dur=f=>{const b=fs.readFileSync(path.join(A,f)),mv=b.indexOf('mvhd'),ver=b[mv+4],ts=ver?b.readUInt32BE(mv+24):b.readUInt32BE(mv+16),du=ver?Number(b.readBigUInt64BE(mv+28)):b.readUInt32BE(mv+20);return{sec:du/ts,fast:b.indexOf('moov')<b.indexOf('mdat'),bytes:b.length};};
const ob=dur('opening-book.mp4'),rg=dur('root-gate.mp4');
ok(ob.sec>9.3&&ob.sec<9.6&&ob.fast&&ob.bytes<3e6,'책 오프닝 9.3–9.6초·faststart·3MB 미만',ob);
ok(rg.sec>9.3&&rg.sec<9.7&&rg.fast&&rg.bytes<3e6,'실사 보스 입장 9.3–9.7초·faststart·3MB 미만',rg);
ok(fs.existsSync(path.join(R,'runtime-text','assets','r309','intro','opening-hapil.mp4')),'원래 연결본(R327)은 지우지 않음');
ok(/SRC='assets\/r372\/opening-book\.mp4'/.test(r309)&&/CUT=9\.4,TITLE_AT=6\.6,/.test(r309),'R309 오프닝: 책 영상, 9.4초 컷, 제목 6.6초~');
ok(/ZONE='dist00'/.test(src)&&/s\.phase!=='door'/.test(src)&&/bossDoorId/.test(src),'dist00 보스 문(door 단계)에서만');
ok(/play\(r,\{after:\(\)=>base\.apply\(self,a\)\}\)/.test(src)&&/o\.after\(\)/.test(src),'영상 뒤 원래 문 처리 이어감');
ok(/__STORYWORLD_CINEMA_GUARDS__/.test(src)&&/stopImmediatePropagation/.test(src),'재생 중 게임 키 막기');
ok(/__STORYWORLD_ROOT_GATE_VIDEO_R372__\?\.bgmGain/.test(fs.readFileSync(path.join(R,'client-source','bgm-map-r308.js'),'utf8')),'BGM 배수 연결');
ok(!/[가-힣]{2,}[.!?…]["']?,?\s*\]/.test(src)&&!/CUES/.test(src),'자막(새 문장) 없음 — 이름 카드만');
// 가짜 엔진: 문 앞 'door' 단계에서만 가로채고, 닫히면 원래 interact 를 한 번 부른다.
function fake(o={}){const calls={base:0};const els=[];const mk=tag=>{const e={tag,children:[],style:{},classList:{s:new Set(),add(c){this.s.add(c);},remove(c){this.s.delete(c);},toggle(c,v){v?this.s.add(c):this.s.delete(c);},contains(c){return this.s.has(c);}},
 setAttribute(){},removeAttribute(){},addEventListener(t,f){(this.ev=this.ev||{})[t]=f;},removeEventListener(){},appendChild(c){this.children.push(c);},insertBefore(c){this.children.unshift(c);},remove(){this.removed=true;},
 querySelector(){return mk('q');},load(){},pause(){},play(){return Promise.resolve();},focus(){},set innerHTML(v){},currentTime:0};els.push(e);return e;};
 const timers=[];const ctx={console,Math,JSON,Number,String,Promise,Date,
  window:{},localStorage:{getItem:()=>null,setItem(){}},document:{createElement:mk,getElementById:()=>null,head:mk('head'),body:mk('body'),activeElement:null},
  requestAnimationFrame:f=>f(),setTimeout:(f)=>{timers.push(f);return timers.length;},clearTimeout(){},addEventListener(){},performance:{now:()=>0},
  started:true,modal:false,loading:false,storyScene:null,player:{x:20,y:21.5,hp:10},room:{id:o.zone||'dist00',layer:'STORY',enemies:[{boss:true,name:'뿌리의 문지기'}],exploration:{bossDoorId:'door-0',worldR74:{doors:[{id:'door-0',x:20,y:20}]}}},
  regionById:{dist00:{title:'악마화 나무의 정원'}},interact(){calls.base++;return 'base';},tick(){}};
 ctx.window=ctx;ctx.window.__STORYWORLD_WORLD_COMBAT_R78__={state:()=>({phase:o.phase||'door'})};vm.createContext(ctx);vm.runInContext(src,ctx);return{ctx,calls,timers,api:ctx.__STORYWORLD_ROOT_GATE_VIDEO_R372__};}
{const f=fake();const r=f.ctx.interact();ok(r===true&&f.calls.base===0&&f.api.inspect().open,'문 앞 door 단계: 영상 먼저, 원래 처리는 대기');f.api.skip();for(const t of f.timers.splice(0))t();
 ok(f.calls.base===1&&!f.api.inspect().open&&f.api.inspect().prefs.seen,'건너뛰면 원래 처리 한 번·seen');f.ctx.interact();ok(f.calls.base===2&&f.api.inspect().stats.plays===1,'두 번째는 바로 원래 처리');}
{const f=fake({phase:'route'});f.ctx.interact();ok(f.calls.base===1&&!f.api.inspect().open,'들판 단계(route)면 그대로');}
{const f=fake({zone:'dist01'});f.ctx.interact();ok(f.calls.base===1&&!f.api.inspect().open,'다른 지역이면 그대로');}
{const f=fake();f.ctx.player.x=30;f.ctx.interact();ok(f.calls.base===1&&!f.api.inspect().open,'문에서 멀면 그대로');}
{const f=fake();f.ctx.storyScene={key:'x'};f.ctx.interact();ok(f.calls.base===1&&!f.api.inspect().open,'서사창이 열려 있으면 그대로');}
console.log(JSON.stringify({ok:!bad,checks:n,method:'static+fake-engine'}));process.exit(bad?1:0);
