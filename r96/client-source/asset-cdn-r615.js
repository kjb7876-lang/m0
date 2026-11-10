// R615 — 무거운 에셋 외부 기준 주소(사용자 2026-11-10 "cloudfare무료로그럼하자").
//  · 코드·사이트는 GitHub Pages 그대로, 서사 음성 같은 무거운 에셋만 Cloudflare Pages 별도 프로젝트(무료, 결제수단 없음)에서 받는다.
//  · 외부 주소의 cdn-health.json(scripts/cdn-pack.py 가 만듦)이 맞다고 확인되기 전에는 언제나 GitHub Pages 상대 경로를 쓴다.
//  · 받다가 실패하면 쓰는 쪽(voice-r381 등)이 local() 로 같은 파일을 GitHub Pages 에서 한 번 더 받는다. 연속 실패 3번이면 이번 접속 동안 끈다.
//  · 시험: ?cdn=off 끄기, ?cdn=https://다른주소 바꾸기. 기준 주소·대상 폴더는 r96/asset-cdn.json 과 같아야 한다(검사 r96/qa/r615).
(()=>{'use strict';
if(window.__STORYWORLD_ASSET_CDN__)return;
const BASE='https://storyworld-m0-assets.pages.dev/',PREFIXES=['assets/r381/voice/'],SCHEMA='storyworld-asset-cdn/v1',TIMEOUT=4000,MAX_FAILS=3;
const norm=b=>{try{b=String(b||'').trim();if(!/^https:\/\/[A-Za-z0-9.-]+(:\d+)?\//.test(b+'/'))return '';return b.endsWith('/')?b:b+'/';}catch(_){return '';}};
let base=BASE,state='pending',active=[],fails=0,lastError=null;const stats={cdn:0,local:0,fallbacks:0,ok:0};
try{const q=new URLSearchParams(window.location?.search||'').get('cdn');if(q==='off'||q==='0')state='off';else if(q)base=norm(q);}catch(_){}
if(!base)state='off';
const rel=p=>{p=String(p||'');return p.startsWith('./')?p.slice(2):p;};
const eligible=p=>!/^[a-z]+:|^\/|(^|\/)\.\.(\/|$)/i.test(p)&&active.some(x=>p.startsWith(x));
function url(p){const r=rel(p);if(state==='on'&&eligible(r)){stats.cdn++;return base+r;}stats.local++;return p;}
function local(u){u=String(u||'');return u.startsWith(base)?u.slice(base.length):u;}
const isCdn=u=>!!base&&String(u||'').startsWith(base);
function fail(u,why){stats.fallbacks++;fails++;lastError=String(why||'error').slice(0,160);if(fails>=MAX_FAILS&&state==='on')state='down';}
function ok(){fails=0;stats.ok++;}
let ready=Promise.resolve(false);
if(state==='pending'&&typeof window.fetch==='function'){
 ready=new Promise(res=>{let done=false;const end=(on,why)=>{if(done)return;done=true;clearTimeout(t);if(!on){state='down';lastError=why||lastError;}res(on);};
  const ac=typeof AbortController==='function'?new AbortController():null;
  const t=setTimeout(()=>{try{ac?.abort();}catch(_){}end(false,'health timeout');},TIMEOUT);
  try{window.fetch(base+'cdn-health.json',{cache:'no-store',mode:'cors',signal:ac?.signal}).then(r=>r&&r.ok?r.json():Promise.reject(new Error('health '+(r&&r.status))))
   .then(h=>{if(done)return;const ps=h&&h.schema===SCHEMA&&Array.isArray(h.prefixes)?PREFIXES.filter(x=>h.prefixes.includes(x)):[];
    if(!ps.length)return end(false,'health mismatch');active=ps;state='on';end(true);}).catch(e=>end(false,String(e?.message||e)));}
  catch(e){end(false,String(e?.message||e));}});}
else if(state==='pending')state='down';
window.__STORYWORLD_ASSET_CDN__=Object.freeze({revision:'R615-asset-cdn-1',url,local,isCdn,fail,ok,ready,
 inspect:()=>({revision:'R615-asset-cdn-1',state,base,prefixes:active.slice(),fails,stats:{...stats},lastError})});
})();
