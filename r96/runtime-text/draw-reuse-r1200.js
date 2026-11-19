// R1200 그리기 렉 — 그림 조각(명령 메시) 재사용(사용자 2026-11-19 "싹다확인해서 그리기 위주로 전수조사해서 렉파격적개선").
//  헤드리스 실측(사몽 4장 3구역 ep1b08, 환도 777, 640×360, 20장면): 3D 기록기(CommandScene)가 장면마다 명령 메시를 약 90개 새로 만들고 버렸다.
//   새로 만들 때마다 BufferGeometry·MeshBasicMaterial·Mesh 생성, three getProgram·cloneUniforms, GPU 버퍼·VAO 생성, 버릴 때 dispose(해제).
//   그중 57개는 '열쇠(c.key)는 그대로인데 그림(image)만 바뀐' 경우였다(scene:N 차례 열쇠, 몹 걷기 칸, 효과 칸). 엔진은 그림이 다르면 무조건 지우고 새로 만든다.
//  고침: CommandScene.render 앞에서, 열쇠가 같고 · 그림만 다르고 · 모양(style — globalAlpha·filter 제외, 값이 모두 글자·숫자일 때만)과 주인 종류가 같은
//   그림 명령이면 지금 재질의 map 만 새 텍스처로 바꿔 끼운다(엔진 texture()/release() 로 참조 수를 맞춘다 — R980 감싸기도 그대로 탄다).
//   그 뒤는 엔진의 원래 '같은 그림' 길(자리·UV·필터·투명도 갱신)이 그대로 돈다. 그리는 결과(텍스처·모양·자리)는 새로 만들 때와 같다.
//   깊이 재질이 있는 몸, MeshBasic 이 아닌 재질(병원 금속), 필터 정보가 없는 재질은 손대지 않는다(엔진이 예전처럼 새로 만든다).
//  둘째(새 열쇠 재활용): 먼지·잔상·재처럼 장면마다 번호가 새로 붙는 그림(예 r113:dust:41→42)은 열쇠가 매번 새로워 지우고 새로 만들었다(장면당 약 30개).
//   이번 장면 명령에 열쇠가 없어 엔진이 render 끝에 지울 행을, 같은 종류(숫자만 다른 열쇠)·같은 모양·같은 주인 종류의 '새 열쇠' 명령에 넘겨 준다(열쇠만 옮기고 위처럼 그림을 바꿔 끼움).
//   자리·UV·순서·층·투명도·필터는 엔진의 원래 '있는 행' 길이 새 명령 값으로 다시 맞춘다. 행 하나는 한 명령에만 준다.
//  끄기: localStorage['storyworld.r1200.reuse']='0' 또는 __STORYWORLD_DRAW_REUSE_R1200__.set(false)
(()=>{'use strict';
if(window.__STORYWORLD_DRAW_REUSE_R1200__)return;
const REV='R1200-draw-reuse-1',KEY='storyworld.r1200.reuse';
let on=true;try{if(localStorage.getItem(KEY)==='0')on=false;}catch(_){}
const stats={frames:0,swaps:0,rekeys:0,skipped:0,errors:0};let lastError=null,wrapped=false;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const own=Object.prototype.hasOwnProperty;
const prim=v=>v===null||(typeof v!=='object'&&typeof v!=='function');
function sameStyle(prev,c){
 if(!prev||prev.kind!=='image')return false;
 const pf=c.owner?.kind==='prop'?c.owner.visualHospitalFrame:null;if(prev.propFrame!==pf)return false;
 const a=prev.style,b=c.style;if(!a||!b)return false;let na=0,nb=0;
 for(const k in a){if(!own.call(a,k)||k==='globalAlpha'||k==='filter')continue;na++;const v=a[k];if(!prim(v)||!own.call(b,k)||!Object.is(v,b[k]))return false;}
 for(const k in b)if(own.call(b,k)&&k!=='globalAlpha'&&k!=='filter')nb++;
 return na===nb;}
const reusable=row=>{const mesh=row?.mesh,m=mesh?.material;return !!(row.image&&m&&m.isMeshBasicMaterial&&m.userData?.filter&&m.map&&!mesh.customDepthMaterial&&row.styleState?.kind==='image');};
function retexture(S,row,c){if(row.image===c.image)return;const old=row.image,tex=S.texture(c.image,c.mutable);row.mesh.material.map=tex;row.image=c.image;S.release(old);}
function swap(S,c){
 const row=S.rows.get(c.key);if(!row||!row.image||!c.image||row.image===c.image)return;
 if(!reusable(row)||row.geometryState?.owner?.kind!==c.owner?.kind||!sameStyle(row.styleState,c)){stats.skipped++;return;}
 retexture(S,row,c);stats.swaps++;}
// 열쇠 종류: 숫자(소수·음수 포함)를 # 로 — 'r113:dust:41' 과 'r113:dust:42' 는 같은 종류
const family=k=>String(k).replace(/-?\d+(?:\.\d+)?/g,'#');
function sig(kind,style){let o='';for(const k in style){if(!own.call(style,k)||k==='globalAlpha'||k==='filter')continue;const v=style[k];if(!prim(v))return null;o+=k+'='+typeof v+':'+String(v)+';';}return kind+'|'+o;}
function rekey(S,commands){
 let spare=null;const here=new Set();for(const c of commands)if(c&&c.key!==undefined)here.add(c.key);
 for(const c of commands){if(!c||c.kind!=='image'||!c.image||S.rows.has(c.key))continue;
  if(spare===null){spare=new Map();for(const [k,row] of S.rows){if(here.has(k)||!reusable(row))continue;const g=sig(row.geometryState?.owner?.kind,row.styleState.style);if(g===null||row.styleState.propFrame!==null)continue;const f=family(k)+'|'+g;let a=spare.get(f);if(!a)spare.set(f,a=[]);a.push(k);}}
  if(!spare.size)return;if(c.owner?.kind==='prop')continue;const g=sig(c.owner?.kind,c.style);if(g===null)continue;const a=spare.get(family(c.key)+'|'+g);if(!a||!a.length)continue;
  const k=a.pop(),row=S.rows.get(k);if(!row)continue;S.rows.delete(k);S.rows.set(c.key,row);retexture(S,row,c);stats.rekeys++;}}
function wrap(){
 if(wrapped)return true;const CS=window.StoryPhase1?.CommandScene;const P=CS?.prototype;if(!P||typeof P.render!=='function'||typeof P.texture!=='function'||typeof P.release!=='function')return false;
 const base=P.render;
 P.render=function(commands){
  if(on&&Array.isArray(commands)&&this.rows&&!this.disposed){stats.frames++;
   for(const c of commands){if(!c||c.kind!=='image')continue;try{swap(this,c);}catch(e){fail(e);}}
   try{rekey(this,commands);}catch(e){fail(e);}}
  return base.apply(this,arguments);};
 wrapped=true;return true;}
if(!wrap()){let n=0;const t=setInterval(()=>{if(wrap()||++n>600)clearInterval(t);},100);}
function set(v){on=v!==false;try{if(on)localStorage.removeItem(KEY);else localStorage.setItem(KEY,'0');}catch(_){}return on;}
window.__STORYWORLD_DRAW_REUSE_R1200__=Object.freeze({revision:REV,set,inspect:()=>({revision:REV,on,wrapped,stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
