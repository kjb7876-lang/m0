// R169 — 사용자 2026-10-31 요청 묶음.
//  ① 서사를 단서 쪽지 형식으로: 전투 맵에서 R139 가 모아 두던 서사(들어설 때·구역 cue 등)를 전투 중 '기억 쪽지'로 떨어뜨린다.
//     맵의 적 수를 (남은 쪽지 + 1)로 나눈 만큼 처치할 때마다(적이 적으면 40초마다) 한 장, 가까이 가면 주워지고 양피지 쪽지로 오른쪽에 뜬다(전투는 계속). 주운 쪽지는 맵 정리 때 다시 뜨지 않고,
//     못 주운 것은 예전처럼 정리 서사 앞에 모아 보인다. 주운 쪽지·사몽 단서조각(R162)·정리 때 본 서사는 '쪽지 모음'(메뉴·기억 창)에 쌓인다.
//  ② 잡몹 공격 이펙트를 서사(지역 성격)에 맞게: 병원 = 메스 자국·유리 조각, 정원 = 가시, 동굴·석조 = 금, 늪 = 독기, 잿더미 = 불씨,
//     대장간 = 불꽃, 집 = 할퀸 자국, 눈 = 얼음 조각, 해안 = 물결, 기억 = 룬, 신경 = 회로. 기 모으기(예고) + 내려칠 때 한 번. 칠한 R106 스프라이트로.
//     판정·피해·타이밍은 그대로, 동시에 14개까지.
//  ③ 조형물이 길을 막지 않게: 입구 → 목표·출구로 가는 길(격자 최단 경로) 1.15칸 안에 놓인 장식 소품은 그리지 않는다(상호작용·단서·상자·쪽지는 그대로).
//     사몽의 '세뇌당한 기억의 조각'은 방마다 하나, 단서 기록 곁에 놓는다(samong-r161 이 pathCells 를 쓴다).
//  ④ EGO 중첩: EGO 가 켜져 있는 동안 F 를 다시 누르면(공명 30) 중첩된다. 중첩마다 지속 3초로 새로 고치고, DREAM 에서는 EGO 횟수도 하나씩 올라
//     사몽이 더 빨리 열린다. 버프는 기본 EGO 에 중첩 하나당 +7%만(2중첩 = 기본+7%, 최대 7중첩 = 기본+42%).
//  ⑤ 패시브 조각(적 처치 포인트 구슬)을 적 레벨에 따라 더: 구슬 하나 = 기본 1~7점 × (1 + ⌊적 Lv / 7⌋). 기본 몫은 원래 경로, 더 붙는 몫은 주울 때 더한다.
//  storyworld.r169.play {notes,mobFx,curate,egoStack,levelPoints:false} 로 각각 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_PLAY_R169__)return;
const REV='R169-play-1',KEY='storyworld.r169.play',BOOK='storyworld.r169.notes';
let prefs={notes:true,mobFx:true,curate:true,egoStack:true,levelPoints:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={noteDrops:0,notePicks:0,collected:0,mobCharge:0,mobImpact:0,hidden:0,stacks:0,bonusPoints:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const live=()=>typeof started!=='undefined'&&started&&typeof player==='object'&&player&&typeof room==='object'&&room;
const scope=(o,fn)=>{if(typeof ctx.scope==='function')ctx.scope(o,fn);else fn();};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SENT={type:'r169-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}

// ---- 쪽지 모음 ---------------------------------------------------------------------------------
let book=[];try{const j=JSON.parse(localStorage.getItem(BOOK)||'[]');if(Array.isArray(j))book=j.filter(n=>n&&typeof n.key==='string'&&typeof n.text==='string');}catch(_){}
function saveBook(){try{localStorage.setItem(BOOK,JSON.stringify(book));}catch(_){}}
function collect(n){if(!n||typeof n.key!=='string'||typeof n.text!=='string'||!n.text.trim()||book.some(b=>b.key===n.key))return false;
 book.push({key:n.key,title:String(n.title||'쪽지').slice(0,120),narr:String(n.narr||'').slice(0,60),text:n.text.slice(0,6000),place:String(n.place||'').slice(0,60),at:Date.now()});if(book.length>900)book.shift();saveBook();stats.collected++;return true;}
const placeOf=s=>{try{return regionById?.[s?.id]?.title||'';}catch(_){return'';}};
function showBook(){if(typeof openPanel!=='function')return;const groups=new Map();for(const n of book){const k=n.place||'기억';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(n);}
 let h='<button id="r169BookClose" class="close">닫기</button><div class="eyebrow">기억 쪽지</div><h2>쪽지 모음 · '+book.length+'장</h2><p class="small">전투 중 주운 기억 쪽지, 사몽 단서조각, 맵을 정리할 때 본 서사가 모입니다. 제목을 누르면 펼쳐집니다.</p><div class="r169book">';
 if(!book.length)h+='<p class="small muted">아직 모은 쪽지가 없습니다. 전투 맵에서 적을 쓰러뜨리면 기억 쪽지가 떨어집니다.</p>';
 for(const[place,list]of groups){h+='<section><h4>'+esc(place)+' <small>'+list.length+'장</small></h4>';for(const n of list)h+='<details><summary>'+esc(n.title)+(n.narr?' <small>· '+esc(n.narr)+'</small>':'')+'</summary>'+n.text.split(/\n{2,}/).map(p=>'<p>'+esc(p)+'</p>').join('')+'</details>';h+='</section>';}
 h+='</div>';openPanel(h);noteCss();try{button('r169BookClose',()=>closePanel());}catch(_){const b=document.getElementById('r169BookClose');if(b)b.onclick=()=>closePanel();}}
function noteCss(){if(document.getElementById('r169NoteCss'))return;const s=document.createElement('style');s.id='r169NoteCss';
 s.textContent='#r169Note{position:fixed;right:max(14px,env(safe-area-inset-right,0px));top:120px;z-index:40;width:min(340px,82vw);max-height:46vh;overflow:auto;padding:14px 16px 12px;background:linear-gradient(170deg,#efe4cf,#dccab0);color:#2a1d16;border:1px solid #8a6a4a;border-radius:3px;box-shadow:0 10px 30px #000a,inset 0 0 26px #8a5a3a33;font:14px/1.75 "Gowun Batang","Noto Serif KR",serif;cursor:pointer;transform:rotate(.5deg)}'
  +'#r169Note[hidden]{display:none}#r169Note b{display:block;font:700 12px/1.4 "Malgun Gothic",sans-serif;letter-spacing:.06em;color:#7a2a24;margin-bottom:6px}#r169Note small{display:block;color:#6a5440;font-size:12px;margin-bottom:6px}#r169Note p{margin:0 0 8px;white-space:pre-wrap}#r169Note i{display:block;text-align:right;font:11px "Malgun Gothic",sans-serif;color:#7a6650;font-style:normal}'
  +'@media (max-width:780px){#r169Note{top:auto;bottom:calc(var(--bottom,144px) + 12px);max-height:34vh}}'
  +'.r169book section{margin:8px 0 12px}.r169book h4{margin:4px 0;color:#f0d9b0;border-bottom:1px solid #6b5a46;font-family:"Gowun Batang","Noto Serif KR",serif}.r169book h4 small{color:#bfa98a;font-weight:400}.r169book details{margin:4px 0;padding:6px 10px;background:linear-gradient(170deg,#efe4cf,#dccab0);color:#2a1d16;border:1px solid #8a6a4a;border-radius:3px;font:14px/1.7 "Gowun Batang","Noto Serif KR",serif}.r169book summary{cursor:pointer;font-weight:700;color:#5a2a20}.r169book summary small{font-weight:400;color:#6a5440}#panel .r169book details p{margin:6px 0;white-space:pre-wrap;color:#2a1d16}';document.head.appendChild(s);}
let noteEl=null,showing=null,hideAt=0,hover=false;const noteQ=[];
function showNote(n){noteQ.push(n);next();}
function next(){if(showing||!noteQ.length)return;noteCss();if(!noteEl){noteEl=document.createElement('div');noteEl.id='r169Note';noteEl.setAttribute('role','dialog');noteEl.setAttribute('aria-label','기억 쪽지');
  noteEl.onclick=()=>{showing=null;noteEl.hidden=true;next();};noteEl.onmouseenter=()=>hover=true;noteEl.onmouseleave=()=>hover=false;document.body.appendChild(noteEl);}
 showing=noteQ.shift();noteEl.innerHTML='';const b=document.createElement('b');b.textContent=showing.title;noteEl.appendChild(b);if(showing.narr){const s=document.createElement('small');s.textContent=showing.narr;noteEl.appendChild(s);}
 for(const para of showing.text.split(/\n{2,}/)){const p=document.createElement('p');p.textContent=para;noteEl.appendChild(p);}const i=document.createElement('i');i.textContent='누르면 닫힘 · 메뉴의 쪽지 모음에서 다시 볼 수 있음';noteEl.appendChild(i);
 const other=document.getElementById('r162Note');noteEl.style.top=other&&!other.hidden?Math.round(other.getBoundingClientRect().bottom+10)+'px':'';
 noteEl.hidden=false;noteEl.scrollTop=0;hideAt=performance.now()+Math.max(12000,Math.min(60000,showing.text.length*95));}
setInterval(()=>{try{const m=typeof modal!=='undefined'&&!!modal;if(noteEl)noteEl.style.visibility=m?'hidden':'';if(m&&showing)hideAt+=300;// 창이 열린 동안은 가리고 시간도 멈춘다
 if(showing&&!hover&&!m&&performance.now()>hideAt){showing=null;if(noteEl)noteEl.hidden=true;next();}}catch(e){fail(e);}},300);

// ---- ① 서사 → 기억 쪽지 --------------------------------------------------------------------------
const SB=()=>window.__STORYWORLD_STORY_BATCH_R139__;
let known=new Map(),dropped=new Set(),picked=new Set(),lastKill=null,kills=0,dropKills=0,dropT=0,enterT=0,foes=0;
function freeSpot(at){const ok=(x,y)=>{try{return typeof blocked!=='function'||!blocked(x,y,.3,room);}catch(_){return true;}};if(ok(at.x,at.y))return at;
 for(let k=0;k<12;k++){const a=k*.52,r=.8+.15*k,x=at.x+Math.cos(a)*r,y=at.y+Math.sin(a)*r;if(ok(x,y))return{x,y};}return{x:player.x,y:player.y};}
function noteTick(){if(!prefs.notes||!solo()||!live()||!SB()?.pending)return;const pend=SB().pending(),keys=new Set(pend.map(s=>s.key));
 for(const s of pend)if(s.key&&!known.has(s.key))known.set(s.key,s);
 // 대기열에서 빠졌는데 줍지 않은 것 = 정리 서사·포탈에서 이미 보인 것 → 모음에만 넣는다.
 for(const[k,s]of known)if(!keys.has(k)){if(!picked.has(k))collect({key:'story:'+k,title:s.title||'기억',narr:s.narrator,text:s.text,place:placeOf(s)});known.delete(k);}
 const props=room.props||(room.props=[]);/* 아래 filter 가 room.props 를 새 배열로 바꾸므로 새 쪽지는 room.props 에 직접 넣는다 */for(const p of props.slice())if(p.r169Note&&!keys.has(p.noteKey))room.props=room.props.filter(q=>q!==p);
 const t=T(),todo=pend.find(s=>s.key&&!dropped.has(s.key));
 // R169 균형: 맵의 적을 (남은 쪽지 + 1) 몫으로 나눠 그만큼 처치할 때마다 한 장 — 전투 내내 고루 나온다. 적이 적은 맵은 40초마다.
 const left=pend.filter(s=>s.key&&!dropped.has(s.key)).length,gap=foes>0?Math.max(2,Math.floor(foes/(left+1))):Infinity;
 if(todo&&(kills-dropKills>=gap||t-dropT>=40&&t-enterT>=8)){const near=lastKill&&Math.hypot(lastKill.x-player.x,lastKill.y-player.y)<10?lastKill:{x:player.x+1.3,y:player.y+.7},at=freeSpot(near);
  dropped.add(todo.key);dropKills=kills;dropT=t;(room.props||(room.props=[])).push({id:'r169:note:'+todo.key,x:at.x,y:at.y,solid:false,autoTargetEligible6:false,visible:true,r169Note:true,noteKey:todo.key,label:'기억 쪽지',t0:t});stats.noteDrops++;
  try{toast('기억 쪽지가 떨어졌습니다 · 가까이 가면 주워집니다.',2.2);}catch(_){}}
 for(const p of (room.props||[]).slice()){if(!p.r169Note||Math.hypot(p.x-player.x,p.y-player.y)>=1.1)continue;room.props=room.props.filter(q=>q!==p);const s=SB().take(p.noteKey);if(!s)continue;picked.add(p.noteKey);stats.notePicks++;
  const n={key:'story:'+s.key,title:'기억 쪽지 · '+(s.title||placeOf(s)),narr:s.narrator||'',text:s.text,place:placeOf(s)};collect(n);showNote(n);
  try{window.__STORYWORLD_PIXELFX_R163__?.play('collect-burst',p.x,p.y,{k:.55,z:H()*.25});}catch(_){}try{sound('pickup');}catch(_){}}}
function drawNote(p){const q=project(p.x,p.y),h=H(),bob=Math.sin(T()*3+p.x)*h*.05,S=SPR();
 ctx.save();try{if(S){S.draw('glow',{a:[200,150,90],b:[255,240,210]},q.x,q.y-h*.28+bob,h*.85,h*.85,{alpha:.55});S.draw('ring',{a:[190,140,90],b:[255,235,200]},q.x,q.y,h*(.48+.1*Math.sin(T()*4)),h*.24,{alpha:.55});}
  ctx.translate(q.x,q.y-h*.3+bob);ctx.rotate(Math.sin(T()*1.7+p.y)*.18-.1);ctx.fillStyle='#e9dcc2';ctx.fillRect(-h*.15,-h*.17,h*.3,h*.34);ctx.fillStyle='#8a6a4a';ctx.fillRect(-h*.15,-h*.17,h*.3,h*.03);ctx.fillStyle='#4a2a20';for(let k=0;k<4;k++)ctx.fillRect(-h*.1,-h*.09+k*h*.065,h*(.2-.05*(k%2)),Math.max(1,h*.012));}finally{ctx.restore();}}

// ---- ② 잡몹 공격 이펙트(지역 성격) -------------------------------------------------------------------
const C=(a,b)=>({a,b});
const MOBFX={
 clinical:{hit:['slashline','shard'],pal:C([90,130,150],[230,248,255])}, garden:{hit:['spike','petal'],pal:C([60,90,40],[200,90,90])},
 cave:{hit:['crack','smoke'],pal:C([70,60,50],[190,170,140])}, stone:{hit:['crack','smoke'],pal:C([80,76,70],[210,200,180])},
 swamp:{hit:['smoke','ring'],pal:C([50,70,30],[170,200,90])}, ash:{hit:['flame','spark'],pal:C([90,30,20],[255,170,90])},
 forge:{hit:['flare','spark'],pal:C([120,40,10],[255,200,110])}, domestic:{hit:['slash','shard'],pal:C([70,40,35],[220,180,150])},
 snow:{hit:['shard','ring'],pal:C([90,120,150],[240,250,255])}, coast:{hit:['ring','smoke'],pal:C([20,80,90],[150,230,220])},
 memory:{hit:['rune','glow'],pal:C([70,40,100],[220,190,255])}, neural:{hit:['circuit','spark'],pal:C([60,50,110],[200,200,255])},
 regional:{hit:['slashwide','spark'],pal:C([90,30,30],[240,200,170])}};
const famOf=()=>{try{const L=room?.exploration;const f=L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[zone]?.family;return MOBFX[f]?f:'regional';}catch(_){return'regional';}};
const major=e=>!!(e?.boss||e?.midboss||e?.persona||e?.cosmic||e?.trial||e?.samongMidR162||e?.samongR103);
// R170(사용자 "이펙트 색은 각자의 이름색 + 고유색 + 보조색에 맞게"): 모양은 지역 서사, 색은 그 몹의 R114 팔레트(이름에 색이 있으면 그 색이 고유색).
//  주 그림 = 고유색 → 그 발광색, 보조 조각 = 보조색 → 그 발광색. 팔레트가 없는 몹만 지역 기본색.
function palOf(e,fam){try{const pl=window.__STORYWORLD_COMBAT_R114__?.palette?.(e);if(pl&&pl.p&&pl.s)return{main:{a:pl.p,b:pl.gp||pl.p},sub:{a:pl.s,b:pl.gs||pl.s}};}catch(_){}const M=MOBFX[fam]||MOBFX.regional;return{main:M.pal,sub:M.pal};}
// R175: 동굴은 석조, 늪은 해안, 잿더미는 대장간 pixelfx 모양을 함께 쓴다.
const PXFAM={cave:'stone',swamp:'coast',ash:'forge'};
const seen=new WeakMap(),mfx=[];
let warmed='';
function mobTick(){if(!prefs.mobFx||!live()||!Array.isArray(room.enemies))return;const t=T(),fam=famOf();if(warmed!==room.id){warmed=room.id;try{window.__STORYWORLD_PIXELFX_R163__?.warm?.(['mob-'+(PXFAM[fam]||fam)]);}catch(_){}}// R175: 첫 타격부터 보이게 미리 받기
 for(const e of room.enemies){if(!e||e.hp<=0||major(e)||Math.hypot(e.x-player.x,e.y-player.y)>13)continue;const a=e.attack;let s=seen.get(e);
  if(a&&Number.isFinite(a.angle)){if(!s||s.id!==a.id){s={id:a.id,hit:false};seen.set(e,s);const w=Number(a.castWindup150??a.shape154?.windup)||.35;if(mfx.length<14){mfx.push({kind:'charge',e,fam,pal:palOf(e,fam),t0:t,life:Math.min(1.2,Math.max(.2,w))});stats.mobCharge++;}}
   if(a.committed&&!s.hit){s.hit=true;const r=Math.min(2.4,Math.max(.8,Number(a.shape154?.range)||1.3));if(mfx.length<14){mfx.push({kind:'hit',fam,pal:palOf(e,fam),x:e.x+Math.cos(a.angle)*r*.38,y:e.y+Math.sin(a.angle)*r*.38,ex:e.x,ey:e.y,ang:a.angle,r,t0:t,life:.45,seed:Math.random()*6});stats.mobImpact++;}}}
   if(a&&a.committed&&s&&s.hit&&!s.px){s.px=true;try{const X=window.__STORYWORLD_PIXELFX_R163__,nm='mob-'+(PXFAM[fam]||fam),P=palOf(e,fam).main;if(X?.has?.(nm)){const sx=Math.cos(a.angle)-Math.sin(a.angle),r=Math.min(2.4,Math.max(.8,Number(a.shape154?.range)||1.3));X.play(nm,e.x+Math.cos(a.angle)*r*.45,e.y+Math.sin(a.angle)*r*.45,{k:1.3,rate:1.2,flip:sx<0,tint:P});stats.mobPixel=(stats.mobPixel||0)+1;}}catch(_){}}// R175: pixelfx 서사 모양을 그 몹 색으로
  else if(s&&!a)seen.delete(e);}
 for(let i=mfx.length-1;i>=0;i--)if(t-mfx[i].t0>mfx[i].life||mfx[i].kind==='charge'&&(mfx[i].e.hp<=0||!mfx[i].e.attack))mfx.splice(i,1);}
// 영웅 가까이 그리는 그림은 R106 이 흐리게 하므로(영웅 가림 방지) 칼끝 쪽(사거리 38%)에 두고 overHero 로 그린다.
// 금·물결·연기·룬·회로 같은 바닥 그림은 몹 발밑에 — 본편 타격 폭발(R98)에 묻히지 않게.
function drawMob(){const S0=SPR();if(!S0||typeof project!=='function')return;const S={draw:(n,F,x,y,w,h,o={})=>S0.draw(n,F,x,y,w*1.9,h*1.9,{overHero:true,...o})},t=T(),h=H();
 for(const f of mfx){const v=(t-f.t0)/f.life;if(v<0||v>1)continue;const M=MOBFX[f.fam]||MOBFX.regional,PM=f.pal?.main||M.pal,PS=f.pal?.sub||M.pal;
  if(f.kind==='charge'){const e=f.e,q=project(e.x,e.y);scope({id:'r169:charge:'+f.t0,kind:'effect',x:e.x,y:e.y},()=>{S.draw('glow',PM,q.x,q.y-h*.55,h*(.35+.45*v),h*(.35+.45*v),{alpha:.25+.45*v});S.draw('ring',PM,q.x,q.y,h*(.9-.35*v),h*(.45-.17*v),{alpha:.35*v});});continue;}
  stats.mobDrawn=(stats.mobDrawn||0)+1;
  const q=project(f.x,f.y),q1=project(f.x+Math.cos(f.ang),f.y+Math.sin(f.ang)),ang=Math.atan2(q1.y-q.y,q1.x-q.x),u=1-v,[a,b]=M.hit;
  scope({id:'r169:hit:'+f.t0,kind:'effect',x:f.x+.4,y:f.y+.4},()=>{
   if(a==='spike'){for(let k=-1;k<=1;k++)S.draw('spike',PM,q.x+Math.cos(ang+k*.5)*h*.25,q.y-h*.1+Math.sin(ang+k*.5)*h*.12,h*.28,h*(.5+.25*(1-Math.abs(k)))*(.5+.5*Math.min(1,v*3)),{angle:0,alpha:u,blend:'source-over'});}
   else if(a==='crack'||a==='ring'||a==='smoke'){const g=project(f.ex,f.ey);S.draw(a,PM,g.x,g.y,h*(.9+.6*v),h*(.45+.3*v),{alpha:u,angle:f.seed,blend:a==='ring'?'lighter':'source-over'});}
   else if(a==='rune'||a==='circuit'){const g=project(f.ex,f.ey);S.draw(a,PM,g.x,g.y-h*.05,h*(.7+.3*v),h*(.35+.15*v),{alpha:u,angle:f.seed*.2});}
   else{S.draw(a,PM,q.x,q.y-h*.45,h*f.r*.9,h*.38,{angle:ang+(f.seed>3?.35:-.35),alpha:u,blend:'source-over'});S.draw(a,PM,q.x,q.y-h*.45,h*f.r*.7,h*.22,{angle:ang+(f.seed>3?.35:-.35),alpha:u*.8});}
   if(b==='spark'||b==='shard'||b==='petal'){for(let k=0;k<4;k++){const aa=ang+(k-1.5)*.45+f.seed*.1,d=h*(.15+.55*v);S.draw(b,PS,q.x+Math.cos(aa)*d,q.y-h*.4+Math.sin(aa)*d*.6,h*.2,h*.08,{angle:aa,alpha:u*.9});}}
   else S.draw(b,PS,q.x,q.y-(b==='glow'?h*.4:0),h*(.7+.5*v),h*(b==='glow'?.7+.5*v:.35+.25*v),{alpha:.6*u});});}}

// ---- ③ 길 위의 장식 소품 숨기기 · 길 격자 ----------------------------------------------------------------
function pathCells(r=room){try{const L=r?.exploration;if(!L||!Array.isArray(L.floorCells)||!L.floorCells.length)return null;const key=c=>c[0]+','+c[1],floor=new Set(L.floorCells.map(key));
  const cell=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?[Math.floor(p.x),Math.floor(p.y)]:null;const st=cell(L.entry)||cell(r.r72Entry)||cell(player);if(!st||!floor.has(key(st)))return null;
  const goals=[r.objective,L.samongR103?.exit,L.samongR103?.dais,r.samongR103?.portal,r.samongR103?.core];try{const reg=regionById?.[r.id];if(reg&&typeof exitPoint==='function')for(const d of Object.keys(reg.exits||{}))goals.push(exitPoint(d));}catch(_){}
  const prev=new Map([[key(st),null]]),q=[st];for(let i=0;i<q.length&&i<40000;i++){const[x,y]=q[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=[x+dx,y+dy],k=key(n);if(floor.has(k)&&!prev.has(k)){prev.set(k,key([x,y]));q.push(n);}}}
  const out=new Set();for(const g of goals){const c=cell(g);if(!c)continue;let k=key(c);if(!prev.has(k)){let best=null,bd=9;for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){const kk=key([c[0]+dx,c[1]+dy]);if(prev.has(kk)&&Math.abs(dx)+Math.abs(dy)<bd){bd=Math.abs(dx)+Math.abs(dy);best=kk;}}k=best;}
   for(let n=0;k&&n<4000;n++){out.add(k);k=prev.get(k);}}
  return out.size?out:null;}catch(e){fail(e);return null;}}
const KEEP=/crate|barrel|cabinet|box|coffer|trunk|chest|portal|door|altar/i;
function decor(p){return !!p&&!!p.path&&p!==room.objective&&!(p.samongR103||p.r115Clue||p.chestR103||p.growthR103||p.r162Frag||p.r169Note||p.passivePointDropR64||p.portal||p.npc||p.interact||p.label||p.exit||p.r105Record||p.r161Sculpture)&&!KEEP.test(String(p.path))&&!KEEP.test(String(p.kind||''));}
let curated='',curN=-1,curAt=0;
function curate(){if(!prefs.curate||!live())return;const props=room.props||[],k=String(room.id)+':'+String(room.samongR103?.key||room.samongR103?.zone||'');if(k===curated&&props.length===curN)return;if(T()<curAt)return;curAt=T()+.5;
 const path=pathCells(room);curated=k;curN=props.length;if(!path)return;
 for(const p of props){if(p.r169Hidden||!decor(p)||p.visible===false)continue;const cx=Math.floor(p.x),cy=Math.floor(p.y);let near=false;
  for(let dx=-2;dx<=2&&!near;dx++)for(let dy=-2;dy<=2&&!near;dy++)if(path.has((cx+dx)+','+(cy+dy))&&Math.hypot(cx+dx+.5-p.x,cy+dy+.5-p.y)<1.15)near=true;
  if(near){p.visible=false;p.r169Hidden=true;stats.hidden++;}}}

// ---- ④ EGO 중첩 -------------------------------------------------------------------------------
const STACK_MAX=7,STEP=.07;let lastPress=-9;
const egoVisit=()=>{try{return window.__STORYWORLD_EGO151__?.inspect?.().state?.active===true;}catch(_){return false;}};
const stackOf=p=>p&&p.ego>0&&!(p.samong>0)?Math.max(1,p.egoStackR169||1):0;

// ---- ⑤ 적 레벨에 따른 패시브 조각 ---------------------------------------------------------------------
const bonus=new Map();
const levelOf=e=>{const n=Number(e?.levelR62);if(Number.isFinite(n)&&n>0)return n;try{return window.__STORYWORLD_PROGRESSION_R62__?.mapLevel?.()||1;}catch(_){return 1;}};
function bonusTick(){if(!bonus.size||!live())return;let claims=null;try{claims=window.__STORYWORLD_PROGRESSION_R62__?.state(player)?.pointDropClaimsR64;}catch(_){}if(!claims)return;
 for(const[id,b]of bonus){if(!claims[id])continue;bonus.delete(id);player.points=Math.min(Number.MAX_SAFE_INTEGER,(Number(player.points)||0)+b.extra);stats.bonusPoints+=b.extra;
  try{toast('패시브 조각 · 적 Lv.'+b.level+' 추가 +'+b.extra+' (총 +'+(b.amount+b.extra)+')',2.4);}catch(_){}try{saveGame(false);}catch(_){}}}

// ---- 설치 -------------------------------------------------------------------------------------
try{
 if(typeof ego==='function'){const base=ego;ego=function(...a){const p=typeof player==='object'?player:null;
   try{if(prefs.egoStack&&solo()&&p&&p.ego>0&&!(p.samong>0)&&!egoVisit()&&started&&!modal&&!loading&&p.hp>0){
     if(T()-lastPress<.3)return;lastPress=T();const n=stackOf(p);
     if(n>=STACK_MAX){toast('EGO 중첩 최대 '+STACK_MAX+' · 기본 +'+Math.round(STEP*100*(STACK_MAX-1))+'%',1.4);return;}
     if(p.resonance<30){toast('EGO 중첩에는 공명 30이 필요합니다.',2);return;}
     p.resonance-=30;p.ego=3;p.egoCD=Math.max(Number(p.egoCD)||0,6);p.egoStackR169=n+1;stats.stacks++;
     if(layer==='DREAM'){p.egoCount=Math.min(7,(Number(p.egoCount)||0)+1);if(p.egoCount===7){p.pending=true;awaken('seven');}}
     try{fx('sigil',p.x,p.y,{asset:VFX.aura,size:2.2+.12*n,life:.5});sound('ego');}catch(_){}
     try{toast('EGO '+(n+1)+'중첩 · 기본 +'+Math.round(STEP*100*n)+'%',1.2);}catch(_){}try{updateHUD();}catch(_){}return;}}catch(e){fail(e);}
   const before=Number(p?.ego)||0,r=base.apply(this,a);try{if(p&&before<=0&&p.ego>0){p.egoStackR169=1;lastPress=T();}}catch(_){}return r;};}
 if(typeof attackPower==='function'){const base=attackPower;attackPower=function(...a){const v=base.apply(this,a);try{const n=prefs.egoStack?stackOf(player):0;if(n>1&&Number.isFinite(v))return v*(1+STEP*(n-1));}catch(_){}return v;};}
 if(typeof updateHUD==='function'){const base=updateHUD;updateHUD=function(...a){const r=base.apply(this,a);try{const n=prefs.egoStack?stackOf(player):0,el=document.getElementById('awakeText');if(el&&n>1){const add=' · '+n+'중첩 +'+Math.round(STEP*100*(n-1))+'%';if(!el.textContent.endsWith(add))el.textContent+=add;}}catch(e){fail(e);}return r;};}
 if(typeof killEnemy==='function'){const base=killEnemy;killEnemy=function(e,...a){const drops=live()&&Array.isArray(room.passivePointDropsR64)?room.passivePointDropsR64:null,before=drops?drops.length:0,first=!!e&&!e.deadRecorded;
   const r=base.apply(this,[e,...a]);try{if(e&&live()){lastKill={x:e.x,y:e.y};if(first)kills++;}
    if(prefs.levelPoints&&solo()&&first&&drops&&drops.length>before){const lv=levelOf(e),k=Math.floor(lv/7);if(k>0)for(const row of drops.slice(before)){const amount=Number(row.amount)||0;if(amount>0&&row.id)bonus.set(row.id,{extra:amount*k,amount,level:lv});}}}catch(err){fail(err);}return r;};}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p?.r169Note){try{drawNote(p);}catch(err){fail(err);}return;}return base.apply(this,[p,...a]);};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r169-fx'){try{drawMob();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(live()){if(!(player.ego>0))player.egoStackR169=0;noteTick();mobTick();curate();bonusTick();if(mfx.length)arm();else disarm();}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);try{dropped=new Set();picked=new Set();lastKill=null;dropKills=kills;dropT=T();enterT=T();foes=(room?.enemies||[]).filter(e=>e&&e.hp>0&&!major(e)).length;mfx.length=0;curated='';curN=-1;curAt=0;
   for(const id of bonus.keys())if(!room?.passivePointDropsR64?.some(d=>d.id===id))bonus.delete(id);}catch(e){fail(e);}return r;};}
 // 쪽지 모음 단추: 메뉴와 기억(일지) 창
 const addBtn=()=>{const box=document.querySelector('#panel .actions');if(!box||document.getElementById('r169BookBtn'))return;const b=document.createElement('button');b.id='r169BookBtn';b.textContent='쪽지 모음 · '+book.length;b.onclick=()=>showBook();box.appendChild(b);};
 if(typeof showMenu==='function'){const base=showMenu;showMenu=function(...a){const r=base.apply(this,a);try{addBtn();}catch(e){fail(e);}return r;};}
 if(typeof showJournal==='function'){const base=showJournal;showJournal=function(...a){const r=base.apply(this,a);try{addBtn();if(!document.getElementById('r169BookBtn')){const h=document.querySelector('#panel h2');if(h){const b=document.createElement('button');b.id='r169BookBtn';b.textContent='쪽지 모음 · '+book.length;b.onclick=()=>showBook();h.insertAdjacentElement('afterend',b);}}}catch(e){fail(e);}return r;};}
}catch(e){fail(e);}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_PLAY_R169__=Object.freeze({revision:REV,set,collect,showBook,pathCells,MOBFX,STACK_MAX,STEP,book:()=>book.map(n=>({key:n.key,title:n.title,place:n.place})),
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},book:book.length,notesOnMap:live()?(room.props||[]).filter(p=>p.r169Note).length:0,mobFx:mfx.length,stack:live()?stackOf(player):0,bonusPending:bonus.size,note:showing?showing.title:null,lastError})});
})();
