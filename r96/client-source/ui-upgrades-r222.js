// R222 스킬업(P · 패시브 강화) 창 다듬기 — 사용자 2026-11-02 "스킬업ui 개선해줘".
// 실측(헤드리스 1280×720, Lv.12·1점): 창 위쪽 다섯 줄 설명 때문에 강화 카드가 반쯤 접혀 내려가 있었고(창 높이 1145px 중 660px 보임),
//  포인트가 두 번 표시됐으며, 설명 끝이 '…'로 잘렸다. 눌리지 않는 +1 단추에 이유가 없었다:
//   · Z·X·C 스킬강화 — 원래 카드에는 "사몽 루트를 시작하면 열립니다"가 있는데 모음에는 안 보였다.
//   · 일반강화 — 이미 최대(6/6, 8/8 …)인데 모음에는 "다음 1점"으로 보였다.
// 바꾼 것(그림·구매 규칙·비용은 그대로, R115 모음 위에 덧칠만):
//  1) 설명 문단은 "규칙·지금 효과" 접기 안으로 넣고, 제목 줄에 사용 가능 포인트 배지를 단다.
//  2) 눌리지 않는 단추에 이유를 쓴다: 최대 → '최대', 잠김 → '잠김' + 열리는 조건 한 줄, 점수 부족 → '점수 부족'.
//  3) 살 수 있는 단추는 금빛 테두리로 눈에 띄게 한다.
//  4) 설명은 잘리지 않게 두 줄까지 보여 준다.
//  5) 이 창에서는 쓸 수 없는 '앞으로 ▶' 단추를 숨긴다.
// 끄기: localStorage['storyworld.r222.upgradesUi']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_UPGRADES_UI_R222__)return;
const REV='R222-upui-1',KEY='storyworld.r222.upgradesUi';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={passes:0,rows:0,max:0,locked:0,short:0,buyable:0,folded:0,formulas:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const CSS=`#panel #r115Book .ln{white-space:normal;overflow:hidden;text-overflow:clip;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.35}
#panel #r115Book .r115row{align-items:start;padding:5px 2px}
#panel #r115Book .r115row button{min-width:46px;align-self:center;white-space:nowrap}
#panel #r115Book .r115row button.r222buy{border-color:#d9b35f;color:#ffe7b0;box-shadow:0 0 0 1px #d9b35f55,0 0 8px #d9b35f44}
#panel #r115Book .r115row button.r222max{color:#bfae8f;opacity:.75}
#panel #r115Book .r115row button.r222lock,#panel #r115Book .r115row button.r222short{color:#9d8d78;opacity:.8;font-size:11px}
#panel #r115Book .r115row .r222why{grid-column:2/4;font-size:11px;color:#c99a6a;margin-top:1px}
#panel .r222pts{display:inline-block;margin-left:10px;padding:2px 10px;border:1px solid #d9b35f;border-radius:999px;font-size:13px;color:#ffe7b0;vertical-align:middle;background:#2a1f12}
#panel details.r222help{margin:4px 0 8px;border:1px solid #4a3d30;border-radius:6px;padding:4px 10px;background:#140f0c99}
#panel details.r222help>summary{cursor:pointer;font-size:12px;color:#cdbda4;padding:2px 0}
#panel details.r222help>p{margin:6px 0}
#panel.r222up #r176Nav [data-r176="fwd"][disabled]{display:none}`;
function style(){if(document.getElementById('r222UpCss'))return;const s=document.createElement('style');s.id='r222UpCss';s.textContent=CSS;document.head.appendChild(s);}
const pts=()=>{const p=typeof player==='object'&&player?Number(player.points):NaN;return Number.isFinite(p)?p:null;};
// 원래 카드(숨겨진 .cards)의 글에서 이유를 읽는다.
function reasonOf(card,cost){const t=(card?.innerText||card?.textContent||'').replace(/\s+/g,' ');
 const lv=t.match(/(\d+)\s*\/\s*(\d+)/);if(lv&&+lv[1]>=+lv[2]&&+lv[2]>0)return {kind:'max'};
 const lock=t.match(/[^.。]*(열립니다|필요합니다|필요|해금)[^.。]*/);if(lock)return {kind:'lock',why:lock[0].trim()};
 const p=pts();if(p!=null&&Number.isFinite(cost)&&p<cost)return {kind:'short'};return {kind:'other'};}
function titleOf(card){return (card.querySelector('b,strong,h3,h4,.title')?.textContent||card.textContent||'').trim();}
function pass(panel){stats.passes++;panel.classList.add('r222up');
 const book=panel.querySelector('#r115Book');const cards=[...panel.querySelectorAll('.cards button.card, .cards .card')];
 // 1) 설명 접기 + 포인트 배지
 const h2=panel.querySelector('h2');const p=pts();
 if(h2&&p!=null){let b=h2.querySelector('.r222pts');if(!b){b=document.createElement('span');b.className='r222pts';h2.appendChild(b);}b.textContent='사용 가능 '+p+'점';}
 if(!panel.querySelector('details.r222help')&&book){const smalls=[...panel.children].filter(c=>c.tagName==='P'&&c.classList.contains('small')&&c.compareDocumentPosition(book)&Node.DOCUMENT_POSITION_FOLLOWING);
  if(smalls.length){const d=document.createElement('details');d.className='r222help';const s=document.createElement('summary');s.textContent='규칙 · 지금 효과 보기';d.appendChild(s);smalls[0].before(d);for(const n of smalls)d.appendChild(n);stats.folded+=smalls.length;}}
 if(!book)return;
 // 2)·3) 단추 상태
 for(const row of book.querySelectorAll('.r115row')){const btn=row.querySelector('button[data-r115up]');if(!btn)continue;stats.rows++;
  btn.classList.remove('r222buy','r222max','r222lock','r222short');row.querySelector('.r222why')?.remove();
  const name=row.querySelector('.nm')?.textContent.trim()||'';const lvEl=row.querySelector('.lv');
  const cost=Number((lvEl?.textContent.match(/다음\s*(\d+)점/)||[])[1]);
  if(!btn.disabled){btn.classList.add('r222buy');btn.textContent='+1';btn.title=Number.isFinite(cost)?cost+'점 써서 한 단계 올리기':'올리기';stats.buyable++;continue;}
  const card=cards.find(c=>titleOf(c).startsWith(name))||cards.find(c=>(c.textContent||'').includes(name));
  const r=reasonOf(card,cost);
  if(r.kind==='max'){btn.textContent='최대';btn.classList.add('r222max');btn.title='이미 최대 단계입니다';if(lvEl)lvEl.textContent=lvEl.textContent.replace(/\s*·\s*다음\s*\d+점/,'')+' · 최대';stats.max++;}
  else if(r.kind==='lock'){btn.textContent='잠김';btn.classList.add('r222lock');btn.title=r.why;const w=document.createElement('span');w.className='r222why';w.textContent='🔒 '+r.why;row.appendChild(w);stats.locked++;}
  else if(r.kind==='short'){btn.textContent='부족';btn.classList.add('r222short');btn.title='포인트가 모자랍니다 ('+cost+'점 필요)';stats.short++;}}
 // 6) 수식 설명 → 지금·다음 수치
 for(const row of book.querySelectorAll('.r115row')){const ln=row.querySelector('.ln'),lvEl=row.querySelector('.lv');if(!ln||ln.dataset.r222)continue;
  const k=Number((lvEl?.textContent.match(/(\d+)단계/)||[])[1]);if(!Number.isFinite(k))continue;const nice=friendly(ln.textContent,k);
  if(nice){ln.dataset.r222='1';ln.title=ln.textContent;ln.textContent=nice;stats.formulas++;}}
}
// 아주 작은 사칙연산 계산기(단계 자리에 숫자만 넣는다; eval 을 쓰지 않음)
function calc(src){const s=src.replace(/×/g,'*').replace(/\s+/g,'');let i=0;
 const num=()=>{if(s[i]==='('){i++;const v=add();if(s[i]!==')')throw 0;i++;return v;}if(s[i]==='-'){i++;return -num();}const m=s.slice(i).match(/^\d+(\.\d+)?/);if(!m)throw 0;i+=m[0].length;return +m[0];};
 const mul=()=>{let v=num();while(s[i]==='*'||s[i]==='/'){const o=s[i++],w=num();v=o==='*'?v*w:v/w;}return v;};
 const add=()=>{let v=mul();while(s[i]==='+'||s[i]==='-'){const o=s[i++],w=mul();v=o==='+'?v+w:v-w;}return v;};
 const v=add();if(i!==s.length||!Number.isFinite(v))throw 0;return v;}
const pct=v=>(Math.round(v*1000)/10)+'%';
function friendly(text,k){try{
 let m=text.match(/^(.*?)\s*×\s*\[([^\]]*단계[^\]]*)\]\.?\s*$/);
 if(m){const a=calc(m[2].replace(/단계/g,'('+k+')')),b=calc(m[2].replace(/단계/g,'('+(k+1)+')'));return m[1].trim()+' '+pct(a)+' → 다음 '+pct(b);}
 m=text.match(/^(.*?)\s*([\d.]+\s*×\s*단계\s*\/\s*\(\s*단계\s*\+\s*[\d.]+\s*\))\s*%\.?\s*$/);
 if(m){const a=calc(m[2].replace(/단계/g,'('+k+')')),b=calc(m[2].replace(/단계/g,'('+(k+1)+')'));const f=x=>(Math.round(x*10)/10)+'%';return m[1].trim()+' '+f(a)+' → 다음 '+f(b);}
}catch(_){}return null;}
let obs=null,busy=false;
function watch(){const panel=document.getElementById('panel');if(!panel||obs)return;
 obs=new MutationObserver(()=>{if(busy||!on)return;if(!panel.querySelector('#r115Book')&&!panel.querySelector('#r62PassiveClose'))return panel.classList.remove('r222up');
  busy=true;try{style();pass(panel);}catch(e){fail(e);}finally{Promise.resolve().then(()=>{busy=false;});}});
 obs.observe(panel,{childList:true,subtree:true});}
if(on){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();}
window.__STORYWORLD_UPGRADES_UI_R222__=Object.freeze({revision:REV,inspect:()=>({revision:REV,on,stats:{...stats},lastError}),reasonOf,pass,friendly,calc});
})();
