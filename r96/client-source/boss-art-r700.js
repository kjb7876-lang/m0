/* R700 보스 그림 전수조사(7대죄 우선) — 사용자 2026-11-11 00:57Z "보스들 특히 7대죄 이미지 일관성 및 품질 전수조사검사 개선작업".
 *  실측(qa/r700/audit.md): 게임이 실제로 그리는 7대죄 보스 그림 가운데 질투·탐식·색욕의 0단계 공격 그림만 가장자리의 37~43%가
 *  배경 지우기 때 남은 회백 1~3px 테두리였다(대기 그림·R104 열쇠 자세·R380 시트는 0~1%). 공격할 때만 몸에 흰 윤곽이 생겨 대기와 다른 그림처럼 보였다.
 *  scripts/r700-boss-clean.py 가 테두리 색만 안쪽 몸 색으로 바꾼 사본(픽셀은 지우지 않음)을 assets/r700/clean/<원래 경로> 에 두고,
 *  여기서 그 경로의 이미지 주소만 사본으로 돌린다. 원본·R99·R425 사본은 그대로, 캐시 키·저장·데이터 줄도 원래 경로 그대로.
 *  R425(바깥)·R99(안쪽) 주소 돌리기 사이에 끼므로 두 사본 접두사가 붙어 와도 알아본다.
 *  같은 라운드의 나태 몸 크기 고침(크기 잠금 값 241.8→205)은 sin-boss-art-r463-data.js(scripts/r463-sin-boss-art.py) 쪽이다.
 *  끄기: localStorage['storyworld.r700.bossart']='{"clean":false}'. 점검: window.__STORYWORLD_BOSS_ART_R700__.inspect() */
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_ART_R700__||typeof urlFor!=='function')return;
const REV='R700-boss-art-1',KEY='storyworld.r700.bossart';
const CLEAN=new Set(["assets/generated-v31224/actors-normalized/9f845f4d58bf_envy-human-attack.webp", "assets/generated-v31224/actors-normalized/27ef01c10a8f_gluttony-human-attack.webp", "assets/generated-v31224/actors-normalized/53c9ce212489_lust-human-attack.webp"]);
let prefs={clean:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.clean==='boolean')prefs.clean=s.clean;}catch(_){}
const stats={redirected:0,errors:0};let lastError=null;
const PRE=/^(?:\.\/)?(?:assets\/r425\/clean\/|assets\/r99\/clean\/)?/;
const base=urlFor;urlFor=function(path,...a){try{if(prefs.clean&&typeof path==='string'){const raw=typeof cleanPath==='function'?cleanPath(path):path;const p=String(raw).replace(PRE,'');
  if(CLEAN.has(p)){stats.redirected++;return base.call(this,'assets/r700/clean/'+p,...a);}}}catch(e){stats.errors++;lastError=String(e?.message||e).slice(0,160);}
 return base.call(this,path,...a);};
window.__STORYWORLD_BOSS_ART_R700__=Object.freeze({revision:REV,paths:()=>[...CLEAN],set:p=>{if(typeof p?.clean==='boolean')prefs.clean=p.clean;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 inspect:()=>({revision:REV,prefs:{...prefs},count:CLEAN.size,stats:{...stats},lastError,originalsChanged:false})});
})();
