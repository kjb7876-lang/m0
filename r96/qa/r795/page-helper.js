// R795 영웅 전수 점검 — 페이지 안 도우미(게임 전역을 읽기만 하고, 시간은 tick(1/60) 을 직접 돌려 실제보다 빠르게 흘린다).
(()=>{'use strict';
if(window.__HQ795)return;
const NUM=['x','y','hp','attackCD','attackAnim','skillAnim','blinkCD','specialCD','invincible','parry','ego','egoCD','samong','samongCD','grazeGuard','counter','resonance','shield','combo'];
const viol=[],seen=new Set();let tag='',errSeen=0,ticks=0;
const push=(k,d)=>{const key=tag+'|'+k;if(seen.has(key))return;seen.add(key);viol.push({at:tag,k,d,t:+time.toFixed(2)});};
const dummyMove=(dx,dy,from)=>{const d={x:(from||player).x,y:(from||player).y};try{moveActor(d,dx,dy);}catch(e){return -1;}return Math.hypot(d.x-(from||player).x,d.y-(from||player).y);};
const arrows=()=>{const sx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),sy=(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0);if(!sx&&!sy)return null;const v=norm(sx+2*sy,2*sy-sx);return v;};
const statusLabels=()=>{const out=[];try{for(const k of ['__STORYWORLD_FOUR_ELEMENTS_R61__','__STORYWORLD_REGION_AFFLICTIONS_R58__','__STORYWORLD_HOSPITAL_WOUNDS_R53__'])for(const r of (window[k]?.statusRows?.()||[]))out.push(String(r.key||r.kind||r.label||'?'));}catch(_){}if(player.storyStatus150)out.push('story150:'+(player.storyStatus150.kind||player.storyStatus150.key||'?'));if(Number(player.heroSlowUntil150)>time)out.push('slow150');return out;};
// 이동 잠금 감시: 방향키를 누르고 있는데 0.6초 동안 0.25칸도 못 가고, 같은 자리의 허수 몸은 갈 수 있을 때.
const lock={since:null,x:0,y:0,rows:[]};
function watchLock(){const v=arrows();if(!v||modal||loading||player.hp<=0){lock.since=null;return;}
 if(lock.since===null){lock.since=time;lock.x=player.x;lock.y=player.y;return;}
 const moved=Math.hypot(player.x-lock.x,player.y-lock.y);
 if(moved>.25){lock.since=time;lock.x=player.x;lock.y=player.y;return;}
 if(time-lock.since>.6){const free=dummyMove(v.x*.4,v.y*.4);if(free>.2){let bound=false;try{bound=!!window.__STORYWORLD_COMBAT_R137__?.bound?.()||!!window.__STORYWORLD_PAINTED_VFX_R87__?.inspect?.().binding;}catch(_){}
   const row={at:tag,t:+time.toFixed(2),dur:+(time-lock.since).toFixed(2),bound,status:statusLabels(),skillAnim:+player.skillAnim.toFixed(2),attackAnim:+player.attackAnim.toFixed(2),guard:player.guard,pos:[+player.x.toFixed(2),+player.y.toFixed(2)],hero:player.hero};
   const last=lock.rows[lock.rows.length-1];if(last&&last.at===tag&&row.t-last.t<1.2){last.dur=+(last.dur+(row.t-last.t)).toFixed(2);last.t=row.t;}else lock.rows.push(row);}
  lock.since=time;lock.x=player.x;lock.y=player.y;}}
const seenF={aa:false,sa:false,shots:0};
function hudCd(k){try{updateHUD();}catch(_){}const el=k==='q'?document.getElementById('specialCD'):document.getElementById('story-wer-'+k)?.querySelector('.cd');const t=String(el?.textContent||'').trim();return t===''?0:(parseFloat(t)||0);}
function inv(){ticks++;if(player.attackAnim>0)seenF.aa=true;if(player.skillAnim>0)seenF.sa=true;for(const k of NUM)if(!Number.isFinite(player[k]))push('nan:'+k,String(player[k]));
 if(player.hp>maxHP()+1e-6)push('hp>max',player.hp+'>'+maxHP());
 if(player.resonance>100+1e-6||player.resonance<-1e-6)push('resonance-range',player.resonance);
 for(const k of ['attackCD','attackAnim','skillAnim','blinkCD','specialCD','invincible','ego','egoCD'])if(player[k]<0)push('neg:'+k,player[k]);
 if(errors.length>errSeen){for(const e of errors.slice(errSeen))push('engine-error',String(e).slice(0,300));errSeen=errors.length;}
 if(ticks%20===0){try{if(blocked(player.x,player.y,.2))push('inside-solid',[player.x,player.y].map(v=>+v.toFixed(2)).join());}catch(_){}}
 watchLock();}
function step(sec,drawEvery=6){const n=Math.round(sec*60),t0=time;let stoppedBy=null;for(let i=0;i<n;i++){if(modal){stoppedBy='modal';break;}if(loading){stoppedBy='loading';break;}if(player.hp<=0){stoppedBy='dead';break;}
  watchDmg();try{tick(1/60);}catch(e){push('tick-throw',String(e&&e.stack||e).slice(0,400));stoppedBy='throw';break;}inv();watchDmg();
  if(i%drawEvery===0){try{draw();}catch(e){push('draw-throw',String(e&&e.stack||e).slice(0,400));}}}
 return {dt:+(time-t0).toFixed(3),stoppedBy};}
function sweep(){const r={};for(const k of Object.keys(window)){if(!/^__STORYWORLD|^__HAPIL/.test(k))continue;const o=window[k];if(!o||typeof o!=='object')continue;let ins=null;try{ins=typeof o.inspect==='function'?o.inspect():null;}catch(e){r[k]={e:'inspect-throw',le:String(e).slice(0,160)};continue;}
  let st=ins&&ins.stats||o.stats;if(typeof st==='function'){try{st=st.call(o);}catch(_){st=null;}}
  const e=(st&&st.errors)??(ins&&ins.errors);let le=(ins&&ins.lastError)||o.lastError||(st&&st.lastError);if(typeof le==='function')le=null;
  const n=typeof e==='number'?e:Array.isArray(e)?e.length:0;if(n>0||le)r[k]={e:n,le:le?String(typeof le==='object'?JSON.stringify(le):le).slice(0,200):null};}
 return r;}
const snap=()=>({hero:player.hero,x:+player.x.toFixed(3),y:+player.y.toFixed(3),dir:player.direction,moving:!!player.moving,attackCD:+player.attackCD.toFixed(3),attackAnim:+player.attackAnim.toFixed(3),skillAnim:+player.skillAnim.toFixed(3),specialCD:+player.specialCD.toFixed(3),blinkCD:+player.blinkCD.toFixed(3),guard:!!player.guard,ego:+player.ego.toFixed(3),egoCD:+player.egoCD.toFixed(3),res:+player.resonance.toFixed(2),hp:+player.hp.toFixed(2),maxHp:maxHP(),shield:+player.shield.toFixed(2),inv:+player.invincible.toFixed(3),combo:player.combo,keys:[...keys],auto:!!auto,guide:!!guide,command,route:route.length,shots:projectiles.filter(b=>b.friendly).length,eshots:projectiles.filter(b=>!b.friendly).length,fx:effects.length,t:+time.toFixed(3),zone,layer,modal:!!modal,loading:!!loading,level:player.level,points:player.points,
 wer:(()=>{const o={};for(const s of ['w','e','r']){const v=player.storyWER?.ready?.[player.hero+':'+s];o[s]=v==null?null:+(v-time).toFixed(2);}return o;})(),
 ranks:(()=>{try{return window.__STORYWORLD_SKILL_GROWTH_R663__.inspect().ranks;}catch(_){return null;}})()});
// 열린 자리: 여덟 방향으로 2.4칸씩 갈 수 있고 가장 가까운 적이 minEnemy 칸보다 먼 곳.
const DIRS8=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]].map(([a,b])=>{const m=Math.hypot(a,b);return [a/m,b/m];});
const openAt=(x,y,reach=2.4)=>{if(blocked(x,y,.3))return false;for(const [dx,dy] of DIRS8){const d=dummyMove(dx*reach,dy*reach,{x,y});if(d<reach*.9)return false;}return true;};
const nearestLive=(x,y)=>{let best=Infinity;for(const e of room.enemies)if(e.hp>0)best=Math.min(best,Math.hypot(e.x-x,e.y-y));return best;};
function findOpen(minEnemy=13,maxR=40){const ox=player.x,oy=player.y;for(let r=0;r<=maxR;r+=1.5)for(let a=0;a<16;a++){const x=ox+Math.cos(a*Math.PI/8)*r,y=oy+Math.sin(a*Math.PI/8)*r;if(openAt(x,y)&&nearestLive(x,y)>minEnemy)return {x,y};if(r===0)break;}return null;}
function placeNear(e,d){for(let k=0;k<24;k++){const a=k*Math.PI/12+.3,x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d;if(!blocked(x,y,.3)&&clearLine({x,y},e)&&dummyMove(.3,0,{x,y})>=0)return {x,y};}return null;}
// 적 옆 자리 잡기: 가까운 순서로, 자리를 옮긴 뒤에도 그 적이 방에 남아 있는 것만(R383 뿌리 추적자처럼 멀어지면 사라지는 몹 제외).
function engage(melee,skip){const h=HEROES[player.hero],d0=melee?Math.min(1.7,h.range*.55):Math.min(5,h.range*.6);const pool=room.enemies.filter(e=>e.hp>0&&!e.boss&&!e.r170Tower&&e.visible!==false&&!['hidden','inactive','disabled','despawned'].includes(e.spawnState)&&!/r383|summon/i.test(String(e.id))&&!(skip||[]).includes(e.id));pool.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 for(const e of pool.slice(0,12)){const q=placeNear(e,d0)||placeNear(e,d0+.8)||placeNear(e,d0+1.6);if(!q)continue;tp(q);target=e.id;return {id:e.id,d:+Math.hypot(e.x-q.x,e.y-q.y).toFixed(2),name:e.name};}return null;}
/* 붙을 몹을 못 찾았을 때 왜인지 본 그대로 적는다(읽기만 함): 살아 있는 잡몹 수, 거름 조건별로 빠진 수, 남은 후보 수, 가까운 후보 6마리에 설 자리가 있었는지 */
function engageWhy(melee){const h=HEROES[player.hero],d0=melee?Math.min(1.7,h.range*.55):Math.min(5,h.range*.6);const live=room.enemies.filter(e=>e.hp>0&&!e.boss);
 const hid=e=>e.visible===false||['hidden','inactive','disabled','despawned'].includes(e.spawnState),sum=e=>/r383|summon/i.test(String(e.id));
 const pool=live.filter(e=>!e.r170Tower&&!hid(e)&&!sum(e));pool.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
 return {live:live.length,tower:live.filter(e=>e.r170Tower).length,hidden:live.filter(hid).length,summon:live.filter(sum).length,pool:pool.length,
  nearest:pool.slice(0,6).map(e=>({id:String(e.id).slice(-26),d:+Math.hypot(e.x-player.x,e.y-player.y).toFixed(1),spot:!!(placeNear(e,d0)||placeNear(e,d0+.8)||placeNear(e,d0+1.6)),state:e.spawnState||null})),zone:typeof zone==='string'?zone:null};}
