'use strict';// R1308 2단계 — 그림 폴더도 Cloudflare 자산 프로젝트에서 받으려면 CSS 배경(url())·innerHTML 의 <img src> 도 바꿔야 한다.
//  (innerHTML·style 문자열은 src setter 를 타지 않는다: passive-cutin-r1033·persona-cutin-r1174·chapter-veil-r1269·엔진 urlFor <img> 문자열)
//  공개 주소에서만 바꾸고, 다른 주소·data·blob·옮기지 않은 폴더는 글자 하나 안 바꾼다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}else console.log('PASS',m);};
const SRC=fs.readFileSync(path.join(R,'client-source','asset-route-r1308.js'),'utf8');
const ROUTED=JSON.parse(SRC.match(/const ROUTED=(\[[^\]]*\])/)[1].replace(/'/g,'"'));
const CDN='https://storyworld-m0-assets.pages.dev/';
const IMG=ROUTED.find(p=>/vfx-r83|rc140|final42-r88/.test(p));
ok(!!IMG,'그림 폴더(vfx-r83·rc140·final42-r88 중 하나 이상)가 옮길 목록에 있음',ROUTED);
const P=IMG||'assets/vfx-r83/',F=P+'sheet a.png',FE=P+'sheet%20a.png';
function world(host='kjb7876-lang.github.io'){
 const baseURI='https://'+host+'/m0/index.html';
 class CSSStyleDeclaration{constructor(){this._p={};}setProperty(k,v,pr){this._p[k]=String(v);}getPropertyValue(k){return this._p[k]||'';}}
 for(const [js,css] of [['background','background'],['backgroundImage','background-image'],['cssText','*'],['maskImage','mask-image'],['webkitMaskImage','-webkit-mask-image'],['borderImage','border-image'],['listStyleImage','list-style-image']])
  Object.defineProperty(CSSStyleDeclaration.prototype,js,{configurable:true,enumerable:true,get(){return this._p[css]||'';},set(v){this._p[css]=String(v);}});
 class Element{constructor(tag){this.tagName=tag;this._html='';this.style=new CSSStyleDeclaration();this._a={};}setAttribute(k,v){this._a[k]=String(v);}insertAdjacentHTML(pos,h){this._html+=String(h);}}
 Object.defineProperty(Element.prototype,'innerHTML',{configurable:true,enumerable:true,get(){return this._html;},set(v){this._html=String(v);}});
 Object.defineProperty(Element.prototype,'outerHTML',{configurable:true,enumerable:true,get(){return '<x>'+this._html+'</x>';},set(v){this._html='OUTER:'+String(v);}});
 const HTMLElement=Element;
 const window={location:{hostname:host,search:'',href:baseURI},document:{baseURI},Element,HTMLElement,CSSStyleDeclaration,URL,URLSearchParams,addEventListener(){}};window.window=window;
 vm.runInNewContext(SRC,{window,document:window.document,location:window.location,URL,URLSearchParams});
 return window;
}
{const w=world(),el=new w.Element('DIV');
 el.style.backgroundImage='url("'+FE+'")';ok(el.style.backgroundImage==='url("'+CDN+FE+'")','style.backgroundImage url("…") → CDN',el.style.backgroundImage);
 el.style.backgroundImage="url('./"+FE+"')";ok(el.style.backgroundImage==="url('"+CDN+FE+"')",'url(\'./…\') → CDN',el.style.backgroundImage);
 el.style.background='#000 url(./'+FE+') no-repeat';ok(el.style.background==='#000 url('+CDN+FE+') no-repeat','style.background 안 url → CDN',el.style.background);
 el.style.cssText='width:3px;background-image:url(./'+FE+');background-size:10px';ok(el.style.cssText==='width:3px;background-image:url('+CDN+FE+');background-size:10px','cssText → CDN',el.style.cssText);
 el.style.setProperty('background-image','url('+FE+')');ok(el.style.getPropertyValue('background-image')==='url('+CDN+FE+')','setProperty → CDN');
 el.style.webkitMaskImage='url('+FE+')';ok(el.style.webkitMaskImage==='url('+CDN+FE+')','mask-image → CDN');
 el.style.backgroundImage='url(assets/heroes/a.webp)';ok(el.style.backgroundImage==='url(assets/heroes/a.webp)','옮기지 않은 폴더 그대로');
 el.style.backgroundImage='url(data:image/png;base64,AAAA)';ok(el.style.backgroundImage==='url(data:image/png;base64,AAAA)','data url 그대로');
 el.style.backgroundImage='linear-gradient(#000,#fff)';ok(el.style.backgroundImage==='linear-gradient(#000,#fff)','url 없는 값 그대로');
 el.style.backgroundImage='url('+FE+'), url(assets/heroes/a.webp)';ok(el.style.backgroundImage==='url('+CDN+FE+'), url(assets/heroes/a.webp)','여러 url 중 옮긴 것만',el.style.backgroundImage);
 el.innerHTML='<div><img class="bg" src="'+FE+'"><img src="assets/heroes/a.webp"></div>';
 ok(el.innerHTML==='<div><img class="bg" crossorigin="anonymous" src="'+CDN+FE+'"><img src="assets/heroes/a.webp"></div>','innerHTML <img src> → CDN + crossorigin, 다른 그림 그대로',el.innerHTML);
 el.innerHTML="<img crossorigin='use-credentials' src='./"+FE+"'>";ok(el.innerHTML==="<img crossorigin='use-credentials' src='"+CDN+FE+"'>",'이미 crossorigin 있으면 존중',el.innerHTML);
 el.innerHTML='<span style="background-image:url(./'+FE+');background-size:50px">x</span>';ok(el.innerHTML==='<span style="background-image:url('+CDN+FE+');background-size:50px">x</span>','innerHTML style 안 url → CDN',el.innerHTML);
 el.innerHTML='<span style="background-image:url(&quot;'+FE+'&quot;)">x</span>';ok(el.innerHTML==='<span style="background-image:url(&quot;'+CDN+FE+'&quot;)">x</span>','&quot; 로 감싼 url → CDN',el.innerHTML);
 el.innerHTML='<p>'+F+' 는 글자일 뿐</p><a href="'+FE+'">x</a>';ok(el.innerHTML==='<p>'+F+' 는 글자일 뿐</p><a href="'+FE+'">x</a>','본문 글자·a href 는 그대로',el.innerHTML);
 el.innerHTML='';el.insertAdjacentHTML('beforeend','<img src="'+FE+'">');ok(el.innerHTML==='<img crossorigin="anonymous" src="'+CDN+FE+'">','insertAdjacentHTML → CDN',el.innerHTML);
 el.outerHTML='<img src="'+FE+'">';ok(el.innerHTML==='OUTER:<img crossorigin="anonymous" src="'+CDN+FE+'">','outerHTML → CDN',el.innerHTML);
 el.setAttribute('style','background:url('+FE+')');ok(el._a.style==='background:url('+CDN+FE+')','setAttribute(style) → CDN',el._a);
 el.innerHTML=12345;ok(el.innerHTML==='12345','문자열 아닌 값도 그대로 넘김');}
{const w=world('127.0.0.1'),el=new w.Element('DIV');el.style.backgroundImage='url('+FE+')';el.innerHTML='<img src="'+FE+'">';
 ok(el.style.backgroundImage==='url('+FE+')'&&el.innerHTML==='<img src="'+FE+'">','로컬 주소에서는 CSS·innerHTML 그대로');}
console.log(`\nR1308 asset route css/html: ${n-bad}/${n} PASS`);process.exit(bad?1:0);
