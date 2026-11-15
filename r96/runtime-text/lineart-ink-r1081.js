// R1081 — 선 그림 컷씬을 수묵화풍으로(한지 바탕 · 먹선 · 중간 먹 번짐).
// 사용자 2026-11-15 15:15Z: "모든시네마틱영상 실로그린영상그걸로 대체생성하고 그것돌도 수묵화풍으로 개선"
//  · 대상: 지역 선 그림 컷씬 54곳(lineart-cine-r880) + 영상 대신 그리는 일곱 장면(lineart-video-r1080). 장면 코드·자막·길이·순서는 그대로 두고 색만 옮긴다.
//  · 옮기는 법(화면 전체 필터를 쓰지 않는다 — 흰 옷·흰 날개가 검게 뒤집히지 않게, 색 규칙으로만):
//      바탕(어두운 종이) → 한지 색 / 선(밝은 잉크) → 먹 / 어두운 덩어리 채움 → 중간 먹(그 위의 먹선이 보이게, 더 어두웠던 것이 더 짙게)
//      흰 채움·색 채움 → 그대로(담채) / 밝은 색 선 → 같은 빛깔의 짙은 선 / 하늘 바림 → 한지 농담 / 빛 번짐(screen) → 옅은 색 번짐(multiply)
//      컷 사이 암전·처음 어둠 → 빈 종이 / 가장자리 어둠 → 옅은 먹 바림
//  · 먹·중간 먹·한지 색은 맵 수묵화풍(R1055)에서 고른 화풍의 값을 그대로 읽어 쓴다(그 파일은 고치지 않는다). 없거나 값이 깨졌으면 진경산수풍 기본값.
//  · 한지 결: 작은 무늬 한 장을 만들어 깔기만 한다(필터·섞기 방식 추가 없음).
//  · 판정·진행·세이브·서사·음성은 건드리지 않는다. 숫자는 모두 clamp(NaN·Infinity 가 그리기로 가지 않게).
//  · 끄기: localStorage['storyworld.r1081.lineartInk']='{"on":false}' 또는 __STORYWORLD_LINEART_INK_R1081__.set({on:false}) → 다음 장면부터 원래 색.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_LINEART_INK_R1081__)return;
const REV='R1081-lineart-ink-1',KEY='storyworld.r1081.lineartInk';
const DEF=Object.freeze({ink:[.07,.085,.11],mid:[.35,.37,.395],pap:[.80,.78,.70]});
let prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object'&&!Array.isArray(s)&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={dressed:0,mapped:0,observed:0,textures:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),c01=v=>Number.isFinite(v)?clamp(v,0,1):0;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}};
const L=c=>0.2126*c[0]+0.7152*c[1]+0.0722*c[2];
const hex=c=>'#'+c.map(v=>Math.round(c01(v)*255).toString(16).padStart(2,'0')).join('');
const css=c=>'rgb('+c.map(v=>Math.round(c01(v)*255)).join(',')+')';
function parse(s){if(typeof s!=='string')return null;s=s.trim();let m=/^#([0-9a-f]{3})$/i.exec(s);if(m)return m[1].split('').map(h=>parseInt(h+h,16)/255);
 m=/^#([0-9a-f]{6})$/i.exec(s);if(m){const v=parseInt(m[1],16);return[(v>>16&255)/255,(v>>8&255)/255,(v&255)/255];}
 m=/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s);if(m)return[c01(+m[1]/255),c01(+m[2]/255),c01(+m[3]/255)];return null;}
