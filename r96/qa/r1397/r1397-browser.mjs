// R1397 브라우저 확인(헤드리스, 그래픽 검증 아님): 그리기 캐시 예산이 새 큰 시트에 맞는지.
//  ① 정책: PC(터치 아님·저사양 끔·메모리 8GB 이상)는 R409 테두리 캐시 14M화소, R89 쉬는 텍스처 60초·160장·320MB. 모바일·저사양·끄기는 예전 값(7M·20초·64장·192MB) 그대로.
//  ② R89 기능: 30초 쉰 텍스처가 PC 에서는 남고, 끄면 예전처럼 버려진다. 90초 넘게 쉰 것은 PC 에서도 버려진다(경계).
//  ③ R409 기능: 서로 다른 그림 10M화소어치를 구워도 PC 에서는 버리지 않고, 14M 을 넘기면 오래된 것부터 버린다(경계).
//  ④ 실플레이: 환도 자동전투 dist02→ep1b06(각 14게임초) 동안 R409 테두리 버림 0, 같은 GL 문맥·지역에서 같은 그림을 15~55초 만에 다시 올린 횟수 0
//     (R89 가 20초 쉰 텍스처를 버렸다 다시 올리던 표지. 15초 안 다시 올림은 내용이 바뀌는 캔버스라 뺀다).
//  ⑤ 실플레이: 이어서 dist00(14게임초). 앞 두 지역 모두 '들어온 지 3게임초 뒤 처음 GPU 에 올라간' assets 그림(영웅 스킬 시트)이
//     dist00 에서는 그렇게 늦게 올라가지 않음(미리 올려 둠). 앞 두 지역에 그런 그림이 하나도 없으면 실패(검사가 비지 않게).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1397/r1397-browser.mjs [functional|play|all]
import {chromium,boot,go} from '../r444/lib.mjs';
const MODE=process.argv[2]||'all';let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');if(!c)fail++;};
const H='__STORYWORLD_DRAW_CACHE_R1397__';
async function functional(){
 // PC
 {const b=await chromium.launch();try{const {p}=await boot(b,{vp:{width:640,height:360}});await go(p,'dist00');
  const pol=await p.evaluate(H=>{const h=window[H];if(!h)return null;return {roomy:h.roomy(),outline:h.outlinePx(7e6),idle:h.texIdle(false),idleLow:h.texIdle(true),r409cap:window.__STORYWORLD_COMBAT_READ_R409__?.inspect?.().capPx};},H);
  ok('① 훅 있음',!!pol,pol);
  if(!pol){ok('② ③ 훅이 없어 기능 확인 못 함',false);return;}
  ok('① PC 는 넉넉한 예산',pol?.roomy===true&&pol.outline===14e6&&pol.idle?.ms===60000&&pol.idle?.count===160&&pol.idle?.bytes===320*1048576,pol);
  ok('① 저사양 칸 요청은 예전 값',pol?.idleLow?.ms===20000&&pol.idleLow.count===24&&pol.idleLow.bytes===64*1048576,pol?.idleLow);
  ok('① R409 가 실제로 14M 상한을 씀',pol?.r409cap===14e6,pol?.r409cap);
  // ② R89 기능
  const t=await p.evaluate(async H=>{const S=window.__STORYWORLD_PHASE1__.controller.state.three.commands;const mk=(w)=>{const c=document.createElement('canvas');c.width=w;c.height=w;c.getContext('2d').fillRect(0,0,4,4);return c;};
   const idle=()=>S.r89Idle;const park=(c,age)=>{S.texture(c,false);S.release(c);const m=idle()?.get(c);if(m)m.at=performance.now()-age;return !!m;};
   const a=mk(64),b2=mk(65),c3=mk(66);const pa=park(a,30000),pb=park(b2,95000);S.r89SweepAt=0;S.texture(mk(8),false);
   const r={parked:pa&&pb,keep30:idle().has(a),drop95:!idle().has(b2)};
   window[H].set({on:false});park(c3,30000);S.r89SweepAt=0;S.texture(mk(9),false);r.offDrop30=!idle().has(c3);window[H].set({on:true});return r;},H);
  ok('② 쉰 텍스처 놓아두기 가능',t.parked,t);ok('② PC: 30초 쉰 텍스처는 남음',t.keep30,t);ok('② PC 경계: 95초 쉰 것은 버림',t.drop95,t);ok('② 끄면 예전처럼 30초 쉰 것도 버림',t.offDrop30,t);
  // ③ R409 기능
  const q=await p.evaluate(async()=>{const R=window.__STORYWORLD_COMBAT_READ_R409__;const s0=R.inspect();const ev0=s0.stats.cacheEvicted;let px=0,i=0,made=0;
   const one=async(w)=>{const c=document.createElement('canvas');c.width=w;c.height=w;const g=c.getContext('2d');g.fillStyle='#a33';g.beginPath();g.arc(w/2,w/2,w*.4,0,7);g.fill();g.fillRect(i%7,i%5,3,3);i++;
     for(let k=0;k<30;k++){const r=R.bake(c,0,0,w,w,3,'enemy');if(r){made++;return (w+8)*(w+8);}await new Promise(z=>setTimeout(z,50));}return 0;};
   const target=10e6-s0.cachedPx;while(px<target)px+=await one(600);const mid={cached:R.inspect().cachedPx,ev:R.inspect().stats.cacheEvicted-ev0};
   while(R.inspect().cachedPx+380000<14e6||px<16e6-s0.cachedPx)px+=await one(600);const end={cached:R.inspect().cachedPx,ev:R.inspect().stats.cacheEvicted-ev0};return {start:s0.cachedPx,mid,end,made};});
  ok('③ PC: 10M화소까지 테두리 캐시 버림 없음',q.mid.ev===0&&q.mid.cached>7e6,q);ok('③ PC 경계: 14M 넘기면 버림·상한 지킴',q.end.ev>0&&q.end.cached<=14e6,q);
 }finally{await b.close();}}
 // 모바일(터치)
 {const b=await chromium.launch();try{const nc=b.newContext.bind(b);b.newContext=o=>nc({...o,hasTouch:true,isMobile:true});const {p}=await boot(b,{vp:{width:640,height:360}});
  const pol=await p.evaluate(H=>{const h=window[H];return h?{roomy:h.roomy(),outline:h.outlinePx(7e6),idle:h.texIdle(false),r409cap:window.__STORYWORLD_COMBAT_READ_R409__?.inspect?.().capPx,mobile:window.__STORYWORLD_MOBILE_MEMORY_R980__?.mobile?.()}:null},H);
  ok('① 모바일은 예전 예산(R980 3M·20초·64장)',pol&&pol.mobile===true&&pol.roomy===false&&pol.outline===7e6&&pol.idle.ms===20000&&pol.idle.count===64&&pol.r409cap===3e6,pol);
 }finally{await b.close();}}
 // 저사양 설정
 {const b=await chromium.launch();try{const {p}=await boot(b,{vp:{width:640,height:360}});
  const pol=await p.evaluate(H=>{settings.lowFx=true;const h=window[H];const r=h?{roomy:h.roomy(),outline:h.outlinePx(7e6),r409cap:window.__STORYWORLD_COMBAT_READ_R409__?.inspect?.().capPx}:null;settings.lowFx=false;return r},H);
  ok('① 저사양 켬은 예전 예산',pol&&pol.roomy===false&&pol.outline===7e6&&pol.r409cap===7e6,pol);
 }finally{await b.close();}}
}
async function play(){const b=await chromium.launch();try{const {p}=await boot(b,{vp:{width:480,height:270}});
 await p.evaluate(()=>{const U=window.__U=new Map();window.__REP=[];let scene=null;
  for(const G of [WebGLRenderingContext.prototype,WebGL2RenderingContext.prototype])for(const n of ['texImage2D','texSubImage2D']){const o=G[n];G[n]=function(){const a=arguments,s=a[a.length-1];
   if(s&&s.width){/* 지역을 옮기면 엔진이 장면 텍스처를 모두 비운다(정상) → 장면·지역마다 새로 센다 */const S=window.__STORYWORLD_PHASE1__?.controller?.state?.three?.commands,rid=typeof room!=='undefined'&&room?room.id:'';if(S!==scene||rid!==window.__RID){scene=S;window.__RID=rid;U.clear();(window.__ZT||(window.__ZT={}))[rid]=time;}/* 같은 GL 문맥에서 같은 그림만(다른 렌더러 문맥은 따로 올려야 함) */let m=U.get(this);if(!m)U.set(this,m=new Map());const now=performance.now(),e=m.get(s);if(e&&now-e>=15000&&now-e<55000)window.__REP.push([(s.src||'').split('/').slice(-2).join('/')||'canvas '+s.width+'x'+s.height,Math.round((now-e)/1000)]);m.set(s,now);
    /* ⑤ 지역 들어온 지 3게임초 넘어 처음 올라간 assets 그림 */const pth=(/(assets\/[\w\-./]+\.(?:webp|png))/.exec(s.src||'')||[])[1];if(pth&&!e){const Z=window.__MID||(window.__MID={});const zt=window.__ZT||(window.__ZT={});if(!(rid in zt))zt[rid]=time;if(time-zt[rid]>3)(Z[rid]||(Z[rid]=new Set())).add(pth);}}return o.apply(this,a)}}});
 await p.evaluate(()=>{player.hero='hwando';auto=true;guide=true;setInterval(()=>{try{player.hp=maxHP();player.invincible=99;if(modal&&!storyScene)closePanel(true);if(storyScene)advanceScene();}catch(_){}},200);});
 const wait=s=>p.evaluate(async s=>{const t0=time,w=Date.now();await new Promise(r=>{const g=()=>{if(time-t0>s||Date.now()-w>240000)return r();setTimeout(g,100)};g();});},s);
 const ev0=await p.evaluate(()=>window.__STORYWORLD_COMBAT_READ_R409__.inspect().stats.cacheEvicted);
 for(const z of ['dist02','ep1b06']){await go(p,z);await wait(14);}
 const r=await p.evaluate(ev0=>({evicted:window.__STORYWORLD_COMBAT_READ_R409__.inspect().stats.cacheEvicted-ev0,cachedPx:window.__STORYWORLD_COMBAT_READ_R409__.inspect().cachedPx,rep:window.__REP.length,repTop:window.__REP.slice(0,8),r1397:window.__STORYWORLD_DRAW_CACHE_R1397__?.inspect?.()}),ev0);
 await go(p,'dist00');await wait(14);
 const k=await p.evaluate(()=>{const Z=window.__MID||{};const a=Z.dist02||new Set(),b=Z.ep1b06||new Set(),c=Z.dist00||new Set();const rec=[...a].filter(x=>b.has(x));return {recurring:rec.length,late:rec.filter(x=>c.has(x)),dist00Late:c.size,kit:window.__STORYWORLD_DRAW_CACHE_R1397__?.inspect?.().kit};});
 ok('⑤ 실플레이: 두 지역에서 전투 중 처음 올라간 영웅 그림이 세 번째 지역(dist00)에서는 전투 중 처음 올라가지 않음',k.recurring>0&&k.late.length===0,k);
 ok('④ 실플레이: 테두리 캐시 버림 0',r.evicted===0,r);ok('④ 실플레이: 쉬다 버린 같은 그림을 15~55초 뒤 다시 올림 0(매 장면 바뀌는 캔버스 제외)',r.rep===0,r);
}finally{await b.close();}}
if(MODE==='functional'||MODE==='all')await functional();
if(MODE==='play'||MODE==='all')await play();
console.log(fail?`R1397 BROWSER FAIL ${fail}`:'R1397 BROWSER ALL PASS');process.exit(fail?1:0);
