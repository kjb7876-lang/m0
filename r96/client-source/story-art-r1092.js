/* R1092 — 서사 창 장면 그림. 사용자 2026-11-16 "3일내 업로드된 구글드라이브 자산들 … 쓸만한거 개선해서 규칙과 일관성 맞게 적용".
 * 드라이브의 세로판 장면 그림(A01~A56, 지역 제목과 1:1)을 다듬어(생성 표식 줄 잘라냄·600px webp) 서사 창(advanceScene) 왼쪽 그림 칸의
 * 배경(img.bg, 원래는 지역 지도 그림)으로 쓴다. 영웅·보스 초상(img.actor)·문장·장면 순서·음성은 그대로다(서사 불변).
 * · 맘몬 지역은 Codex 몫이라 그림을 두지 않는다.
 * · 수묵화풍(R1055)이 그 지역에 켜져 있으면 그림도 먹빛으로(CSS 필터, DOM 그림이라 Three.js 와 무관).
 * · R255 가 서사 창을 쪽지 모양으로 바꿔 배경·초상 칸을 숨기므로(사용자 2026-11-03), 쪽지 창에서는 글 상자 바로 위에
 *   그 장면 그림 한 장(.r1092Pin)을 붙인다. 쪽지 모양·단추·글은 그대로, 낮은 화면에서는 그림을 숨겨 글 자리를 지킨다.
 * · 그림을 못 읽으면 원래 지도 그림으로 되돌린다(쪽지 그림 칸은 치운다). 끄기: localStorage['storyworld.r1092.sceneArt']='{"on":false}'.
 * Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
if(window.__STORYWORLD_SCENE_ART_R1092__||typeof advanceScene!=='function')return;
const KEY='storyworld.r1092.sceneArt',INK='grayscale(.78) sepia(.24) contrast(1.06) brightness(.94)';
const ZONES=['dist00','dist01','dist02','dist03','dist04','dist05','dist06','ep1a08','ep1a09','ep1a09b','ep1a10','ep1a11',
 'ep1b01','ep1b02','ep1b03','ep1b04','ep1b05','ep1b06b','ep1b07','ep1b08','ep1b09','u201','u202','u204','u205','u206','u203',
 'last304','last305','last301','last302','last303','kair01','kair04','kair05','kair06','kair07','kair08','kair09','kair10','kair02','kair03',
 'hando01','hando02','hando03','murder01','murder02','murder04','murder03','cult01','cult02','cult05','cult06','cult03','cult04'];
const ART=Object.freeze(Object.fromEntries(ZONES.map(z=>[z,'assets/r1092/scene-'+z+'.webp'])));
const stats={applied:0,skipped:0,fallback:0,ink:0};let lastError=null;
function prefs(){try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');return{on:p.on!==false};}catch(_){return{on:true};}}
function set(p){try{localStorage.setItem(KEY,JSON.stringify({...prefs(),...p}));}catch(_){}}
function url(p){try{return typeof urlFor==='function'?urlFor(p):p;}catch(_){return p;}}
function inked(zone){try{const I=window.__STORYWORLD_INK_WASH_R1055__;return !!(I&&typeof I.wants==='function'&&I.wants(zone));}catch(_){return false;}}
const CSS='.r1092Pin{display:none;position:relative;height:clamp(72px,16vh,132px);margin:0 0 8px;overflow:hidden;border:1px solid #6b5640;background:#120c0a;'
 +'box-shadow:inset 0 0 22px #000a}.r1092Pin img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 38%;opacity:.92;'
 +'-webkit-mask-image:linear-gradient(180deg,#000 72%,transparent);mask-image:linear-gradient(180deg,#000 72%,transparent)}'
 +'#panel.r255-doc .r1092Pin{display:block}#panel.r255-doc.r1092-pin .storyText{max-height:calc(52vh - clamp(72px,16vh,132px))}'
 +'@media (max-height:560px){.r1092Pin{display:none!important}}';
function css(){try{if(document.getElementById('r1092Css'))return;const st=document.createElement('style');st.id='r1092Css';st.textContent=CSS;document.head.appendChild(st);}catch(_){}}
function clearPin(pn){try{for(const o of Array.from(pn?.querySelectorAll?.('.r1092Pin')||[]))o?.remove?.();pn?.classList?.remove('r1092-pin');}catch(_){}}
function pin(pn,s,src,ink){const txt=pn&&pn.querySelector('.storyText');if(!txt||!txt.parentNode)return;css();
 const box=document.createElement('div');box.className='r1092Pin';box.dataset.r1092=s.id;const im=document.createElement('img');
 let title='';try{title=(typeof regionById!=='undefined'&&regionById[s.id]?.title)||'';}catch(_){}
 im.alt=title;im.addEventListener('error',function onErr(){im.removeEventListener('error',onErr);box.remove();try{pn.classList.remove('r1092-pin');}catch(_){}stats.fallback++;});
 im.src=src;im.style.filter=ink?INK:'';box.appendChild(im);txt.parentNode.insertBefore(box,txt);try{pn.classList.add('r1092-pin');}catch(_){}}
function apply(){
 const pn=document.getElementById('panel');clearPin(pn);
 if(!prefs().on)return;const s=typeof storyScene!=='undefined'?storyScene:null;if(!s)return;
 const path=ART[s.id];if(!path){stats.skipped++;return;}
 const ink=inked(s.id);pin(pn,s,url(path),ink);
 const bg=document.querySelector('#panel .storyArt img.bg');if(!bg){stats.applied++;if(ink)stats.ink++;return;}
 const original=bg.src;bg.dataset.r1092=s.id;
 bg.addEventListener('error',function onErr(){bg.removeEventListener('error',onErr);bg.src=original;bg.style.filter='';bg.style.opacity='';stats.fallback++;});
 bg.src=url(path);bg.style.opacity='.92';bg.style.objectPosition='50% 38%';
 if(ink){bg.style.filter=INK;stats.ink++;}else bg.style.filter='';
 stats.applied++;
}
const base=advanceScene;
advanceScene=function(...a){const r=base.apply(this,a);try{apply();}catch(e){lastError=String(e?.message||e);}return r;};
window.__STORYWORLD_SCENE_ART_R1092__=Object.freeze({revision:'R1092',storageKey:KEY,art:ART,count:ZONES.length,prefs,set,
 stats:()=>({...stats,lastError})});
})();
