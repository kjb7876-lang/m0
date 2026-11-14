// R1021 전투 화면 집중 — 사용자 2026-11-14 "가운데 체력바로 정화구슬 체력알게하고 맨위에쪽 특히 황금실메뉴 삭제 그리고 아래 동그라미들은 모두 키고 끌수있도록
//  … 서사텍스트도 키고끌수있도록 전투화면에 집중하게 대신 영웅배치 키 생성 - 오른쪽아래있는것들 제거하고", "피시에서도 생존모드 서사텍스트 키고끌수있도록 확실하게",
//  "영웅배치하나 추가+ 나머지는 다없애고 블링크키만 남겨 나머지는 자동발동하게하고", "설정안에서 어떤효과가적용되는지 설정들어가면 바로 스킬창보이게".
//  ① 위쪽 황금실 제작·연속 줄(#goldHudR72)을 숨긴다 — 같은 기능은 메뉴의 R339 묶음(proxy:goldHud*)에 그대로 남는다.
//  ② 가운데 정화 구슬 체력: 구슬 위 막대에 '정화 구슬 n/m' 이름표(survival-r600 이 on() 을 보고 그림), 위쪽 HUD 의 같은 막대는 숨긴다(중복).
//  ③ 폰 아래 단추: 회피(블링크) + 영웅 배치(무한 생존은 R720 배치 창, 그 밖은 영웅 선택창) 둘만. 기술(Q)·EGO(F)는 재사용이 끝나고 가까이 적이 있으면 저절로 나간다(설정에서 끄면 단추가 돌아옴).
//  ④ 오른쪽 아래 상호작용 단추(#touchUse, '이전 시작점' 등)는 무한 생존·영화 모드에서 숨긴다. 이야기 모드는 문·제단을 여는 데 필요해 남긴다.
//  ⑤ 설정을 열면 맨 위에 스킬창(지금 영웅의 기술·패시브·강화와 무엇이 자동인지), 바로 아래 '전투 화면' 묶음(서사 자막·화면 단추·자동 발동 켜고 끄기).
//  서사 글 자체는 바꾸지 않는다(자막을 보이느냐만). 단추 id·엔진 함수(special·ego·blink·showHeroes)는 그대로 쓴다.
//  설정 저장 localStorage['storyworld.r1021.combat']={subs,buttons,autoSkills}, 모듈 끄기 {"on":false}.
(()=>{'use strict';
if(window.__STORYWORLD_UI_COMBAT_R1021__)return;
const REV='R1021-combat-1',KEY='storyworld.r1021.combat';
const DEF=Object.freeze({subs:true,buttons:true,autoSkills:true});
const stats={applied:0,tagged:0,heroBtn:0,heroOpen:0,placeOpen:0,heroBlocked:0,autoSpecial:0,autoEgo:0,skills:0,section:0,toggles:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const $=id=>document.getElementById(id);
let on=true;const P={...DEF};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'){if(s.on===false)on=false;for(const k of Object.keys(DEF))if(typeof s[k]==='boolean')P[k]=s[k];}}catch(_){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({on,...P}));}catch(_){}};
const mobile=()=>{try{return !!window.__STORYWORLD_MOBILE_R63__?.isMobile?.();}catch(_){return false;}};
/* started·loading·modal·storyScene·player 는 게임 스크립트의 최상위 let 이라 window 에 없다 — 이름으로 바로 읽는다 */
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const playing=()=>G(()=>!!started&&!loading&&!modal&&!storyScene&&!!player&&player.hp>0,false);
const survival=()=>!!document.body?.classList?.contains('r600On');
const cinema=()=>!!document.body?.classList?.contains('r370Cinema');
const CSS=[
 // ① 위쪽 황금실 줄
 'body.r1021On #goldHudR72{display:none!important}',
 // ② 위쪽 HUD 의 구슬 막대(구슬 위 이름표 막대와 중복)
 'body.r1021On.r600On #r600Hud .c{display:none!important}',
 // ④ 오른쪽 아래 상호작용 단추 — 생존·영화에서만
 'body.r1021On.r600On #touchUse,body.r1021On.r370Cinema #touchUse{display:none!important}',
 // 서사 자막 끄기(생존 r600Subs·영화 r370Subs)
 'body.r1021On.r1021SubsOff #r600Subs,body.r1021On.r1021SubsOff #r370Subs{display:none!important}',
 // ③ 아래 동그라미: 끄면 모두 숨김, 자동 발동이면 기술·EGO 단추 숨김
 'body.r1021On.r1021BtnOff #touchActionsR100{display:none!important}',
 'body.r1021On.r1021Auto #touchActionsR100 button[data-r1021="special"],body.r1021On.r1021Auto #touchActionsR100 button[data-r1021="ego"]{display:none!important}',
 // 폰: 자막 상자가 오른쪽 아래 동그라미(회피·영웅)를 덮지 않게 왼쪽으로 좁힌다
 'body.r1021On.mobile-live-r63:not(.r1021BtnOff) #r600Subs,body.r1021On.mobile-live-r63:not(.r1021BtnOff) #r370Subs{left:calc(50% - 38px);width:calc(100vw - 108px)}',
 '#touchActionsR100 #r1021Hero img{inset:4px;width:46px;height:46px;border-radius:50%;object-fit:cover;object-position:50% 18%;opacity:.95}',
 // 설정 창이 열린 동안 생존 위쪽 글줄이 창 제목을 덮지 않게
 'body.r1021On.r600Modal:has(#r1021Skills) #r600Hud{display:none!important}',
 // ⑤ 설정 맨 위 스킬창과 '전투 화면' 묶음
 '#r1021Skills{margin:4px 0 12px;padding:10px 12px;border-radius:8px;background:linear-gradient(180deg,rgba(24,30,34,.92),rgba(12,16,19,.92));box-shadow:0 0 0 1px rgba(184,154,94,.35) inset;text-align:left}',
 '#r1021Skills h3,#combatScreenR1021 h3{margin:0 0 6px;font-size:13px;letter-spacing:.06em;color:#e6c27a}',
 '#r1021Skills .who{font-size:13px;color:#efe6d6;margin-bottom:6px}#r1021Skills .who b{color:#f4dca0}',
 '#r1021Skills ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;gap:3px 22px}',
 '#r1021Skills li{display:flex;gap:8px;align-items:baseline;font-size:12px;line-height:1.45;color:#d9cfbd}',
 '#r1021Skills li .k{flex:0 0 auto;min-width:64px;color:#9fd8cc}#r1021Skills li .v{flex:1 1 auto}',
 '#r1021Skills li .m{flex:0 0 auto;font-size:11px;padding:0 6px;border-radius:9px;background:rgba(127,224,208,.16);color:#9ff0e0}#r1021Skills li .m.hand{background:rgba(230,194,122,.16);color:#f0d49a}',
 '#r1021Skills .up{margin-top:6px;font-size:11px;color:#bfb39c}',
 '#combatScreenR1021{margin:0 0 12px;padding:8px 12px;border-radius:8px;background:rgba(10,12,14,.55);box-shadow:0 0 0 1px rgba(143,212,200,.22) inset;text-align:left}',
 '#combatScreenR1021 .r1021-row{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px;color:#efe6d6}#combatScreenR1021 .r1021-row small{color:#a99f8e;font-size:11px}',
 '@media (min-width:720px){#r1021Skills ul{grid-template-columns:1fr 1fr}}'
].join('\n');
function style(){try{if(!$('r1021Style')&&document.head){const st=document.createElement('style');st.id='r1021Style';st.textContent=CSS;document.head.appendChild(st);}}catch(e){fail(e);}}
function flags(){try{const c=document.body?.classList;if(!c)return;c.toggle('r1021On',on);c.toggle('r1021SubsOff',on&&!P.subs);c.toggle('r1021BtnOff',on&&!P.buttons);c.toggle('r1021Auto',on&&P.autoSkills&&mobile());}catch(e){fail(e);}}
// ③ 폰 아래 단추: 기존 단추에 이름표를 달고 영웅 단추를 하나 붙인다 ---------------------------------
const TAGS={'회피':'blink','기술':'special','EGO':'ego'};
const heroId=()=>G(()=>player.hero,'hwando');
const portrait=id=>{const p='assets/r108/heroes/'+id+'.webp';try{return typeof urlFor==='function'?urlFor(p):p;}catch(_){return p;}};
// 무한 생존에서는 '영웅 배치'(R720, PC 의 I 키·위쪽 '배치' 단추와 같은 창), 그 밖의 모드에서는 영웅 선택창(R263)
const placeMode=()=>{try{return survival()&&!!window.__STORYWORLD_HERO_DEFENSE_R720__?.enabled?.();}catch(_){return false;}};
function openHero(){try{if(placeMode()){const D=window.__STORYWORLD_HERO_DEFENSE_R720__;if(D.open()){stats.placeOpen++;return true;}stats.heroBlocked++;if(typeof toast==='function')toast('지금은 영웅 배치 창을 열 수 없습니다.',2);return false;}
 const H=window.__STORYWORLD_HERO_SELECT_R263__;if(H&&H.canOpen&&H.canOpen()){stats.heroOpen++;H.open();return true;}
  stats.heroBlocked++;if(typeof toast==='function')toast('지금은 영웅 선택창을 열 수 없습니다(장면·로딩 중).',2);return false;}catch(e){fail(e);return false;}}
function buttons(){try{const box=$('touchActionsR100');if(!box)return false;
 for(const b of box.querySelectorAll('button')){const t=TAGS[b.getAttribute('aria-label')];if(t&&b.dataset.r1021!==t){b.dataset.r1021=t;stats.tagged++;}}
 let h=$('r1021Hero');if(!h){h=document.createElement('button');h.id='r1021Hero';h.type='button';h.setAttribute('aria-label','영웅');h.dataset.r1021='hero';
  const img=document.createElement('img');img.alt='';h.appendChild(img);const sp=document.createElement('span');sp.textContent='영웅';h.appendChild(sp);
  h.onclick=ev=>{try{ev?.preventDefault?.();ev?.stopPropagation?.();}catch(_){}openHero();};stats.heroBtn++;}
 if(h.parentNode!==box||box.lastElementChild!==h)box.appendChild(h);
 const pm=placeMode(),lab=pm?'배치':'영웅',sp=h.querySelector('span');if(sp&&sp.textContent!==lab){sp.textContent=lab;h.setAttribute('aria-label',pm?'영웅 배치':'영웅');h.title=pm?'영웅 배치 창 열기 (I)':'영웅 선택창 열기';}
 const img=h.querySelector('img'),id=heroId();if(img&&img.dataset.hero!==id){img.dataset.hero=id;img.src=portrait(id);}
 return true;}catch(e){fail(e);return false;}}
// ③ 자동 발동(폰): 기술(Q)·EGO(F). 엔진 함수를 그대로 부른다(조건이 안 맞으면 엔진이 그냥 돌아간다) --------
const AUTO_RANGE=8;
function autoTick(){try{if(!on||!P.autoSkills||!mobile()||cinema()||!playing())return 0;
 const e=G(()=>nearestEnemy(AUTO_RANGE),null);if(!e)return 0;let n=0;
 if(G(()=>player.specialCD<=0,false)&&typeof special==='function'){special();if(G(()=>player.specialCD>0,false)){stats.autoSpecial++;n++;}}
 // EGO 는 공명 30 이 있을 때만 — 없을 때 부르면 엔진이 '공명 30 필요' 쪽지를 띄우므로 미리 거른다
 if(G(()=>player.egoCD<=0&&!(player.ego>0)&&!(player.samong>0)&&player.resonance>=30,false)&&typeof ego==='function'){ego();if(G(()=>player.ego>0||player.egoCD>0,false)){stats.autoEgo++;n++;}}
 return n;}catch(e){fail(e);return 0;}}
// ⑤ 설정 맨 위 스킬창 --------------------------------------------------------------------------
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
function rows(){const id=heroId(),H=G(()=>HEROES[id],null)||{},mob=mobile(),auto=on&&P.autoSkills&&mob;
 const semi=G(()=>!!window.__STORYWORLD_SEMI_AUTO_R705__?.enabled?.(),false);
 const cd=k=>{const v=G(()=>+player[k],0);return Number.isFinite(v)&&v>0?'재사용 '+v.toFixed(1)+'초':'준비됨';};
 const res=Math.max(0,Math.floor(G(()=>+player.resonance,0)||0));
 return [
  ['기본 공격',((+H.range||0)>4?'원거리':'근거리')+(Number.isFinite(+H.range)&&+H.range>0?' · 사거리 '+(+H.range).toFixed(1)+'칸':'')+' · 가까운 적부터',semi?'자동':'직접',semi],
  ['Q 기술',(H.special||'특수기')+' · '+cd('specialCD'),auto?'자동':(mob?'단추':'Q 키'),auto],
  ['W·E·R','숙련 기술',semi?'자동':'직접',semi],
  ['F EGO','EGO 각성 · 공명 '+res+'/30 · '+cd('egoCD'),auto?'자동':(mob?'단추':'F 키'),auto],
  ['회피','블링크 · '+cd('blinkCD'),mob?'단추':'S 키',false],
  ['패시브',H.passive||'—','항상',true]].concat(survival()?[['영웅 배치','정화 결정으로 영웅을 사서 구슬 곁에 세움',mob?'단추':'I 키',false]]:[]);}
function upgrades(){try{const U=G(()=>UPGRADES,[])||[],have=G(()=>player.upgrades,{})||{};const key=u=>{try{return typeof upgradeKey==='function'?upgradeKey(u):u.id;}catch(_){return u.id;}};
 return U.map(u=>({name:u.name,lv:+(have[key(u)]||0),max:u.max})).filter(x=>x.lv>0);}catch(e){fail(e);return [];}}
function skills(){try{let s=$('r1021Skills');if(!s){s=el('section');s.id='r1021Skills';}
 while(s.firstChild)s.removeChild(s.firstChild);
 const id=heroId(),H=G(()=>HEROES[id],null)||{};
 s.appendChild(el('h3',null,'지금 적용 중인 기술'));
 const who=el('div','who');who.appendChild(el('b',null,H.name||id));who.appendChild(el('span',null,' · '+(H.resource||'')+(survival()?' · 무한 생존':'')));s.appendChild(who);
 const ul=el('ul');for(const[k,v,m,a]of rows()){const li=el('li');li.appendChild(el('span','k',k));li.appendChild(el('span','v',v));li.appendChild(el('span','m'+(a?'':' hand'),m));ul.appendChild(li);}s.appendChild(ul);
 const ups=upgrades();s.appendChild(el('div','up',ups.length?'강화: '+ups.map(u=>u.name+' '+u.lv+(u.max?'/'+u.max:'')).join(' · '):'강화: 아직 없음'));
 stats.skills++;return s;}catch(e){fail(e);return null;}}
function toggleRow(k,label,note){const row=el('label','r1021-row');const i=el('input');i.type='checkbox';i.dataset.r1021=k;i.checked=!!P[k];
 i.onchange=()=>{set(k,!!i.checked);};row.appendChild(i);row.appendChild(el('span',null,label));if(note)row.appendChild(el('small',null,note));return row;}
// 다른 덧씌움(R1022 자동 순간이동 줄 등)이 이 묶음에 붙인 줄은 남기고, 이 모듈이 만든 줄(r1021Own)만 다시 만든다
function section(){try{let s=$('combatScreenR1021');if(!s){s=el('section');s.id='combatScreenR1021';}
 for(const c of [...s.children])if(c.classList.contains('r1021Own'))s.removeChild(c);
 const mine=[el('h3','r1021Own','전투 화면'),toggleRow('subs','서사 자막','무한 생존·영화 모드 화면 글')];
 if(mobile())mine.push(toggleRow('buttons','화면 단추','회피·영웅 배치 동그라미'),toggleRow('autoSkills','기술·EGO 자동 발동','끄면 단추로 직접'));
 const first=s.firstElementChild;for(const m of mine){m.classList.add('r1021Own');s.insertBefore(m,first);}
 stats.section++;return s;}catch(e){fail(e);return null;}}
function settings(){try{if(!on)return false;const panel=$('panel');if(!panel)return false;
 const h2=panel.querySelector('h2');if(!h2||!/설정/.test(h2.textContent||''))return false;
 const sk=skills(),sec=section();if(!sk||!sec)return false;
 if(h2.nextElementSibling!==sk)panel.insertBefore(sk,h2.nextElementSibling);
 if(sk.nextElementSibling!==sec)panel.insertBefore(sec,sk.nextElementSibling);
 // R1022 자동 순간이동 줄은 R1022 가 먼저 읽혀 이 묶음이 생기기 전에 간이설정 끝에 붙는다 → 이 묶음으로 옮긴다(id·동작 그대로)
 const am=$('autoMoveR1022');if(am&&am.parentNode!==sec){sec.appendChild(am);stats.adopted=(stats.adopted||0)+1;}
 return true;}catch(e){fail(e);return false;}}
function set(k,v){if(!(k in DEF))return null;P[k]=!!v;stats.toggles++;save();flags();try{if($('r1021Skills'))skills();}catch(e){fail(e);}return P[k];}
function apply(){try{style();flags();if(on)buttons();stats.applied++;}catch(e){fail(e);}}
const later=(f,ms)=>{try{setTimeout(()=>{try{f();}catch(e){fail(e);}},ms);}catch(e){fail(e);}};
if(typeof document!=='undefined'&&document.head){style();flags();
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settings();later(settings,0);later(settings,90);later(settings,420);}catch(e){fail(e);}return r;};}
 try{setInterval(apply,700);}catch(e){fail(e);}
 try{setInterval(autoTick,200);}catch(e){fail(e);}
 later(apply,0);}
window.__STORYWORLD_UI_COMBAT_R1021__=Object.freeze({revision:REV,KEY,DEF,CSS,AUTO_RANGE,on:()=>on,prefs:()=>({...P}),set,apply,buttons,autoTick,skills,section,settings,openHero,
 enable(v){on=v!==false;save();flags();return on;},
 inspect:()=>({revision:REV,on,prefs:{...P},mobile:mobile(),stats:{...stats},lastError})});
})();
