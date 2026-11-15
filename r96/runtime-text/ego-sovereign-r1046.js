/* R1046 히든 영웅 '마지막 수호자 EGO'(사용자 2026-11-15 06:53Z "이 자산으로 … 히든영웅 넣어줘 … ego각성영웅도 스스로를 구원하지는 못해 …
 * 기존서사와 충돌되지 않게 잘녹여서", 지시서 1~8항은 참고).
 *  · 서사: S-07 원문에서 환도는 페르소나의 식탁에서 가면을 내려놓고 'EGO'로 각성한다. 그래서 EGO 는 환도의 계보 — 몸·검·스킬 키는 환도 것을 그대로 쓰고
 *    (스킬 키를 늘리지 않음), 그 위에 EGO 고유 능력 표(ego-sovereign-r1046-data.js)를 얹는다. 원문 문장은 바꾸지 않는다.
 *  · 해금: 사몽 S-07(페르소나)을 깨면(또는 unlock() — 페르소나 보스 등) 한 번 컷인이 뜨고, 영웅 선택창 환도 옆에 'EGO' 칸이 생긴다. 777 시험 중에도 보인다.
 *  · 형상: player.egoSovereignR1046(저장됨). 환도일 때만 켜지고, 다른 영웅으로 바꾸면 꺼진다.
 *  · 관측 폐기: 걷을 수 있는 해로운 상태가 생기면 0.7초(게임 시간) 뒤 걷는다. 16초 대기. 이미 받은 피해·죽음은 그대로(자기 자신은 구원하지 못한다).
 *  · 그림: 해금 컷인·선택창 초상은 사용자 EGO 원화(합일1). 전장 몸 그림은 Dots 시트가 오기 전까지 환도 몸 + 붉은 R100 손그림 오라(임시).
 * 끄기: localStorage storyworld.r1046.ego = {"on":false,"off":true} 의 off. 판정 코드는 이 파일 안에서만. */
