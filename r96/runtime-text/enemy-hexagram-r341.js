// R341 — 사용자 2026-11-05 "서사에 적 십자가가 나오는 부분 모두 흑마법진 혹은 육망성으로 대체, 이펙트 및 이미지도 육망성으로. 십자가는 항상 긍정적으로, 아군 쪽에서".
//  상징 규칙(SKILL.md 11절): 마법진·육망성 = 악마·적, 십자가 = J·아군 구원자.
//  · 글자: 정본 데이터(R106 서사 등)는 다시 만들어지는 고정 데이터라 그대로 두고, 화면에 보일 때 적 쪽 십자가 표현만 바꾼다
//    (문서 글자 노드 감시 + 캔버스에 그리는 몹·보스 이름). 미카엘라의 십자가·J 의 인장 같은 아군 쪽 십자가는 바꾸지 않는다(아래 표에 있는 적 표현만).
//  · 그림: 적 위험지대가 십자 봉인 그림(cross-seal)을 쓰면 핏빛 육망성으로 바꿔 그린다. 사몽 운석 예고의 십자 마법진은 samong-play-r162·samong-r161 에서 육망성으로 바꿨다.
//  · 끄기: localStorage['storyworld.r341.hexagram']='0'.
(()=>{'use strict';
if(window.__STORYWORLD_ENEMY_HEXAGRAM_R341__)return;
const REV='R341-enemy-hexagram-1',KEY='storyworld.r341.hexagram';
let on=true;try{on=localStorage.getItem(KEY)!=='0';}catch(_){}
const stats={text:0,names:0,hazards:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
// 긴 표현부터(겹치는 짧은 표현보다 먼저)
const MAP=[['거꾸로 된 십자가와 피로 그린 육망성','검은 마법진과 피로 그린 육망성'],['거꾸로 매달린 십자가','거꾸로 매달린 흑마법진'],['황금빛 역십자가 형태의 탄막','황금빛 육망성 형태의 탄막'],
 ['황금 역십자가의 탄막','황금 육망성의 탄막'],['거꾸로 된 십자가 창','육망성 창'],['역십자가 시체경호체','흑마법진 시체경호체'],['창처럼 날아오는 역십자가','창처럼 날아오는 육망성'],
 ['치료거부 성광십자','치료거부 성광 육망성'],['거꾸로 된 십자가','흑마법진'],['역십자가','육망성'],['역십자','육망성']];
const HIT=/역십자|거꾸로 된 십자가|거꾸로 매달린 십자가|성광십자/;
// 십자가(모음 끝) → 흑마법진·육망성(받침 끝): 뒤 조사를 맞춘다(가→이, 를→을, 는→은, 와→과, 로→으로, 야→이야, 여→이여)
const JOSA={'가':'이','를':'을','는':'은','와':'과','로':'으로','야':'이야','여':'이여'};
function swap(s){if(typeof s!=='string'||!HIT.test(s))return s;let o=s;for(const[a,b]of MAP)if(o.includes(a))o=o.split(a).join('\u0001'+b+'\u0002');
 o=o.replace(/\u0002(가|를|는|와|로|야|여)(?![가-힣])/g,(m,j)=>JOSA[j]);return o.replace(/[\u0001\u0002]/g,'');}
// 글자 노드
function walk(root){try{if(!root)return;if(root.nodeType===3){const t=swap(root.data);if(t!==root.data){root.data=t;stats.text++;}return;}
 if(root.nodeType!==1&&root.nodeType!==11)return;const tw=document.createTreeWalker(root,4);let n;while((n=tw.nextNode())){if(!HIT.test(n.data))continue;const t=swap(n.data);if(t!==n.data){n.data=t;stats.text++;}}
 if(root.nodeType===1&&root.title&&HIT.test(root.title))root.title=swap(root.title);}catch(e){fail(e);}}
function observe(){try{if(!on||!document.body)return false;walk(document.body);new MutationObserver(ms=>{if(!on)return;for(const m of ms){if(m.type==='characterData')walk(m.target);else for(const n of m.addedNodes)walk(n);}}).observe(document.body,{subtree:true,childList:true,characterData:true});return true;}catch(e){fail(e);return false;}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
// 몹·보스 이름(캔버스에 그리는 머리 위 이름·보스 이름): e.name 자체는 R248·R306 그림 찾기 열쇠라 바꾸지 않고, 그릴 때 글자만 바꾼다.
const memo=new Map();function canvasText(t){if(!on||typeof t!=='string'||!HIT.test(t))return t;let o=memo.get(t);if(o===undefined){o=swap(t);if(memo.size>256)memo.clear();memo.set(t,o);stats.names++;}return o;}
function wrapFill(o){try{if(!o||typeof o.fillText!=='function'||o.fillText.r341)return;const base=o.fillText;const f=function(t,...a){return base.call(this,canvasText(t),...a);};f.r341=true;o.fillText=f;}catch(e){fail(e);}}
if(typeof CanvasRenderingContext2D==='function')wrapFill(CanvasRenderingContext2D.prototype);
if(typeof ctx==='object'&&ctx&&Object.prototype.hasOwnProperty.call(ctx,'fillText'))wrapFill(ctx);
// 적 위험지대의 십자 봉인 그림 → 핏빛 육망성
const BLOOD={a:[100,27,37],b:[209,40,53]},INK={a:[11,13,14],b:[100,27,37]};
if(typeof drawHazard==='function'){const base=drawHazard;drawHazard=function(h,...a){try{if(on&&h&&typeof h.asset==='string'&&/cross-seal/.test(h.asset)&&typeof project==='function'){const S=window.__STORYWORLD_FX_SPRITES_R106__;
   if(S&&S.on&&S.on()){const q=project(h.x,h.y),U=Math.abs(project(h.x+1,h.y).x-q.x)*1.25+1,w=(h.radius||1)*U*2,warn=h.age<h.warning,u=warn?Math.min(1,h.age/Math.max(.01,h.warning)):1,al=warn?.45+.55*u:Math.max(0,1-(h.age-h.warning)/Math.max(.2,h.life-h.warning));
    S.draw('rune',INK,q.x,q.y,w*1.03,w*1.03,{squash:.5,angle:(h.age||0)*.6,alpha:.7*al,blend:'source-over'});S.draw('rune',BLOOD,q.x,q.y,w,w,{squash:.5,angle:(h.age||0)*.6,alpha:al});stats.hazards++;return;}}}catch(e){fail(e);}return base.apply(this,[h,...a]);};}
window.__STORYWORLD_ENEMY_HEXAGRAM_R341__=Object.freeze({revision:REV,swap,MAP,
 canvasText,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}return on;}});
})();
