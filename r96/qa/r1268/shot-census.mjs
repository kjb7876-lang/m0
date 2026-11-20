// R1268 몹 '걸으며 쏘기' 전수 — 지역마다 영웅이 원을 그리며 걷고(무적), 새로 생긴 적 투사체마다 쏜 적이 직전 0.1초 안에 걸었는지(틱 전체 이동 초당 0.6칸 넘음) 센다.
//  공격 중 미끄러짐: 몹(보스 제외)이 공격·윈드업 중인 틱(시작·끝 틱 제외, 영웅 타격 넉백 틱 제외)에 옮겨 간 횟수 slideMoved.
//  판정은 탄이 만들어지는 순간(makeShot)에 한다(나중에 세면 쏜 뒤 걸음이 섞임). 걸으며 쏜 탄은 makeShot 호출 스택의 오버레이 파일 이름으로 어느 경로인지 묶는다. 헤드리스 소프트웨어 렌더링 결과.
import {chromium,boot,go} from '../r444/lib.mjs';
const ZONES=(process.env.ZONES||'cult03,kair04,dist01,last302,murder03,dist05,ep1b03').split(',');const SEC=+(process.env.SEC||10);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
if(process.env.PIN==='0')await p.evaluate(()=>window.__STORYWORLD_STILL_ATTACK_R1268__.set({pin:false}));
await p.evaluate(()=>{const W=window.__SC={};const pos=new Map();
 const base=tick;window.tick=tick=function(dt){const r=base.apply(this,arguments);if(W.on){for(const e of room.enemies||[]){if(!(e.hp>0))continue;const L=pos.get(e);if(L&&Math.hypot(e.x-L.x,e.y-L.y)/Math.max(dt,1e-3)>.6)e.__scMove=time;if(L&&!e.boss&&(e.attack||e.rangedWindup>0)&&L.atk&&e.__scHitAt!==time){const d=Math.hypot(e.x-L.x,e.y-L.y);W.slide=(W.slide||0)+d;W.slideTicks=(W.slideTicks||0)+1;if(d>.004)W.slideMoved=(W.slideMoved||0)+1;}pos.set(e,{x:e.x,y:e.y,atk:!!(e.attack||e.rangedWindup>0)});}player.hp=player.maxHp=1e9;}return r};
 const he=hitEnemy;window.hitEnemy=hitEnemy=function(e){try{e.__scHitAt=time}catch(_){}return he.apply(this,arguments)};
 const mk=makeShot;window.makeShot=makeShot=function(){const n0=projectiles.length;const r=mk.apply(this,arguments);try{if(W.on){const st=new Error().stack;for(const s of projectiles.slice(n0)){if(s.friendly)continue;s.__scStack=st;const o=room.enemies.find(e=>e.id===s.owner||e===s.owner);s.__scWalked=!!o&&time-(o.__scMove??-9)<.1;}}}catch(_){}return r};});
const out=[];
for(const z of ZONES){try{await go(p,z);}catch(e){console.log('skip',z);continue}
 await p.evaluate(()=>{const W=window.__SC;W.on=true;W.slide=0;W.slideTicks=0;W.slideMoved=0;W.seen=new WeakSet();W.n=0;W.walk=0;W.by={};W.ex=[];W.noOwner=0;room.engaged=true;player.invincible=1e9;
  const e=liveEnemies().filter(e=>!e.boss).sort((a,b)=>distance(a,player)-distance(b,player))[0];if(e){player.x=e.x-2.5;player.y=e.y;}W.cx=player.x;W.cy=player.y;
  W.iv=setInterval(()=>{for(const b of projectiles){if(b.friendly||W.seen.has(b))continue;W.seen.add(b);W.n++;const o=room.enemies.find(e=>e.id===b.owner||e===b.owner);if(!o){W.noOwner++;continue}
    if(b.__scWalked){W.walk++;const src=(b.__scStack||'').split('\n').slice(2,16).map(l=>{const f=l.match(/m0\/([\w.-]+\.js):(\d+)/);const fn=l.match(/at ([\w.$]+)/);return (fn?fn[1]:'?')+'@'+(f?f[1]:'html:'+((l.match(/:(\d+):\d+\)?$/)||[])[1]))});const key=src.join('>')||'?';W.by[key]=(W.by[key]||0)+1;if(W.ex.length<3)W.ex.push(o.name+' '+o.ai+' atk='+!!o.attack+' rw='+(+o.rangedWindup||0).toFixed(2)+' st='+o.state)}}
   const a=time*.9;for(const k of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'])keys.delete(k);const k=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'][Math.floor(time/.8)%4];keys.add(k);},16);});
 const t0=await p.evaluate(()=>time);for(let i=0;i<900;i++){const t=await p.evaluate(()=>{if(storyScene)for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);return time});if(t>t0+SEC)break;await p.waitForTimeout(150);}
 const r=await p.evaluate(()=>{const W=window.__SC;clearInterval(W.iv);keys.clear();W.on=false;return {slide:+W.slide.toFixed(3),slideTicks:W.slideTicks,slideMoved:W.slideMoved,n:W.n,walk:W.walk,noOwner:W.noOwner,by:W.by,ex:W.ex}});out.push({z,...r});console.log(JSON.stringify({z,...r}));}
await b.close();const tot=out.reduce((a,x)=>({n:a.n+x.n,walk:a.walk+x.walk,slide:+(a.slide+x.slide).toFixed(3),slideMoved:a.slideMoved+x.slideMoved,slideTicks:a.slideTicks+x.slideTicks}),{n:0,walk:0,slide:0,slideMoved:0,slideTicks:0});console.log('SUM',JSON.stringify(tot));
if(process.env.PIN!=='0'&&(tot.walk>0||tot.slideMoved>0)){console.log('RESULT FAIL 걸으며 쏜 탄',tot.walk);process.exit(1)}console.log(tot.n>0?'RESULT PASS':'RESULT FAIL 탄 없음');process.exit(tot.n>0?0:1);
