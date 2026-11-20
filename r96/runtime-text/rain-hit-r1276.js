/* R1276 영웅 적중 효과음 → 빗방울 (사용자 2026-11-20 "빗소리 만든거 듣기좋은소리로 개선해서 모든영웅들 적중효과음에 적절하게 배치해 지금 전자음 다 빼고").
 * 영웅 10명(기본 8 + EGO + 페르소나)의 적중음 r785Hit_<영웅>(기본 적중 4변주)·r785HitBig_<영웅>(스킬 적중 2변주) 프로필만 assets/r1276/sfx 의 빗방울 소리로 바꿔 끼운다.
 *  · 소리: ElevenLabs 로 만든 잔잔한 빗소리 조각(새 생성·결제 없음)을 scripts/build-sfx-r1276.py 가 영웅마다 음높이·길이·물방울 수·저역통과를 달리해 짧게 자름
 *    (150Hz 아래·4kHz 근처 위 억제, 시작 10ms 넘게 올림, 피크 약 -10.5dBFS — R545·R1049 소리 기준). 전자음(전격·태엽 틱·결정 울림 등 합성 느낌)은 쓰지 않는다.
 *  · 고르는 길·간격·겹침 제한·처치 마무리(r785Kill)·믹스 별칭(enemyHit)은 R785·R993 그대로. 이 파일은 프로필 표만 바꾼다 → 엔진·R785·R1155·밸런스·저장은 건드리지 않는다.
 *  · R785 가 setupAudio 때 다시 쓰고 R1155 가 EGO·페르소나 칸을 다시 쓸 수 있어, setupAudio 뒤와 1초마다 빗방울이 아니면 다시 얹는다.
 *  · 끄기: localStorage storyworld.r1276.sfx = '0' → 예전 소리 그대로.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_RAIN_HIT_R1276__)return;
 const REV='R1276-rain-hit-1',DIR='assets/r1276/sfx/',HEROES=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner','ego','persona'],HIT_GAIN=.85,BIG_GAIN=1;
 let on=true;try{on=localStorage.getItem('storyworld.r1276.sfx')!=='0';}catch(_){}
 const stats={applied:0,reapplied:0,errors:0};
 const rows=(prefix,n,gain)=>Array.from({length:n},(_,i)=>({key:'r1276-'+prefix+'-'+(i+1),path:DIR+prefix+'-'+(i+1)+'.ogg',gain,r541:true}));
 const mine=k=>{try{const r=soundProfiles[k];return !!(r&&r.length&&String(r[0].path).indexOf(DIR)===0);}catch(_){return false;}};
 function apply(){if(!on||typeof soundProfiles==='undefined'||!soundProfiles)return false;let n=0;
  const C=window.__STORYWORLD_SFX_COMFORT__,al=C&&C.aliases;
  for(const h of HEROES){
   if(!mine('r785Hit_'+h)){soundProfiles['r785Hit_'+h]=rows('rain-hit-'+h,4,HIT_GAIN);n++;}
   if(!mine('r785HitBig_'+h)){soundProfiles['r785HitBig_'+h]=rows('rain-hitbig-'+h,2,BIG_GAIN);n++;}
   if(al){al['r785Hit_'+h]='enemyHit';al['r785HitBig_'+h]='enemyHit';}}
  if(n){stats.applied++;if(stats.applied>1)stats.reapplied++;}return true;}
 if(on){
  try{apply();}catch(_){stats.errors++;}
  try{setInterval(()=>{try{apply();}catch(_){stats.errors++;}},1000);}catch(_){}
  if(typeof setupAudio==='function'){const base=setupAudio;setupAudio=function(){const r=base.apply(this,arguments);try{apply();}catch(_){stats.errors++;}return r;};}}
 window.__STORYWORLD_RAIN_HIT_R1276__=Object.freeze({revision:REV,heroes:HEROES.slice(),enabled:()=>on,apply,inspect:()=>({revision:REV,on,stats:{...stats},ready:HEROES.every(h=>mine('r785Hit_'+h)&&mine('r785HitBig_'+h))})});
})();
