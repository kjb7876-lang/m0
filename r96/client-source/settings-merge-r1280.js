// R1280 PC 설정창 겹치는 칸 합치기 — 사용자 2026-11-20 "pc 설정에서 겹치는 기능 하나로 모아줘 설정ui 간편화".
//  전수 조사(헤드리스, 묶음 모두 펼침 203칸)에서 같은 값을 두 칸 이상이 고치던 곳만 한 칸으로 모은다. 기능·기본값·저장 자리는 그대로다.
//   ① 서사 자막 칸(R1021 subs) = 제목 줄 '서사 텍스트' 단추(R1141, #771)와 같은 값 → 칸 숨김, 단추만 남김.
//   ② '서사 창 자동 넘기기'(R365) = '전투 화면' 서사 창(R1037) 반대값 → 옛 칸 숨김.
//   ③ '주운 쪽지 바로 펼치기'(R177)·'길잡이 중/직접 조작 중 쪽지 창'(R365) = '기억 조각·쪽지 창'(R1037) → 옛 칸 숨김.
//   ④ 엔진 '서사 음성 자동 재생' + R1223 '기억 조각·서사 음성 자동 재생' → '전투 화면'의 통합 칸 '서사 음성' 하나(둘 다 몬다, 기본 켜짐).
//   ⑤ R58 '손전등 주변 시야' 칸 = R182 '시야' 고르기의 일부 → 칸 숨김.
//   ⑥ R63 '가로·세로 표시 범위'(1~2) × R217 '시야 배율'(0.7~1) → 밀대 하나 '시야 범위'(0.7~2). 1 아래는 시야 배율, 1 위는 표시 범위가 맡는다.
//   ⑦ R114 '호러 분위기' + R123 '다크 판타지 톤'(둘 다 끔·약·보통·강, 기본 보통) → 한 줄 '분위기 세기'(둘 다 같은 단계로).
//   ⑧ 간이설정의 '사몽 구역 분위기' 사본 = 세부설정 R123 '사몽 구역 분위기' → 사본 숨김.
//   ⑨ R114 '몹·보스 스킬 고유색/보조색' + R100 '몹·보스 고유색 스킬 이펙트' → 통합 칸 하나.
//   ⑩ R137 '전투 중 몹이 늘 영웅을 봄' = R1043 '전투 중 서로 바라보기' 묶음에 이미 들어 있는데 남아 보였음 → 숨김.
//  저장값 이관: 통합 칸은 따로 저장하지 않고 원래 칸들의 값을 읽어 보여 준다. 원래 값이 서로 다르면 '일부'(체크 칸 indeterminate, 단계 줄은 아무것도 안 눌림)로 보이고
//   사용자가 통합 칸을 누르기 전까지 아무 값도 바꾸지 않는다(손실 없음). 누르면 숨은 원래 칸을 하나씩 같은 값으로 눌러 각 모듈이 제 자리에 저장한다.
//  옛 칸은 지우지 않고 숨기기만 한다(다른 모듈·검사가 그 칸을 찾음). 휴대폰 설정은 이번 범위가 아니라 손대지 않는다. 끄기: localStorage storyworld.r1280.merge = '0'.
(()=>{'use strict';
if(window.__STORYWORLD_SETTINGS_MERGE_R1280__)return;
const REV='R1280-settings-merge-2',HIDE='r1280Hidden';
const stats={builds:0,merged:0,clicks:0,errors:0};let lastError=null,applied=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let off=false;try{off=localStorage.getItem('storyworld.r1280.merge')==='0';}catch(_){}
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const r2=v=>Math.round(v*1000)/1000;
function splitView(v){const n=Number(v);if(!Number.isFinite(n))return {cam:1,view:1};const x=clamp(n,.7,2);return x<1?{cam:1,view:r2(x)}:{cam:r2(x),view:1};}
function joinView(cam,view){const c=Number.isFinite(+cam)?+cam:1,f=Number.isFinite(+view)?+view:1;return r2(clamp(c*f,.7,2));}
function state(vals){const a=(vals||[]).filter(v=>v!==undefined&&v!==null);if(!a.length)return null;if(a.every(v=>v===a[0]))return a[0]===true?'on':a[0]===false?'off':a[0];return 'mixed';}
function mobile(){try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return !!window.matchMedia?.('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<820;}catch(_){return false;}}
// 숨길 칸(선택자 → 그 칸이 든 줄). CSS :has 로도 숨겨 다른 모듈이 줄을 다시 그려도 숨은 채로 둔다.
const HIDE_SEL=['input[data-r1021="subs"]','#r365SkipStory','#r182Auto','#r365GuideFrag','#r365ManualFrag','input[data-setting="narration"]','#r1223Chk','#flashlightModeR58',
 '#viewFactorR217','[data-r114-api="c114"][data-r114-key="palette"]','#r100-signature','[data-r137="faceAlways"]','#r123QuickMood input'];
const CSS='.'+HIDE+'{display:none!important}'
 +HIDE_SEL.map(s=>'body.r1280On #panel label:has(> '+s+')').join(',')+'{display:none!important}'
 +'body.r1280On #flashlightHintR58,body.r1280On #panel label[for="cameraFactorR63"],body.r1280On #cameraFactorR63{display:none!important}'
 +'body.r1280On #panel .r114-row:has(> [data-r114-horror]),body.r1280On #r123DarkRow{display:none!important}'
 +'#horrorR1280 button{min-width:2.4em}#horrorR1280 .r1280-note,#narrVoiceRowR1280 small,#viewRowR1280 small{opacity:.78;font-size:.86em;margin-left:.4em}'
 +'#viewRowR1280{display:block;margin:.3em 0}#viewRowR1280 input{width:100%}';
function css(){if($('r1280Css')||!document.head)return;const s=document.createElement('style');s.id='r1280Css';s.textContent=CSS;document.head.appendChild(s);}
const labelOf=el=>el?.closest?.('label')||el;
function hide(el){if(el?.classList&&!el.classList.contains(HIDE))el.classList.add(HIDE);}
// R1283: 같은 값은 다시 쓰지 않는다(같은 값 쓰기도 DOM 변화로 잡혀 감시기→다시 만들기→다시 쓰기가 프레임마다 돌았음)
const setAttr=(el,k,v)=>{if(el&&el.getAttribute(k)!==v)el.setAttribute(k,v);};const setText=(el,v)=>{if(el&&el.textContent!==v)el.textContent=v;};
const setTog=(el,c,on)=>{if(el&&el.classList.contains(c)!==on)el.classList.toggle(c,on);};
const q=s=>{try{return document.querySelector('#panel '+s)||document.querySelector(s);}catch(_){return null;}};
const tap=el=>{if(el){stats.clicks++;el.click();}};
// ---- 통합 체크 칸 ----
function box(id,label,note,read,write,anchor,where){let inp=$(id);
 if(!inp){const l=document.createElement('label');l.id=id.replace(/R1280$/,'RowR1280');l.innerHTML='<input type="checkbox" id="'+id+'"> '+label+(note?'<small>'+note+'</small>':'');if(anchor?.classList?.contains('r1021-row'))l.className='r1021-row';
  if(where==='after')anchor.after(l);else anchor.before(l);inp=l.querySelector('input');inp.onchange=()=>{try{write(!!inp.checked);}catch(e){fail(e);}refresh();};stats.merged++;}
 else if(where==='after'&&anchor&&anchor.nextElementSibling!==labelOf(inp))anchor.after(labelOf(inp));
 const st=state(read());inp.checked=st==='on';inp.indeterminate=st==='mixed';const tt=st==='mixed'?'일부만 켜져 있습니다 — 누르면 모두 같은 값으로 맞춥니다':'';if(inp.title!==tt)inp.title=tt;return inp;}
// ④ 서사 음성
const MEM=()=>window.__STORYWORLD_MEMORY_VOICE_R1223__||null;
function narrRead(){const out=[];const e=q('input[data-setting="narration"]');try{out.push(typeof settings!=='undefined'?settings.narration!==false:e?.checked);}catch(_){out.push(e?.checked);}
 const m=MEM();if(m?.prefs)out.push(m.prefs().on!==false);else{const c=$('r1223Chk');if(c)out.push(!!c.checked);}return out;}
function narrWrite(v){const e=q('input[data-setting="narration"]');if(e&&e.checked!==v)tap(e);const c=$('r1223Chk');if(c){if(c.checked!==v)tap(c);}else MEM()?.set?.(v);}
// ⑨ 고유색 이펙트
function sigRead(){return [q('[data-r114-api="c114"][data-r114-key="palette"]')?.checked,$('r100-signature')?.checked];}
function sigWrite(v){for(const e of [q('[data-r114-api="c114"][data-r114-key="palette"]'),$('r100-signature')])if(e&&e.checked!==v)tap(e);}
// ⑦ 분위기 세기
const LV=[['off','끔'],['low','약'],['mid','보통'],['high','강']];
function horrorRead(){const a=window.__STORYWORLD_CINEMA_R114__?.prefs?.().horror,b=window.__STORYWORLD_DARK_R123__?.prefs?.().tone;
 return [a??q('[data-r114-horror][aria-pressed="true"]')?.dataset.r114Horror,b??q('[data-r123-tone][aria-pressed="true"]')?.dataset.r123Tone];}
function horrorWrite(k){tap(q('[data-r114-horror="'+k+'"]'));tap(q('[data-r123-tone="'+k+'"]'));}
function horrorRow(){const a=q('[data-r114-horror]')?.closest('.r114-row'),b=$('r123DarkRow');if(!a&&!b)return;let row=$('horrorR1280');
 if(!row){row=document.createElement('div');row.id='horrorR1280';row.className='r114-row';row.setAttribute('role','radiogroup');row.setAttribute('aria-label','분위기 세기');
  row.innerHTML='분위기 세기(색보정·어둠·붉은 빛) '+LV.map(([k,t])=>'<button type="button" data-r1280-horror="'+k+'" aria-pressed="false">'+t+'</button>').join(' ')+'<span class="r1280-note"></span>';
  (a||b).before(row);row.querySelectorAll('[data-r1280-horror]').forEach(x=>x.onclick=()=>{try{horrorWrite(x.dataset.r1280Horror);}catch(e){fail(e);}refresh();});stats.merged++;}
 const st=state(horrorRead());row.querySelectorAll('[data-r1280-horror]').forEach(x=>{const on=x.dataset.r1280Horror===st;setTog(x,'active',on);setAttr(x,'aria-pressed',String(on));});
 const n=row.querySelector('.r1280-note');setText(n,st==='mixed'?'(지금은 색보정·어둠 세기가 서로 다름 — 고르면 같게 맞춤)':'');}
// ⑥ 시야 범위
const CAM=()=>window.__STORYWORLD_CAMERA_R63__||null,VIEW=()=>window.__STORYWORLD_VIEW_R217__||null;
function camNow(){const s=$('cameraFactorR63');const v=s?+s.value:NaN;return Number.isFinite(v)&&v>0?v:1.5;}
function viewRow(){const sec=$('cameraSettingsR63');if(!sec)return;let row=$('viewRowR1280');
 const out=()=>{const o=row?.querySelector('output');setText(o,(+$('viewRangeR1280').value).toFixed(2)+'배');};
 if(!row){row=document.createElement('label');row.id='viewRowR1280';row.innerHTML='시야 범위 <output></output><input type="range" id="viewRangeR1280" min="0.7" max="2" step="0.05"><small>0.7배 = 영웅이 크게 · 1.5배 = PC 기본 · 2배 = 가장 넓게</small>';
  const h=sec.querySelector(':scope>h3');if(h)h.after(row);else sec.prepend(row);const s=row.querySelector('input');
  s.oninput=()=>{try{const sp=splitView(s.value);CAM()?.setFactor?.(sp.cam);VIEW()?.set?.(sp.view);const c=$('cameraFactorR63');if(c)c.value=String(sp.cam);const v=$('viewFactorR217');if(v)v.value=String(sp.view);out();}catch(e){fail(e);}};
  s.onchange=s.oninput;const rs=$('cameraResetR63');if(rs&&!rs.dataset.r1280){rs.dataset.r1280='1';rs.addEventListener('click',()=>{try{VIEW()?.set?.(1);const v=$('viewFactorR217');if(v)v.value='1';setTimeout(refresh,0);}catch(e){fail(e);}});}
  stats.merged++;}
 const s=$('viewRangeR1280');if(document.activeElement!==s){const f=VIEW()?.factor?.()??(+$('viewFactorR217')?.value||1);const nv=String(joinView(camNow(),f));if(s.value!==nv)s.value=nv;}out();}
// ---- 모으기 ----
function settingsOpen(){return !!($('settingsClose')&&($('quickSettingsR114')||document.querySelector('#panel .settings')));}
let busy=false;
function refresh(){if(busy)return;busy=true;try{build();}finally{busy=false;}}
function build(){try{if(off||!settingsOpen())return;if(mobile()){applied=false;return;}css();applied=true;stats.builds++;document.body?.classList.add('r1280On');
 for(const s of HIDE_SEL)for(const e of document.querySelectorAll('#panel '+s))hide(labelOf(e));
 hide($('flashlightHintR58'));const cl=document.querySelector('#panel label[for="cameraFactorR63"]');hide(cl);hide($('cameraFactorR63'));
 hide(q('[data-r114-horror]')?.closest('.r114-row'));hide($('r123DarkRow'));
 // 통합 칸
 const frag=labelOf(q('input[data-r1037="fragment"]')),sec=$('combatScreenR1021');
 if(frag)box('narrVoiceR1280','서사 음성 자동 재생','서사 창·기억 조각·영상 음성',narrRead,narrWrite,frag,'after');
 else if(sec?.lastElementChild)box('narrVoiceR1280','서사 음성 자동 재생','서사 창·기억 조각·영상 음성',narrRead,narrWrite,sec.lastElementChild,$('narrVoiceR1280')?null:'after');
 const pal=labelOf(q('[data-r114-api="c114"][data-r114-key="palette"]'))||labelOf($('r100-signature'));
 if(pal)box('signatureR1280','몹·보스 고유색 스킬 이펙트','',sigRead,sigWrite,pal,'before');
 horrorRow();viewRow();}catch(e){fail(e);}}
// 늦게 붙는 칸(R420 한 장면 뒤, R1037 0.5초 뒤 등)도 잡도록 열 때 몇 번 + 설정창 안 변화 감시.
function later(){build();try{queueMicrotask(build);}catch(_){}try{requestAnimationFrame(()=>{build();requestAnimationFrame(build);});}catch(_){}for(const ms of [200,600,1200])try{setTimeout(build,ms);}catch(_){}}
try{if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...a){const r=base.apply(this,a);try{later();}catch(e){fail(e);}return r;};}}catch(e){fail(e);}
let mo=null;function watch(){try{const pn=$('panel');if(!pn||mo||typeof MutationObserver!=='function')return;let pend=false;
 mo=new MutationObserver(l=>{if(busy||pend)return;/* R1283: 칸(요소)이 새로 붙거나 빠질 때만 — 글자만 바뀌는 변화(곡 이름 등)·자기 변화로 다시 만들지 않음 */if(!l.some(m=>[...m.addedNodes,...m.removedNodes].some(x=>x.nodeType===1)))return;pend=true;requestAnimationFrame(()=>{pend=false;if(settingsOpen())refresh();});});mo.observe(pn,{childList:true,subtree:true});}catch(e){fail(e);}}
try{if(document.readyState==='complete')watch();else addEventListener('load',watch,{once:true});document.addEventListener?.('change',ev=>{try{if(settingsOpen()&&!ev?.target?.id?.endsWith?.('R1280'))setTimeout(refresh,0);}catch(_){}},true);}catch(e){fail(e);}
window.__STORYWORLD_SETTINGS_MERGE_R1280__=Object.freeze({revision:REV,splitView,joinView,state,build:refresh,hidden:HIDE_SEL.slice(),
 inspect:()=>({revision:REV,off,applied,mobile:mobile(),stats:{...stats},lastError,presentationOnly:true})});
})();
