// R1103 페이지 안 탐침: 도형 그리기(fill·stroke·fillRect·strokeRect)의 색이 주황 계열이면 호출 사슬로 묶어 센다(읽기만).
(()=>{'use strict';if(window.__R1103P)return;
const hits={};let total=0;
function rgb(s){if(typeof s!=='string')return null;s=s.trim().toLowerCase();let m;
 if((m=s.match(/^#([0-9a-f]{3,8})$/))){let h=m[1];if(h.length<6)h=h.split('').map(c=>c+c).join('');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
 if((m=s.match(/^rgba?\(([^)]+)\)/))){const v=m[1].split(/[ ,/]+/).map(parseFloat);return v.slice(0,3);}
 if((m=s.match(/^hsla?\(([^)]+)\)/))){const v=m[1].split(/[ ,/]+/).map(parseFloat);const h=v[0],S=v[1]/100,L=v[2]/100;const a=S*Math.min(L,1-L),f=n=>{const k=(n+h/30)%12;return 255*(L-a*Math.max(-1,Math.min(k-3,9-k,1)));};return [f(0),f(8),f(4)];}
 return null;}
function orange(c){if(!c)return false;const [r,g,b]=c.map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,d=mx-mn;if(d<.18||mx!==r)return false;const s=d/(1-Math.abs(2*l-1)||1);let h=60*(((g-b)/d)%6);if(h<0)h+=360;return h>=8&&h<=50&&s>=.4&&l>=.28&&l<=.88;}
function chain(){const st=String(new Error().stack).split('\n').slice(3,16);return st.map(l=>{const m=l.match(/at (?:(\S+) \()?.*\/([^/:()]*):(\d+):\d+\)?$/);return m?(m[1]||'anon').replace(/^(Object|window|DrawCommands)\./,'')+'@'+(m[2]||'index')+':'+m[3]:l.trim().slice(3,30);}).filter(x=>!/^(scope|w|DC\.scope|D\.scope|P\.<computed>)@/.test(x)).join(' < ');}
function hook(P,tag){if(!P||P.__r1103)return;P.__r1103=true;
 for(const [name,style] of [['fill','fillStyle'],['fillRect','fillStyle'],['stroke','strokeStyle'],['strokeRect','strokeStyle']]){const base=P[name];if(typeof base!=='function')continue;
  P[name]=function(){try{const st=this[style];const c=typeof st==='string'?rgb(st):[255,140,40];if(typeof st!=='string'||orange(c)){total++;const k=tag+'|'+name+'|'+(this.owner?.kind||'-')+(this.owner?.r98Telegraph?'|r98T':'')+'|'+chain();const h=hits[k]||(hits[k]={n:0,color:String(st),alpha:+(this.globalAlpha??1).toFixed(3),zone:window.zone});h.n++;}}catch(_){}return base.apply(this,arguments);};}}
hook(window.CanvasRenderingContext2D?.prototype,'2d');
const imgs={};function hookImg(P,tag){if(!P||P.__r1103i)return;P.__r1103i=true;const base=P.drawImage;P.drawImage=function(im){try{const k0=this.owner?.kind||'-';if(tag==='rec'&&!/terrain|floor|wall|tiles|hud|portrait/i.test(String(im?.src||''))){const src=String(im?.currentSrc||im?.src||(im?.tagName||im?.constructor?.name||'?')).replace(/^.*\/m0\//,'');const k=k0+(this.owner?.r98Telegraph?'|r98T':'')+'|'+src.slice(0,90)+'|'+chain().split(' < ').slice(0,4).join(' < ');const h=imgs[k]||(imgs[k]={n:0,alpha:+(this.globalAlpha??1).toFixed(2),op:this.globalCompositeOperation});h.n++;}}catch(_){}return base.apply(this,arguments);};}
const DC=window.StoryPhase1?.DrawCommands;hook(DC?.prototype,'rec');hookImg(DC?.prototype,'rec');
if(!DC){try{const c=window.ctx;if(c&&c.constructor&&c.constructor!==CanvasRenderingContext2D)hook(c.constructor.prototype,'rec');}catch(_){}}
function hookLive(){try{const c=window.ctx;if(!c||c instanceof CanvasRenderingContext2D)return;let P=c;while(P&&P!==Object.prototype){if(Object.prototype.hasOwnProperty.call(P,'drawImage')&&!P.__r1103iOwn){P.__r1103iOwn=true;const base=P.drawImage;const tmp={drawImage:base};hookImg(tmp,'rec');P.drawImage=tmp.drawImage;}P=Object.getPrototypeOf(P);}}catch(_){}}
if(typeof window.groundImage==='function'){const gb=window.groundImage;window.groundImage=function(){hookLive();return gb.apply(this,arguments);};}
window.__R1103P={reset(){for(const k in hits)delete hits[k];for(const k in imgs)delete imgs[k];total=0;},dump(){return {total,hits,imgs};}};})();