const still=id=>{const e=room.enemies.find(v=>v.id===id);return !!e&&e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<HEROES[player.hero].range+3;};
function pickEnemy(){const pool=room.enemies.filter(e=>e.hp>0&&!e.boss&&e.visible!==false&&!['hidden','inactive','disabled','despawned'].includes(e.spawnState));pool.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));return pool[0]||null;}
const tp=(q)=>{player.x=q.x;player.y=q.y;route=[];command=null;};
/* 피해 재기: 몹 HP 합계는 싸움 중 새로 나오는 몹(R383 뿌리 등) 때문에 늘 수 있다 → 틱마다 몹별 HP 감소만 모은다.
   enemyHpSum() 은 '−누적 피해'를 돌려준다(앞뒤 값의 차 = 그 사이에 준 피해). */
const hpSeen=new WeakMap();let dmgTotal=0;
function watchDmg(){for(const e of room.enemies||[]){const now=Math.max(0,+e.hp||0),was=hpSeen.get(e);if(was!==undefined&&now<was)dmgTotal+=was-now;hpSeen.set(e,now);}}
const enemyHpSum=()=>{watchDmg();return -dmgTotal;};
/* 영웅 몸 그림 확인: draw() 동안 전역 ctx 는 기록기(명령 목록)로 바뀌므로 CanvasRenderingContext2D 원형을 엿봐도 안 잡힌다.
   drawHero 를 잠깐 감싸 그 순간의 ctx.drawImage(인스턴스에 얹힌 것 포함)를 엿본다(qa/r444/fcensus 와 같은 방식).
   그리기는 실제 시간 간격을 두는 덧씌우기가 있어 80ms 쉬고 부른다. */
