// R255 서사는 모두 쪽지·기억 조각 모양으로 — 사용자 2026-11-03 "모든텍스트서사 기억조각및 쪽지같은 형식으로 해줘 조형물이랑상호작용하는것도 쪽지or3d체험형식으로
//  연출해주고 보스맵들어가는것도 모든서사를 조각및쪽지같은방식으로 구현해야함 혹은 3d체험방식 or 너가 코드로 짧은영상이나 애니메이션생성".
//  진행이 걸리지 않은 서사는 R139·R169·R177 이 이미 바닥의 쪽지로 떨어뜨린다. 남은 것은 진행이 걸린 서사(보스 문 앞 '전투 전', 출구 '전투 후',
//  조형물·제단을 E 로 조사, 최종장 단계)로, 엔진의 서사 창(배경 지도 + 인물 그림 + 긴 글 상자)으로 화면을 덮었다.
//  · 그 창을 쪽지 한 장처럼 바꾼다: 배경 지도·인물 그림을 빼고, 화면 오른쪽에 작은 종이(쪽지·기억 조각·진료기록·보고서 — R177 과 같은 분류·같은 종이)로,
//    머리에 '쪽지 · 제목', 아래에 원래 '계속' 단추. 창이 떠 있는 동안 전투가 멈추고, 끝나면 원래 하던 일(보스 전투·문·지역 완료)을 그대로 한다(진행 코드 그대로).
//  · 보스 구역 서사(그 지역에 보스가 있고 '전투 전' 장면이 처음 뜰 때): 쪽지 앞에 코드로 그린 짧은 연출(약 2.4초) — 위아래 검은 띠가 닫히고, 핏빛 먹이 번지고
//    금이 가며, 지역 이름과 보스 이름(게임에 있는 이름 그대로)이 떠오른다. 누르면 건너뛴다.
//  · 그대로 두는 것: 기억 책(쪽지 모음)에서 직접 여는 읽기(journal:)는 책 모양 그대로. 함께하기는 예전 창.
//  끄기: localStorage['storyworld.r255.fragments']='{"on":false}' ({"cinema":false} 로 연출만 끔)
(()=>{'use strict';
if(window.__STORYWORLD_STORY_FRAGMENTS_R255__)return;
const REV='R255-fragments-2',KEY='storyworld.r255.fragments';
let prefs={on:true,cinema:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={styled:0,cinemas:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const FORMS={chart:'진료기록',shard:'기억 조각',report:'누군가의 보고서',note:'쪽지'};
function css(){if(typeof document==='undefined'||document.getElementById('r255Css'))return;const s=document.createElement('style');s.id='r255Css';s.textContent=
 '#modal.r255{backdrop-filter:none;background:radial-gradient(120% 90% at 30% 50%,rgba(0,0,0,.05),rgba(0,0,0,.55));justify-content:flex-end;align-items:center}'
 +'#panel.r255-doc{width:min(460px,92vw);max-height:78vh;margin-right:max(18px,3vw);padding:16px 18px 12px;background:#1a1412f2;border:1px solid #6b5640;border-radius:3px;box-shadow:0 18px 50px #000c}'
 +'#panel.r255-doc .storyLayout{display:block}#panel.r255-doc .storyArt{display:none!important}'
 +'#panel.r255-doc .eyebrow{font-size:11px;letter-spacing:.14em;opacity:.7;margin:0 0 2px}#panel.r255-doc h2{font-size:17px;margin:0 0 6px}'
 +'#panel.r255-doc .r255Tag{display:inline-block;margin:0 0 6px;padding:1px 8px;font:700 11px/1.6 "Malgun Gothic",sans-serif;letter-spacing:.08em;border-radius:2px;background:#d9c5a6;color:#7a2a24}'
 +'#panel.r255-doc .storyText{max-height:52vh;overflow:auto;font-size:14px;line-height:1.75}'
 +'#panel.r255-doc.f-note .storyText{background:linear-gradient(172deg,#efe4cf,#d9c5a6);color:#2a1d16;padding:12px 16px;border:1px solid #8a6a4a;box-shadow:inset 0 0 28px #7a4a2a3a}'
 +'#panel.r255-doc.f-chart .storyText{background:#f3f1ea repeating-linear-gradient(180deg,transparent 0 27px,#c9d3dc 27px 28px);color:#1d2630;padding:10px 16px;border:1px solid #7d8a96}#panel.r255-doc.f-chart .r255Tag{background:#7d8a96;color:#fff}'
 +'#panel.r255-doc.f-shard .storyText{background:radial-gradient(120% 90% at 30% 10%,#3a1820,#120a10);color:#ecd9d6;padding:12px 16px;border:1px solid #b0404a;box-shadow:0 0 18px #b0404a55}#panel.r255-doc.f-shard .r255Tag{background:#3a1820;color:#ff9a9a;border:1px solid #b0404a}'
 +'#panel.r255-doc.f-report .storyText{background:#e9e4d8;color:#1e1c18;padding:10px 16px;border:1px solid #6c6556;font-family:"Nanum Gothic Coding","D2Coding",monospace}#panel.r255-doc.f-report .r255Tag{background:#e9e4d8;color:#5a1a14;border:1px dashed #6c6556}'
 +'@media (max-width:700px){#modal.r255{justify-content:center;align-items:flex-end}#panel.r255-doc{margin:0 0 12px}}';document.head.appendChild(s);}
function formOf(s){try{const f=window.__STORYWORLD_STORY_COLLECT_R177__?.formOf;if(typeof f==='function')return f([s]);}catch(e){fail(e);}return 'note';}
function eligible(s){if(!prefs.on||!solo()||!s)return false;if(/^journal:/.test(String(s.key||'')))return false;return true;}
function unstyle(){try{document.getElementById('panel')?.classList.remove('r255-doc','f-note','f-chart','f-shard','f-report');document.getElementById('modal')?.classList.remove('r255');}catch(_){}}
function style(s){const pn=document.getElementById('panel'),md=document.getElementById('modal');if(!pn||!pn.querySelector('.storyText'))return;css();const f=formOf(s);
 pn.classList.remove('f-note','f-chart','f-shard','f-report');pn.classList.add('r255-doc','f-'+(FORMS[f]?f:'note'));md?.classList.add('r255');
 const h=pn.querySelector('h2');if(h&&!pn.querySelector('.r255Tag')&&!pn.querySelector('.r177Tag')){const t=document.createElement('div');t.className='r255Tag';t.textContent=FORMS[f]||'쪽지';h.parentNode.insertBefore(t,h);}stats.styled++;}
// ---- 보스 구역 짧은 연출(코드로 그린 애니메이션) ----
const shown=new Set();
function bossInfo(s){try{if(!s||s.part!=='pre')return null;const r=regionById?.[s.id];if(!r||!(r.bosses?.length))return null;const k=String(s.id)+':'+(typeof layer!=='undefined'?layer:'');if(shown.has(k))return null;shown.add(k);
  const live=(typeof room!=='undefined'&&room?.enemies||[]).find(e=>e&&e.boss&&e.hp>0);return {region:String(r.title||''),boss:String(live?.name||r.bosses[0]?.name||'')};}catch(e){fail(e);return null;}}
function cinema(info){if(!prefs.cinema||!info||typeof document==='undefined')return;const st=document.getElementById('stage')||document.body;if(!st)return;stats.cinemas++;
 const c=document.createElement('canvas');c.id='r255Cinema';c.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:9000;cursor:pointer';document.body.appendChild(c);
 const t0=performance.now(),D=2400;let done=false;const end=()=>{if(done)return;done=true;c.remove();};c.onclick=end;
 const seed=Math.random()*6,blots=[...Array(9)].map((_,i)=>({a:seed+i*.7,r:.12+.08*((i*37)%5)/5,d:.2+.5*((i*13)%7)/7}));
 const frame=()=>{if(done)return;const t=(performance.now()-t0)/D;if(t>=1){end();return;}const W=innerWidth,H=innerHeight,dp=Math.min(2,devicePixelRatio||1);if(c.width!==Math.round(W*dp)){c.width=Math.round(W*dp);c.height=Math.round(H*dp);}
  const g=c.getContext('2d');if(!g){end();return;}g.setTransform(dp,0,0,dp,0,0);g.clearRect(0,0,W,H);const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
  const shut=ease(t/.18)*(1-ease((t-.86)/.14)),bar=H*.16*shut;g.fillStyle='rgba(4,2,3,.97)';g.fillRect(0,0,W,bar);g.fillRect(0,H-bar,W,bar);g.fillStyle='rgba(18,2,6,'+(.6*shut)+')';g.fillRect(0,bar,W,H-2*bar);
  const ink=ease((t-.1)/.45)*(1-ease((t-.85)/.15));for(const p of blots){const x=W*.5+Math.cos(p.a)*W*p.d*.35,y=H*.5+Math.sin(p.a*1.3)*H*p.d*.22,r=Math.min(W,H)*p.r*ink;if(r<1)continue;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(120,8,18,.55)');gr.addColorStop(1,'rgba(60,2,8,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
  const crack=ease((t-.25)/.3);if(crack>0){g.strokeStyle='rgba(230,60,60,'+(.8*(1-ease((t-.85)/.15)))+')';g.lineWidth=1.5;g.beginPath();g.moveTo(W*.2,H*.5);for(let i=1;i<=12;i++)g.lineTo(W*.2+W*.6*i/12*crack,H*.5+Math.sin(seed+i*1.9)*H*.03);g.stroke();}
  const a=ease((t-.3)/.25)*(1-ease((t-.86)/.14));g.globalAlpha=a;g.textAlign='center';g.fillStyle='#e8d6c8';g.font='600 '+Math.round(Math.min(W,H)*.032)+'px "Noto Serif KR","Malgun Gothic",serif';g.fillText(info.region,W/2,H*.43);
  g.fillStyle='#ff6a6a';g.font='700 '+Math.round(Math.min(W,H)*.06)+'px "Noto Serif KR","Malgun Gothic",serif';g.shadowColor='rgba(255,40,40,.7)';g.shadowBlur=18;g.fillText(info.boss,W/2,H*.56);g.shadowBlur=0;g.globalAlpha=1;
  requestAnimationFrame(frame);};requestAnimationFrame(frame);}
if(typeof advanceScene==='function'){const base=advanceScene;advanceScene=function(...a){const r=base.apply(this,a);
 try{const s=typeof storyScene!=='undefined'?storyScene:null;if(s&&eligible(s)){style(s);const info=bossInfo(s);if(info)cinema(info);}else unstyle();}catch(e){fail(e);}return r;};}
if(typeof openPanel==='function'){const base=openPanel;openPanel=function(...a){unstyle();return base.apply(this,a);};}// 다른 창에는 쪽지 모양이 남지 않게(서사 창은 advanceScene 뒤에 다시 입힌다)
if(typeof closePanel==='function'){const base=closePanel;closePanel=function(...a){unstyle();return base.apply(this,a);};}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_STORY_FRAGMENTS_R255__=Object.freeze({revision:REV,set,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();
