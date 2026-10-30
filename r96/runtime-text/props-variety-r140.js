// R140 — 장식 조형물이 모두 같은 쪽을 보고 서 있던 것을, 물리적으로 어색하지 않은 범위에서 방향을 다양하게.
//  · 바닥에 혼자 서 있는 장식(지역 장면 소품 R80/R81, 사몽 흩어 놓은 소품, 사몽 분위기 조형물, 드라이브 원화 소품)은
//    소품 id 로 정한 절반을 좌우로 뒤집어 그린다(같은 소품은 늘 같은 쪽 — 깜빡이지 않음).
//  · 벽에 붙은 것(창·액자·게시판·사물함·벽 줄 소품·책상 줄)과 문·단서·진술·NPC·목표·부서지는 상자는 뒤집지 않는다.
//  · 회전(기울임)은 하지 않는다 — 비스듬히 세운 물체는 등각 화면에서 쓰러진 것처럼 보인다.
// 그리기만 바뀌며 위치·충돌·상호작용·세이브는 그대로다. 설정 storyworld.r140.props {flip:false} 로 끈다.
(()=>{'use strict';
if(window.__STORYWORLD_PROPS_VARIETY_R140__)return;
const KEY='storyworld.r140.props';let prefs={flip:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={flipped:0,kept:0,errors:0};let lastError=null;
const h32=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const WALLY=/window|frame|board|notice|locker|sign|banner|mirror|wall|door|gate|portal|stair|lift|shelf|cabinet/i;
function free(p){if(!p||typeof p!=='object'||p.interactive||p.r74Door||p.terrainWall||p.r75NPC||p.r75NarrativeNPC||p.r75FortPerson||p.r115Clue||p.r115Stmt!=null||p.r105Record||p.samongR103||p.objective||/objective/i.test(String(p.id||'')))return false;
 if(p.r123Deco){const d=p.r123Deco;if(d.face||WALLY.test(String(d.kind||'')))return false;return true;}
 if(p.r138Drive)return p.r138Drive==='bones';
 if(p.r115Prop){const id=String(p.id||'');if(/:(a|g)\d/.test(id)||WALLY.test(p.r115Prop))return false;return true;}
 if(p.r80Dressing||p.r81NativeSkin){const k=String(p.r80Art||p.path||p.r81NativeSkin?.path||'');return !WALLY.test(k);}
 return false;}
const flipOf=p=>(h32(p.id??(p.x+':'+p.y))&1)===1;
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){
 if(!prefs.flip||!free(p)||!flipOf(p)||typeof ctx?.scale!=='function'||typeof project!=='function'){return base.call(this,p,...a);}
 let q;try{q=project(p.x,p.y);}catch(e){stats.errors++;lastError=String(e?.message||e);return base.call(this,p,...a);}
 ctx.save();try{ctx.translate(q.x,0);ctx.scale(-1,1);ctx.translate(-q.x,0);stats.flipped++;return base.call(this,p,...a);}finally{ctx.restore();}};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_PROPS_VARIETY_R140__=Object.freeze({set,free,flipOf,inspect:()=>({revision:'R140-props-variety-1',prefs:{...prefs},stats:{...stats},lastError})});
})();
