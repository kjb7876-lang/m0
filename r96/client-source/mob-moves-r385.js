// R385 — 검수 목록 v18 옮기기·대체(사용자 2026-11-07 "망각거미등 다른걸로대체및 뒷부분으로 옮기라고한것들 … 구글드라이브 잘봐서 적용",
//  "30마리밸런스바꿔도됨"). 원문 지시는 검수 목록 03·41·42·43·45·48·49·50·62·63·06(흰 가면 주사실 이동).
//  · 41 "전극을 두른 좀비 수호기사를 시체들이 되살아난 밤으로 옮기고 되살아난 수호기사로" + 18 "보라검 부활자는 그냥 삭제"
//    → dist04 의 보라검 부활자(dist04-c2) 자리를 '되살아난 수호기사'(ep1b08 b08-c1 그림)로.
//  · 03 "무너진 성의 쓰러진 수호병을 … 무너진성에는 나오지 않게"(시체들이 되살아난 밤에는 이미 '이름 잃은 전우' dist04-s1 이 있음)
//    → dist03 의 쓰러진 수호병(dist03-s1)을 같은 지역의 피냄새 추적자(dist03-g1) 그림·이름으로.
//  · 42·43 "역십자가 들어간 이름은 다 흑마법사쪽으로" → ep1b08 이름만(인계 제안명 흑마법사의 저주창·흑마법사의 시체경호체).
//  · 48·49·50 "잔인한구원 02 03 04 뒤에 카이로노미콘이나 컬트쪽에 … 기계화를 이름앞에" → cult01·kair07·cult02 R74 순찰 자리에 기존 그림으로.
//  · 45 "03번 몹 뒤에 컬트쪽으로"(ep1b09 b09-c1 원래 그림) → cult05 순찰 자리.
//  · 62·63 "203 01-03 뒷쪽 컬트쪽에 … 기존01-03 두개의성에도" → cult03·hando01~03 순찰 자리(u203 e1·e2·e3 원래 그림).
//  · 06 "흰 가면의 병원/주사실 이동" → ep1a09 순찰 6마리 중 3마리를 오만의 흰 가면(ep1a10 a10-o1 원래 그림)으로.
//  방법(R112 와 같음): 방 자료의 id·nativeId·그림 경로·수치·수·웨이브·저장은 그대로 두고, 이름만 바꾸고 그리는 순간에만
//  원래 몹(nativeId·path·profile)의 그림을 빌려 온다(R81 원본 보존 계약·3×10 무리 유지). storyworld.r385.moves {on:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_MOB_MOVES_R385__)return;
const REV='R385-moves-5',KEY='storyworld.r385.moves';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={rooms:0,renamed:0,draws:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const isPatrol=e=>/:r74-patrol:/.test(String(e?.id||''));
const plainName=s=>String(s||'').replace(/^중간보스 · /,'').replace(/ (\d+|증원|추격대|우두머리|후속 증원)$/,'').replace(/ (\d+|증원|추격대|우두머리|후속 증원)$/,'');
// [대상 지역, 고르기, 빌려 올 [원본 지역, nativeId], 새 이름]
const KINDS=[
 ['dist04',e=>e.nativeId==='dist04-c2',['ep1b08','b08-c1'],'되살아난 수호기사'],
 ['dist03',e=>e.nativeId==='dist03-s1',['dist03','dist03-g1'],'피냄새 추적자'],
 ['cult01',isPatrol,['u202','u202-e2'],'기계화 복종 봉인구'],
 ['kair07',isPatrol,['u202','u202-e3'],'기계화 감옥 공명기사'],
 ['cult02',isPatrol,['u202','u202-mid'],'기계화 제8단계 자비 교정관'],
 ['cult05',isPatrol,['ep1b09','b09-c1'],'설원 아래의 기계 다리'],
 ['cult03',(e,i)=>isPatrol(e)&&i%3===0,['u203','u203-e1'],'이동문 청람잔영'],['cult03',(e,i)=>isPatrol(e)&&i%3===1,['u203','u203-e2'],'이동문 공허잔영'],['cult03',(e,i)=>isPatrol(e)&&i%3===2,['u203','u203-e3'],'최종문 공명기사'],
 ['hando01',isPatrol,['u203','u203-e1'],'이동문 청람잔영'],['hando02',isPatrol,['u203','u203-e2'],'이동문 공허잔영'],['hando03',isPatrol,['u203','u203-e3'],'최종문 공명기사'],
 ['ep1a09',(e,i)=>isPatrol(e)&&i%2===0,['ep1a10','a10-o1'],'오만의 흰 가면'],
 // R386: 나태 보스가 등짐을 몸에 합친 통합 그림(사용자 채택)을 받으므로 별도 '등에 붙은 쓰레기더미'는 같은 맵의 살아 움직이는 쓰레기들로(수·수치·id 그대로)
 ['ep1b02',e=>e.nativeId==='b02-b1'&&!isPatrol(e),['ep1b02','b02-o1'],'살아 움직이는 쓰레기들']];
// R386: 주사실 순찰에 남은 유리 망령은 사용자 채택 유리 망령 v1 시트(R380 index)로 그린다 → R74 지도 그림 표시(r74Monster)를 지워야 frameFor 사슬을 탄다.
const ATLAS_OFF=[['ep1a09','glass']];
const RENAME=[['ep1b08','창처럼 날아오는 역십자가','흑마법사의 저주창'],['ep1b08','역십자가 시체경호체','흑마법사의 시체경호체']];
const SWAP=['nativeId','path','profile'];const donors=new Map();let makeBase=null,roomOn=false,drawOn=false,deathOn=false,building=0;const preloaded=new Set();
function donor(zone,nid){const k=zone+'|'+nid;if(!donors.has(k)){let d=null;building++;try{const src=(makeBase||makeRoom)(zone,'STORY');const e=src?.enemies?.find(e=>e&&e.nativeId===nid&&!isPatrol(e)&&!e.wardChampionR81);
  if(e)d={nativeId:e.nativeId,path:e.path,profile:e.profile?JSON.parse(JSON.stringify(e.profile)):e.profile,key:e.r248Key||plainName(e.r381From||e.r380From||e.name)};}catch(err){fail(err);}finally{building--;}donors.set(k,d);}return donors.get(k);}
function preload(id){if(preloaded.has(id))return;preloaded.add(id);try{const def=typeof regionById==='object'?regionById[id]:null;if(!def)return;const paths=new Set(def.paths||[]);
 for(const [z,,[sz,nid]] of KINDS){if(z!==id)continue;const d=donor(sz,nid);if(!d)continue;if(d.path)paths.add(d.path);for(const f of Object.values(d.profile?.frames||{}))if(f?.path)paths.add(f.path);}
 for(const p of paths)if(!(def.paths||[]).includes(p)&&typeof register==='function')register(p,'image','StoryWorld R385 몹 옮기기 · '+id);def.paths=[...paths];}catch(err){fail(err);}}
function apply(r,id,l){if(building||!prefs.on||!r||!Array.isArray(r.enemies)||l==='DREAM')return r;let touched=false;
 for(const [z,from,to] of RENAME)if(id===z)for(const e of r.enemies){if(!e||e.r385Renamed)continue;const n=String(e.name||'');if(!n.includes(from))continue;
  e.r385From=n;if(!e.r248Key)e.r248Key=plainName(n);e.name=n.replace(from,to);if(typeof e.r373Name==='string')e.r373Name=e.r373Name.replace(from,to);e.r385Renamed=true;stats.renamed++;touched=true;}
 const rows=KINDS.filter(k=>k[0]===id);if(rows.length){let pi=0;
  for(const e of r.enemies){if(!e||e.boss||e.r385Look)continue;const i=isPatrol(e)?pi++:-1;const k=rows.find(([,pick])=>pick(e,i));if(!k)continue;
   const [,,[sz,nid],name]=k;e.r385Look=[sz,nid];e.r385From=e.name;e.r385Key0=e.r248Key;
   // R248 은 r248Key 로 몹 그림 시트·공격 효과를 고른다 → 옮겨 온 몹의 키로 바꿔야 그 몹 그림·효과가 나온다(시트가 없으면 엔진 원래 그림을 빌림).
   const dk=donor(sz,nid)?.key;e.r248Key=dk||plainName(e.name);
   const n=String(e.name||''),mid=/^중간보스 · /.test(n),suf=(n.match(/ (증원|추격대|후속 증원|우두머리|\d+)$/)||[''])[0];
   e.name=(mid?'중간보스 · ':'')+name+suf;if(typeof e.r373Name==='string')e.r373Name=name;delete e.r74Monster;stats.renamed++;touched=true;}}
 for(const [z,mon] of ATLAS_OFF)if(id===z)for(const e of r.enemies){if(!e||e.r385Look||!isPatrol(e)||e.r74Monster!==mon)continue;e.r385Atlas=mon;delete e.r74Monster;stats.renamed++;touched=true;}
 if(touched)stats.rooms++;return r;}
function view(e){if(!prefs.on||!e?.r385Look)return null;const d=donor(e.r385Look[0],e.r385Look[1]);return d&&{nativeId:d.nativeId,path:d.path,profile:d.profile};}
function installRoom(){if(roomOn)return true;if(typeof makeRoom!=='function')return false;if(makeRoom.__r385)return roomOn=true;roomOn=true;const base=makeRoom;makeBase=base;
 const w=function(id,l,...a){if(!building&&KINDS.some(k=>k[0]===id))preload(id);const r=base.call(this,id,l,...a);try{return apply(r,id,l);}catch(err){fail(err);return r;}};w.__r385=true;try{makeRoom=w;}catch(_){}try{window.makeRoom=w;}catch(_){}return true;}
// 승인 그림 덧씌우기(R208·R374·R375·R380)는 assign 결과를 적 객체에 캐시한다. 프리로드 검사(R260)처럼 그림을 빌리기 전에
// 원래 정체로 캐시된 값이 남으면 빌려 온 정체로 그려도 옛 결과가 나오므로, 빌린 정체로 만든 캐시가 아니면 지우고 다시 묻게 한다.
const CACHE=['r208Checked','r208Mob','r374Checked','r374Mob','r375Checked','r375Mob','r380Checked','r380Mob'];
const snap=e=>CACHE.map(k=>e[k]===undefined?'':String(e[k])).join('|');
function borrow(e,fn,self,args){let v=null;try{v=view(e);}catch(x){fail(x);}if(!v)return fn.apply(self,args);const keep={};for(const k of SWAP)keep[k]=e[k];Object.assign(e,v);
 if(e.r385Cache!==snap(e))for(const k of CACHE)delete e[k];
 try{return fn.apply(self,args);}finally{try{e.r385Cache=snap(e);}catch(_){}for(const k of SWAP)e[k]=keep[k];}}
function installDraw(){if(drawOn)return true;if(typeof drawEnemy!=='function')return false;if(drawEnemy.__r385)return drawOn=true;drawOn=true;const base=drawEnemy;
 const w=function(e,...a){if(e?.r385Look&&prefs.on)stats.draws++;return borrow(e,base,this,[e,...a]);};w.__r385=true;try{drawEnemy=w;}catch(_){}try{window.drawEnemy=w;}catch(_){}return true;}
// 죽음 불꽃(spawnBurnDeath3)은 drawEnemy 를 거치지 않고 e.profile.frames.death·e.path 를 바로 읽는다 → 같은 빌리기를 씌운다.
function installDeath(){if(deathOn)return true;if(typeof spawnBurnDeath3!=='function')return false;if(spawnBurnDeath3.__r385)return deathOn=true;deathOn=true;const base=spawnBurnDeath3;
 const w=function(e,...a){return borrow(e,base,this,[e,...a]);};w.__r385=true;try{spawnBurnDeath3=w;}catch(_){}try{window.spawnBurnDeath3=w;}catch(_){}return true;}
try{installRoom();installDraw();installDeath();}catch(e){fail(e);}
let tries=0;(function arm(){try{installRoom();installDraw();installDeath();}catch(e){fail(e);}if(!(roomOn&&drawOn&&deathOn)&&++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_MOB_MOVES_R385__=Object.freeze({revision:REV,KINDS,RENAME,apply,view,donor,set,installRoom,installDraw,installDeath,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
