// R1269 해금 전 챕터 제목 묵색 가림(스포일러 방지) — 사용자 2026-11-20 "해금전에 챕터 제목 묵색으로 가려서 스포방지 시작메뉴".
//  지도 창(이어지는 기억의 지역)과 지역 정보 창에서 아직 열리지 않은 부(챕터) 이름·지역 이름·보스 이름을 먹 번짐 덩어리로 가린다.
//  해금 판단은 엔진 것을 그대로 쓴다: __STORYWORLD4__.isUnlocked(id,layer)(777 해금 포함) · 방문 · 완료. 서사 데이터·해금 로직은 바꾸지 않고
//  창에 그려진 글자만 먹 덩어리 칸으로 바꾼다(가린 이름은 DOM 글자로도 남기지 않음 — 선택·복사로 새지 않게).
//  끄기: localStorage['storyworld.r1269.veil']='0'.
(function(){
'use strict';
const KEY='storyworld.r1269.veil',ID='chapterVeilR1269';
const enabled=()=>{try{return localStorage.getItem(KEY)!=='0';}catch(_){return true;}};
// "제1부 — 마지막 수호자 EGO" → {head:'제1부 — ', name:'마지막 수호자 EGO'} (첫 줄표에서만 나눔)
function splitChapter(s){
 s=typeof s==='string'?s:'';const m=/^(.*?\s[—–-]\s)(.*)$/.exec(s);
 return m?{head:m[1],name:m[2]}:{head:'',name:s};
}
// 지역·부마다 잠김 여부. 해금 판단이 던지면 가리지 않는다(화면을 망가뜨리지 않음).
function plan(regs,chs,isOpen){
 const out={regions:{},chapters:{}};regs=Array.isArray(regs)?regs:[];chs=Array.isArray(chs)?chs:[];
 let broken=false;const open={};
 for(const r of regs){if(!r||!r.id)continue;let o=true;if(!broken){try{o=!!isOpen(r.id);}catch(_){broken=true;}}open[r.id]=o;}
 if(broken){for(const r of regs)if(r&&r.id)out.regions[r.id]=false;chs.forEach((c,i)=>{out.chapters[i]=false;});return out;}
 for(const r of regs)if(r&&r.id)out.regions[r.id]=!open[r.id];
 chs.forEach((c,i)=>{out.chapters[i]=!regs.some(r=>r&&r.chapterIndex===i&&open[r.id]);});
 return out;
}
const veilLen=s=>Math.max(2,Math.min(12,typeof s==='string'?[...s].length:0));
// 글자 맞춤 후보: 긴 이름 먼저(열린 긴 이름이 잠긴 짧은 이름을 먼저 차지). 같은 이름이 열림·잠김 둘 다면 열림.
function candidates(regs,chs,p,extra){
 const m=new Map();const add=(name,locked)=>{if(typeof name!=='string'||!name.trim())return;name=name.trim();m.set(name,m.has(name)?(m.get(name)&&locked):locked);};
 (Array.isArray(regs)?regs:[]).forEach(r=>{if(r&&r.id)add(r.title,!!p.regions[r.id]);});
 (Array.isArray(chs)?chs:[]).forEach((c,i)=>add(splitChapter(c).name,!!p.chapters[i]));
 (extra||[]).forEach(x=>add(x,true));
 return [...m].map(([name,locked])=>({name,locked})).sort((a,b)=>b.name.length-a.name.length);
}
// 먹 번짐 붓자국 SVG 세 가지(이름마다 고정으로 고름): 옅은 번짐(바깥) + 짙은 붓 몸통 + 마른 붓결(안쪽 밝은 줄)
const stroke=(seed,body,wash,dry)=>"url(\"data:image/svg+xml,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40' preserveAspectRatio='none'><filter id='f' x='-8%' y='-30%' width='116%' height='160%'><feTurbulence type='fractalNoise' baseFrequency='.07 .28' numOctaves='3' seed='${seed}'/><feDisplacementMap in='SourceGraphic' scale='6'/></filter><filter id='w' x='-10%' y='-40%' width='120%' height='180%'><feGaussianBlur stdDeviation='2.2'/></filter><path d='${wash}' fill='#1a1d22' fill-opacity='.28' filter='url(#w)'/><g filter='url(#f)'><path d='${body}' fill='#0e1115' fill-opacity='.95'/><path d='${dry}' fill='none' stroke='#3a3f46' stroke-opacity='.45' stroke-width='1.1' stroke-linecap='round'/></g></svg>`)+"\")";
const SVG=[
 stroke(7,'M4 21C9 9 30 8 58 9C84 10 103 7 114 14C121 20 115 31 98 32C72 34 42 33 20 33C7 33 1 28 4 21Z','M1 20C6 4 40 3 62 4C92 5 118 4 119 19C120 36 90 38 60 38C30 38 0 37 1 20Z','M18 17C40 15 70 16 100 15M24 26C50 25 76 27 96 25'),
 stroke(23,'M3 18C11 8 33 7 57 10C83 13 101 8 115 13C121 18 118 30 103 32C80 35 51 31 27 33C11 35 1 28 3 18Z','M0 18C4 3 44 2 66 5C96 7 119 5 119 21C119 37 86 39 58 38C26 37 0 35 0 18Z','M14 16C38 14 62 18 92 16M20 25C46 23 72 26 104 24'),
 stroke(41,'M6 23C10 10 28 10 46 9C70 7 96 9 113 13C121 18 117 32 100 31C77 30 50 35 26 34C9 33 2 30 6 23Z','M2 22C5 6 36 4 58 4C90 4 119 6 119 22C118 38 84 39 56 38C24 37 1 37 2 22Z','M16 19C42 17 66 15 98 18M22 27C48 28 70 25 100 26')
];
const hash=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.codePointAt(0))|0;return Math.abs(h);};
const CSS=`.r1269Veil{display:inline-block;vertical-align:-.3em;height:1.42em;margin:0 .06em;color:transparent!important;text-shadow:none!important;-webkit-text-fill-color:transparent;
 background-repeat:no-repeat;background-position:center;background-size:100% 100%;white-space:pre;overflow:hidden;user-select:none;-webkit-user-select:none;pointer-events:none;
 filter:drop-shadow(0 0 1.6px rgba(214,204,178,.32));opacity:.96}
.r1269Veil.v0{background-image:${SVG[0]}}.r1269Veil.v1{background-image:${SVG[1]}}.r1269Veil.v2{background-image:${SVG[2]}}
strong .r1269Veil,h2 .r1269Veil,h3 .r1269Veil{height:1.3em;vertical-align:-.26em}
html.r1086Hanji #panel .r1269Veil{filter:none;opacity:.9}
.worldnode.r1269Locked img,.r1269Locked .storyArt img,.storyArt.r1269Locked img{filter:grayscale(1) brightness(.42) blur(5px)!important}
.worldnode.r1269Locked{border-style:dashed}`;
function css(){if(document.getElementById(ID))return;const s=document.createElement('style');s.id=ID;s.textContent=CSS;(document.head||document.documentElement).appendChild(s);}
function veilSpan(name){const s=document.createElement('span');s.className='r1269Veil v'+(hash(name)%3);s.textContent='　'.repeat(veilLen(name));
 s.setAttribute('role','img');s.setAttribute('aria-label','아직 열리지 않은 기억');s.title='아직 열리지 않은 기억';return s;}
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function veilText(root,cands){
 const lockedAny=cands.some(c=>c.locked);if(!lockedAny||!root)return 0;
 const map=new Map(cands.map(c=>[c.name,c.locked]));const re=new RegExp(cands.map(c=>esc(c.name)).join('|'),'g');
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest('.r1269Veil,script,style')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);let count=0;
 for(const tn of nodes){const t=tn.nodeValue;if(!t||!t.trim())continue;re.lastIndex=0;let m,last=0,frag=null;
  while((m=re.exec(t))){if(!map.get(m[0]))continue;frag=frag||document.createDocumentFragment();if(m.index>last)frag.appendChild(document.createTextNode(t.slice(last,m.index)));frag.appendChild(veilSpan(m[0]));last=m.index+m[0].length;count++;}
  if(frag){if(last<t.length)frag.appendChild(document.createTextNode(t.slice(last)));tn.parentNode.replaceChild(frag,tn);}}
 return count;
}
function engineOpen(){
 const W=window.__STORYWORLD4__;
 return id=>{const l=typeof layer!=='undefined'?layer:'STORY';
  if(W&&typeof W.isUnlocked==='function'&&W.isUnlocked(id,l))return true;
  if(typeof visited!=='undefined'&&typeof layerKey==='function'&&visited.has(layerKey(id)))return true;
  if(typeof completed==='function'&&completed(id))return true;
  if(!W||typeof W.isUnlocked!=='function'){if(typeof chapterOpen==='function'&&typeof regionById!=='undefined')return !!chapterOpen(regionById[id]);return true;}
  return false;};
}
let lastInfo=null,busy=false;
function apply(panel){
 panel=panel||document.getElementById('panel');if(!panel||!enabled())return 0;
 if(typeof regions==='undefined'||typeof chapters==='undefined')return 0;
 const isMap=!!panel.querySelector('.worldgrid');const isInfo=!isMap&&!!panel.querySelector('#regionMap')&&!!panel.querySelector('#regionPlay,#regionTravel,#regionJournal');
 if(!isMap&&!isInfo)return 0;
 const p=plan(regions,chapters,engineOpen());let extra=[];
 if(isMap){for(const nd of panel.querySelectorAll('.worldnode[data-zone]')){if(!p.regions[nd.dataset.zone])continue;nd.classList.add('r1269Locked');const im=nd.querySelector('img');if(im)im.alt='';}}
 else{const h=panel.querySelector('h2');let id=lastInfo&&lastInfo.id;const r0=typeof regionById!=='undefined'&&id?regionById[id]:null;
  const r=r0&&h&&h.textContent.includes(r0.title)?r0:regions.find(x=>h&&x.title===h.textContent.trim());
  if(r&&p.regions[r.id]){extra=(r.bosses||[]).map(b=>b&&b.name).filter(Boolean);if(r.meta&&r.meta.environmentKey)extra.push(String(r.meta.environmentKey));
   const art=panel.querySelector('.storyArt');if(art)art.classList.add('r1269Locked');panel.querySelectorAll('.storyArt img').forEach(im=>{im.alt='';});}}
 return veilText(panel,candidates(regions,chapters,p,extra));
}
function run(){if(busy)return;busy=true;try{apply();}catch(e){try{console.warn('[R1269]',e);}catch(_){}}finally{busy=false;}}
function install(){
 css();const panel=document.getElementById('panel');
 if(panel&&typeof MutationObserver==='function'&&!panel.__r1269){panel.__r1269=true;const mo=new MutationObserver(()=>{if(busy)return;run();});mo.observe(panel,{childList:true,subtree:true});}
 if(typeof showRegionInfo==='function'&&!showRegionInfo.__r1269){const base=showRegionInfo;const w=function(id){lastInfo={id};const out=base.apply(this,arguments);run();return out;};w.__r1269=true;try{showRegionInfo=w;}catch(_){}}
}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();}
window.__STORYWORLD_CHAPTER_VEIL_R1269__={version:1,enabled,splitChapter,plan,veilLen,candidates,apply};
})();