const tri=(a,d)=>Array.isArray(a)&&a.length>=3&&a.slice(0,3).every(v=>Number.isFinite(v)&&v>=0&&v<=1)?a.slice(0,3):d.slice();
// 맵 수묵화풍(R1055)의 화풍 값을 읽는다 — 종이는 화면 전체를 덮으니 조금 밝힌다
function palette(){let id='jg',st=null;try{const W=window.__STORYWORLD_INK_WASH_R1055__;if(W&&W.styles){const p=typeof W.prefs==='function'?W.prefs():null;if(p&&typeof p.style==='string'&&W.styles[p.style])id=p.style;st=W.styles[id]||null;}}catch(_){st=null;id='jg';}
 let ink=tri(st&&st.ink,DEF.ink),mid=tri(st&&st.mid,DEF.mid),pap=tri(st&&st.pap,DEF.pap).map(v=>c01(v*1.07));
 if(!(L(ink)<0.2))ink=DEF.ink.slice();if(!(L(pap)>0.64))pap=DEF.pap.map(v=>c01(v*1.07));if(!(L(mid)>0.27&&L(mid)<0.53))mid=DEF.mid.slice();
 return{style:id,ink,mid,pap,inkCss:css(ink),midCss:css(mid),papCss:css(pap),papHex:hex(pap),midHex:hex(mid)};}
const DARK=0.235,LIGHT=0.45;
// 색 하나를 옮긴다. role: 'fill'(채움) · 'stroke'(선·그룹 잉크 색)
function mapWith(P,c,role){const v=parse(c);if(!v||typeof c!=='string'||c.trim()[0]!=='#')return c;const l=L(v);
 if(role==='stroke'){if(l<=LIGHT)return c.trim().length===4?hex(v):c;const k=0.3/l;return hex(v.map(x=>x*k));}
 if(l>=DARK)return c.trim().length===4?hex(v):c;
 const lt=0.255+(l/DARK)*0.19,m=P.mid,km=lt/Math.max(0.05,L(m)),base=m.map(x=>x*km),hue=l>0.012?v.map(x=>x*(lt/l)):base;
 let out=base.map((x,i)=>c01(x*0.8+c01(hue[i])*0.2));const lo=L(out);if(lo<0.245){const k=0.25/Math.max(0.01,lo);out=out.map(x=>c01(x*k));}return hex(out);}
