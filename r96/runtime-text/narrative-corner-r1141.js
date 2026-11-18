// R1141 서사 글 오른쪽 아래 상자 — 사용자 2026-11-18 "오른쪽아래 초록원그린곳에 서사 텍스트 나오게 나머지부분은 전투화면으로
//  서사텍스트끄기도 설정안에 바로보이게 전투에집중할수있게 개선" (아이폰 세로 스크린샷, 초록 원 = HP·MP 구슬 오른쪽, 회피·배치 단추 아래, 아래 키 안내줄 위).
//  ① 화면 가운데·아래·위에 뜨던 서사 글(생존 자막 #r600Subs, 영화 모드 자막 #r370Subs, 곡 소개 쪽지 #r331BgmNote)을
//     오른쪽 아래 작은 상자(#r1141Narr) 하나에만 보여 준다. 원래 칸은 visibility 로만 감추고(글·시간·음성은 원래 모듈 그대로) 글을 그대로 옮겨 적는다.
//     상자 자리는 실제 화면의 영웅 구슬 카드·회피/배치 동그라미·본진 단추·아래 안내줄(폰), 아래 단축칸·패시브 강화 줄(PC)을 재서 피한다.
//     긴 글은 상자 안에서 천천히 위로 흐른다(상자를 키워 전투 화면을 덮지 않는다).
//  ② 설정 창 맨 위(제목 줄, 닫기 옆)에 '서사 텍스트 켜짐/꺼짐' 단추. R1021 '서사 자막'과 같은 설정(storyworld.r1021.combat.subs)을 쓴다.
//  · 전체 영화 화면(R376 r376cine, 전투 UI 없이 보는 모드)은 원래 자막 그대로 둔다. 서사 글 내용은 바꾸지 않는다.
//  모듈 끄기: localStorage['storyworld.r1141.narr']={"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_NARR_CORNER_R1141__)return;
const REV='R1141-narr-corner-1',KEY='storyworld.r1141.narr';
const stats={ticks:0,shown:0,texts:0,layouts:0,toggles:0,btn:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const doc=()=>typeof document!=='undefined'?document:null;
const $=id=>{try{return doc()?.getElementById(id)||null;}catch(_){return null;}};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const fin=(v,d=0)=>Number.isFinite(+v)?+v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const C1021=()=>G(()=>window.__STORYWORLD_UI_COMBAT_R1021__,null);
const subsOn=()=>{const C=C1021();if(!C)return true;return G(()=>C.prefs().subs!==false,true);};
function setSubs(v){try{const C=C1021();if(!C||typeof C.set!=='function')return null;const r=C.set('subs',!!v);stats.toggles++;
 // R1021 설정 묶음의 '서사 자막' 칸도 같이 맞춘다(그 칸은 바꿀 때만 다시 그려진다)
 const i=doc()?.querySelector?.('#combatScreenR1021 input[data-r1021="subs"]');if(i)i.checked=!!r;
 tick();btnSync();return r;}catch(e){fail(e);return null;}}
const mobile=()=>G(()=>!!window.__STORYWORLD_MOBILE_R63__?.isMobile?.(),false);
// ① 자리 계산(문서 없이 숫자만) -----------------------------------------------------------------
//  o={vw,vh,phone,hero,btns:[...],shelf,stage,footer,hotbar,footRight} (모두 {left,top,right,bottom})
//  돌려줌 {left,width,bottom(화면 아래에서),maxHeight}
function place(o){o=o||{};const vw=Math.max(0,fin(o.vw)),vh=Math.max(0,fin(o.vh));const gap=6,MIN=44;
 const R=r=>r&&[r.left,r.top,r.right,r.bottom].every(Number.isFinite)&&r.right>r.left&&r.bottom>r.top?r:null;
 const footer=R(o.footer),footRight=R(o.footRight),stage=R(o.stage),shelf=R(o.shelf),hero=R(o.hero);
 const btns=(Array.isArray(o.btns)?o.btns:[]).map(R).filter(Boolean);
 let left,right,floor,top;
 if(!o.phone&&footer){
  // PC: 아래 줄(단축칸·패시브 강화) 바로 위, 오른쪽 끝 정렬
  right=Math.min(footRight?footRight.right:vw-18,vw-8);floor=footer.top-8;
  const w=clamp(vw*0.26,240,380);left=Math.max(8,right-w);
  const cap=Math.min(clamp(vh*0.2,60,180),vh/3);top=Math.max(floor-cap,Math.min(floor-MIN,(stage?stage.top:0)+8));
 }else{
  // 폰: 영웅 구슬 카드 오른쪽 ~ 화면 오른쪽, 동그라미 단추 아래 ~ 아래 안내줄 위
  right=vw-8;floor=Math.min(vh,shelf?shelf.top:vh,stage?stage.bottom:vh)-gap;
  left=hero&&hero.right<vw*0.6?hero.right+8:8;
  const cap=clamp(vh*0.16,56,140);
  const col=btns.filter(b=>b.left<right&&b.right>left&&b.bottom<=floor+gap);
  const ceil=col.length?Math.max(...col.map(b=>b.bottom))+gap:-Infinity;
  if(floor-ceil>=MIN)top=Math.max(ceil,floor-cap);
  else{ // 동그라미 줄 아래에 자리가 없으면(가로 화면) 동그라미 왼쪽으로
   right=Math.min(...col.map(b=>b.left))-8;top=floor-cap;
   const hit=btns.filter(b=>b.left<right&&b.right>left&&b.bottom>top&&b.top<floor);if(hit.length)right=Math.min(...hit.map(b=>b.left))-8;}
  left=Math.max(left,right-420);
 }
 const width=Math.max(0,right-left),maxHeight=Math.max(0,floor-top),bottom=vh-floor;
 return {left:Math.round(fin(left)),width:Math.round(fin(width)),bottom:Math.round(fin(bottom)),maxHeight:Math.round(fin(maxHeight))};}
// 화면에서 막는 것들을 잰다 -----------------------------------------------------------------------
function vis(e){try{if(!e||!e.isConnected)return null;if(e.checkVisibility&&!e.checkVisibility({visibilityProperty:true}))return null;
 const r=e.getBoundingClientRect();return r.width>1&&r.height>1?{left:r.left,top:r.top,right:r.right,bottom:r.bottom}:null;}catch(_){return null;}}
function gather(){const d=doc();const q=s=>{try{return d.querySelector(s);}catch(_){return null;}};
 const footer=vis(q('footer')),phone=mobile()||!footer;
 return {vw:G(()=>innerWidth,0),vh:G(()=>innerHeight,0),phone,hero:vis($('heroCard')),
  btns:['touchActionsR100','touchUse','r1124TouchHomeBtn'].map(id=>vis($(id))).filter(Boolean),
  shelf:vis($('noticeShelfR63R2')),stage:vis($('stage')),footer,hotbar:vis(q('footer .hotbar')),footRight:vis(q('footer .footRight'))};}
// 상자 -----------------------------------------------------------------------------------------
const CSS=[
 // 원래 칸은 자리만 남기고 감춘다(display 는 그대로 — R1021·R1037 끄기 검사가 display 를 본다)
 'body.r1141Take #r600Subs,body.r1141Take:not(.r376cine) #r370Subs,body.r1141Take #r331BgmNote{visibility:hidden!important}',
 '#r1141Narr{position:fixed;z-index:8995;pointer-events:none;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-end;opacity:0;transition:opacity .35s ease;contain:layout paint}',
 '#r1141Narr.on{opacity:1}#r1141Narr[hidden]{display:none!important}',
 '#r1141Narr .w{box-sizing:border-box;max-height:100%;display:flex;flex-direction:column;padding:5px 9px 6px;border-radius:5px;background:linear-gradient(180deg,rgba(10,8,10,.58),rgba(8,6,8,.76));box-shadow:0 0 0 1px rgba(184,154,94,.28) inset,0 2px 8px rgba(0,0,0,.35);overflow:hidden}',
 '#r1141Narr .n{flex:0 0 auto;font-size:10px;letter-spacing:.08em;color:#8fd4c8;opacity:.9;line-height:1.3;margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#r1141Narr .n:empty{display:none}',
 '#r1141Narr .sc{flex:1 1 auto;min-height:0;overflow:hidden}',
 // 글이 위로 흐를 때 윗줄이 칼로 자른 듯 잘려 보이지 않게 위쪽 8px 을 옅게
 '#r1141Narr .sc.flow{-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 9px);mask-image:linear-gradient(180deg,transparent 0,#000 9px)}',
 '#r1141Narr .t{display:block;font-size:12px;line-height:1.42;color:#efe6d6;text-align:left;text-shadow:0 1px 2px #000;word-break:keep-all;overflow-wrap:anywhere}',
 '#r1141Narr.music .n{color:#d8b86a}#r1141Narr.music .t{color:#e3d5b6;font-size:11px}',
 '#r1141Narr.pc .w{padding:7px 12px 8px}#r1141Narr.pc .n{font-size:11px}#r1141Narr.pc .t{font-size:14px;line-height:1.5}#r1141Narr.pc.music .t{font-size:12.5px}',
 // ② 설정 맨 위 단추
 '#r1141NarrBtn{position:absolute;z-index:3;display:inline-flex;align-items:center;gap:6px;padding:0 12px;border-radius:16px;font-size:12.5px;cursor:pointer;white-space:nowrap;color:#f2e6c8;background:rgba(32,26,18,.86);border:1px solid rgba(214,180,110,.7);box-shadow:none;letter-spacing:.02em}',
 '#r1141NarrBtn i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#7fe0d0;box-shadow:0 0 6px rgba(127,224,208,.8)}',
 '#r1141NarrBtn[aria-pressed="false"]{color:#cfc4ae;background:rgba(40,34,30,.7);border-color:rgba(160,140,110,.55)}#r1141NarrBtn[aria-pressed="false"] i{background:#6b625a;box-shadow:none}'
].join('\n');
let boxEl=null,nEl=null,tEl=null,scEl=null,shownKey='',shownAt=0,lastPlace=null;
function style(){try{const d=doc();if(d&&d.head&&!$('r1141Style')){const st=d.createElement('style');st.id='r1141Style';st.textContent=CSS;d.head.appendChild(st);}}catch(e){fail(e);}}
function box(){try{if(boxEl&&boxEl.isConnected)return boxEl;const d=doc();if(!d||!d.body)return null;
 boxEl=d.createElement('div');boxEl.id='r1141Narr';boxEl.setAttribute('aria-live','polite');boxEl.hidden=true;
 const w=d.createElement('div');w.className='w';nEl=d.createElement('span');nEl.className='n';scEl=d.createElement('div');scEl.className='sc';tEl=d.createElement('span');tEl.className='t';
 scEl.appendChild(tEl);w.appendChild(nEl);w.appendChild(scEl);boxEl.appendChild(w);d.body.appendChild(boxEl);return boxEl;}catch(e){fail(e);return null;}}
const started_=()=>G(()=>!!started&&!loading,false);
const panelOpen=()=>{const p=$('panel');return !!(p&&vis(p));};
const blocked=()=>G(()=>!!modal,false)||!!doc()?.body?.classList?.contains('r600Modal')||panelOpen();
// 지금 보여 줄 글: 영화 자막 > 생존 자막 > 곡 소개 쪽지
function source(){const b=doc()?.body;const cine=!!b?.classList?.contains('r376cine');
 const rd=(id)=>{const e=$(id);if(!e||!e.classList.contains('on')||e.classList.contains('away'))return null;const t=(e.querySelector('.t')?.textContent||'').trim();if(!t)return null;return {n:(e.querySelector('.n')?.textContent||'').trim(),t,kind:'subs'};};
 if(!cine){const c=rd('r370Subs');if(c)return c;}
 const s=rd('r600Subs');if(s)return s;
 const m=$('r331BgmNote');if(m&&m.style&&m.style.opacity==='1'){const t=(m.textContent||'').replace(/^\s*♪\s*/,'').trim();if(t)return {n:'♪ 음악',t,kind:'music'};}
 return null;}
function layout(){try{const b=box();if(!b)return;const g=gather(),p=place(g);lastPlace={...p,phone:g.phone};
 b.classList.toggle('pc',!g.phone);
 b.style.left=p.left+'px';b.style.width=p.width+'px';b.style.bottom=p.bottom+'px';b.style.maxHeight=p.maxHeight+'px';b.style.height=p.maxHeight+'px';stats.layouts++;}catch(e){fail(e);}}
function tick(){try{stats.ticks++;const b=doc()?.body;if(!b)return;
 const take=on&&started_()&&!b.classList.contains('r376cine');b.classList.toggle('r1141Take',take);
 const bx=box();if(!bx)return;
 const src=take&&subsOn()&&!blocked()?source():null;
 if(!src){if(bx.classList.contains('on'))bx.classList.remove('on');if(!take||!subsOn())bx.hidden=true;return;}
 bx.hidden=false;const key=src.kind+'|'+src.n+'|'+src.t;
 if(key!==shownKey){shownKey=key;shownAt=G(()=>performance.now(),0);nEl.textContent=src.n;tEl.textContent=src.t;bx.classList.toggle('music',src.kind==='music');scEl.scrollTop=0;stats.texts++;layout();}
 if(!bx.classList.contains('on')){bx.classList.add('on');stats.shown++;}
 // 긴 글은 1.4초 머문 뒤 초당 18px 로 위로 흐른다
 const over=scEl.scrollHeight-scEl.clientHeight;scEl.classList.toggle('flow',over>0&&scEl.scrollTop>0);if(over>0){const dt=(G(()=>performance.now(),0)-shownAt-1400)/1000;scEl.scrollTop=clamp(dt*18,0,over);}
}catch(e){fail(e);}}
// ② 설정 맨 위 단추 -----------------------------------------------------------------------------
function btnSync(){try{const bt=$('r1141NarrBtn');if(!bt)return;const v=subsOn();bt.setAttribute('aria-pressed',v?'true':'false');
 const s=bt.querySelector('span');const lab='서사 텍스트 '+(v?'켜짐':'꺼짐');if(s&&s.textContent!==lab)s.textContent=lab;
 bt.title=v?'누르면 서사 글을 끄고 전투 화면만 봅니다':'누르면 서사 글을 오른쪽 아래 상자에 다시 보입니다';}catch(e){fail(e);}}
function settingsBtn(){try{if(!on)return false;const panel=$('panel');if(!panel)return false;const h2=panel.querySelector('h2');if(!h2||!/설정/.test(h2.textContent||''))return false;
 let bt=$('r1141NarrBtn');const d=doc();
 if(!bt){bt=d.createElement('button');bt.type='button';bt.id='r1141NarrBtn';const i=d.createElement('i');const s=d.createElement('span');bt.appendChild(i);bt.appendChild(s);
  bt.onclick=ev=>{try{ev?.preventDefault?.();ev?.stopPropagation?.();}catch(_){}setSubs(!subsOn());};stats.btn++;}
 if(bt.parentNode!==panel||bt.nextElementSibling!==h2)panel.insertBefore(bt,h2);
 // 제목 줄(닫기 단추와 같은 높이), 닫기 왼쪽에 둔다
 const pr=panel.getBoundingClientRect(),cl=$('settingsClose'),cr=cl?vis(cl):null,hr=h2.getBoundingClientRect();
 const top=(cr?cr.top:hr.top)-pr.top+panel.scrollTop,h=cr?cr.bottom-cr.top:Math.max(30,hr.height);
 bt.style.top=Math.round(top+Math.max(0,(h-32)/2))+'px';bt.style.height='32px';bt.style.right=Math.round(cr?pr.right-cr.left+8:52)+'px';
 btnSync();return true;}catch(e){fail(e);return false;}}
const later=(f,ms)=>{try{setTimeout(()=>{try{f();}catch(e){fail(e);}},ms);}catch(e){fail(e);}};
if(doc()&&doc().head){style();box();
 try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{settingsBtn();later(settingsBtn,0);later(settingsBtn,120);later(settingsBtn,480);}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
 try{setInterval(tick,150);setInterval(layout,600);setInterval(btnSync,400);addEventListener('resize',()=>{layout();later(settingsBtn,60);});}catch(e){fail(e);}}
window.__STORYWORLD_NARR_CORNER_R1141__=Object.freeze({revision:REV,KEY,CSS,place,gather,source,tick,layout,settingsBtn,setSubs,subsOn,
 on:()=>on,enable(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}tick();return on;},
 inspect:()=>({revision:REV,on,subs:subsOn(),place:lastPlace,shown:!!(boxEl&&boxEl.classList.contains('on')&&!boxEl.hidden),text:tEl?tEl.textContent:'',stats:{...stats},lastError})});
})();
