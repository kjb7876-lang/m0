/* Deterministic, bounded geometry and save schema. No rendering or damage side effects. */
(()=>{'use strict';
 const LIMIT=Object.freeze({strokes:12,raw:2048,points:96,segments:64,length:16,slots:7,targets:8,hits:8,events:64});
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const length=s=>s.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-s[i].x,p.y-s[i].y),0);
 function resample(s,count){const total=length(s);if(!(total>0))return[];const out=[{...s[0]}];let j=1,passed=0;for(let i=1;i<count;i++){const d=total*i/(count-1);while(j<s.length-1&&passed+Math.hypot(s[j].x-s[j-1].x,s[j].y-s[j-1].y)<d){passed+=Math.hypot(s[j].x-s[j-1].x,s[j].y-s[j-1].y);j++;}const a=s[j-1],b=s[j],t=clamp((d-passed)/Math.max(1e-12,Math.hypot(b.x-a.x,b.y-a.y)),0,1);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}return out;}
 function normalize(input){
  if(!Array.isArray(input)||input.length>LIMIT.strokes)throw Error('획은 최대 12개입니다.');
  let count=0;const cleaned=[];
  for(const raw of input){if(!Array.isArray(raw))throw Error('올바른 획이 아닙니다.');const s=[];for(const p of raw){if(++count>LIMIT.raw||!finite(p)||Math.abs(p.x)>1e6||Math.abs(p.y)>1e6)throw Error('도안 점의 수·좌표를 확인하세요.');const last=s.at(-1);if(!last||Math.hypot(p.x-last.x,p.y-last.y)>1e-6)s.push({x:p.x,y:p.y});}if(s.length>1&&length(s)>1e-4)cleaned.push(s);}
  if(!cleaned.length)throw Error('선을 그린 뒤 저장하세요.');
  const pts=cleaned.flat(),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,extent=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  if(extent<.025)throw Error('조금 더 큰 선을 그려주세요.');
  let remaining=LIMIT.length;const strokes=[];
  for(const raw of cleaned){const s=raw.map(p=>({x:2*(p.x-cx)/extent,y:2*(p.y-cy)/extent})),out=[s[0]];for(let i=1;i<s.length&&remaining>1e-8;i++){const a=s[i-1],b=s[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(d<=remaining){out.push(b);remaining-=d;}else{const t=remaining/d;out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});remaining=0;}}if(out.length>1)strokes.push(out);if(!remaining)break;}
  const total=strokes.reduce((n,s)=>n+length(s),0),budget=LIMIT.points-strokes.length*2;
  return strokes.map(s=>resample(s,Math.max(2,2+Math.floor(budget*length(s)/total))).map(p=>({x:+p.x.toFixed(5),y:+p.y.toFixed(5)})));
 }
 function segments(strokes){const total=strokes.reduce((n,s)=>n+length(s),0),remaining=LIMIT.segments-strokes.length;return strokes.flatMap((s,index)=>{const pts=resample(s,2+Math.floor(remaining*length(s)/total));return pts.slice(1).map((b,i)=>({a:pts[i],b,stroke:index,gap:i===0}));});}
 function fresh(){return{version:2,learned:false,designs:[],archive:[],equipped:[],ranks:{cooldown:0,damage:'0',size:0,speed:0,slots:0,equip:0},autoUse:false,readyIn:0,readyByDesign:{},legacyCredit:0};}
 const safeId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,48}$/.test(x);
 const name=x=>String(x||'이름 없는 검무').replace(/[\x00-\x1f\x7f<>]/g,'').slice(0,24).trim()||'이름 없는 검무';
 function validStrokes(s){return Array.isArray(s)&&s.length>0&&s.length<=LIMIT.strokes&&s.every(v=>Array.isArray(v)&&v.length>=2)&&s.reduce((n,v)=>n+v.length,0)<=LIMIT.points&&s.flat().every(p=>finite(p)&&Math.abs(p.x)<=1.001&&Math.abs(p.y)<=1.001)&&s.reduce((n,v)=>n+length(v),0)<=LIMIT.length+.01;}
 function damageLevel(s){const n=s?.ranks?.damage;return typeof n==='string'&&n.length<=4096&&/^(0|[1-9]\d*)$/.test(n)?n:Number.isSafeInteger(n)&&n>=0?String(n):'0';}
 function increment(n){n=damageLevel({ranks:{damage:n}});if(n.length>=4096&&/^9+$/.test(n))throw Error('강화 기록이 저장 크기 한계에 도달했습니다. 포인트는 소비하지 않았습니다.');const a=n.split('');let i=a.length-1;while(i>=0&&a[i]==='9')a[i--]='0';if(i<0)a.unshift('1');else a[i]=String(Number(a[i])+1);return a.join('');}
 function sanitize(raw){
  const s=fresh();if(![1,2].includes(raw?.version))return s;
  for(const k of ['cooldown','size','speed','slots','equip']){const n=raw.ranks?.[k];s.ranks[k]=Number.isSafeInteger(n)?clamp(n,0,k==='slots'?9:k==='equip'?1:k==='speed'?7:10):0;}s.ranks.damage=damageLevel(raw);
  s.legacyCredit=raw.version===1?s.ranks.slots+Math.max(0,(raw.ranks?.speed||0)-7):Number.isSafeInteger(raw.legacyCredit)?clamp(raw.legacyCredit,0,12):0;
  const ids=new Set(),all=[];for(const d of [...(Array.isArray(raw.designs)?raw.designs:[]),...(raw.version===2&&Array.isArray(raw.archive)?raw.archive:[])].slice(0,12)){if(!d||!safeId(d.id)||ids.has(d.id)||!validStrokes(d.strokes))continue;ids.add(d.id);all.push({id:d.id,name:name(d.name),strokes:d.strokes.map(v=>v.map(p=>({x:p.x,y:p.y})))});}
  const wanted=[...new Set((Array.isArray(raw.equipped)?raw.equipped:[]).filter(id=>ids.has(id)))].slice(0,s.ranks.equip?3:1),chosen=new Set(wanted);for(const d of all){if(chosen.size>=7)break;chosen.add(d.id);}s.designs=all.filter(d=>chosen.has(d.id));s.archive=all.filter(d=>!chosen.has(d.id));s.equipped=wanted;s.learned=raw.learned===true;s.autoUse=raw.autoUse===true;s.readyIn=Number.isFinite(raw.readyIn)?clamp(raw.readyIn,0,24):0;
  for(const d of all){const n=raw.readyByDesign?.[d.id];s.readyByDesign[d.id]=Number.isFinite(n)?clamp(n,0,24):s.readyIn;}return s;
 }
 function stats(s){const r=s.ranks,n=damageLevel(s),damage=n.length>14?1e12:Math.min(1e12,1+.1*Number(n));return{slots:7,equip:r.equip?3:1,cooldown:Math.max(3,24-2.1*r.cooldown),damage,size:3*(1+.05*r.size),speed:1+.05*Math.min(7,r.speed)};}
 function plan(strokes,center,size,isSafe,clear,origin){
  if(!finite(center)||!finite(origin)||!validStrokes(strokes))return null;
  const base=segments(strokes),centers=[center];for(const radius of [.45,.9])for(let i=0;i<8;i++)centers.push({x:center.x+Math.cos(i*Math.PI/4)*radius,y:center.y+Math.sin(i*Math.PI/4)*radius});
  for(const scale of [1,.8,.6,.4])for(const c of centers){const transform=p=>({x:c.x+p.x*size*scale,y:c.y+p.y*size*scale}),path=base.map(v=>({...v,a:transform(v.a),b:transform(v.b)}));let last=origin,ok=true;for(const v of path){if(!isSafe(v.a)||!isSafe(v.b)||!clear(last,v.a)||!clear(v.a,v.b)){ok=false;break;}last=v.b;}if(ok)return{path,center:c,scale,length:path.reduce((n,v)=>n+Math.hypot(v.b.x-v.a.x,v.b.y-v.a.y),0)};}
  return null;
 }
 function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
 globalThis.StoryGoldenCoreR72=Object.freeze({LIMIT,normalize,resample,segments,sanitize,fresh,stats,damageLevel,increment,name,safeId,validStrokes,plan,distance});
})();
