// R1246b — 사몽 각성 첫 장면 그림 예열(사용자 2026-11-19 22:58Z "사몽각성및 여러 렉요소될수 있는거 체크해서 렉개선").
//  헤드리스 측정(qa/r1246/crop-probe.mjs, murder01 스토리 층, samongCD 3→0 자연 준비 뒤 각성): 영웅마다 그 세션 첫 각성 장면에서
//  영웅 문양(r56x sigil·r1153 sigil)·확률 패시브 시트(R948 미카엘라 1536×1024 6장·R561 라우렌 중력 4장·R951 네온 등)·r411 적중 시트를
//  처음 읽어 그림 테두리 재기(imageCrop, R154 가 세션 안에서는 기억)가 1~19장, 19~382ms 를 각성 첫 두세 장면에 몰았다.
//  R1199·R1217 예열은 꿈 층에서만, 사몽에서 새로 올라간 텍스처만 다뤄 이 그림들은 빠졌다.
//  고친 방법: 지금 형상(8영웅·EGO·페르소나)의 각성 첫 장면 그림 목록을 각성 전 한가한 때(불러오는 중·각성 중·쓰러짐 아님)에
//  0.4초에 한 장씩 엔진 addImage 로 미리 읽어 테두리를 미리 재 둔다(세션당 한 번 — 지역을 옮겨 그림 기억이 비워져도 R154 가 테두리를 기억).
//  목록 = 기본 표(측정한 첫 각성 그림) + 배운 그림(각성 시작 4초 안에 처음 읽힌 assets/ 그림, 형상별 40장, localStorage 'storyworld.r1246.awakeLearn').
//  그림·판정·쿨다운·세이브는 그대로. 끄기: localStorage 'storyworld.r1246.awakeWarm' = '0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_AWAKE_WARM_R1246__)return;
const REV='R1246-awake-warm-1',KEY='storyworld.r1246.awakeWarm',LKEY='storyworld.r1246.awakeLearn',GAP=400,LEARN_S=4,CAP=40;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const SAFE=/^assets\/[\w\-./]+\.(webp|png)$/;const ok=p=>typeof p==='string'&&SAFE.test(p)&&!p.includes('..');
// 기본 표: 헤드리스 첫 각성 측정 두 번(qa/r1246/crop-probe.mjs)에서 처음 읽힌 그림(8영웅). 몹 그림 등 지역에 딸린 것은 뺐다.
//  EGO·페르소나는 형상을 켤 때 이미 자기 그림을 모두 읽어 첫 각성에 새로 읽는 그림이 0장이었다 → 배우기 목록만 쓴다.
const DATA=Object.freeze(/*R1246DATA{*/{"michaela":["assets/r948/mh07-note24.webp","assets/r948/mh03-heart24.webp","assets/r948/mh10-aura24.webp","assets/r948/mh05-cloud24.webp","assets/r948/mh04-blast24-r3.webp","assets/r563/dots/michaela-sigil-front.webp","assets/r948/heart-burst16.webp","assets/r563/dots/michaela-sigil-back.webp","assets/r948/mh10a-enter8.webp","assets/r948/mh10b-exit8.webp","assets/r948/heart-fly8.webp","assets/r378/orgel-0.webp","assets/r378/orgel-1.webp","assets/r378/orgel-2.webp","assets/r378/orgel-3.webp","assets/r378/orgel-4.webp","assets/r378/orgel-5.webp","assets/r378/orgel-6.webp","assets/r378/orgel-7.webp"],"hwando":["assets/r100/sig-hit-gold.webp"],"seoha":["assets/r411/fx/hit-ice-spikes.webp","assets/r564/dots/seoha-sigil-front.webp","assets/r564/dots/seoha-sigil-back.webp"],"neon":["assets/r562/dots/neon-sigil-back.webp","assets/r562/dots/neon-sigil-front.webp","assets/r951/neon-hazard-sign.webp"],"lauren":["assets/r411/fx/hit-teleport.webp","assets/r1153/sigil-lauren.webp","assets/r561/lauren/lauren-gravity-well-back.webp","assets/r561/lauren/lauren-crush-vortex.webp","assets/r561/lauren/lauren-gravity-well-front.webp","assets/r561/lauren/lauren-collapse.webp"],"hunter":["assets/r1153/sigil-hunter.webp"],"slayer":["assets/r411/fx/hit-fire.webp","assets/r1153/sigil-slayer.webp","assets/r1153/slayer-brand.webp","assets/r1153/status-icons.webp"],"gunner":["assets/r411/fx/hit-explosion.webp","assets/r1153/sigil-gunner.webp"]}/*}R1246DATA*/);
const stats={warmed:0,learned:0,errors:0,skipped:{loading:0,awake:0,off:0}};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
const on=()=>G(()=>localStorage.getItem(KEY),null)!=='0';
let learned={};try{const v=JSON.parse(G(()=>localStorage.getItem(LKEY),null)||'{}');if(v&&typeof v==='object')for(const k of Object.keys(v))if(Array.isArray(v[k]))learned[k]=v[k].filter(ok).slice(-CAP);}catch(_){learned={};}
function save(){G(()=>localStorage.setItem(LKEY,JSON.stringify(learned)));}
function form(){const p=G(()=>player,null);if(!p||typeof p!=='object')return null;if(p.hero==='lauren'&&p.personaHeroR1113===true)return 'persona';
 if(p.hero==='hwando'&&(p.egoSovereignR1046===true||G(()=>!!window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive(),false)))return 'ego';return typeof p.hero==='string'?p.hero:null;}
