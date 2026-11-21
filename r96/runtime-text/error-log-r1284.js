// R1284 시스템 오류 기록 보존 — 사용자 2026-11-21 "시스템오류생김"(기억 검열기 보스전 스크린샷, '시스템 오류 · 설정의 상태 및 진단에서 상세 내용을 확인하세요').
//  헤드리스로 같은 조합을 여러 조건에서 돌려도 재현되지 않았다 → 다음에 생기면 새로고침 뒤에도 상세 내용이 남아 바로 보낼 수 있게 한다.
//  · 기록하는 것: 엔진 logError(프레임 루프 오류 = kind 'frame', 그 밖 엔진 포착 = 'engine'), window error('async'), 처리 안 된 Promise 거절('promise').
//  · 한 건: 시각·종류·메시지·스택(각 2000자까지)·지역·층·영웅·레벨·EGO 남은 시간·근처 보스 이름·화면 크기·배율. 같은 메시지+스택 첫 줄은 한 줄로 합쳐 횟수만 늘린다.
//  · 최대 20건(새 것 남김), localStorage storyworld.r1284.errors. 게임 동작은 바꾸지 않는다(기록만).
//  · 설정 '상태 및 진단' 아래에 '저장된 오류 기록' 칸 + 복사·지우기 단추. 끄기: localStorage storyworld.r1284.log = '0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_ERROR_LOG_R1284__)return;
const REV='R1284-error-log-1',KEY='storyworld.r1284.errors',MAX=20,CAP=2000;
const stats={recorded:0,merged:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
let off=false;try{off=localStorage.getItem('storyworld.r1284.log')==='0';}catch(_){}
let rows=[];try{const s=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(s))rows=s.filter(r=>r&&typeof r.message==='string').slice(-MAX);}catch(_){rows=[];}
const cut=s=>String(s==null?'':s).slice(0,CAP);
// room·player·zone 같은 엔진 값은 전역 let 이라 window 속성이 아니다 → 전역 범위 함수로 읽는다
const readers={};const g=name=>{try{if(!/^[A-Za-z_$][\w$]*$/.test(name))return undefined;const f=readers[name]||(readers[name]=new Function('return typeof '+name+'!=="undefined"?'+name+':undefined'));return f();}catch(_){return undefined;}};
const seen=new WeakMap();
function context(){
 const o={};
 try{const r=g('room');o.zone=r?.id||g('zone')||'';o.layer=r?.layer||g('layer')||'';}catch(_){}
 try{const pl=g('player');if(pl){o.hero=pl.hero||'';o.level=pl.level;o.hp=Math.round(pl.hp);o.ego=Number.isFinite(pl.ego)?Math.round(pl.ego*10)/10:undefined;}}catch(_){}
 try{const r=g('room'),pl=g('player');const bs=(r?.enemies||[]).filter(e=>e&&e.hp>0&&(e.boss||e.midboss||e.type==='boss'));
  if(bs.length){bs.sort((a,b)=>Math.hypot(a.x-pl.x,a.y-pl.y)-Math.hypot(b.x-pl.x,b.y-pl.y));o.boss=String(bs[0].name||bs[0].id||'').slice(0,80);o.bossHp=Math.round(bs[0].hp)+'/'+Math.round(bs[0].maxHp);}}catch(_){}
 try{o.view=innerWidth+'x'+innerHeight+'@'+(window.devicePixelRatio||1);}catch(_){}
 return o;
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(rows));}catch(e){fail(e);}}
function record(kind,err,fallbackMsg){
 if(off)return;
 try{
  if(err&&typeof err==='object'){const prior=seen.get(err);if(prior&&rows.includes(prior)){if(kind!=='engine'&&prior.kind==='engine'){prior.kind=kind;save();refresh();}return;}}
  const message=cut(err?.message!=null?err.message:(fallbackMsg!=null?fallbackMsg:String(err)));
  const stack=cut(err?.stack||'');
  const sig=message+'\n'+(stack.split('\n').find((l,i)=>i>0&&l.trim())||'');
  const at=new Date().toISOString();
  const same=rows.find(r=>r.sig===sig);
  let row=same;
  if(same){same.count=(same.count||1)+1;same.last=at;if(kind!=='engine'&&same.kind==='engine')same.kind=kind;rows.splice(rows.indexOf(same),1);rows.push(same);stats.merged++;}
  else{row={sig,kind,message,stack,at,last:at,count:1,...context()};rows.push(row);stats.recorded++;if(rows.length>MAX)rows=rows.slice(-MAX);}
  if(err&&typeof err==='object')seen.set(err,row);
  save();refresh();
 }catch(e){fail(e);}
}
// 엔진 logError(전역 함수) 감싸기 — 프레임 루프 catch 가 부른 것이면 kind 'frame'
try{
 const base=g('logError');
 if(typeof base==='function'){
  window.logError=function(error,...rest){
   const out=base.call(this,error,...rest);
   let kind='engine';try{const s=String(new Error().stack||'');if(/(^|\n)\s*(at frame \(|frame@)/.test(s))kind='frame';}catch(_){}
   record(kind,error&&typeof error==='object'?error:null,error&&typeof error==='object'?null:String(error));
   return out;
  };
 }
}catch(e){fail(e);}
window.addEventListener('error',ev=>{if(!ev||!ev.message)return;record('async',ev.error&&typeof ev.error==='object'?ev.error:null,ev.message+(ev.filename?' @ '+String(ev.filename).split('/').pop()+':'+ev.lineno+':'+ev.colno:''));});
window.addEventListener('unhandledrejection',ev=>{const r=ev?.reason;record('promise',r&&typeof r==='object'?r:null,String(r?.message||r));});
function text(){
 if(!rows.length)return '저장된 오류 없음';
 return rows.slice().reverse().map((r,i)=>[
  `#${i+1} [${r.kind}] ${r.at}${r.count>1?' ×'+r.count+' (마지막 '+r.last+')':''}`,
  `지역 ${r.zone||'?'}·${r.layer||'?'} · 영웅 ${r.hero||'?'} Lv.${r.level??'?'} 체력 ${r.hp??'?'}${r.ego?' EGO '+r.ego+'s':''}${r.boss?' · 보스 '+r.boss+' '+r.bossHp:''} · 화면 ${r.view||'?'}`,
  r.message,
  r.stack&&r.stack!==r.message?r.stack:''
 ].filter(Boolean).join('\n')).join('\n\n');
}
function refresh(){try{const pre=document.querySelector('#errorLogR1284 pre');if(pre)pre.textContent=text();}catch(e){fail(e);}}
function mount(){
 try{
  const diag=document.getElementById('statusDiagnosticsR63R2');if(!diag||document.getElementById('errorLogR1284'))return;
  const box=document.createElement('div');box.id='errorLogR1284';
  const h=document.createElement('h4');h.textContent='저장된 오류 기록 (새로고침 뒤에도 남음, 최근 '+MAX+'건)';box.appendChild(h);
  const pre=document.createElement('pre');pre.className='readout';pre.style.maxHeight='16em';pre.style.overflow='auto';pre.style.whiteSpace='pre-wrap';pre.textContent=text();box.appendChild(pre);
  const act=document.createElement('div');act.className='actions';
  const copy=document.createElement('button');copy.type='button';copy.dataset.r1284='copy';copy.textContent='오류 기록 복사';
  copy.onclick=async()=>{const t=text();let done=false;try{await navigator.clipboard.writeText(t);done=true;}catch(_){}
   if(!done)try{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();done=document.execCommand('copy');ta.remove();}catch(_){}
   copy.textContent=done?'복사했습니다':'복사 실패 — 글을 직접 선택해 주세요';setTimeout(()=>{copy.textContent='오류 기록 복사';},1800);};
  const clear=document.createElement('button');clear.type='button';clear.dataset.r1284='clear';clear.textContent='기록 지우기';
  clear.onclick=()=>{rows=[];save();refresh();};
  act.appendChild(copy);act.appendChild(clear);box.appendChild(act);diag.appendChild(box);
 }catch(e){fail(e);}
}
try{
 const base=g('showSettings');
 if(typeof base==='function')window.showSettings=function(...args){const out=base.apply(this,args);mount();return out;};
}catch(e){fail(e);}
window.__STORYWORLD_ERROR_LOG_R1284__=Object.freeze({revision:REV,list:()=>rows.map(r=>({...r})),text,clear:()=>{rows=[];save();refresh();},record,
 inspect:()=>({revision:REV,off,count:rows.length,stats:{...stats},lastError})});
})();
