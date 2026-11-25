// R1308 — 무거운 자산을 Cloudflare 자산 프로젝트에서 받기(사용자 2026-11-25 "이걸로 개선작업해줘", GitHub Pages 1.1GB 한도 풀기).
//  · index.html 의 첫 스크립트. 이미지·소리·영상 src, new Audio, fetch, XHR 주소를 한곳에서 바꾼다(엔진·덧씌우기 코드는 그대로).
//  · 공개 주소(kjb7876-lang.github.io)에서만 켠다. 로컬·CI 는 상대 경로 그대로(새 PR 자산은 main 병합 전엔 CDN 에 없다).
//  · 대상 폴더(ROUTED)는 r96/asset-cdn.json prefixes 에도 있어야 하고 pages-exclude.json 으로 Pages 배포본에서 빠진다.
//    main 배포 전 scripts/cdn-route-gate.py 가 CDN 이 이번 묶음과 같은지 확인한다(다르면 배포 안 함).
//  · 바꾼 이미지·소리·영상에는 crossOrigin='anonymous' 를 붙인다(CDN 은 CORS * — 캔버스·WebGL·WebAudio 오염 방지).
//  · 시험: ?cdn=off 끄기, ?cdn=http://127.0.0.1:포트/ 또는 https://*.pages.dev/ 로 바꾸기. 검사 r96/qa/r1308.
(()=>{'use strict';
if(window.__STORYWORLD_ASSET_ROUTE__)return;
const BASE='https://storyworld-m0-assets.pages.dev/',PUBLIC=['kjb7876-lang.github.io'];
const ROUTED=['assets/r308/bgm/','audio/rc133/processed/bgm/','assets/r1056/bgm/','assets/r372/','assets/r309/intro/','assets/r617/','assets/r369/','assets/r368/','assets/rc26/audio/','assets/r955/sfx/','assets/vfx-r83/','assets/rc140/','assets/final42-r88/','assets/r92/','assets/world-r80/','assets/vfx/','assets/maps/','assets/r118/','assets/visual-test/','assets/r91/','assets/generated-story10-cycle-20261005/','assets/rc91/','assets/rc138/','assets/boss-actions-20261011/','assets/r410/','assets/rc137/','assets/r74/','assets/generated-v31224/'];
const stats={routed:0,errors:0};let base='',on=false,root='';
const norm=b=>{try{const u=new URL(String(b||''));if(u.username||u.password||u.search||u.hash)return '';
  if(!((u.protocol==='https:'&&/\.pages\.dev$/.test(u.hostname))||(u.protocol==='http:'&&u.hostname==='127.0.0.1'&&u.port)))return '';
  const h=u.href;return h.endsWith('/')?h:h+'/';}catch(_){return '';}};
try{const q=new URLSearchParams(window.location?.search||'').get('cdn');
 if(q==='off'||q==='0')on=false;else if(q){base=norm(q);on=!!base;}else if(PUBLIC.includes(window.location?.hostname)){base=BASE;on=true;}
 root=new URL('./',(window.document&&window.document.baseURI)||window.location.href).href;}catch(_){on=false;}
function url(u){
 if(!on)return u;let s=u;
 if(typeof URL==='function'&&u instanceof URL)s=u.href;else if(typeof u!=='string')return u;
 if(/^(data|blob|javascript):/i.test(s)||(base&&s.startsWith(base)))return u;
 let abs;try{abs=new URL(s,root).href;}catch(_){return u;}
 if(!abs.startsWith(root))return u;
 const rel=abs.slice(root.length),cut=rel.search(/[?#]/),p=cut<0?rel:rel.slice(0,cut);
 if(!ROUTED.some(x=>p.startsWith(x)))return u;
 stats.routed++;return base+rel;
}
// 2단계: 문자열 속 주소(CSS url(), innerHTML 의 src/poster/style) — setter 를 타지 않는 길.
const sub=v=>{const r=url(v);return r===v?null:r;};
function css(s){if(typeof s!=='string'||s.indexOf('url(')<0)return s;
 return s.replace(/url\(\s*(&quot;|["']?)([^"')&]+?)\1\s*\)/g,(m,q,u)=>{const r=sub(u);return r==null?m:'url('+q+r+q+')';});}
function html(s){if(typeof s!=='string'||(s.indexOf('src=')<0&&s.indexOf('poster=')<0&&s.indexOf('url(')<0))return s;
 return s.replace(/<(img|video|audio|source)\b([^>]*)>/gi,(m,tag,attrs)=>{let hit=false;
   const a=attrs.replace(/(\s)(src|poster)=(["'])([^"']*)\3/gi,(mm,sp,k,q,u)=>{const r=sub(u);if(r==null)return mm;if(k.toLowerCase()==='src')hit=true;return sp+k+'='+q+r+q;});
   const co=hit&&!/\scrossorigin\b/i.test(attrs)&&/^(img|video|audio)$/i.test(tag);
   return '<'+tag+(co?a.replace(/(\s)src=/i,'$1crossorigin="anonymous" src='):a)+'>';})
  .replace(/(\sstyle=)(["'])([^"']*)\2/gi,(m,k,q,v)=>k+q+css(v)+q);}
const cors=el=>{try{if(el.crossOrigin==null)el.crossOrigin='anonymous';}catch(_){}};
function wrapSrc(C,prop='src',withCors=true){const d=C&&C.prototype&&Object.getOwnPropertyDescriptor(C.prototype,prop);if(!d||!d.set||d.set.__r1308)return;
 const set=function(v){const r=url(v);if(r!==v&&withCors)cors(this);return d.set.call(this,r);};set.__r1308=true;
 Object.defineProperty(C.prototype,prop,{...d,set});}
if(on){
 wrapSrc(window.HTMLImageElement);wrapSrc(window.HTMLMediaElement);wrapSrc(window.HTMLSourceElement);wrapSrc(window.HTMLVideoElement,'poster',false);
 const E=window.Element&&window.Element.prototype;
 if(E&&E.setAttribute&&!E.setAttribute.__r1308){const sa=E.setAttribute;const f=function(k,v){
   const key=String(k).toLowerCase(),tag=String(this.tagName||'');
   if(key==='src'&&/^(IMG|AUDIO|VIDEO|SOURCE|MEDIA)$/i.test(tag)){const r=url(String(v));if(r!==String(v)){cors(this);return sa.call(this,k,r);}}
   if(key==='style'){const r=css(String(v));if(r!==String(v))return sa.call(this,k,r);}
   if(key==='poster'&&window.HTMLVideoElement&&this instanceof window.HTMLVideoElement){const r=url(String(v));if(r!==String(v))return sa.call(this,k,r);}
   return sa.call(this,k,v);};f.__r1308=true;E.setAttribute=f;}
 const A=window.Audio;if(typeof A==='function'&&!A.__r1308){const W=function Audio(src){const a=new A();if(src!==undefined)a.src=src;return a;};
  W.prototype=A.prototype;W.__r1308=true;try{Object.defineProperty(W.prototype,'constructor',{value:W,writable:true,configurable:true});}catch(_){}window.Audio=W;}
 const F=window.fetch;if(typeof F==='function'&&!F.__r1308){const W=function(input,init){
   if(typeof input==='string'||(typeof URL==='function'&&input instanceof URL)){const r=url(input);if(r!==input)return F.call(this,r,init).catch(e=>{stats.errors++;throw e;});}
   else if(input&&typeof input.url==='string'&&typeof window.Request==='function'){const r=url(input.url);if(r!==input.url)return F.call(this,new window.Request(r,input),init);}
   return F.call(this,input,init);};W.__r1308=true;window.fetch=W;}
 const X=window.XMLHttpRequest&&window.XMLHttpRequest.prototype;if(X&&X.open&&!X.open.__r1308){const o=X.open;const f=function(m,u,...rest){return o.call(this,m,url(u),...rest);};f.__r1308=true;X.open=f;}
 const S=window.CSSStyleDeclaration&&window.CSSStyleDeclaration.prototype;
 if(S){for(const k of ['background','backgroundImage','cssText','maskImage','webkitMaskImage','borderImage','listStyleImage','content']){
   let o=S,d=null;while(o&&!(d=Object.getOwnPropertyDescriptor(o,k)))o=Object.getPrototypeOf(o);
   if(!d||!d.set||d.set.__r1308)continue;const set=function(v){return d.set.call(this,css(v));};set.__r1308=true;
   try{Object.defineProperty(o,k,{...d,set});}catch(_){}}
  if(S.setProperty&&!S.setProperty.__r1308){const sp=S.setProperty;const f=function(k,v,...r){return sp.call(this,k,css(v),...r);};f.__r1308=true;S.setProperty=f;}}
 const H=window.Element&&window.Element.prototype;
 if(H){for(const k of ['innerHTML','outerHTML']){let o=H,d=null;while(o&&!(d=Object.getOwnPropertyDescriptor(o,k)))o=Object.getPrototypeOf(o);
   if(!d||!d.set||d.set.__r1308)continue;const set=function(v){return d.set.call(this,html(v));};set.__r1308=true;try{Object.defineProperty(o,k,{...d,set});}catch(_){}}
  if(H.insertAdjacentHTML&&!H.insertAdjacentHTML.__r1308){const ia=H.insertAdjacentHTML;const f=function(pos,v){return ia.call(this,pos,html(v));};f.__r1308=true;H.insertAdjacentHTML=f;}}
 try{window.addEventListener('error',e=>{const t=e&&e.target;const s=t&&typeof t.src==='string'?t.src:'';if(base&&s.startsWith(base))stats.errors++;},true);}catch(_){}
}
window.__STORYWORLD_ASSET_ROUTE__=Object.freeze({revision:'R1308-asset-route-1',url,inspect:()=>({revision:'R1308-asset-route-1',on,base,root,prefixes:ROUTED.slice(),...stats})});
})();
