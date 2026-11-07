// R380 — 사용자 직접 검수 목록(v18) 채택 몹 적용(사용자 2026-11-07 "어제오늘 내가 신규생성한것들 구글드라이브에 있는데 게임에 왜 적용안함 뺄꺼 빼고 넣을꺼 넣고 교체할거 교체").
//  · 재 나방(dist01): 몸통 다듬은 v2(비행4·공격4).
//  · 보랏빛 알집지기(dist01): 실사풍 v1(이동4·공격4) — "저걸로 채택 기존거 폐기".
//  · 거미줄에 묶인 수호병(dist01): 검은 안개 v4(이동6·공격5). 픽셀 그림 모드(R306)에서는 픽셀판.
//  · 망각의 거미: "로봇느낌나서 통제자쪽 서사 맵으로 옮겨줘 이름도 기계화망각거미로" → dist01 에서 빼고, 통제자 u202(잔인한 구원)에
//    '기계화 망각거미'로 넣는다(새 관절형 그림). 그 지역 일반 몹(가짜 자비 수집가)의 수치를 그대로 빌려 난이도를 바꾸지 않는다.
//  · 그림만 엔진 frameFor 사슬에 내준다. 판정·보상·저장은 그대로. storyworld.r380.mobs {on:false} 로 끈다(이동·개명은 새로 만드는 지역부터).
(()=>{'use strict';
if(window.__STORYWORLD_APPROVED_MOBS_R380__)return;
const REV='R387-approved-3',KEY='storyworld.r380.mobs',INDEX='assets/r380/mobs/index.json';
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={assigned:0,frames:0,waiting:0,removed:0,added:0,renamed:0,reinstalls:0,errors:0,deaths:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
let idx=null;if(typeof fetch==='function')fetch(INDEX).then(r=>r.ok?r.json():null).then(j=>{if(j?.mobs)idx=j;}).catch(fail);
const curLayer=()=>{try{return typeof layer==='string'?layer:'STORY';}catch(_){return 'STORY';}};
const zoneOf=()=>{try{return String(typeof room==='object'&&room?(room.id||''):'');}catch(_){return '';}};
const artMode=()=>{try{return window.__STORYWORLD_MOB_ART_VARIANTS_R306__?.inspect?.().mode==='pixel'?'pixel':'painted';}catch(_){return 'painted';}};
const T=()=>typeof time==='number'?time:performance.now()/1000;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
const attacking=e=>!!(e?.attack&&Number.isFinite(e.attack.elapsed));
const SPIDER=/망각의 거미/,MECH='기계화 망각거미';
const RENAME=[['ep1a10','갈망의 도시짐승','약을 갈망하는 자'],['ep1a10','오만의 흰 가면','암시장의 수상한 자'],['dist02','늪에서 되살아난 전우','늪에서 되살아난 혼령체'],
 // R382: 검수 목록 v18 29·31·32·40·46·47·54–57·66·67 개명.
 ['ep1b02','미뤄 둔 시간의 형상','살아 움직이는 쓰레기들'],['ep1b03','찢어진 사진의 망령','질투로 얼룩진 망령'],['ep1b03','칼날과 유리 조각','추녀의 한탄'],
 ['ep1b09','인간의 뇌를 닮은 투명 연산 장치','걸어다니는 소형 로봇'],['ep1b09','설원 아래의 기계 다리','설원 잠복 보행기'],['u201','폭격기억 사이보그 사냥개','전쟁기계사냥개'],
 ['u204','첫 기억 청람잔영','기계화 첫 기억 청람잔영'],['u204','기억 공백 망령','기계화 기억 공백 망령'],['u204','문턱 관측거미','기계화 문턱 관측거미'],['u204','제12단계 기억 검열기','기계화 제12단계 기억 검열기'],
 ['u206','기억이주 연결자','기계화 기억이주 연결자'],['u206','중앙이주 공명기사','기계화 공명술사']];
// ── 이동·개명: 지역을 만들 때 한 번(결정적) ──
function relocate(r,id,l){if(!prefs.on||!r||!Array.isArray(r.enemies)||l==='DREAM')return r;
 // 정본 계약(R81: 지역마다 3×10 무리, 적 id·능력치 불변)을 지키려고 몹을 빼거나 더하지 않고 이름·그림만 바꾼다.
 if(id==='dist01'){const sub=['재 나방','보랏빛 알집지기','거미줄에 묶인 수호병'];let k=0;
  for(const e of r.enemies)if(e&&!e.r380Renamed&&!e.boss&&!e.midboss&&!e.wardChampionR81&&!/중간보스|준보스/.test(e.name||'')&&String(e.nativeId||'').startsWith('dist01-sp1')&&SPIDER.test(e.name||'')){
   const n=sub[k%3]+' '+(Math.floor(k/3)+1);e.r380From=e.name;if(!e.r248Key)e.r248Key=String(e.name).replace(/ \d+$/,'').replace(/ (증원|추격대|우두머리|후속 증원)$/,'');e.name=n;e.r380Renamed=true;k++;stats.removed++;}}
 else if(id==='u202'&&!r.enemies.some(e=>e?.r380Mech)){const src=r.enemies.filter(e=>e&&!e.boss&&!e.midboss&&!e.wardChampionR81&&e.nativeId==='u202-e1'&&/^가짜 자비 수집가( \d+)?$/.test(e.name||'')&&e.spawnState==='active');
  src.slice(0,4).forEach((e,i)=>{e.r380From=e.name;if(!e.r248Key)e.r248Key='가짜 자비 수집가';e.name=MECH+' '+(i+1);e.r380Mech=true;stats.added++;});}
 // 개명해도 R248 공격 효과·상태이상 조회 키(r248Key)는 옛 이름으로 둔다(Codex P1, 전투 밸런스 보존).
 // R381: 검수 목록 v18 05·06·17 개명(같은 몹 그대로, 이름만) — "갈망의 도시짐승삭제하고 약을 갈망하는 자로", "그자리에 … 암시장의 수상한 자로", "명명 늪에서 되살아난 혼령체".
 for(const [z,from,to] of RENAME)if(id===z)for(const e of r.enemies){if(!e||e.boss||e.r381Renamed)continue;const n=String(e.name||'');if(n.includes(from)){e.r381From=n;if(!e.r248Key)e.r248Key=from;e.name=n.replace(from,to);if(typeof e.r373Name==='string')e.r373Name=e.r373Name.replace(from,to);e.r381Renamed=true;stats.renamed++;}}
 balance(r,id,l);
 return r;}
// ── R383 밸런스(사용자 2026-11-07 "30마리밸런스바꿔도됨") ──
//  · "그냥뿌추적자 뿌리첫맵 / 다크그린뿌리추적자 늪"(검수 목록 18, 결정 카드: 악마화 나무의 정원 dist00): R74 순찰 '뿌리 추적자'(root)를
//    늪(dist02, 다크그린 그림)과 dist00 밖에서는 원래 그 지역 몹으로 되돌린다(수·수치·id 그대로). dist00(보스만 있던 첫 뿌리 맵)에는 늪 순찰과 같은 수치의 뿌리 추적자 6마리를 새로 둔다.
//  · "분노의 사냥개 … 분노 맵 적용"(검수 목록 19) = "7대죄 분노의귀청수부나오는곳"(ep1b07): 그 지역 R74 순찰 6마리를 분노의 사냥개로(수치 그대로).
//  · 3×10 정규 무리(r75Pack)는 손대지 않는다. dist00 에 더한 몹은 id ':r383-root:N'·r383Added 로 남긴다(계약 검사가 이것만 빼고 본다).
const ROOT_HOME='dist02',ROOT_ADD='dist00',WRATH_ZONE='ep1b07',WRATH='분노의 사냥개';let rootTpl=null;
// R387: 주사실(ep1a09)에는 지역 우두머리(mb-<지역> 중간보스)가 없다 → 사용자 지시(2026-11-07 "병원맵 주사실쪽에 보스가 나오지 않을걸 거기에 넣어줘")로
//  '중독을 부르는 주사기 환영체'를 한 마리 더한다. 수치·전투 성격은 바로 다음 지역 우두머리(ep1a10 mb-ep1a10, 중간보스)를 복제해 쓰고,
//  제단 가까이 빈 바닥 칸에 처음부터 보이게(spawnState active — 원래 우두머리는 hidden 으로 단계 뒤에 나옴) 둔다. 그림은 R380 index 의 syringe-phantom-boss-v1(이름으로 고름). 이 개체는 r383Added 로 표시해 R81 계약(3×10)에서 뺀다.
const SYR_ZONE='ep1a09',SYR_FROM='ep1a10',SYR_NAME='중독을 부르는 주사기 환영체';let syrTpl=null;
function syringeTemplate(l){if(syrTpl)return syrTpl;try{const base=makeRoom.__r380base||makeRoom,src=base(SYR_FROM,l||'STORY');const d=src?.enemies?.find(e=>e&&e.midboss&&!e.boss&&e.nativeId==='mb-'+SYR_FROM);
  if(d){const c=JSON.parse(JSON.stringify(d));for(const k of ['squadLeaderR373','r373Name','r373Base','squadR373','r373Slot','r373Anchor','r373From','r373MovePending','r373Clone','capScaleR373','r248Key','r380From','r381From','r385Look','r385From'])delete c[k];syrTpl=c;}}catch(err){fail(err);}return syrTpl;}
function addSyringe(r,l){if(r.enemies.some(e=>e?.r387Syringe)||r.enemies.some(e=>e&&(e.boss||e.midboss)))return;const tpl=syringeTemplate(l),L=r.exploration;if(!tpl||!L)return;
 const ent=L.entry||{x:0,y:0},rad=tpl.combatProfile?.bodyBlock?.r||.6;
 const free=(x,y)=>{try{if(typeof blocked==='function'&&blocked(x,y,rad+.2,r))return false;}catch(_){}return r.enemies.every(a=>Math.hypot(a.x-x,a.y-y)>rad+(a.combatProfile?.bodyBlock?.r||.3)+1);};
 // 목표 제단(r.objective)을 지키도록 제단에서 4칸쯤 떨어진 빈 칸, 제단이 없으면 입구에서 가장 먼 칸.
 const ob=r.objective&&Number.isFinite(r.objective.x)?r.objective:null,score=c=>ob?Math.abs(Math.hypot(c.x-ob.x,c.y-ob.y)-4):-Math.hypot(c.x-ent.x,c.y-ent.y);
 const cells=(L.floorCells||[]).map(([x,y])=>({x:x+.5,y:y+.5})).filter(c=>Math.hypot(c.x-ent.x,c.y-ent.y)>12).sort((a,b)=>score(a)-score(b)||a.x-b.x||a.y-b.y);
 const c=cells.find(c=>free(c.x,c.y));if(!c)return;const e=JSON.parse(JSON.stringify(tpl));
 Object.assign(e,{id:SYR_ZONE+':r387-syringe-boss',name:SYR_NAME,x:c.x,y:c.y,homeX:c.x,homeY:c.y,hp:tpl.maxHp,deadRecorded:false,deadAt:undefined,nav:[],navAt:0,stuck:0,attack:null,rangedWindup:0,aim:null,cd:1.5,rest:0,state:'idle',moving:false,
  spawnState:'active',explorationGroup:SYR_ZONE+':r387-boss',explorationLeash:14,r383Added:true,r387Syringe:true,r387From:tpl.name});delete e.r75Pack;delete e.r74Monster;
 try{window.__STORYWORLD_SCALE_MELEE_R61__?.normalize?.(e,r,{preserveHealth:true,preserveDamage:true});}catch(err){fail(err);}r.enemies.push(e);stats.added++;}
// dist00 몹은 R74 지도 그림(좌우 안 뒤집음, R86) 대신 엔진 frameFor 사슬로 이 오버레이 시트(root-stalker-r74-plain)를 쓴다 → r74Monster 를 지운다.
const isPatrol=e=>/:r74-patrol:/.test(String(e?.id||''));
function rootTemplate(l){if(rootTpl)return rootTpl;try{const base=makeRoom.__r380base||makeRoom,src=base('dist02',l||'STORY');const ok=e=>isPatrol(e)&&(e.r74Monster==='root'||e.r383Atlas==='root'),d=src?.enemies?.find(e=>ok(e)&&!e.squadLeaderR373)||src?.enemies?.find(ok);
  if(d){const c=JSON.parse(JSON.stringify(d));
   // R373 분대 우두머리·분대 자리를 물려받지 않게(Codex P2): 우두머리면 ×1.6 전 수치로 되돌리고 R373 표시를 모두 지운다.
   if(c.squadLeaderR373&&c.r373Base)for(const k of ['hp','maxHp','damage'])if(Number.isFinite(c.r373Base[k]))c[k]=c.r373Base[k];
   if(c.squadLeaderR373&&Number.isFinite(c.difficultyBaseHpR63))c.difficultyBaseHpR63/=1.6;
   for(const k of ['squadLeaderR373','r373Name','r373Base','squadR373','r373Slot','r373Anchor','r373From','r373MovePending','r373Clone','capScaleR373'])delete c[k];rootTpl=c;}}catch(err){fail(err);}return rootTpl;}
function balance(r,id,l){if(!Array.isArray(r.enemies))return;
 // 뿌리 맵·늪 밖의 뿌리 추적자 순찰은 지우지 않고(3×10 무리·저장 id 보존) 원래 복제해 온 그 지역 몹(같은 nativeId)의 이름·그림으로 되돌린다.
 if(id!==ROOT_HOME&&id!==ROOT_ADD)for(const e of r.enemies){if(!isPatrol(e)||e.r74Monster!=='root')continue;const d=r.enemies.find(a=>a&&!isPatrol(a)&&!a.boss&&a.nativeId===e.nativeId);if(!d)continue;
  e.r383From=e.name;if(!e.r248Key)e.r248Key=String(d.r248Key||d.name).replace(/ \d+$/,'');const dn=String(d.r373Name||d.name).replace(/ \d+$/,'').replace(/ 우두머리$/,'');e.name=dn+(/우두머리$/.test(e.name)?' 우두머리':'');if(typeof e.r373Name==='string')e.r373Name=dn;e.r383RootFrom='root';delete e.r74Monster;stats.removed++;}
 if(id===WRATH_ZONE)for(const e of r.enemies)if(isPatrol(e)&&!e.r383Wrath){e.r383From=e.name;if(!e.r248Key)e.r248Key=String(e.name).replace(/ 우두머리$/,'');e.name=WRATH+(/우두머리$/.test(e.r383From)?' 우두머리':'');if(typeof e.r373Name==='string')e.r373Name=WRATH;e.r383Wrath=true;e.r383Atlas=e.r74Monster;delete e.r74Monster;stats.renamed++;}
 // 늪 다크그린 뿌리 추적자(R382)도 R74 지도 그림이 이 시트를 가렸다 → 같은 방식으로 frameFor 사슬에 넘긴다.
 if(id===ROOT_HOME)for(const e of r.enemies)if(isPatrol(e)&&e.r74Monster==='root'){e.r383Atlas='root';delete e.r74Monster;}
 if(id===SYR_ZONE&&l!=='DREAM')addSyringe(r,l);
 if(id===ROOT_ADD&&!r.enemies.some(e=>e?.r383Added)){const tpl=rootTemplate(l),L=r.exploration;if(!tpl||!L)return;
  const ent=L.entry||{x:0,y:0},boss=r.enemies.find(e=>e.boss),rad=tpl.combatProfile?.bodyBlock?.r||.4;
  const free=(x,y)=>{try{if(typeof blocked==='function'&&blocked(x,y,rad+.12,r))return false;}catch(_){}return r.enemies.every(a=>Math.hypot(a.x-x,a.y-y)>rad+(a.combatProfile?.bodyBlock?.r||.3)+.6);};
  const cells=(L.floorCells||[]).map(([x,y])=>({x:x+.5,y:y+.5})).filter(c=>Math.hypot(c.x-ent.x,c.y-ent.y)>9&&(!boss||Math.hypot(c.x-boss.x,c.y-boss.y)>7));
  cells.sort((a,b)=>hash(a.x+':'+a.y)-hash(b.x+':'+b.y));let n=0;
  for(const c of cells){if(n>=6)break;if(!free(c.x,c.y))continue;const e=JSON.parse(JSON.stringify(tpl));
   Object.assign(e,{id:'dist00:r383-root:'+n,name:'뿌리 추적자',x:c.x,y:c.y,homeX:c.x,homeY:c.y,hp:tpl.maxHp,maxHp:tpl.maxHp,deadRecorded:false,deadAt:undefined,nav:[],navAt:0,stuck:0,attack:null,rangedWindup:0,aim:null,cd:1.2,rest:0,state:'idle',moving:false,
    explorationGroup:'dist00:r383-pack:'+Math.floor(n/2),explorationLeash:32,r383Added:true,r75Pack:undefined});delete e.r75Pack;delete e.r74Monster;
   // R74 순찰 만들 때처럼 R61 정규화에 원래 수치 보존으로 등록(JSON 복제는 WeakMap 등록을 안 옮김, Codex P2).
   try{window.__STORYWORLD_SCALE_MELEE_R61__?.normalize?.(e,r,{preserveHealth:true,preserveDamage:true});}catch(err){fail(err);}r.enemies.push(e);n++;stats.added++;}}}
function installRoom(){if(typeof makeRoom!=='function'||makeRoom.__r380)return typeof makeRoom==='function';const base=makeRoom;
 const w=function(id,l,...a){const r=base.call(this,id,l,...a);try{return relocate(r,id,l);}catch(err){fail(err);return r;}};w.__r380base=base;w.__r380=true;try{makeRoom=w;}catch(_){}try{window.makeRoom=w;}catch(_){}return true;}
// ── 그림 ──
function match(e){if(!idx||!e||e.hero||(e.boss&&!idx.mobs.some(m=>m.actor.boss&&new RegExp(m.actor.name).test(String(e.name||''))))||e.r170Tower||e.r251Circle)return null;try{if(typeof player!=='undefined'&&e===player)return null;}catch(_){}
 const L=curLayer(),n=String(e.name||''),mode=artMode();
 return idx.mobs.find(m=>{const a=m.actor;if(a.layer!==L)return false;if(a.zone&&zoneOf()!==a.zone)return false;if(a.artMode&&a.artMode!==mode)return false;return new RegExp(a.name).test(n);})||null;}
function assign(e){if(!prefs.on||!idx||!e)return null;const k=curLayer()+'|'+zoneOf()+'|'+artMode();if(e.r380Checked===k)return e.r380Mob?idx.mobs.find(m=>m.id===e.r380Mob)||null:null;
 e.r380Checked=k;const m=match(e);e.r380Mob=m?.id||null;if(m)stats.assigned++;return m;}
function progress(e){const sh=e.attack.shape154||e.combatProfile?.attackShape||{},tot=Math.max(.2,(e.attack.castWindup150??sh.windup??.45)+(sh.active??.15)+(sh.recovery??.35));return Math.min(.999,Math.max(0,e.attack.elapsed/tot));}
function cellFor(e,m){if(attacking(e))return m.attack[Math.floor(progress(e)*m.attack.length)];
 if(e.rangedWindup>0)return m.attack[0];
 if(!(e.hp>0)||e.hitTimer>0)return m.move[0];
 if(e.moving)return m.move[Math.floor(T()*8+hash(e.id)*8)%m.move.length];
 return m.idle?.length&&m.idle[0]!==m.move[0]?m.idle[0]:m.move[Math.floor(T()*1.6+hash(e.id)*2)%Math.min(2,m.move.length)];}
function faceLeft(e){if(attacking(e)&&Number.isFinite(e.attack.angle)){const sd=Math.cos(e.attack.angle)-Math.sin(e.attack.angle);if(Math.abs(sd)>.05)return sd<0;}
 try{return !!(player&&(player.x-player.y)<(e.x-e.y));}catch(_){return false;}}
function frameOf(e,m){const [cw,ch]=m.cell,[px,py]=m.pivot,vh=m.visibleHeight||150,k=cellFor(e,m),cols=m.cols||k+1,sx=(k%cols)*cw,sy=Math.floor(k/cols)*ch;
 const flip=faceLeft(e)!==(m.facing==='left');
 return {path:m.path,assetFrame:{sourceRect:[sx,sy,cw,ch],pivot:[px,py],visibleHeight:vh},sourceAlphaCore:[sx,sy,cw,ch],metricThreshold:16,sourcePixelsEdited:false,
  normalizedFullRectangleExtents:[-px/vh,-py/vh,(cw-px)/vh,(ch-py)/vh],r380Mob:m.id,r208Mob:m.id,flip};}
const ready=p=>typeof readyImage==='function'&&readyImage(p)?.image?.naturalWidth>0;
function install(){const S=window.__STORYWORLD_STORY_COMBAT_R54__;if(!S||typeof S.frameFor!=='function')return false;if(S.__r380)return true;
 window.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({...S,__r380:true,frameFor(e,f){try{const m=prefs.on?assign(e):null;if(m){
   if(!ready(m.path)){if(typeof ensureImages==='function')Promise.resolve(ensureImages([m.path])).catch(()=>{});stats.waiting++;return S.frameFor(e,f);}
   stats.frames++;return frameOf(e,m);}}catch(err){fail(err);}return S.frameFor(e,f);}});stats.reinstalls++;return true;}
// 죽음 불꽃은 e.profile.frames.death 한 장을 찍는다 → 그 순간 새 그림 장을 넘긴다(R375 와 같은 방식).
function installDeath(){if(typeof spawnBurnDeath3!=='function'||spawnBurnDeath3.__r380)return typeof spawnBurnDeath3==='function';const base=spawnBurnDeath3;
 const w=function(e){let m=null,saved;try{m=prefs.on&&e?assign(e):null;if(m&&ready(m.path)){saved=e.profile;const p=e.profile||{};
   e.profile={...p,frames:{...(p.frames||{}),death:frameOf({...e,hp:0,attack:null},m)}};stats.deaths++;}else m=null;}catch(err){fail(err);m=null;}
  try{return base.apply(this,arguments);}finally{if(m)e.profile=saved;}};w.__r380=true;try{spawnBurnDeath3=w;}catch(_){}try{window.spawnBurnDeath3=w;}catch(_){}return true;}
try{installRoom();}catch(e){fail(e);}
let tries=0;(function arm(){try{installRoom();install();installDeath();}catch(e){fail(e);}if(++tries<80&&typeof setTimeout==='function')setTimeout(arm,250);})();
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
window.__STORYWORLD_APPROVED_MOBS_R380__=Object.freeze({revision:REV,set,assign,match,cellFor,frameOf,relocate,installDeath,installRoom,faceLeft,
 inspect:()=>({revision:REV,prefs:{...prefs},loaded:!!idx,mode:artMode(),mobs:idx?.mobs?.map(m=>m.id)||[],stats:{...stats},lastError})});
})();