(()=>{'use strict';
if(window.__STORYWORLD_EGO_SOVEREIGN_R1046__)return;
const D=window.__STORYWORLD_EGO_SOVEREIGN_R1046_DATA__;if(!D)return;
const REV='R1046-ego-sovereign-1',KEY='storyworld.r1046.ego',FIELD='egoSovereignR1046';
const fin=Number.isFinite,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const P=D.profile,OD=D.abilities.find(a=>a.id==='observe-discard');
const stats={discards:0,scheduled:0,cutins:0,cards:0,stagePatched:0,auraDraws:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{return f();}catch(_){return d;}};
const pl=()=>G(()=>typeof player!=='undefined'?player:null,null);
const now=()=>G(()=>typeof time==='number'&&fin(time)?time:null,null);
let saved={on:false,off:false};try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object')saved={on:v.on===true,off:v.off===true};}catch(_){}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(_){}};
let cutinQueued=false;
// ---- 해금 ----
function samongCleared(){try{const A=window.__STORYWORLD_SAMONG_R103__;const i=(A?.episodes||[]).findIndex(e=>e?.key==='S-07');const c=A?.state?.()?.cleared;return i>=0&&Array.isArray(c)&&c.includes(i);}catch(_){return false;}}
const cheat=()=>G(()=>!!window.__STORYWORLD_CHEAT777__?.active?.(),false);
// 기존 RC151(index.html rc151-ego-extension): 페르소나 처치 → ego151.unlocked, 다음 지역에서 '마지막 수호자 EGO' 변신(그쪽 컷인·HUD). 여기서는 읽기만 한다.
const rc=()=>G(()=>typeof ego151!=='undefined'&&ego151?ego151:null,null);
const rcActive=()=>rc()?.active===true;
function unlocked(){return !saved.off&&(saved.on||rc()?.unlocked===true||cheat());}
function unlock(reason='api'){if(saved.on)return true;saved.on=true;persist();cutinQueued=reason!=='rc151';stats.unlockReason=String(reason).slice(0,40);return true;}
// ---- 형상 ----
function formActive(){const p=pl();return !!(p&&p[FIELD]===true&&p.hero===P.base&&!saved.off);}
function active(){return formActive()||(!saved.off&&rcActive());}
function setForm(v){const p=pl();if(!p)return false;if(v&&(!unlocked()||p.hero!==P.base)){p[FIELD]=false;return false;}p[FIELD]=!!v;if(!v)pending=null;return !!v;}
// ---- 관측 폐기 ----
const T=D.dispel.dispellable.map(x=>x.id);
function present(){const p=pl(),t=now();if(!p||t==null)return[];const out=[];
 if(p.storyStatus150&&fin(p.storyStatus150.until)&&p.storyStatus150.until>t||fin(p.heroSlowUntil150)&&p.heroSlowUntil150>t)out.push('story150');
 if(G(()=>window.__STORYWORLD_REGIONAL_COMBAT_R58__.statusRows().length>0,false))out.push('regional58');
 if(G(()=>window.__STORYWORLD_HOSPITAL_WOUNDS_R53__.statusRows().some(r=>/^hospital-/.test(String(r?.key||''))),false))out.push('wounds53');
 if(p.healthBleedR71||G(()=>window.__STORYWORLD_HEALTH_R71__.statusRows(p).length>0,false))out.push('bleed71');
 if(fin(p.heroHealingBlockedUntil)&&p.heroHealingBlockedUntil>t)out.push('healblock9');
 return out.filter(id=>T.includes(id));}
const CLEAR={
 story150:p=>{const t=now();p.storyStatus150=null;if(fin(p.heroSlowUntil150)&&p.heroSlowUntil150>t)p.heroSlowUntil150=t;},
 regional58:()=>window.__STORYWORLD_REGIONAL_COMBAT_R58__?.clear?.('r1046-observe-discard'),
 wounds53:()=>window.__STORYWORLD_HOSPITAL_WOUNDS_R53__?.clear?.('r1046-observe-discard'),
 bleed71:p=>window.__STORYWORLD_HEALTH_R71__?.clearBleeding?.(p,'r1046-observe-discard'),
 healblock9:p=>{const t=now();if(fin(p.heroHealingBlockedUntil)&&p.heroHealingBlockedUntil>t)p.heroHealingBlockedUntil=t;}};
let pending=null,cdUntil=-1,lastT=null,lineAt=0,fxAt=-99,unlockPoll=0;
function discard(){const p=pl(),t=now();if(!p||t==null||!(p.hp>0))return 0;const ids=present();let n=0;
 for(const id of ids){try{CLEAR[id]?.(p);n++;}catch(e){fail(e);}}
 if(!n)return 0;stats.discards++;stats.last=ids.slice();cdUntil=t+OD.cooldown;fxAt=t;
 try{const line=OD.lines[lineAt++%OD.lines.length];if(typeof floatText==='function')floatText(line,p.x,p.y,'#f2c3c8');}catch(e){fail(e);}
 return n;}
function step(){const p=pl(),t=now();if(!p||t==null)return;
 if(lastT!=null&&t<lastT){pending=null;cdUntil=-1;fxAt=-99;lastT=null;}const prev=lastT!=null&&t-lastT<.25?lastT:t;lastT=t;
 if(t>=unlockPoll){unlockPoll=t+.5;if(!saved.on&&rc()?.unlocked===true)unlock('rc151');else if(!saved.on&&samongCleared())unlock('samong-S-07');}
 if(p[FIELD]===true&&(p.hero!==P.base||!unlocked())){p[FIELD]=false;pending=null;}
 if(!active()||!(p.hp>0)){pending=null;return;}
 if(pending){if(t>=pending.at){pending=null;discard();}return;}
 /* 상태는 지난 프레임과 이번 프레임 사이에 걸렸다 — 지연은 그 프레임 시작부터 센다 */if(t>=cdUntil&&present().length){pending={at:Math.max(prev,cdUntil)+OD.delay};stats.scheduled++;}}
// ---- 저장 ----
function wrapSave(){
 if(typeof serializeSave==='function'&&!serializeSave.__r1046){const base=serializeSave;const w=function(...a){const d=base.apply(this,a);try{if(d&&d.player)d.player[FIELD]=formActive();}catch(e){fail(e);}return d;};w.__r1046=true;serializeSave=w;}
 if(typeof restoreSave==='function'&&!restoreSave.__r1046){const base=restoreSave;const w=async function(raw,...a){const r=await base.call(this,raw,...a);try{const p=pl();if(p){p[FIELD]=raw?.player?.[FIELD]===true&&p.hero===P.base&&unlocked();pending=null;cdUntil=-1;lastT=null;}}catch(e){fail(e);}return r;};w.__r1046=true;restoreSave=w;}}
function wrapTick(){if(typeof tick!=='function'||tick.__r1046)return;const base=tick;const w=function(...a){const r=base.apply(this,a);try{step();ui();}catch(e){fail(e);}return r;};w.__r1046=true;tick=w;}
// ---- 화면(문서가 있을 때만) ----
const hasDoc=()=>typeof document!=='undefined'&&!!document&&typeof document.createElement==='function'&&typeof document.querySelector==='function';
const url=p=>G(()=>urlFor(p),p);
let want=false,commit=null,uiAt=0,synthetic=false;
function css(){if(document.getElementById('r1046Css'))return;const s=document.createElement('style');s.id='r1046Css';s.textContent=[
 '.r1046card{position:relative}.r1046card img{filter:saturate(1.08) contrast(1.06)}',
 '.r1046card .r1046tag{position:absolute;top:4px;right:4px;font-size:9px;letter-spacing:.14em;padding:1px 5px;border:1px solid #c8323f;color:#f4d7da;background:#1a0608cc;border-radius:2px}',
 '.r1046card.selected{border-color:#c8323f!important;box-shadow:0 0 14px #c8323f80!important}',
 '#r263Stage.r1046 .row b{white-space:nowrap;flex:none;display:inline-block}#r263Stage.r1046 .row.rec{font-size:12.5px;color:#cdbfb1;line-height:1.75}#r263Stage.r1046 .row.seal{font-size:12px;color:#9a8f86;font-style:italic}',
 '#r1046Cutin{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 45%,#2a0508ee,#000f 70%);cursor:pointer;animation:r1046in .9s ease-out}',
 '#r1046Cutin img{max-height:78vh;max-width:86vw;object-fit:contain;filter:drop-shadow(0 0 28px #c8323f90)}',
 '#r1046Cutin p{position:absolute;left:50%;bottom:6vh;transform:translateX(-50%);width:min(760px,90vw);margin:0;text-align:center;font:500 clamp(13px,1.9vw,17px)/1.85 "Noto Serif KR","Malgun Gothic",serif;color:#f1e3d6;text-shadow:0 0 10px #000,0 0 18px #6a0b12}',
 '#r1046Cutin b{position:absolute;top:5vh;left:50%;transform:translateX(-50%);font:700 clamp(18px,3vw,28px)/1.2 "Noto Serif KR",serif;letter-spacing:.3em;color:#f4d7da;text-shadow:0 0 16px #c8323f}',
 '@keyframes r1046in{from{opacity:0;filter:brightness(1.8)}to{opacity:1}}',
 '@media (prefers-reduced-motion:reduce){#r1046Cutin{animation:none}}'].join('\n');document.head.appendChild(s);}
function card(ref,startRow){const b=document.createElement('button');b.type='button';b.className=(ref.className||'card').replace(/\bselected\b/g,'').trim()+' r1046card';b.dataset.egoR1046='1';b.dataset.r263='1';b.title=P.title;
 if(startRow){b.innerHTML='<img alt="EGO"><span>'+P.name+'</span>';}
 else if(ref.querySelector('.pf')){b.innerHTML='<div class="pf"><img alt="EGO"></div><div class="body"><span class="role">'+P.role+'</span><strong>'+P.name+'</strong><small>'+P.passive+'</small></div>';}
 else b.innerHTML='<img alt="EGO"><strong>'+P.name+'</strong><small>'+P.passive+'</small>';
 const img=b.querySelector('img');img.src=url(P.portrait);img.style.objectFit='cover';img.style.objectPosition='50% 12%';
 const tag=document.createElement('span');tag.className='r1046tag';tag.textContent='HIDDEN';b.appendChild(tag);
 b.onclick=ev=>{try{ev?.stopPropagation?.();want=true;const h=ref.parentElement?.querySelector('[data-hero="'+P.base+'"]');synthetic=true;try{h?.click();}finally{synthetic=false;want=true;}setTimeout(mark,0);}catch(e){fail(e);}};stats.cards++;return b;}
function mark(){if(!hasDoc())return;for(const c of document.querySelectorAll('#panel [data-ego-r1046]')){const row=c.parentElement,h=row?.querySelector('[data-hero="'+P.base+'"]');const sel=want&&!!h&&(h.classList.contains('selected')||c.classList.contains('selected'));c.classList.toggle('selected',sel);if(sel)h.classList.remove('selected');}
 const st=document.getElementById('r263Stage');if(!st)return;
 if(want&&!st.classList.contains('r1046')){st.classList.add('r1046');st.style.setProperty('--c',P.color);const nm=st.querySelector('.nm'),role=st.querySelector('.role'),img=st.querySelector('.pt img'),info=st.querySelector('.info');
  if(nm)nm.textContent=P.name;if(role)role.textContent=P.role;if(img){img.onerror=null;img.src=url(P.portrait);img.alt=P.name;}
  if(info){for(const r of info.querySelectorAll('.row'))r.remove();const tags=info.querySelector('.tags');if(tags)tags.innerHTML=P.tags.map(x=>'<span>'+x+'</span>').join('');
   const add=(cls,html)=>{const p=document.createElement('p');p.className='row '+cls;p.innerHTML=html;info.appendChild(p);};
   for(const line of P.record)add('rec',line);add('pas','<b>패시브</b>'+P.passive);add('q','<b>Q</b>'+P.special);add('seal',P.sealed);}
  stats.stagePatched++;}
 else if(!want&&st.classList.contains('r1046')){st.classList.remove('r1046');st.dataset.hero='';}}
function inject(){const panel=document.getElementById('panel');if(!panel)return;
 const rows=[];const sr=panel.querySelector('#heroRowR101 .heroRowR101');if(sr)rows.push([sr,true]);const cs=panel.querySelector('.cards');if(cs&&cs.querySelector('[data-hero]'))rows.push([cs,false]);
 for(const[row,start]of rows){const h=row.querySelector('[data-hero="'+P.base+'"]');if(!h)continue;let c=row.querySelector('[data-ego-r1046]');
  if(!unlocked()){if(c)c.remove();continue;}
  if(!c){c=card(h,start);h.insertAdjacentElement('afterend',c);}}
 mark();}
function onClick(ev){try{const el=ev.target?.closest?.('#panel [data-hero],#chooseHero,#slotConfirmR73');if(!el)return;
 if(el.id==='chooseHero'||el.id==='slotConfirmR73'){const sel=document.querySelector('#panel [data-ego-r1046].selected');commit=!!(sel&&want);if(commit)stats.chosen=(stats.chosen||0)+1;return;}
 if(!synthetic&&!ev.target.closest('[data-ego-r1046]'))want=false;}catch(e){fail(e);}}
function cutin(){if(!cutinQueued||!hasDoc())return;if(G(()=>loading||storyScene||modal,true))return;if(document.getElementById('r1046Cutin'))return;cutinQueued=false;stats.cutins++;css();
 const d=document.createElement('div');d.id='r1046Cutin';d.innerHTML='<b>'+P.title+'</b><img alt="EGO"><p></p>';d.querySelector('img').src=url(P.cutin.image);d.querySelector('p').textContent=P.cutin.caption;
 const close=()=>{try{d.remove();if(typeof toast==='function')toast('히든 영웅 해금 · '+P.title+' — 영웅 선택창의 환도 옆에서 고를 수 있습니다.',4);}catch(_){}};d.onclick=close;document.body.appendChild(d);setTimeout(close,P.cutin.seconds*1000);}
function ui(){if(!hasDoc())return;const t=Date.now();if(t<uiAt)return;uiAt=t+200;
 try{if(commit!=null&&!G(()=>loading,true)&&G(()=>started,false)){const p=pl();if(p){const on=commit&&p.hero===P.base;setForm(on);if(on){if(typeof toast==='function')toast(P.title+' · '+P.hint,4);}commit=null;want=false;}}}catch(e){fail(e);}
 try{if(document.getElementById('panel')?.querySelector('[data-hero]')){css();inject();}}catch(e){fail(e);}
 try{cutin();}catch(e){fail(e);}}
// ---- 전장 그림(임시): 형상 중 몸 뒤 붉은 R100 손그림 오라 + 관측 폐기 순간 바닥 소용돌이 1회 ----
const AURA='assets/r100/sig-aura-red.webp',GATHER=OD.fx.sheet,asked=new Map();
function image(path){try{const r=typeof readyImage==='function'?readyImage(path):null;if(r?.image)return r.image;const t=Date.now();if(t-(asked.get(path)||0)>1500){asked.set(path,t);if(typeof addImage==='function')addImage(path,'R1046 EGO');}}catch(e){fail(e);}return null;}
function paint(target){const p=pl(),t=now();if(!p||t==null||typeof project!=='function')return;const q=project(p.x,p.y),h=G(()=>actorHeight(),60),lift=clamp(Number(p.visualLiftPx)||0,0,h*.65);
 if(![q?.x,q?.y,h].every(fin)||h<=0)return;const A=image(AURA),Gt=image(GATHER),draw=target.drawImage;if(typeof draw!=='function')return;
 const put=(im,S,fr,cx,cy,w,hh,alpha,blend)=>{const x=cx-w/2,y=cy-hh/2;if(![x,y,w,hh,alpha].every(fin)||w<=0||hh<=0)return;target.save();try{target.globalCompositeOperation=blend;target.filter='none';target.globalAlpha=clamp(alpha,0,1);draw.call(target,im,fr*S,0,S,S,x,y,w,hh);}finally{target.restore();}};
 const y=q.y-lift;if(A){const fr=((Math.floor(t*10)%12)+12)%12,s=h*2.05;put(A,160,fr,q.x,y-h*.34,s,s,.42,'source-over');put(A,160,fr,q.x,y-h*.34,s,s,.22,'lighter');stats.auraDraws++;}
 const age=t-fxAt;if(Gt&&age>=0&&age<OD.fx.life){const g=Math.min(11,Math.floor(age/OD.fx.life*12));put(Gt,192,g,q.x,y-h*.02,h*2.6,h*1.3,.85,'source-over');put(Gt,192,g,q.x,y-h*.02,h*2.6,h*1.3,.45,'lighter');}}
function wrapScope(){const DC=window.StoryPhase1?.DrawCommands;if(!DC?.prototype)return;if(!DC.prototype.scope?.__r1046){const base=DC.prototype.scope;if(typeof base!=='function')return;
  const w=function(owner,fn){let own=false;try{own=formActive()&&typeof owner?.id==='string'&&/^hero:/.test(owner.id);}catch(_){}if(!own)return base.call(this,owner,fn);const self=this;
   return base.call(this,owner,function(...a){try{paint(self);}catch(e){fail(e);}return fn.apply(this,a);});};w.__r1046=true;DC.prototype.scope=w;}
 try{const c=typeof ctx!=='undefined'?ctx:null;if(c&&Object.prototype.hasOwnProperty.call(c,'scope')&&!c.scope.__r1046)c.scope=DC.prototype.scope;}catch(_){}}
// 선택창 형상일 때 HUD 이름·초상(RC151 변신 중에는 RC151 이 정한 그대로)
function wrapHUD(){if(typeof updateHUD!=='function'||updateHUD.__r1046)return;const base=updateHUD;const w=function(...a){const r=base.apply(this,a);try{if(formActive()&&!rcActive()&&hasDoc()){const n=document.getElementById('heroName');if(n&&n.textContent!==P.title)n.textContent=P.title;const pt=document.getElementById('portrait'),u=url(P.portrait);if(pt&&pt.getAttribute('src')!==u)pt.src=u;}}catch(e){fail(e);}return r;};w.__r1046=true;updateHUD=w;}
let wrapAt=0;
function install(){wrapSave();wrapTick();wrapHUD();try{wrapScope();}catch(e){fail(e);}if(hasDoc()){try{document.addEventListener('click',onClick,true);}catch(e){fail(e);}}
 if(typeof setInterval==='function')setInterval(()=>{try{wrapSave();wrapTick();wrapHUD();if(Date.now()>wrapAt){wrapAt=Date.now()+2000;wrapScope();}if(hasDoc()&&!G(()=>started,false))ui();}catch(e){fail(e);}},500);}
install();
window.__STORYWORLD_EGO_SOVEREIGN_R1046__=Object.freeze({revision:REV,data:D,field:FIELD,unlocked,unlock,active,formActive,setForm,present,discard,samongCleared,
 refresh:()=>{try{if(hasDoc()&&document.getElementById('panel')?.querySelector('[data-hero]')){css();inject();}}catch(e){fail(e);}}, // R1057: 창을 다시 그린 즉시 EGO 칸을 다시 끼움(200ms 기다림 없이)

 lock(){saved={on:false,off:false};persist();},set(v){saved.off=v===false||v==='off';persist();return !saved.off;},
 inspect:()=>({revision:REV,unlocked:unlocked(),saved:{...saved},active:active(),form:formActive(),rc151:rcActive(),pending:pending?{...pending}:null,cdUntil,cutinQueued,want,commit,stats:{...stats},lastError})});
})();
