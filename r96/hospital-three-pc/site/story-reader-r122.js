/* R122 서사 읽기창 (사용자 2026-10-29 "긴 서사는 텍스트를 넘기는 방식으로 한 곳에서 이어서 확인 가능하게").
 * 원래 서사 창(advanceScene → openPanel)은 장면 하나의 긴 원문을 한 칸에 통째로 넣어 스크롤해야 했다.
 * 창이 열리면 본문(.storyText)을 문단 경계로 '쪽'으로 나누어 한 쪽씩 보여 주고, ◀ 이전 / 다음 ▶ 와 쪽수(3 / 12)를 붙인다.
 * 마지막 쪽에서는 원래 '계속' 단추가 그대로 다음 장면으로 넘긴다. Enter·Space·→ 다음 쪽, ← 이전 쪽.
 * 원문 문장·장면 순서·읽음 기록·음성은 그대로이고, 보여 주는 방식만 바꾼다. 설정 키 r122.reader. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_READER_R122__||typeof advanceScene!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r122.reader';
 const prefs={on:true,size:430};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(typeof s?.on==='boolean')prefs.on=s.on;if(Number.isFinite(s?.size))prefs.size=Math.max(200,Math.min(1200,s.size));}catch(_){}
 const stats={scenes:0,pages:0,turns:0};let lastError=null;
 const cur={pages:null,at:0,el:null,next:null,bar:null};
 // 문단을 쪽으로 묶는다: 한 쪽은 약 size 글자. 한 문단이 너무 길면 문장 끝(. ? ! 。 …")에서 자른다.
 function paginate(text,size){const paras=String(text||'').replace(/\r\n/g,'\n').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean),out=[];let buf='';
  const push=()=>{if(buf.trim())out.push(buf.trim());buf='';};
  for(const p of paras){if(p.length>size*1.3){push();const parts=p.match(/[^.?!。…]+[.?!。…]+["”’)]*\s*|[^.?!。…]+$/g)||[p];let b='';for(const s of parts){if(b&&(b+s).length>size){out.push(b.trim());b='';}b+=s;}if(b.trim())buf=b;continue;}
   if(buf&&(buf.length+p.length+2)>size)push();buf+=(buf?'\n\n':'')+p;}
  push();return out.length?out:[String(text||'')];}
 function render(){if(!cur.pages||!cur.el)return;const n=cur.pages.length,i=cur.at;cur.el.textContent=cur.pages[i];cur.el.scrollTop=0;
  if(cur.bar){cur.bar.querySelector('.r122Count').textContent=(i+1)+' / '+n;cur.bar.querySelector('.r122Prev').disabled=i===0;}
  if(cur.next)cur.next.textContent=i<n-1?'다음 ▶ · Enter':'계속 · Enter';}
 function turn(d){if(!cur.pages)return false;const j=cur.at+d;if(j<0||j>=cur.pages.length)return false;cur.at=j;stats.turns++;render();return true;}
 function attach(){cur.pages=null;cur.el=null;cur.next=null;cur.bar=null;if(!prefs.on)return;
  const el=document.querySelector('.storyText'),next=document.getElementById('storyNext');if(!el||!next)return;
  const pages=paginate(el.textContent,prefs.size);stats.scenes++;if(pages.length<2)return;
  cur.pages=pages;cur.at=0;cur.el=el;cur.next=next;stats.pages+=pages.length;
  el.classList.add('r122Paged');
  const bar=document.createElement('div');bar.className='r122Pager';bar.innerHTML='<button type="button" class="r122Prev">◀ 이전 · ←</button><span class="r122Count"></span>';
  el.after(bar);cur.bar=bar;bar.querySelector('.r122Prev').onclick=e=>{e.preventDefault();turn(-1);};
  // 마지막 쪽이 아니면 '계속' 단추는 다음 쪽으로 넘긴다(원래 장면 넘김보다 먼저 가로챈다).
  next.addEventListener('click',e=>{if(cur.pages&&cur.next===next&&cur.at<cur.pages.length-1){e.preventDefault();e.stopImmediatePropagation();turn(1);}},true);
  render();}
 const base=advanceScene;advanceScene=function(...a){const r=base.apply(this,a);try{attach();}catch(e){lastError=String(e?.message||e);}return r;};
 addEventListener('keydown',e=>{try{if(!cur.pages||!cur.el||!document.body.contains(cur.el))return;const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
  if((e.key==='Enter'||e.key===' '||e.key==='ArrowRight')&&cur.at<cur.pages.length-1){e.preventDefault();e.stopImmediatePropagation();turn(1);}
  else if(e.key==='ArrowLeft'&&cur.at>0){e.preventDefault();e.stopImmediatePropagation();turn(-1);}}catch(_){}},true);
 const style=document.createElement('style');style.textContent=`.storyText.r122Paged{max-height:none!important;overflow:visible!important;min-height:9.5em;white-space:pre-wrap;line-height:1.75}
.r122Pager{display:flex;align-items:center;gap:10px;margin:8px 0 2px;font-size:12px;color:#c9bfa8}.r122Pager button{padding:3px 10px}.r122Pager button:disabled{opacity:.35}.r122Count{min-width:52px;text-align:center}`;
 document.head.appendChild(style);
 function set(p={}){if(typeof p.on==='boolean')prefs.on=p.on;if(Number.isFinite(p.size))prefs.size=Math.max(200,Math.min(1200,p.size));try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_READER_R122__=Object.freeze({revision:'R122-reader-1',paginate,set,prefs:()=>({...prefs}),turn,inspect:()=>({prefs:{...prefs},stats:{...stats},page:cur.pages?(cur.at+1)+'/'+cur.pages.length:null,lastError})});
})();
