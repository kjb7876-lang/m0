// R981 — 불면귀 중간보스와 본체 구분(사용자 2026-11-13 "갈리지 않게 중간보스 이름이나 연출을 손봐").
//  잠들지 못하는 마을(last302)의 중간보스(mb-last302-v31231)가 '검은 안개 심장 · 불면의 기억'이라 다음 지역(last303) 본체 '불면귀'와
//  같은 보스가 두 번 나오는 것처럼 보였다(이름에 불면·심장·기억, 그림도 호박색 눈 한 점·보라 핵·겹 잔상 = 본체 표식).
//  정본 34장은 주민들이 "보이지 않는 실에 끌리듯" 달려들고 영웅이 "그 몸들을 조종하는 힘이 어디서 오는지" 찾는 데서 끝난다 → 그 힘을 맡는 전조로 바꾼다.
//  · 이름: '꼭두각시 실안개'(꼭두각시 = 실로 놀리는 우리 인형극, 실안개 = 엷은 안개이자 '실'). 불면·심장·기억 낱말을 뺐다.
//    방 자료의 id·nativeId·그림 경로·수치·웨이브·저장은 그대로, 이름만(R385 와 같은 방식). 효과 키 r248Key 는 옛 이름.
//  · 색: 몸(R764 Dots 시트·엔진 4자세·죽음 시트)을 그리는 동안만 회백색으로(grayscale·brightness·contrast — 3D 기록기가 받는 필터만).
//    본체의 호박색 눈빛·보라 핵이 사라져 '형체 없는 안개'로 읽힌다. 본체만의 겹 잔상(R760 1겹)도 뗀다.
//  · 실: 몸에서 둘레 주민(잠식된 주민 몹) 가장 가까운 여섯에게 가는 실이 흔들리며 이어진다(정본 34장 "보이지 않는 실").
//  · 자막: 처음 모습을 드러낼 때·쓰러질 때 짧은 토스트(정본 문장은 고치지 않음, 게임 안내 글).
//  판정·피해·체력·AI·패턴·효과음 종류는 그대로. 끄기: localStorage['storyworld.r981.puppet']='{"on":false}'. 점검: window.__STORYWORLD_PUPPET_R981__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_PUPPET_R981__)return;
const REV='R981-puppet-1',KEY='storyworld.r981.puppet',ZONE='last302',NID='mb-last302-v31231';
const NAME='꼭두각시 실안개',OLD=/검은 안개 심장 · 불면의 기억|검은 안개 심장|불면의 기억/;
const FILTER='grayscale(1) brightness(1.22) contrast(.9)';
const CAP_IN=NAME+' — 주민들을 끌던 보이지 않는 실이 한데 엉긴 안개다.',CAP_OUT='실이 끊기자 안개가 흩어져 포구 너머로 흘러간다.';
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={renamed:0,draws:0,filtered:0,threads:0,ghostsDropped:0,deathTint:0,captions:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const clamp=(v,a,b)=>fin(v)?Math.max(a,Math.min(b,v)):a;
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const zoneNow=()=>{try{return String(room?.id||'');}catch(_){return '';}};
const isMid=e=>!!e&&typeof e==='object'&&!e.hero&&String(e.nativeId||'')===NID;
const plain=s=>String(s||'').replace(/^중간보스 · /,'').replace(/ (\d+|증원|추격대|우두머리|후속 증원)$/,'');
// ── 이름 ──
function rename(e){if(!prefs.on||!isMid(e))return false;const n=String(e.name||'');if(!OLD.test(n))return false;
 if(!e.r981From)e.r981From=n;if(!e.r248Key)e.r248Key=plain(n);
 const pre=/^중간보스 · /.test(n)?'중간보스 · ':'';e.name=pre+NAME;if(typeof e.r373Name==='string')e.r373Name=NAME;stats.renamed++;return true;}
function applyRoom(r){try{if(r&&Array.isArray(r.enemies))for(const e of r.enemies)rename(e);}catch(err){fail(err);}return r;}
let roomOn=false;
function installRoom(){if(roomOn)return true;if(typeof makeRoom!=='function')return false;if(makeRoom.__r981)return roomOn=true;const base=makeRoom;
 const w=function(id,...a){const r=base.call(this,id,...a);return id===ZONE?applyRoom(r):r;};for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r981=true;
 try{makeRoom=w;}catch(_){}try{window.makeRoom=w;}catch(_){}return roomOn=true;}
// R306 픽셀 그림 모드는 'STORY|nativeId|이름' 열쇠로 그림을 찾는다 → 새 이름 열쇠를 옛 이름과 같은 그림에 잇는다.
function aliasR306(){try{const D=window.__STORYWORLD_MOB_ART_VARIANTS_R306_DATA__;if(!D||!D.actors||Object.isFrozen(D.actors))return;
 for(const k of Object.keys(D.actors)){const m=/^(STORY|DREAM)\|mb-last302-v31231\|(.+)$/.exec(k);if(m&&OLD.test(m[2])){const nk=m[1]+'|'+NID+'|'+NAME;if(!(nk in D.actors))D.actors[nk]=D.actors[k];}}}catch(err){fail(err);}}
// ── 색: 이 몸을 그리는 동안만 ctx.drawImage 에 회백 필터를 덧붙인다(R199 와 같은 방식 — 다른 덧씌우기가 sprite·drawAssetFrame3 을 붙잡아 둬도 탐) ──
// 몸 그림만(엔진 4자세 mb-last302-v31231-p1~p4·원본 bulmyeongwi_b·R764 시트 r760/mid) — 붉은 적 테두리·바닥 고리(캔버스)는 그대로 둬 적 읽기를 지킨다.
const BODY=/mb-last302-v31231|bulmyeongwi_b\.|assets\/r760\/mid\//;
const srcOf=im=>{try{return String(im?.currentSrc||im?.src||im?.sourcePath||'');}catch(_){return '';}};
const compose=f=>f&&f!=='none'?f+' '+FILTER:FILTER;
function tinted(fn,self,args){const c=typeof ctx!=='undefined'?ctx:null;if(!c||typeof c.drawImage!=='function')return fn.apply(self,args);
 const own=Object.prototype.hasOwnProperty.call(c,'drawImage'),orig=c.drawImage;
 c.drawImage=function(...a){if(!BODY.test(srcOf(a[0])))return orig.apply(this,a);const f=this.filter;try{this.filter=compose(f);}catch(_){}stats.filtered++;try{return orig.apply(this,a);}finally{try{this.filter=f;}catch(_){}}};
 try{return fn.apply(self,args);}finally{if(own)c.drawImage=orig;else try{delete c.drawImage;}catch(_){c.drawImage=orig;}}}
// ── 실: 몸 → 둘레 주민 어깨 ──
const VILLAGER=/^l302-e[13]$/;
function tileLen(e){try{const a=project(e.x,e.y),b=project(e.x+1,e.y+1),d=Math.hypot(b.x-a.x,b.y-a.y);if(d>1e-3&&fin(d))return clamp(d,4,400);}catch(_){}return 32;}
function threads(e){if(typeof project!=='function'||typeof ctx==='undefined'||!ctx||!(e.hp>0)||e.spawnState==='hidden')return 0;
 const list=Array.isArray(room?.enemies)?room.enemies:[];const near=[];
 for(const v of list){if(!v||v===e||!(v.hp>0)||v.boss||v.midboss||v.spawnState==='hidden'||!VILLAGER.test(String(v.nativeId||'')))continue;
  const d=Math.hypot(v.x-e.x,v.y-e.y);if(fin(d)&&d<=10)near.push([d,v]);}
 if(!near.length)return 0;near.sort((a,b)=>a[0]-b[0]);
 const q=project(e.x,e.y),tl=tileLen(e),t=T();if(!fin(q?.x)||!fin(q?.y))return 0;
 const sx=q.x,sy=q.y-tl*1.45;let n=0;
 ctx.save();try{ctx.lineCap='round';
  for(const [d,v] of near.slice(0,6)){const p=project(v.x,v.y);if(!fin(p?.x)||!fin(p?.y))continue;const ex=p.x,ey=p.y-tl*.95;
   const seed=(String(v.id||'').length*7+n*13)%17,wob=Math.sin(t*1.7+seed)*tl*.18,sag=clamp(Math.hypot(ex-sx,ey-sy)*.12,2,90);
   const mx=(sx+ex)/2+wob,my=(sy+ey)/2+sag;const a=clamp(.42-d*.025+.08*Math.sin(t*2.3+seed),.12,.5);
   ctx.globalAlpha=a;ctx.strokeStyle='rgba(232,226,212,1)';ctx.lineWidth=clamp(tl*.035,1,2.4);
   ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();n++;}}
 finally{ctx.restore();}stats.threads+=n;return n;}
// ── 그리기 감싸기: 이름 다시 확인 → 실(몸 뒤) → 몸(회백) → 본체 표식인 겹 잔상(R760 r760Ghost) 떼기 ──
let wraps=0,depth=0;
function installDraw(){if(typeof drawEnemy!=='function'||drawEnemy.__r981||wraps>=6)return;const base=drawEnemy;wraps++;
 const w=function(e,...a){if(depth||!prefs.on||!isMid(e)||zoneNow()!==ZONE)return base.call(this,e,...a);depth++;try{stats.draws++;
  try{rename(e);}catch(err){fail(err);}try{threads(e);}catch(err){fail(err);}
  const cm=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st0=cm?cm.length:-1;
  const r=tinted(base,this,[e,...a]);
  if(cm&&st0>=0)try{for(let i=cm.length-1;i>=st0;i--){const k=cm[i];if(k?.r760Ghost){cm.splice(i,1);stats.ghostsDropped++;}}}catch(err){fail(err);}
  return r;}finally{depth--;}};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r981=true;try{drawEnemy=w;}catch(_){}try{window.drawEnemy=w;}catch(_){}}
// 죽음 시트(R764 drawDying → drawAssetFrame3)·엔진 죽음 불꽃도 회백으로.
let dWraps=0;
function installDeath(){if(typeof drawBurnDeath3!=='function'||drawBurnDeath3.__r981||dWraps>=6)return;const base=drawBurnDeath3;dWraps++;
 const w=function(fx,...a){if(prefs.on&&zoneNow()===ZONE&&(fx?.r981||fx?.r764?.who==='mid')){stats.deathTint++;return tinted(base,this,[fx,...a]);}return base.call(this,fx,...a);};
 for(const k of Object.keys(base))try{w[k]=base[k];}catch(_){}w.__r981=true;try{drawBurnDeath3=w;}catch(_){}}
// ── 자막: 처음 모습을 드러낼 때 · 쓰러질 때(한 번씩, 창이 떠 있으면 기다림) ──
const shown=new WeakMap();let seen=null,seenRoom=null;
function caption(){if(!prefs.on||zoneNow()!==ZONE||typeof toast!=='function')return;try{if(typeof modal!=='undefined'&&modal)return;if(typeof storyScene!=='undefined'&&storyScene)return;}catch(_){}
 // 쓰러진 적은 room.enemies 에서 빠질 수 있다(헤드리스 실측) → 마지막으로 본 중간보스를 붙잡아 둔다.
 const live=(room?.enemies||[]).find(isMid);if(live){seen=live;seenRoom=room;}const e=live||(seen&&seenRoom===room?seen:null);if(!e)return;rename(e);const s=shown.get(e)||{};
 if(!s.in&&e.spawnState==='active'&&e.hp>0&&e.visible!==false){s.in=true;toast(CAP_IN,3.4);stats.captions++;}
 else if(s.in&&!s.out&&!(e.hp>0)){s.out=true;toast(CAP_OUT,3.6);stats.captions++;
  try{if(Array.isArray(effects))for(const f of effects)if(f?.sourceId===e.id&&f.type==='enemyBurnDeath')f.r981=true;}catch(_){}}
 shown.set(e,s);}
function arm(){try{installRoom();}catch(e){fail(e);}try{installDraw();}catch(e){fail(e);}try{installDeath();}catch(e){fail(e);}aliasR306();}
arm();let tries=0;(function again(){arm();if(++tries<80&&typeof setTimeout==='function')setTimeout(again,250);})();
// R760 은 바깥 감싸기를 setTimeout 0 으로 씌운다 → 그 뒤에도 이 감싸기가 맨 바깥에 오도록 지역에 들어올 때마다 한 번 더 확인(최대 6번).
if(typeof setInterval==='function')setInterval(()=>{try{if(zoneNow()===ZONE){installDraw();installDeath();caption();}}catch(e){fail(e);}},250);
function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_PUPPET_R981__=Object.freeze({revision:REV,NAME,FILTER,CAP_IN,CAP_OUT,rename,threads,caption,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,wraps,dWraps})});
})();