function list(f){const a=[...(DATA[f]||[]),...(learned[f]||[])];return [...new Set(a.filter(ok))];}
const asked=new Set();let awakeAt=-1e9,wasAwake=false,inner=false;
const nowS=()=>G(()=>performance.now()/1000,0);
function awakeNow(p){return !!p&&+p.samong>0;}
function tick(){try{const p=G(()=>player,null),aw=awakeNow(p);if(aw&&!wasAwake)awakeAt=nowS();wasAwake=aw;
  if(!on()){stats.skipped.off++;return;}if(G(()=>loading,false)){stats.skipped.loading++;return;}if(!p||!(+p.hp>0))return;if(aw){stats.skipped.awake++;return;}
  const f=form();if(!f)return;for(const path of list(f)){if(asked.has(path))continue;asked.add(path);if(G(()=>!!readyImage(path),false))continue;
   inner=true;try{if(typeof addImage==='function')addImage(path);else if(typeof ensureImages==='function')Promise.resolve(ensureImages([path])).catch(()=>{});}finally{inner=false;}stats.warmed++;return;}}catch(e){fail(e);}}
// 배우기: 각성 시작 4초 안에 엔진이 처음 읽는(그림 기억에 없는) assets/ 그림
function wrap(){try{if(typeof addImage!=='function'||addImage.__r1246)return;const base=addImage;
  const w=function(path,...a){try{if(!inner&&ok(path)&&wasAwake&&nowS()-awakeAt<=LEARN_S&&!G(()=>imageCache.has(path),true)){const f=form();if(f){const L=learned[f]||(learned[f]=[]);if(!L.includes(path)&&!(DATA[f]||[]).includes(path)){L.push(path);if(L.length>CAP)L.splice(0,L.length-CAP);stats.learned++;save();}}}}catch(e){fail(e);}return base.call(this,path,...a);};
  for(const k of Object.keys(base))if(/^_*r\d+/i.test(k))G(()=>{w[k]=base[k];});w.__r1246=true;addImage=w;}catch(e){fail(e);}}
wrap();G(()=>setInterval(()=>{wrap();tick();},GAP));
window.__STORYWORLD_AWAKE_WARM_R1246__=Object.freeze({revision:REV,forms:()=>Object.keys(DATA),list,form,on,
 set:v=>{G(()=>localStorage.setItem(KEY,v?'1':'0'));return on();},
 inspect:()=>({revision:REV,on:on(),warmed:stats.warmed,learned:stats.learned,asked:asked.size,skipped:{...stats.skipped},errors:stats.errors,lastError,gameplayChanged:false,presentationOnly:true})});
})();
