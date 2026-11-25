// R1306 — 2D 영웅 공격 그림 색을 대기 그림에 맞춤(사용자 2026-11-25 04:53Z "라우렌 네온 공격모션 일관성있는지 대기모션과 검수 … 이기준으로 모든2d영웅 검수").
//  10명 전수(qa/r1306 capture.mjs·render.py) 결과 실제로 눈에 띈 색 차이 둘만 고친다. 그림 윤곽·칸·발 기준점·크기는 원본 그대로(색만 다른 파생본).
//  ① 라우렌 좌우 공격(R437 attack-e, 오른쪽 1장 + 왼쪽 반전): 머리칼·외투가 자홍빛(색상 중앙값 216/255)이라 남보라(191)인 서기·걷기와 다른 옷처럼 보였다
//     → assets/r1306-2d/r437/attack/lauren/attack-e.webp(보라 계열만 대기 색상으로, 금색 자수·은 갑옷·빛나는 장갑은 그대로).
//  ② 헌터 좌우 공격(R425 attack-l/r): 서기보다 밝고 덜 짙었다(V 75·S 130 대 V 57·S 154) → assets/r1306-2d/r425/hunter/attack-{l,r}.webp(명도·채도만).
//  만든 방법: scripts/r1306-hero-attack-tone.py. 경로 꼬리(r437/…·r425/hunter/…)를 품어 몸 그림 정규식이 그대로 통한다.
//  모든 오버레이가 drawHero 를 감싼 뒤(load 다음 틱) 맨 바깥에서, 영웅 몫 이미지 명령의 그림·경로만 바꾼다(points·sourceRect 그대로).
//  새 그림이 아직 안 받아졌으면 원본 그대로(옛 그림으로 튀지 않게). 페르소나 형상(라우렌 위 형상)은 손대지 않는다.
//  판정·피해·쿨다운·세이브는 바꾸지 않는다. 끄기: localStorage storyworld.r1306.attackTone = {"on":false}
(()=>{'use strict';
if(window.__STORYWORLD_HERO_ATTACK_TONE_R1306__)return;
const REV='R1306-attack-tone-1',KEY='storyworld.r1306.attackTone',BASE='assets/r1306-2d/';
const MAP=Object.freeze({'assets/r437/attack/lauren/attack-e.webp':'lauren','assets/r425/hunter/attack-l.webp':'hunter','assets/r425/hunter/attack-r.webp':'hunter'});
const to=p=>BASE+p.slice('assets/'.length);
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={swapped:0,waiting:0,wraps:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const asked=new Map();
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r?.image)return r.image;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const pathOf=c=>{const s=String(c?.sourcePath||c?.image?.src||'');const i=s.indexOf('assets/');return (i>=0?s.slice(i):s).split('?')[0];};
// 순수: 명령 하나를 파생본으로(바꿨으면 true)
function swap(c,p){if(!prefs.on||!c||c.kind!=='image'||c.owner?.kind!=='hero')return false;const hero=p?.hero;if(!hero||p.personaHeroR1113===true)return false;
 const s=pathOf(c),h=MAP[s];if(!h||h!==hero)return false;const d=to(s),im=img(d);if(!im){stats.waiting++;return false;}
 c.image=im;c.sourcePath=d;c.r1306Tone=true;stats.swapped++;return true;}
function after(rec,st){const p=typeof player==='object'?player:null;if(!p||!rec||!Array.isArray(rec.commands))return;for(let i=st;i<rec.commands.length;i++)swap(rec.commands[i],p);}
const MARK=Symbol.for('storyworld.r1306.drawHero');
function install(){try{if(typeof drawHero!=='function'||drawHero[MARK])return;const base=drawHero;
 const w=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:0;const r=base.apply(this,a);try{after(rec,st);}catch(e){fail(e);}return r;};
 w[MARK]=true;drawHero=w;stats.wraps++;}catch(e){fail(e);}}
// 미리 받기: 라우렌·헌터일 때 파생본을 미리 요청(첫 공격부터 새 색)
function warm(){try{const h=typeof player==='object'?player?.hero:null;if(!prefs.on||!h)return;for(const [s,hh] of Object.entries(MAP))if(hh===h)img(to(s));}catch(e){fail(e);}}
const later=()=>setTimeout(install,0);
if(typeof document==='object'&&document&&document.readyState==='complete')later();else if(typeof window.addEventListener==='function')window.addEventListener('load',later);
// 다른 오버레이가 나중에 drawHero 를 바꿔 끼우면 다시 맨 바깥에서 감싼다
setInterval(()=>{install();warm();},2000);
window.__STORYWORLD_HERO_ATTACK_TONE_R1306__=Object.freeze({revision:REV,map:MAP,base:BASE,
 setPrefs:v=>{prefs={...prefs,...(v||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 test:Object.freeze({swap,to}),
 inspect:()=>({revision:REV,prefs:{...prefs},installed:typeof drawHero==='function'&&!!drawHero[MARK],...stats,lastError,presentationOnly:true,gameplayChanged:false})});
})();
