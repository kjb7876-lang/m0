// R329 조형물 투영 그림자(화면 밖 보는 사람 쪽 광원) 검사.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8'),CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8');
const src=CS('prop-shadow-r329.js');assert.strictEqual(src,RT('prop-shadow-r329.js'));assert.strictEqual(CS('props-r102.js'),RT('props-r102.js'));ok('client-source and runtime copies agree');
const idx=RT('index.html');assert(idx.split('"./prop-shadow-r329.js"').length===2&&/terrain-readability-r323\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*<script src="\.\/prop-shadow-r329\.js"><\/script>(?:<script src="\.\/[a-z0-9-]+\.js"><\/script>)*\s*<script src="\.\/combat-r118\.js">/.test(idx));ok('loaded once, right before combat-r118 (outermost drawProp wrapper)');
assert(!/ctx\.filter\s*=\s*['"][^'"]*(blur|drop-shadow)/.test(src)&&!/filter:'[^']*(blur|drop-shadow)/.test(src));ok('game ctx uses brightness only (no blur/drop-shadow)');
assert(!/transform\(/.test(src.replace(/\/\/.*$/gm,'')));ok('no shear transform (Three recorder drops it); translate+scale only');
const m=src.match(/const LEN=([\d.]+),SHIFT=([\d.]+),RISE=([\d.]+),ALPHA=([\d.]+)/);assert(m);const [LEN,SHIFT,RISE,ALPHA]=m.slice(1).map(Number);
assert(LEN>0&&LEN<=1&&SHIFT>0&&RISE>0&&ALPHA>0&&ALPHA<=.6);ok('shadow falls behind (up) and to the right, foreshortened, partial alpha');
assert(/WALLISH=\/[^/]*door[^/]*window/.test(src)&&src.includes('!p.terrainWall&&!p.wallMounted'));ok('wall pieces and wall-mounted dressing are skipped');
assert(CS('props-r102.js').includes('__STORYWORLD_PROP_SHADOW_R329__?.before?.(frameBase,'));ok('R102 animated props call the shadow hook before frameBase');
// 실행 검사: 가짜 전역으로 설치하고 drawProp → sprite 한 번에 그림자 두 장(brightness(0))이 먼저 그려지는지
const calls=[];const ctx={save(){},restore(){},translate(x,y){calls.push(['t',x,y]);},scale(a,b){calls.push(['s',a,b]);}};
const g={window:{},localStorage:{getItem:k=>k==='storyworld.r448.shadowOneLight'?'0':null,setItem(){}},ctx,project:(x,y)=>({x:x*10,y:y*10})};
const W=new Function('window','localStorage','ctx','project','src',`let drawProp=function(p){sprite(p.path,p.x*10,p.y*10,80,{alpha:1});},sprite=(path,x,y,h,o)=>__c.push(['sprite',path,o&&o.filter||'none',o&&o.alpha]),drawAssetFrame3=()=>{};const __c=[];${src}\n;return {drawProp:()=>drawProp,calls:__c,api:window.__STORYWORLD_PROP_SHADOW_R329__};`)({},g.localStorage,ctx,g.project,src);
W.drawProp()({id:'statue',path:'assets/x/statue.webp',x:3,y:4});
const sp=W.calls.filter(c=>c[0]==='sprite');assert.strictEqual(sp.length,3,JSON.stringify(sp));assert(sp[0][2]==='brightness(0)'&&sp[1][2]==='brightness(0)'&&sp[2][2]==='none');ok('a prop draws two black silhouettes first, then itself');
W.calls.length=0;W.drawProp()({id:'door-0',path:'assets/x/door.webp',x:1,y:1});assert.strictEqual(W.calls.filter(c=>c[2]==='brightness(0)').length,0);ok('door props get no cast shadow');
W.api.set(false);W.calls.length=0;W.drawProp()({id:'statue2',path:'assets/x/s.webp',x:2,y:2});assert.strictEqual(W.calls.filter(c=>c[2]==='brightness(0)').length,0);ok('toggle off disables it');
W.api.set(true);W.calls.length=0;W.drawProp()({id:'tree',path:'assets/r99/outdoor/tree-living-00.webp',x:2,y:2});assert.strictEqual(W.calls.filter(c=>c[2]==='brightness(0)').length,2);ok("outdoor trees cast shadows ('outdoor' no longer matches door)");
{const tr=[];const c3={save(){},restore(){},translate(x,y){tr.push([x,y]);},scale(){}};const win={__STORYWORLD_LIGHT_ATMOS_R300__:{lightsOf:()=>[{x:1,y:4,r:3,prop:true}]}};
 const W3=new Function('window','localStorage','ctx','project','src','room',`let drawProp=function(p){sprite(p.path,p.x*10,p.y*10,80,{alpha:1});},sprite=()=>{},drawAssetFrame3=()=>{};${src}\n;return {drawProp:()=>drawProp};`)(win,{getItem:k=>k==='storyworld.r448.shadowOneLight'?'0':null,setItem(){}},c3,(x,y)=>({x:x*10,y:y*10}),src,{});
 W3.drawProp()({id:'cabinet',path:'assets/x/cabinet.webp',x:3,y:4,r303Flip:true});assert(tr[0]&&tr[0][0]<30-5,'mirrored prop: offset negated inside scale(-1,1): '+JSON.stringify(tr.slice(0,2)));ok('R303 mirrored props flip the horizontal shadow push so it stays away from the light on screen');}
// 근처 광원: 왼쪽(x 작은 쪽)에 화로가 있으면 그림자가 오른쪽(빛 반대)으로, 기본(보는 사람 쪽 빛)과 다른 자리
{const tr=[];const c2={save(){},restore(){},translate(x,y){tr.push([x,y]);},scale(){}};const win={__STORYWORLD_LIGHT_ATMOS_R300__:{lightsOf:()=>[{x:1,y:4,r:3,prop:true}]}};
 const W2=new Function('window','localStorage','ctx','project','src','room',`let drawProp=function(p){sprite(p.path,p.x*10,p.y*10,80,{alpha:1});},sprite=()=>{},drawAssetFrame3=()=>{};${src}\n;return {drawProp:()=>drawProp,api:window.__STORYWORLD_PROP_SHADOW_R329__};`)(win,{getItem:k=>k==='storyworld.r448.shadowOneLight'?'0':null,setItem(){}},c2,(x,y)=>({x:x*10,y:y*10}),src,{});
 W2.drawProp()({id:'statue',path:'assets/x/statue.webp',x:3,y:4});const first=tr[0];assert(first&&first[0]>30+5,'shadow pushed away from light: '+JSON.stringify(tr.slice(0,2)));assert(W2.api.inspect().stats.lit>=1);
 ok('a nearby light source pushes the shadow away from it (else viewer-side light)');}
{const scopes=[];const c4={save(){},restore(){},translate(){},scale(){},scope(o,f){scopes.push(o);return f();}};const draws=[];
 const W4=new Function('window','localStorage','ctx','project','src',`let drawProp=function(p){ctx.scope({id:'prop',kind:'prop',bodyPath:p.path},()=>sprite(p.path,p.x*10,p.y*10,80,{alpha:1}));},sprite=(path,x,y,h,o)=>__d.push([o&&o.filter,__cur()]),drawAssetFrame3=()=>{};const __d=arguments[5];const __cur=arguments[6];${src}\n;return {drawProp:()=>drawProp};`);
 let owner=null;const ctx4={...c4,scope(o,f){scopes.push(o);const prev=owner;owner=o;try{return f();}finally{owner=prev;}}};
 const R=W4({},{getItem:k=>k==='storyworld.r448.shadowOneLight'?'0':null,setItem(){}},ctx4,(x,y)=>({x:x*10,y:y*10}),src,draws,()=>owner);R.drawProp()({id:'statue',path:'assets/x/statue.webp',x:3,y:4});
 const sh=draws.filter(d=>d[0]==='brightness(0)');assert(sh.length===2&&sh.every(d=>d[1]&&d[1].groundAligned===true&&!d[1].bodyPath),JSON.stringify(draws));assert(draws.some(d=>d[0]!=='brightness(0)'&&d[1]&&d[1].bodyPath));
 ok('3D recorder: shadow copies are recorded in a ground-aligned scope without bodyPath (the prop itself keeps its body scope)');}
{const src2=require('fs').readFileSync(require('path').join(__dirname,'..','..','client-source','prop-shadow-r329.js'),'utf8');
 if(!/SG\.pointVisible\(c\.wx,c\.wy\)\)\{stats\.hidden/.test(src2))throw new Error('sight check');ok('props hidden by flashlight sight cast no shadow');
 // R412(사용자 2026-11-08 "그림자는 조형물앞이 아닌 뒷쪽에"): 앞(아래)으로 뒤집어 눕히던 갈래는 없어야 하고, 위(뒤)에 있는 빛은 버리고 보는 사람 쪽 빛(뒤로)을 쓴다
 if(/L\.y>\.2\?-\.6:1/.test(src2)||!/const w=L0&&!back\?Math\.max\(0,Math\.min\(1,\(-L0\.y-\.15\)\/\.35\)\):0/.test(src2)||!/oy=Math\.min\(oy,-h\*\.05\)/.test(src2))throw new Error('shadow must stay behind');
 {const tr=[];const c5={save(){},restore(){},translate(x,y){tr.push([x,y]);},scale(a,b){tr.push(['s',a,b]);}};const win={__STORYWORLD_LIGHT_ATMOS_R300__:{lightsOf:()=>[{x:3,y:1,r:3,prop:true}]}};
  const W5=new Function('window','localStorage','ctx','project','src','room',`let drawProp=function(p){sprite(p.path,p.x*10,p.y*10,80,{alpha:1});},sprite=()=>{},drawAssetFrame3=()=>{};${src2}\n;return {drawProp:()=>drawProp};`)(win,{getItem:k=>k==='storyworld.r448.shadowOneLight'?'0':null,setItem(){}},c5,(x,y)=>({x:x*10,y:y*10}),src2,{});
  W5.drawProp()({id:'statue',path:'assets/x/statue.webp',x:3,y:4});const t0=tr.find(v=>v[0]!=='s'),s0=tr.find(v=>v[0]==='s');
  if(!(t0&&t0[1]<40&&s0&&s0[2]>0))throw new Error('light above → shadow must still fall behind (up), upright: '+JSON.stringify(tr.slice(0,3)));}
 ok('light behind the prop (screen above) no longer throws the shadow in front; shadows always fall behind (R412)');
 if(/Math\.round\(x\)\s*,\s*kind:'effect'/.test(src2)||!/'r329:shadow:'\+\(c\?\.self\?\.id\?\?\(Number\.isFinite\(c\?\.wx\)/.test(src2))throw new Error('scope id');ok('shadow scope id uses prop id / world position, stable while the camera pans');}
// R412 심사(7분야): 옆빛에서 옆으로 서던 검은 쌍둥이·구멍처럼 검던 그림자 — 한 장 알파 ≤.3, 옆 밀기 ≤ 키의 .3, 늘 위(뒤)로, 앞빛만 서서히 섞기, 뒷벽 조형물은 기본 그림자
{const run=(lights,prop,extra={})=>{const tr=[],al=[];const c={save(){},restore(){},translate(x,y){tr.push([x,y]);},scale(a,b){tr.push(['s',a,b]);}};const win={__STORYWORLD_LIGHT_ATMOS_R300__:{lightsOf:()=>lights},...(extra.win||{})};
  const W=new Function('window','localStorage','ctx','project','src','room',`let drawProp=function(p){sprite(p.path,p.x*10,p.y*10,80,{alpha:1});},sprite=(path,x,y,h,o)=>__a.push(o&&o.alpha),drawAssetFrame3=()=>{};const __a=arguments[6];${src}\n;return {drawProp:()=>drawProp};`)(win,{getItem:k=>k==='storyworld.r448.shadowOneLight'?'0':null,setItem(){}},c,(x,y)=>({x:x*10,y:y*10}),src,extra.room||{},al);
  W.drawProp()(prop);return{t:tr.filter(v=>v[0]!=='s'),s:tr.filter(v=>v[0]==='s'),a:al};};
 const h=80,P={id:'statue',path:'assets/x/statue.webp',x:3,y:4};
 // 같은 화면 줄 옆빛(L0.y=0): 기본 그림자 — 옆 .12h·위 .1h, 한 장 알파 .25
 let r=run([{x:1,y:4,r:3,prop:true}],P);assert(r.t[0]&&Math.abs(r.t[0][0]-(30-2))<=h*.3+.01&&r.t[0][1]<=40-h*.05,JSON.stringify(r.t.slice(0,2)));assert(r.a.slice(0,2).every(a=>a<=.3)&&r.a[2]===1,JSON.stringify(r.a));
 // 앞(아래) 대각선 빛: 섞여도 옆 밀기는 키의 .3 을 넘지 않는다
 r=run([{x:1,y:5,r:3,prop:true}],P);assert(r.t[0]&&r.t[0][0]-(30-2)<=h*.3+.01&&r.t[0][1]<40,JSON.stringify(r.t.slice(0,2)));
 // 바로 앞(아래) 빛: 그림자가 뚜렷이 위(뒤)로
 r=run([{x:3,y:6,r:3,prop:true}],P);assert(r.t[0]&&r.t[0][1]<40-10&&Math.abs(r.t[0][0]-(30-2))<1,JSON.stringify(r.t.slice(0,2)));
 // 뒷벽 1.2칸 안(R406 walls)에 등을 댄 조형물은 빛과 상관없이 기본 그림자
 const R406={walls:()=>[{dx:0,dy:-1,side:'-y',d:.6}]};r=run([{x:3,y:6,r:3,prop:true}],P,{win:{__STORYWORLD_PROPS_PLACE_R406__:R406},room:{exploration:{}}});
 assert(r.t[0]&&Math.abs(r.t[0][1]-(40-h*.1))<.01&&Math.abs(r.t[0][0]-(30-2+h*.12))<.01,JSON.stringify(r.t.slice(0,2)));
 ok('R412 review: shadows are light (≤.3 alpha per copy), lean at most .3h sideways, always fall up/behind, blend in front lights smoothly; wall-backed props keep the default shadow');}
// R412: R111(벽 간격)·R412 가 숨은 r111To 자리에 그리는 조형물도 그림자가 붙어야 한다(x·y 로 맞추면 2px 넘게 어긋나 빠졌다)
{const d6=[];const win={__STORYWORLD_PROPS_TIDY_R412__:{spotOf:p=>p.r111To||p,footOf:p=>p.r111To||p,mirrored:p=>!!p.r303Flip}};
 const W6=new Function('window','localStorage','ctx','project','src',`let drawProp=function(p){const t=p.r111To||p;sprite(p.path,t.x*10,t.y*10,80,{alpha:1});},sprite=(path,x,y,h,o)=>__d.push(o&&o.filter||'none'),drawAssetFrame3=()=>{};const __d=arguments[5];${src}\n;return {drawProp:()=>drawProp};`)(win,{getItem:k=>k==='storyworld.r448.shadowOneLight'?'0':null,setItem(){}},{save(){},restore(){},translate(){},scale(){}},(x,y)=>({x:x*10,y:y*10}),src,d6);
 W6.drawProp()({id:'shelf',path:'assets/x/shelf.webp',x:2,y:5,r111To:{x:2.6,y:5}});assert.strictEqual(d6.filter(f=>f==='brightness(0)').length,2,JSON.stringify(d6));
 const d7=[];const W7=new Function('window','localStorage','ctx','project','src',`let drawProp=function(p){const t=p.r111To||p;sprite(p.path,t.x*10,t.y*10,80,{alpha:1});},sprite=(path,x,y,h,o)=>__d.push(o&&o.filter||'none'),drawAssetFrame3=()=>{};const __d=arguments[5];${src}\n;return {drawProp:()=>drawProp};`)({},{getItem:k=>k==='storyworld.r448.shadowOneLight'?'0':null,setItem(){}},{save(){},restore(){},translate(){},scale(){}},(x,y)=>({x:x*10,y:y*10}),src,d7);
 W7.drawProp()({id:'shelf',path:'assets/x/shelf.webp',x:2,y:5});assert.strictEqual(d7.filter(f=>f==='brightness(0)').length,2,JSON.stringify(d7));
 ok('props drawn at their R111/R412 spot (r111To) still cast shadows (matched by the draw spot); without R412 the x/y match is unchanged');}
// R448(사용자 2026-11-09 레퍼런스 규칙 "모든 물체가 같은 방향으로 부드러운 바닥 그림자"): 기본은 한 방향 — 근처 불빛과 상관없이 오른쪽 바닥으로, 앞(아래)으로는 안 눕고, 계단 세 장(밑동 진하게)
{const run=(lights,prop)=>{const tr=[],al=[];const c={save(){},restore(){},translate(x,y){tr.push([x,y]);},scale(a,b){tr.push(['s',a,b]);}};const win={__STORYWORLD_LIGHT_ATMOS_R300__:{lightsOf:()=>lights}};
  const W=new Function('window','localStorage','ctx','project','src','room',`let drawProp=function(p){sprite(p.path,p.x*10,p.y*10,80,{alpha:1});},sprite=(path,x,y,h,o)=>__a.push([o&&o.filter,o&&o.alpha]),drawAssetFrame3=()=>{};const __a=arguments[6];${src}\n;return {drawProp:()=>drawProp,api:window.__STORYWORLD_PROP_SHADOW_R329__};`)(win,{getItem:()=>null,setItem(){}},c,(x,y)=>({x:x*10,y:y*10}),src,{},al);
  W.drawProp()(prop);return{t:tr.filter(v=>v[0]!=='s'),s:tr.filter(v=>v[0]==='s'),a:al,api:W.api};};
 const P={id:'statue',path:'assets/x/statue.webp',x:3,y:4};const A=run([],P),B=run([{x:1,y:4,r:3,prop:true}],P),C=run([{x:5,y:6,r:3,prop:true}],P);
 assert.strictEqual(A.a.filter(v=>v[0]==='brightness(0)').length,3,JSON.stringify(A.a));assert(A.a.slice(0,3).every(v=>v[1]<=.25)&&A.a[3][0]!=='brightness(0)');
 assert.deepStrictEqual(A.t,B.t);assert.deepStrictEqual(A.t,C.t);ok('R448: one light for every prop — nearby fires no longer change the shadow direction');
 const T0=A.t.filter((v,i)=>i%2===0),xs=T0.map(v=>v[0]-30),ys=T0.map(v=>v[1]-40),sy=A.s.map(v=>v[2]);
 assert(xs[0]>0&&xs[1]>xs[0]&&xs[2]>xs[1]&&xs[2]<=80*.4+.01,JSON.stringify(xs));assert(ys.every(v=>v<=0&&v>=-80*.05),JSON.stringify(ys));assert(sy[0]<sy[1]&&sy[1]<sy[2]&&sy[2]<=.5+1e-9,JSON.stringify(sy));
 ok('R448: shadow lies on the ground to the right (top-left light), never in front, staircase of 3 (dense at the base, faint at the tip)');
 assert(A.api.inspect().oneLight===true&&typeof A.api.setOneLight==='function');ok('R448: one-light mode is on by default and can be switched back');}
console.log(JSON.stringify({ok:true,checks:n,method:'static + CPU fake globals; headless capture separately; no GPU or device'}));
