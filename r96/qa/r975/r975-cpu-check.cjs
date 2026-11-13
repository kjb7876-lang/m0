// R975 환도 E 「유영 일섬」 보스 우선 · 좌우 7연 다단히트 — CPU 검사(정적 + 가짜 엔진 행동).
//  node r96/qa/r975/r975-cpu-check.cjs
//  사용자 2026-11-13 01:32Z "환도영웅 일섬스킬 보스몹있으면 보스몹부터 우선 공격및 7번좌우로 일섬들어가면서 7다단히트".
//  R590 hwando-chain-r590.js(E 늦은 일섬)와 R975 hwando-ilseom-r975.js 를 실제 순서대로 싣고, E 돌진(엔진)은 건드리지 않는지도 본다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;const ok=(c,m)=>{assert(c,m);n++;console.log('PASS',m);};
const F0='hwando-chain-r590.js',F='hwando-ilseom-r975.js';
const src0=fs.readFileSync(path.join(R,'client-source',F0),'utf8'),src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
// ---- 정적·연결 ----
ok(src===fs.readFileSync(path.join(R,'runtime-text',F),'utf8')&&src0===fs.readFileSync(path.join(R,'runtime-text',F0),'utf8'),'runtime-text 사본 일치(R975·R590)');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok(html.split('"./'+F+'"').length===2&&html.split('"./'+F0+'"').length===2,'index.html 스크립트 태그 한 번(R590 은 부를 때 찾으므로 순서 무관 — 아래 가짜 엔진은 실제 index 순서대로 싣는다)');
const ORDER=html.indexOf('"./'+F+'"')<html.indexOf('"./'+F0+'"')?[[src,F],[src0,F0]]:[[src0,F0],[src,F]];
ok(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8').includes("'"+F+"'"),'verify-r96-public.py 기대 목록');
ok(/node r96\/qa\/r975\/r975-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const man=JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')));
ok(man.includes(F)&&[1,2,3,4,5,6,7].every(i=>man.includes('assets/r975/sfx/ilseom-'+i+'.ogg')),'runtime-manifest 에 오버레이·효과음 7개');
for(let i=1;i<=7;i++){const f=path.join(R,'runtime-text','assets','r975','sfx','ilseom-'+i+'.ogg');ok(fs.existsSync(f)&&fs.statSync(f).size>2000&&fs.statSync(f).size<40000,'효과음 ilseom-'+i+'.ogg 있음(2~40KB)');}
const code=strip(src);
ok(!/drop-shadow|blur\(/.test(code),'Three.js 기록기: drop-shadow·blur 없음');
ok(!/'rune'|'runecross'|'cross'/.test(code),'상징 규칙: 룬·십자 문양을 새로 그리지 않음');
ok(!/\bblink\s*=|\bdash\w*\s*=|player\.(x|y)\s*=|storySourceSkill/.test(code),'E 돌진 불변: 돌진·위치·WER 신호를 바꾸지 않음(R590 늦은 일섬 피해만 넘겨받음)');
ok(/__STORYWORLD_HWANDO_ILSEOM_R975__/.test(strip(src0)),'R590 늦은 일섬이 R975 에 넘겨줄 자리가 있음');

// ---- 가짜 엔진(R590 검사와 같은 틀) ----
// 벽: 14<x<15.5 (세로 벽), 맵: 1..N-1, N=40
function engine({coop=null,enemies=[],px=20,py=20,ready=true,off=false,no975=false}={}){
 const hits=[],draws=[],sounds=[],floats=[];let clock=10;const N=40,store={};
 if(off)store['storyworld.r975.hwandoIlseom']=JSON.stringify({on:false});
 const room={id:'room1',props:[],enemies:enemies.map(e=>({radius:.3,hp:1000,maxHp:1000,...e}))};
 const W={};const g={window:W,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},console,Math,JSON,Set,Map,WeakMap,WeakSet,Array,Object,String,Number,Error,Promise,
  get time(){return clock;},TILE:32,zoom:1,N,room,zone:'z1',settings:{lowFx:false,sound:true,volume:1},effects:[],started:true,modal:false,loading:false,
  player:{x:px,y:py,hp:100,hero:'hwando',direction:'e',attackCD:0,specialCD:0,combo:0},target:null,
  project:(x,y)=>({x:(x-y)*32,y:(x+y)*16}),actorHeight:()=>60,
  liveEnemies:()=>g.room.enemies.filter(e=>e.hp>0),damageable3:()=>true,
  blocked:(x,y,r=.27)=>x-r<1||y-r<1||x+r>N-1||y+r>N-1||(x+r>14&&x-r<15.5),
  attackPower:()=>100,
  hitEnemy:(e,v,s)=>{hits.push({id:e.id,v,s,t:clock});e.hp-=v;return true;},floatText:(t)=>floats.push(t),
  nearestEnemy:(r)=>{let b=null,bd=1e9;for(const e of g.room.enemies){if(e.hp<=0)continue;const d=Math.hypot(e.x-g.player.x,e.y-g.player.y);if(d<=r&&d<bd){bd=d;b=e;}}return b;},
  storyAim22:()=>0,soundProfiles:{},audioUnlocked:false,audioBuffer:()=>Promise.resolve(null),
  fx:()=>{},drawEffect:()=>{},tick:()=>{},enterRegion:async()=>true,sound:(k)=>{sounds.push({k,t:clock});},
  basicAttack(){},special(){},
  readyImage:(pth)=>ready?{ready:true,image:{src:pth,width:1536,height:1024}}:null,ensureImages:()=>Promise.resolve(),
  ctx:{commands:[],save(){},restore(){},translate(...a){if(a.some(v=>!Number.isFinite(v)))g.__nan=(g.__nan||0)+1;},scale(...a){if(a.some(v=>!Number.isFinite(v)))g.__nan=(g.__nan||0)+1;},rotate(a){if(!Number.isFinite(a))g.__nan=(g.__nan||0)+1;g.__rot.push(a);},
   drawImage(im,...a){if(a.some(v=>!Number.isFinite(v)))g.__nan=(g.__nan||0)+1;if(im&&im.src)draws.push('sheet:'+im.src.split('/').pop());},globalAlpha:1,globalCompositeOperation:'source-over',filter:'none'}};
 g.__rot=[];
 g.clearLine=(a,b)=>{const d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.max(1,Math.ceil(d/.24));for(let i=1;i<=k;i++)if(g.blocked(a.x+(b.x-a.x)*i/k,a.y+(b.y-a.y)*i/k,.29))return false;return true;};
 W.__STORYWORLD_FX_SPRITES_R106__={on:()=>true,warm(){},draw:(nm,c,x,y,w,h)=>{if(![x,y,w,h].every(Number.isFinite))g.__nan=(g.__nan||0)+1;draws.push(nm);return true;},along:(nm,c,x0,y0,x1,y1,th)=>{if(![x0,y0,x1,y1,th].every(Number.isFinite))g.__nan=(g.__nan||0)+1;draws.push(nm);return true;}};
 if(coop)W.__STORYWORLD_COOP_SIM_R62__={mode:()=>coop};
 const ctx=vm.createContext(g);for(const [c,f] of ORDER)if(!(no975&&f===F))vm.runInContext(c,ctx,{filename:f});
 const api=W.__STORYWORLD_HWANDO_ILSEOM_R975__,a590=W.__STORYWORLD_HWANDO_CHAIN_R590__;
 const adv=(dt)=>{clock+=dt;ctx.tick(dt);};
 const run=(sec,dt=.01)=>{for(let t=0;t<sec-1e-9;t+=dt)adv(dt);};
 const frame=()=>{draws.length=0;for(const s of g.effects.slice())if(s&&(s.r590Sentinel||s.r975Sentinel))ctx.drawEffect(s);return draws.length;};
 return {g,ctx,api,a590,hits,draws,sounds,floats,adv,run,frame,now:()=>clock};
}
const flight=(E,id,ox,oy,tx,ty)=>E.ctx.fx('storySourceSkill',ox,oy,{storyWER:true,sourceHero:'hwando',sourceSlot:'e',stage:'flight',castId:id,tx,ty,visualWorldAngle35:Math.atan2(ty-oy,tx-ox)});
const ilseom=E=>E.hits.filter(h=>h.s&&h.s.r975);
const sum=(arr,id)=>arr.filter(h=>h.id===id).reduce((a,h)=>a+h.v,0);
const EPS=1e-6;

// 1) 보스가 범위 안(돌진 끝 근처, 지나온 길 밖)에 있으면 보스부터 — 7타 모두 보스가 먼저, 길 위 졸개도 함께 7타
{const E=engine({enemies:[{id:'mob',x:22,y:20.3},{id:'boss',x:25.6,y:21.2,boss:true,radius:.6}]});
 ok(E.api&&typeof E.api.inspect==='function'&&E.api.on(),'전역 __STORYWORLD_HWANDO_ILSEOM_R975__ 켜짐');
 const t0=E.now();flight(E,'wer:b1',20,20,23.8,20);E.run(.31);ok(ilseom(E).length===0,'일섬은 R590 처럼 지나간 0.32초 뒤에 시작(0.31초엔 아직)');
 E.run(.9);const h=ilseom(E),hb=h.filter(x=>x.id==='boss'),hm=h.filter(x=>x.id==='mob');
 ok(hb.length===7,'보스 7타(실제 '+hb.length+')');ok(hm.length===7,'지나온 길 위 졸개도 7타(실제 '+hm.length+')');
 ok(E.hits.filter(x=>x.s&&x.s.r590==='flash').length===0,'R590 한 방 일섬 피해는 R975 가 넘겨받아 따로 안 들어감(이중 피해 없음)');
 const times=[...new Set(h.map(x=>+x.t.toFixed(4)))];ok(times.length===7,'타격 시점 7개');
 for(const tt of times){const at=h.filter(x=>Math.abs(x.t-tt)<1e-6);ok(at[0].id==='boss','같은 타격 안에서 보스를 먼저 때림 @'+(tt-t0).toFixed(2));}
 const gaps=times.slice(1).map((v,i)=>v-times[i]);ok(gaps.every(d=>d>=.05&&d<=.1),'타 간격 0.05~0.1초(실제 '+gaps.map(d=>d.toFixed(3)).join(',')+')');
 ok(times[6]-t0<=.32+.6+.02,'7타가 일섬 시작 뒤 0.6초 안에 끝남');
 ok(Math.abs(sum(h,'boss')-100*E.a590.config.flashMult)<EPS,'보스 총피해 = 공격력×'+E.a590.config.flashMult+'(기존 일섬과 같게 나눔), 실제 '+sum(h,'boss').toFixed(3));
 ok(Math.abs(sum(h,'mob')-100*E.a590.config.flashMult)<EPS,'졸개 총피해도 기존과 같음');
 ok(hb[6].v>hb[0].v,'7타(마무리)가 앞 타보다 무겁다');
 ok(h.every(x=>x.s.attackKind9==='skill'&&x.s.sourceHero==='hwando'&&x.s.sourceSlot==='e'&&x.s.r975Multi===true&&x.s.multiHit&&x.s.multiHit.n===7),'hitEnemy 표지: skill·hwando·e·r975Multi·multiHit{i,n:7}');
 ok(hb.map(x=>x.s.multiHit.i).join()==='1,2,3,4,5,6,7','multiHit.i 1~7 차례');
 ok(E.ctx.player.x===20&&E.ctx.player.y===20,'영웅 위치를 옮기지 않음(E 돌진 불변)');
 const S=E.sounds.filter(s=>/^r975Ilseom/.test(s.k));ok(S.map(s=>s.k).join()==='r975Ilseom1,r975Ilseom2,r975Ilseom3,r975Ilseom4,r975Ilseom5,r975Ilseom6,r975Ilseom7','타마다 효과음 1개씩 7개 차례');
 ok(S.every((s,i)=>Math.abs(s.t-times[i])<1e-6),'효과음은 그 타격과 같은 순간');
 const cuts=E.api.inspect().lastCuts;ok(Array.isArray(cuts)&&cuts.length===7&&cuts.every((c,i)=>c.dir===(i%2?-1:1)),'베기 방향 좌·우 번갈아(+1,-1,…) 7번');
 ok(cuts.every(c=>c.target==='boss'),'베기 연출은 보스 자리에');
 const st=E.api.inspect().stats;ok(st.casts===1&&st.bossFirst===1&&st.errors===0,'통계: 시전 1·보스 우선 1·오류 0');}

// 2) 중간보스(midboss)도 보스로 친다
{const E=engine({enemies:[{id:'mid',x:24.5,y:22,midboss:true}]});flight(E,'wer:m1',20,20,23.8,20);E.run(1.3);
 ok(ilseom(E).filter(x=>x.id==='mid').length===7,'중간보스도 범위 안이면 우선 7타');}
// 3) 사용자 02:17Z "7번베기는 보스나 중간보스한테만 발동하는거야 일반몹한테는 그전처럼 나가고"
//    → 범위 안에 보스가 없으면 R590 원래 한 방 일섬(길 위 적 ×0.6, 한 번)
{const E=engine({enemies:[{id:'mob',x:22,y:20.3},{id:'boss',x:30,y:20,boss:true}]});flight(E,'wer:far',20,20,23.8,20);E.run(1.3);
 const f=E.hits.filter(x=>x.s.r590==='flash');ok(ilseom(E).length===0,'범위 밖 보스·일반몹뿐: 7타 없음');
 ok(f.length===1&&f[0].id==='mob'&&Math.abs(f[0].v-60)<EPS,'일반몹은 그전처럼 한 방 일섬(×0.6)');
 ok(E.sounds.filter(s=>/^r975/.test(s.k)).length===0&&E.api.inspect().stats.casts===0,'7연 효과음·시전 기록 없음');}
{const E=engine({enemies:[{id:'m1',x:21,y:20.2},{id:'m2',x:23,y:19.8}]});flight(E,'wer:mobs',20,20,23.8,20);E.run(1.3);
 const f=E.hits.filter(x=>x.s.r590==='flash');ok(ilseom(E).length===0&&f.length===2,'일반몹 여럿: 각자 한 방씩(원래대로)');}
// 4) 벽 너머 보스는 대상 아님 — 벽 너머라 원래 일섬도 안 닿음
{const E=engine({enemies:[{id:'boss',x:16.3,y:20,boss:true}]});flight(E,'wer:wall',12,20,13.7,20);E.run(1.3);
 ok(E.hits.length===0,'벽 너머 보스는 안 맞음');}
// 5) 보스 없음·길 밖 일반몹은 원래처럼 안 맞음(7타 대상 찾기 없음)
{const E=engine({enemies:[{id:'near',x:24.6,y:21.4}]});flight(E,'wer:near',20,20,23.8,20);E.run(1.3);
 ok(E.hits.length===0,'보스가 없으면 길 밖 일반몹을 따로 찾아 때리지 않음');}
{const E=engine({enemies:[{id:'nobody',x:30,y:30}]});flight(E,'wer:none',20,20,23.8,20);E.run(1.3);
 ok(E.hits.length===0&&E.sounds.filter(s=>/^r975/.test(s.k)).length===0,'대상이 없으면 피해·효과음 없음');}
// 6) 보스가 중간에 죽으면 다음 대상으로, 오류 없이
{const E=engine({enemies:[{id:'boss',x:25,y:21,boss:true,hp:20},{id:'mob',x:22,y:20.2}]});flight(E,'wer:die',20,20,23.8,20);E.run(1.3);
 const hb=ilseom(E).filter(x=>x.id==='boss'),hm=ilseom(E).filter(x=>x.id==='mob');ok(hb.length>=1&&hb.length<7,'보스가 죽으면 더 안 때림(실제 '+hb.length+'타)');
 ok(hm.length===7&&E.api.inspect().stats.errors===0,'남은 졸개는 7타 다 받음, 오류 0');
 ok(E.api.inspect().lastCuts.slice(hb.length).every(c=>c.target==='mob'),'보스가 죽은 뒤 베기 연출은 졸개 자리로');}
// 7) 방이 바뀌면 남은 타 취소
{const E=engine({enemies:[{id:'boss',x:25,y:21,boss:true}]});flight(E,'wer:room',20,20,23.8,20);E.run(.4);const k=ilseom(E).length;
 E.g.room={id:'other',props:[],enemies:[]};E.ctx.room=E.g.room;E.run(1);ok(k>=1&&ilseom(E).length===k,'방이 바뀌면 남은 타 취소('+k+'타에서 멈춤)');}
// 8) 협동이면 R590 처럼 피해 없음
{const E=engine({coop:'host',enemies:[{id:'boss',x:25,y:21,boss:true}]});flight(E,'wer:coop',20,20,23.8,20);E.run(1.3);
 ok(E.hits.length===0,'협동(R62 mode≠off): 피해 없음');}
// 9) 끄기: R975 를 끄면 R590 원래 한 방 일섬 그대로(보스 우선 없음)
{const E=engine({off:true,enemies:[{id:'mob',x:22,y:20.3},{id:'boss',x:25.6,y:21.2,boss:true}]});flight(E,'wer:off',20,20,23.8,20);E.run(1.3);
 const f=E.hits.filter(x=>x.s.r590==='flash');ok(ilseom(E).length===0&&f.length===1&&f[0].id==='mob'&&Math.abs(f[0].v-60)<EPS,'끄면 R590 원래 일섬(길 위 한 방 ×0.6)');}
{const E=engine({no975:true,enemies:[{id:'mob',x:22,y:20.3}]});flight(E,'wer:no',20,20,23.8,20);E.run(1.3);
 ok(E.hits.filter(x=>x.s.r590==='flash').length===1,'R975 가 없으면 R590 원래대로');}
// 10) 같은 시전은 한 번만, 그리기 값 NaN 없음, 그림 시트 사용
{const E=engine({enemies:[{id:'boss',x:25.6,y:21.2,boss:true}]});flight(E,'wer:d1',20,20,23.8,20);flight(E,'wer:d1',20,20,23.8,20);
 let drew=0;for(let i=0;i<120;i++){E.adv(.01);drew+=E.frame();if(E.draws.some(d=>d==='sheet:hwando-e-delayed-flash.webp'))E.g.__sheet=1;}
 ok(ilseom(E).length===7,'같은 castId 는 한 번만(7타)');ok(drew>0&&E.g.__sheet===1,'베기는 Dots 일섬 시트(hwando-e-delayed-flash)로 그림');
 ok(!E.g.__nan,'그리기 호출에 NaN·Infinity 없음');
 const rs=E.g.__rot.filter(Number.isFinite);ok(rs.some(a=>Math.cos(a)>0)&&rs.some(a=>Math.cos(a)<0),'화면에서 오른쪽·왼쪽 두 방향 베기가 모두 그려짐');}
{const E=engine({enemies:[{id:'boss',x:NaN,y:21,boss:true},{id:'mob',x:22,y:20.2}]});flight(E,'wer:nan',20,20,23.8,20);for(let i=0;i<120;i++){E.adv(.01);E.frame();}
 ok(!E.g.__nan&&E.api.inspect().stats.errors===0&&ilseom(E).every(x=>x.id==='mob'),'좌표가 이상한 적은 건너뜀(NaN 그리기 없음)');}
// 11) 효과음 프로필 등록(종류마다 따로 → 엔진 같은 종류 간격 제한에 막히지 않음)
{const E=engine();const P=E.g.soundProfiles;ok([1,2,3,4,5,6,7].every(i=>Array.isArray(P['r975Ilseom'+i])&&P['r975Ilseom'+i].length===1&&P['r975Ilseom'+i][0].path==='assets/r975/sfx/ilseom-'+i+'.ogg'),'soundProfiles r975Ilseom1~7 등록');}
// 12) 2~6타의 엔진 적중 섬광(burst·e568HeroImpact·pxfSprite)은 걷어 냄 — 첫 타·마무리만 남김, 피(r190-blood)는 그대로
{const E=engine({enemies:[{id:'boss',x:25.6,y:21.2,boss:true}]});const H0=E.ctx.hitEnemy;E.g.hitEnemy=function(e,v,s){const r=H0(e,v,s);E.g.effects.push({type:'burst',i:s?.multiHit?.i},{type:'r190-blood',i:s?.multiHit?.i});return r;};
 flight(E,'wer:fx',20,20,23.8,20);const seen=[];for(let i=0;i<130;i++){E.adv(.01);for(const f of E.g.effects)if(f.i&&!seen.includes(f))seen.push(f);}
 const bursts=seen.filter(f=>f.type==='burst').map(f=>f.i),blood=seen.filter(f=>f.type==='r190-blood').map(f=>f.i);
 ok(bursts.join()==='1,7','적중 섬광은 1타·7타만 남음(실제 '+bursts.join()+')');ok(blood.length===7,'피 효과 7개 그대로');
 ok(E.api.inspect().stats.hushed===5,'걷어 낸 섬광 5개');}
{const E=engine({enemies:[{id:'boss',x:25.6,y:21.2,boss:true}]});flight(E,'wer:top',20,20,23.8,20);E.run(.33);E.g.effects.push({type:'burst'});E.adv(.01);
 ok(E.g.effects[E.g.effects.length-1].r975Sentinel===true,'베기 그리기 표지는 effects 맨 끝(적중 섬광 위)');}
console.log('R975 hwando ilseom CPU check: '+n+' passed');