async function heroDrawn(){await new Promise(r=>setTimeout(r,80));const map=new Map();for(const [k,row] of imageCache)if(row.image)map.set(row.image,k);const seen=[];let n=0,calls=0;
 const base=drawHero;drawHero=function(...a){calls++;const c=ctx;if(!c||typeof c.drawImage!=='function')return base.apply(this,a);const own=Object.prototype.hasOwnProperty.call(c,'drawImage')?c.drawImage:null,f=c.drawImage;
  c.drawImage=function(im,...q){n++;const k=map.get(im)||(im&&typeof im.src==='string'?im.src:'');if(k)seen.push(k);return f.call(this,im,...q);};
  try{return base.apply(this,a);}finally{if(own)c.drawImage=own;else delete c.drawImage;}};
 try{draw();}finally{drawHero=base;}
 const h=player.hero,low=seen.map(k=>k.toLowerCase());
 return {calls,n,hero:[...new Set(low.filter(k=>k.includes(h)))].slice(0,4),others:[...new Set(low.filter(k=>/hero/.test(k)&&!k.includes(h)).map(k=>(k.match(/(hwando|seoha|neon|michaela|lauren|hunter|slayer|gunner)/)||[])[1]).filter(Boolean))],pose:heroPose()};}
window.__HQ795={engage,engageWhy,still,heroDrawn,hudCd,seenF,resetSeen(){seenF.aa=false;seenF.sa=false;},viol,lock,step,sweep,snap,findOpen,placeNear,pickEnemy,tp,enemyHpSum,dummyMove,DIRS8,openAt,nearestLive,statusLabels,setTag:t=>{tag=t;lock.since=null;},drain(){const v=viol.splice(0),l=lock.rows.splice(0);return {viol:v,locks:l};}};
})();
