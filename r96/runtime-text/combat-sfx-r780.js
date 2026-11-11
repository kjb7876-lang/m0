/* R780 전투 타격감 효과음 (사용자 2026-11-11 14:22Z "워크래프트3 효과음 많이 참고해서 … 기본공격과 스킬 그리고 피격시 효과음, 적 피격과 죽음 효과음 타격감 있도록 퀄 좋게").
 * 전에는 적 피격이 영웅과 무관한 한 소리(역할 배율 .17 로 가장 작음)였다. WC3 의 설계(짧고 마른 어택, 무기 재질마다 다른 몸통, 큰 타격은 낮은 음높이, 처치 때 한 번 더 묵직한 마무리)만 참고해
 * ElevenLabs 로 새로 만든 소리(scripts/build-sfx-r780.py, 원본 음원 복제 없음)를 엔진 sound('enemyHit') 한 번의 종류만 바꿔 얹는다.
 *  - 영웅 8명 무기 재질별 적중음 r780Hit_<영웅> (환도 칼날·슬레이어 대검·헌터 화살·기억사수 탄환·네온 전격·미카엘라 빛·라우렌 결정·윤서하 태엽). 변주 4개(원본 2 × 피치 변주, 파일에 구워 넣음).
 *  - 스킬 적중(source.attackKind9==='skill' 등)은 낮은 음높이 큰 타격음 r780HitBig_<영웅>.
 *  - 체력이 0 이 되는 타격은 처치 마무리 r780Kill(자체 쿨다운이라 영웅 스킬 소리·적중음을 막지 않음). 기존 R544 적 테마 죽음음(r541Death)은 그대로 함께 난다.
 *  - 적중 역할(roles.enemyHit) 배율 .17→.24, 저역통과 3.0→3.8kHz(타격 어택이 뭉개지지 않게). 150Hz 아래·5kHz 위는 파일에서 이미 걷어 냄(R545 '스피커 터짐' 기준).
 *  - 겹침 제한: 70ms 안에 또 적중이 오면 건너뜀(엔진 조절기는 별도로 영웅 공격 간격×.45 간격·동시 4음).
 * 엔진 프로필·밸런스·저장은 건드리지 않는다. 불면귀 몹 소리(bulmyeongwi-r760.js)가 outer 라 마을 주민의 신음 대체는 그대로 우선한다. 끄기: localStorage storyworld.r780.sfx = '0'.
 * Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SFX_R780__)return;
 let on=true;try{on=localStorage.getItem('storyworld.r780.sfx')!=='0';}catch(_){}
 const DIR='assets/r780/sfx/',HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'],GAP_MS=70,HIT_GAIN=.85,BIG_GAIN=1,KILL_GAIN=.7;
 const stats={hit:0,big:0,kill:0,limited:0,passed:0,warmed:0,errors:0};let lastAt=-1e9,cur=null;
 const now=()=>{try{return performance.now();}catch(_){return Date.now();}};
 const rows=(prefix,n,gain)=>Array.from({length:n},(_,i)=>({key:'r780-'+prefix+'-'+(i+1),path:DIR+prefix+'-'+(i+1)+'.ogg',gain,r541:true}));
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return;
  const C=window.__STORYWORLD_SFX_COMFORT__;if(C){const a=C.aliases;if(a)for(const h of HEROES){a['r780Hit_'+h]='enemyHit';a['r780HitBig_'+h]='enemyHit';}
   const r=C.roles&&C.roles.enemyHit;if(r){r.gain=Math.max(r.gain,.24);r.cutoff=Math.max(r.cutoff,3800);}}
  for(const h of HEROES){soundProfiles['r780Hit_'+h]=rows('hit-'+h,4,HIT_GAIN);soundProfiles['r780HitBig_'+h]=rows('hitbig-'+h,2,BIG_GAIN);}
  soundProfiles.r780Kill=rows('kill',5,KILL_GAIN);}
  // 처음 쓰는 파일은 내려받아 해독하는 동안(약 .6초 넘으면 엔진이 버림) 첫 적중이 조용해지므로, 지금 영웅의 12개를 미리 해독해 둔다(영웅이 바뀔 때마다 한 번, 1초마다 확인).
 let warmedFor=null;function warm(){try{if(!on||typeof audioBuffer!=='function'||typeof soundProfiles==='undefined'||!audioUnlocked)return;const p=typeof player!=='undefined'?player:null,h=p&&p.hero;if(!h||!HEROES.includes(h)||warmedFor===h)return;warmedFor=h;
  for(const k of ['r780Hit_'+h,'r780HitBig_'+h,'r780Kill'])for(const r of soundProfiles[k]||[])try{Promise.resolve(audioBuffer(r.path)).catch(()=>{});}catch(_){}stats.warmed++;}catch(_){stats.errors++;}}
 const isSkill=s=>!!s&&typeof s==='object'&&(s.attackKind9==='skill'||/skill|special|ultimate|ego/i.test(String(s.kind||'')));
 function pick(kind){
  const p=typeof player!=='undefined'?player:null,hero=p&&p.hero;if(!hero||!HEROES.includes(hero))return null;
  const e=cur&&cur.e;if(e&&e.hp<=0&&soundProfiles.r780Kill?.length){stats.kill++;return'r780Kill';}
  const t=now();if(t-lastAt<GAP_MS&&t>=lastAt){stats.limited++;return'';}lastAt=t;
  const big=isSkill(cur&&cur.s),k=(big?'r780HitBig_':'r780Hit_')+hero;if(!soundProfiles[k]?.length)return null;
  if(big)stats.big++;else stats.hit++;return k;}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  try{setInterval(warm,1000);}catch(_){}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}
  if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,v,s){const prev=cur;cur={e,s};try{return base.apply(this,arguments);}finally{cur=prev;}};}
  if(typeof sound==='function'){const base=sound;sound=function(kind,...a){let k=kind;
   if(kind==='enemyHit')try{const m=pick(kind);if(m==='')return undefined;if(m){k=m;stats.passed++;}}catch(_){stats.errors++;k=kind;}
   return base.call(this,k,...a);};}
 }
 window.__STORYWORLD_SFX_R780__=Object.freeze({revision:'R780',enabled:()=>on,apply,heroes:HEROES,gapMs:GAP_MS,inspect:()=>({on,stats:{...stats},profiles:typeof soundProfiles!=='undefined'?Object.fromEntries(Object.keys(soundProfiles).filter(k=>/^r780/.test(k)).map(k=>[k,soundProfiles[k].length])):null,generated:'ElevenLabs text-to-sound v2',directListeningVerified:false})});
})();
