// R221 WebGL2 없는 브라우저: 빈 화면 대신 이유와 해결 방법을 보여 준다.
// 사용자 Drive 리뷰 캡처(storyworld-live-failure-20261102.jpg): 허브 화면이 비고 아래 줄에 "Three.js 실행 실패 · PC 테스트를 중단합니다." 만 보였다.
// 재현: 크로미움 --disable-webgl --disable-webgl2 → phase1 reason 'WebGL2 context unavailable'.
// 이 게임은 Three.js(WebGL2) 화면이 필수다. hospital-pc-test.js 가 렌더러 없이는 진행·조작을 막는다("Canvas 플레이로 대체하지 않습니다").
//  그 규칙은 그대로 두고, 왜 멈췄는지와 어떻게 하면 되는지를 화면 가운데에 쓴다. WebGL2 가 있으면 아무것도 하지 않는다.
// dist/phase1.js 바로 뒤에 읽혀 phase1-original-adapter 의 createController 를 감싼다(알림 문구만 바꿈).
(()=>{'use strict';
if(window.__STORYWORLD_WEBGL_FALLBACK_R221__)return;
const REV='R221-webgl-3';
const stats={probed:false,webgl2:null,wrapped:false,shown:0,reason:null};
function probe(){if(stats.probed)return stats.webgl2;stats.probed=true;let ok=false;
 try{const c=document.createElement('canvas');const g=c.getContext('webgl2');ok=!!g;try{g?.getExtension('WEBGL_lose_context')?.loseContext();}catch(_){}}catch(_){ok=false;}
 stats.webgl2=ok;return ok;}
const LINE='이 브라우저에서는 WebGL2(3D 그래픽)를 쓸 수 없어 게임 화면을 열 수 없습니다.';
const HELP=['Chrome·Edge·Firefox 최신판으로 여세요.','브라우저 설정에서 "하드웨어 가속 사용"을 켜고 브라우저를 다시 시작하세요.','원격·자동화 브라우저(그래픽 카드 없는 환경)에서는 열리지 않을 수 있습니다.'];
function show(reason){stats.shown++;stats.reason=String(reason||'');
 const n=document.getElementById('phase1-status');if(n)n.textContent=LINE;
 const stage=document.getElementById('stage')||document.body;if(!stage||document.getElementById('webglNoticeR221'))return;
 const d=document.createElement('div');d.id='webglNoticeR221';d.setAttribute('role','alert');
 Object.assign(d.style,{position:'absolute',left:'50%',top:'42%',transform:'translate(-50%,-50%)',zIndex:'5',maxWidth:'min(520px,86%)',padding:'18px 22px',
  background:'rgba(14,10,12,.92)',border:'1px solid rgba(190,150,110,.55)',borderRadius:'6px',color:'#eadfce',font:'14px/1.6 system-ui,sans-serif',textAlign:'left',pointerEvents:'auto'});
 const h=document.createElement('div');h.textContent='3D 화면을 시작하지 못했습니다';Object.assign(h.style,{fontSize:'17px',fontWeight:'700',marginBottom:'6px',color:'#f0d6b0'});
 const p=document.createElement('div');p.textContent=LINE;
 const ul=document.createElement('ul');Object.assign(ul.style,{margin:'8px 0 6px',paddingLeft:'18px'});for(const t of HELP){const li=document.createElement('li');li.textContent=t;ul.appendChild(li);}
 const s=document.createElement('div');s.textContent='기술 정보: '+stats.reason;Object.assign(s.style,{fontSize:'12px',opacity:'.65'});
 d.append(h,p,ul,s);stage.appendChild(d);}
const NO_GL=/WebGL2 context unavailable|WebGL2.*(unavailable|not supported)|Error creating WebGL/i;
function wrapHooks(h){const notice=h.notice;return Object.assign({},h,{notice(message){const r=notice?.call(h,message);
 const m=String(message);if(m.includes('시작하지 못해')&&(NO_GL.test(m)||!probe()))show(m.replace(/^.*?Legacy를 사용합니다\.\s*/,''));return r;}});}
const api=window.StoryPhase1;
if(api&&typeof api.createController==='function'){
 const create=api.createController;
 const next=Object.freeze({...api,createController(hooks,opts){return create.call(api,wrapHooks(hooks),opts);}});
 try{window.StoryPhase1=next;stats.wrapped=window.StoryPhase1===next;}catch(_){stats.wrapped=false;}}
// R1118 외부 리뷰: "WebGL 실행 불가 안내가 타이틀 뒤에 가려지고 새 게임 시작도 가능" → 시작 전에 확인한다.
//  WebGL2 가 없으면 ① 타이틀 창 맨 위에 이유·해결 방법 칸을 넣고 ② 새 게임·이어하기·생존·영화 단추를 비활성으로 두고 ③ newGame·restoreSave 를 불러도 막고 쪽지를 띄운다.
//  WebGL2 가 있으면 아무것도 하지 않는다(확인은 첫 화면이 뜬 뒤 한 번).
const START_IDS=['campaignNew54','campaignContinue54','survivalStartR600','cinemaStartR461'];
const BLOCK='WebGL2(3D 그래픽)를 쓸 수 없어 시작할 수 없습니다. 하드웨어 가속을 켜거나 다른 브라우저로 열어 주세요.';
stats.gated=0;stats.blocked=0;
function titleNotice(){try{const panel=document.getElementById('panel');if(!panel||!panel.querySelector)return;
 const hasStart=START_IDS.some(id=>panel.querySelector('#'+id));if(!hasStart)return;
 for(const id of START_IDS){const b=panel.querySelector('#'+id);if(b&&!b.disabled){b.disabled=true;b.setAttribute('aria-disabled','true');b.setAttribute('title',BLOCK);}}
 if(panel.querySelector('#webglTitleNoticeR1118'))return;
 const d=document.createElement('div');d.id='webglTitleNoticeR1118';d.setAttribute('role','alert');
 Object.assign(d.style,{margin:'0 0 12px',padding:'10px 14px',background:'#2a1512',border:'1px solid #a83224',borderRadius:'4px',color:'#f2e6d2',font:'13px/1.6 system-ui,sans-serif'});
 const h=document.createElement('b');h.textContent='3D 화면을 시작할 수 없습니다';Object.assign(h.style,{display:'block',color:'#f6d2b8',fontSize:'15px'});
 const p=document.createElement('div');p.textContent=LINE;
 const ul=document.createElement('ul');Object.assign(ul.style,{margin:'4px 0 0',paddingLeft:'18px'});for(const t of HELP){const li=document.createElement('li');li.textContent=t;ul.appendChild(li);}
 d.append(h,p,ul);panel.insertBefore(d,panel.firstChild||null);stats.shown++;}catch(_){}}
function gate(){try{if(stats.gated||probe())return;stats.gated=1;stats.reason=stats.reason||'WebGL2 context unavailable (start check)';
 const say=()=>{stats.blocked++;try{if(typeof toast==='function')toast(BLOCK);}catch(_){}titleNotice();return false;};
 try{if(typeof newGame==='function'){newGame=async function(){return say();};}}catch(_){}
 try{if(typeof restoreSave==='function'){restoreSave=async function(){return say();};}}catch(_){}
 titleNotice();
 if(typeof MutationObserver==='function'){const arm=()=>{const panel=document.getElementById('panel');if(!panel)return false;new MutationObserver(titleNotice).observe(panel,{childList:true,subtree:true});return true;};
  if(!arm()&&document.addEventListener)document.addEventListener('DOMContentLoaded',()=>{arm();titleNotice();});}}catch(_){}}
if(typeof setTimeout==='function')setTimeout(gate,0);
window.__STORYWORLD_WEBGL_FALLBACK_R221__=Object.freeze({revision:REV,message:LINE,inspect:()=>({revision:REV,...stats}),probe,gate});
})();