const map=(c,role)=>{try{return mapWith(palette(),c,role==='stroke'?'stroke':'fill');}catch(e){fail(e);return c;}};
const same=(a,b)=>{const x=parse(a),y=parse(b);return !!x&&!!y&&Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1])+Math.abs(x[2]-y[2])<0.012;};
const tagOf=n=>String(n.tagName||'').toLowerCase();
const getVar=(s,k)=>{try{return typeof s.getPropertyValue==='function'?s.getPropertyValue(k):s[k];}catch(_){return'';}};
const ORIG=new WeakMap(),SEEN=new WeakSet(),OBS=new WeakMap();
function styleAttr(P,v){return v.replace(/(^|;|\s)(fill|stroke|color)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g,(m,a,k,c)=>a+k+':'+mapWith(P,c,k==='fill'?'fill':'stroke')).replace(/mix-blend-mode:\s*screen/g,'mix-blend-mode:multiply;opacity:.62');}
// 요소 하나
function one(P,o,n){const tag=tagOf(n);let ch=0;if(!n.getAttribute)return 0;
 const set=(k,v,old)=>{if(v!==old&&v!=null){n.setAttribute(k,v);ch++;}};
 if(tag==='stop'){const sc=n.getAttribute('stop-color'),pid=n.parentNode&&n.parentNode.getAttribute?n.parentNode.getAttribute('id'):'';
  if(pid==='r880vig'&&sc&&parse(sc)&&L(parse(sc))<0.05){set('stop-color',P.midHex,sc);const so=+n.getAttribute('stop-opacity');if(so>0.3)n.setAttribute('stop-opacity','0.3');}return ch;}
 if(tag==='lineargradient'){if(n.getAttribute('id')==='r880sky')ch+=sky(P,n);return ch;}
 const fl=n.getAttribute('fill');
 if(fl&&fl[0]==='#'){const v=parse(fl),l=v?L(v):1;let out=fl;
  if(o.ink&&same(fl,o.ink))out='currentColor';else if(o.paper&&same(fl,o.paper))out=P.papHex;
  else if(tag==='rect'&&l<0.03)out=P.papHex;
  else if(/^#0{3}(0{3})?$/.test(fl)&&n.getAttribute('opacity')!=null&&+n.getAttribute('opacity')<=0.5)out=fl;/* 발밑 그림자 */
  else out=mapWith(P,fl,'fill');
  set('fill',out,fl);}
 const sk=n.getAttribute('stroke');if(sk&&sk[0]==='#')set('stroke',o.ink&&same(sk,o.ink)?'currentColor':mapWith(P,sk,'stroke'),sk);
 const st=n.getAttribute('style');if(st&&tag!=='svg'&&/#|screen/.test(st))set('style',styleAttr(P,st),st);
 return ch;}
// 하늘 바림: 어두운 밤하늘 단계 → 한지의 옅은 농담(원래 빛깔을 조금 남긴다)
function sky(P,g){const st=[];for(const c of g.children||[])if(tagOf(c)==='stop'){const v=parse(c.getAttribute('stop-color'));if(v)st.push([c,v,L(v)]);}
 if(!st.length||st.every(s=>s[2]>0.5))return 0;const lo=Math.min(...st.map(s=>s[2])),hi=Math.max(...st.map(s=>s[2])),span=Math.max(0.02,hi-lo);let ch=0;
 for(const [c,v,l] of st){const t=clamp((l-lo)/span,0,1),k=0.9+0.1*t,base=P.pap.map(x=>x*k),lb=L(base),hue=l>0.012?v.map(x=>c01(x*(lb/l))):base;
  c.setAttribute('stop-color',hex(base.map((x,i)=>x*0.86+hue[i]*0.14)));ch++;}return ch;}
function walk(P,o,n){let ch=one(P,o,n);const cs=n.children;if(cs)for(let i=0;i<cs.length;i++)ch+=walk(P,o,cs[i]);return ch;}
// 한지 결(어두운 실오라기와 옅은 얼룩만 — 검은 여백 위에서는 안 보인다)
let texCache=null;
function texUrl(){if(texCache!==null)return texCache;try{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let s=8101;const r=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};
  x.lineCap='round';for(let i=0;i<460;i++){const px=r()*256,py=r()*256,a=r()*6.283,len=3+r()*11,al=(0.035+r()*0.07).toFixed(3),lw=0.4+r()*0.5,mx=Math.cos(a)*len*0.5+r()*2-1,my=Math.sin(a)*len*0.5+r()*2-1;
   for(const ox of [-256,0,256])for(const oy of [-256,0,256]){const qx=px+ox,qy=py+oy;if(qx<-16||qx>272||qy<-16||qy>272)continue;x.strokeStyle='rgba(58,50,38,'+al+')';x.lineWidth=lw;x.beginPath();x.moveTo(qx,qy);x.quadraticCurveTo(qx+mx,qy+my,qx+Math.cos(a)*len,qy+Math.sin(a)*len);x.stroke();}}
  texCache=c.toDataURL('image/png');}catch(_){texCache='';}return texCache;}
function sheet(){try{if(document.getElementById('r1081Css'))return;const P=palette(),s=document.createElement('style'),W=a=>P.midCss.replace('rgb(','rgba(').replace(')',','+a+')');s.id='r1081Css';
 s.textContent='#r880.r1081{background:'+P.papCss+'}#r880.r1081 .shade,#r880.r1081 .grain{display:none}'
 +'#r880.r1081 .chap{color:'+P.inkCss+';text-shadow:0 0 6px '+P.papCss+',0 0 2px '+P.papCss+';opacity:.8}'
 +'#r880.r1081 .ttl{color:'+P.inkCss+';text-shadow:0 0 14px '+P.papCss+',0 0 5px '+P.papCss+'}#r880.r1081 .ttl i{background:'+P.inkCss+';opacity:.5}'
 +'#r880.r1081 .cap{color:#f4efe4;background:radial-gradient(ellipse at 50% 55%,rgba(20,22,28,.80),rgba(20,22,28,.62) 60%,rgba(20,22,28,0) 82%)}'
 +'.r1080on.r1081 .chap{color:'+P.inkCss+'!important;text-shadow:0 0 6px '+P.papCss+',0 0 2px '+P.papCss+'!important}'
 +'.r1080on.r1081 .name b{color:'+P.inkCss+'!important;text-shadow:0 0 14px '+P.papCss+',0 0 5px '+P.papCss+',0 0 2px '+P.papCss+'!important}.r1080on.r1081 .name small{color:#8a3a22!important;text-shadow:0 0 6px '+P.papCss+',0 0 2px '+P.papCss+'!important}'
 +'.r1081 .r1081tex{position:absolute;inset:0;pointer-events:none;background-size:256px 256px;opacity:.62}'
 +'.r1081 .r1081edge{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,rgba(0,0,0,0) 58%,'+W(.20)+' 100%),radial-gradient(ellipse 34% 26% at 22% 30%,'+W(.05)+',rgba(0,0,0,0) 100%),radial-gradient(ellipse 30% 34% at 78% 66%,'+W(.055)+',rgba(0,0,0,0) 100%),radial-gradient(ellipse 22% 18% at 62% 18%,'+W(.04)+',rgba(0,0,0,0) 100%)}';
 (document.head||document.body).appendChild(s);}catch(e){fail(e);}}
function decorate(root,svg){try{if(!root||SEEN.has(root))return;SEEN.add(root);root.classList.add('r1081');sheet();const kids=root.children,i=Array.prototype.indexOf.call(kids,svg),ref=kids[i+1]||null;
 const edge=document.createElement('div');edge.className='r1081edge';root.insertBefore(edge,ref);
 const u=texUrl();if(u){const t=document.createElement('div');t.className='r1081tex';t.style.backgroundImage='url('+u+')';root.insertBefore(t,ref);stats.textures++;}}catch(e){fail(e);}}
// 장면이 도는 동안 바뀌는 색(날개가 물드는 것 등)도 옮긴다 — 색 속성만 지켜본다
function observe(P,o,svg){try{if(typeof MutationObserver!=='function'||OBS.has(svg))return;
 const ob=new MutationObserver(list=>{try{if(!prefs.on)return;const P2=palette(),o2=ORIG.get(svg)||o;for(const m of list){if(m.type==='childList'){for(const n of m.addedNodes)if(n.nodeType===1)stats.mapped+=walk(P2,o2,n);}else if(m.target===svg)root(P2,svg);else stats.mapped+=one(P2,o2,m.target);}}catch(e){fail(e);}});
 ob.observe(svg,{subtree:true,childList:true,attributes:true,attributeFilter:['fill','stroke','style','stop-color']});OBS.set(svg,ob);stats.observed++;}catch(e){fail(e);}}
// svg 뿌리: 잉크 색·종이 색(장면이 다시 지어지면 원래 색으로 돌아오므로 그때마다 다시 잡는다)
function root(P,svg){const s=svg.style,c=s.color,p=getVar(s,'--paper');let o=ORIG.get(svg)||{ink:null,paper:null};
 if(c&&!same(c,P.inkCss)){const v=parse(c);o={...o,ink:v?hex(v):o.ink};s.color=P.inkCss;}
 if(p&&!same(p,P.papCss)){const v=parse(p);o={...o,paper:v?hex(v):o.paper};s.setProperty('--paper',P.papCss);}
 ORIG.set(svg,o);return o;}
// 장면 하나를 수묵으로 옮긴다(여러 번 불러도 같은 결과). 돌려주는 값: 바꾼 속성 수(꺼져 있으면 0)
function dress(svg,rootEl){if(!prefs.on||!svg||!svg.style)return 0;try{const P=palette(),o=root(P,svg);decorate(rootEl||svg.parentNode,svg);const n=1+walk(P,o,svg);stats.dressed++;stats.mapped+=n;observe(P,o,svg);return n;}catch(e){fail(e);return 0;}}
// 지켜보기가 없는 환경(검사)에서 장면이 도는 동안 부르는 것
function frame(svg){if(!prefs.on||!svg||OBS.has(svg))return 0;try{const P=palette();return walk(P,root(P,svg),svg);}catch(e){fail(e);return 0;}}
function set(p){if(p&&typeof p.on==='boolean'&&p.on!==prefs.on){prefs.on=p.on;save();}return{on:prefs.on};}
window.__STORYWORLD_LINEART_INK_R1081__=Object.freeze({revision:REV,KEY,palette,map,dress,frame,set,
 inspect:()=>({revision:REV,on:prefs.on,style:palette().style,stats:{...stats},lastError})});
})();
