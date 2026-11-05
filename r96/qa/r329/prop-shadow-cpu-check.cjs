// R329 조형물 투영 그림자(화면 밖 보는 사람 쪽 광원) 검사.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8'),CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8');
const src=CS('prop-shadow-r329.js');assert.strictEqual(src,RT('prop-shadow-r329.js'));assert.strictEqual(CS('props-r102.js'),RT('props-r102.js'));ok('client-source and runtime copies agree');
const idx=RT('index.html');assert(idx.split('"./prop-shadow-r329.js"').length===2&&/terrain-readability-r323\.js"><\/script><script src="\.\/prop-shadow-r329\.js"><\/script>\s*<script src="\.\/combat-r118\.js">/.test(idx));ok('loaded once, right before combat-r118 (outermost drawProp wrapper)');
assert(!/ctx\.filter\s*=\s*['"][^'"]*(blur|drop-shadow)/.test(src)&&!/filter:'[^']*(blur|drop-shadow)/.test(src));ok('game ctx uses brightness only (no blur/drop-shadow)');
assert(!/transform\(/.test(src.replace(/\/\/.*$/gm,'')));ok('no shear transform (Three recorder drops it); translate+scale only');
const m=src.match(/const LEN=([\d.]+),SHIFT=([\d.]+),RISE=([\d.]+),ALPHA=([\d.]+)/);assert(m);const [LEN,SHIFT,RISE,ALPHA]=m.slice(1).map(Number);
assert(LEN>0&&LEN<=1&&SHIFT>0&&RISE>0&&ALPHA>0&&ALPHA<=.6);ok('shadow falls behind (up) and to the right, foreshortened, partial alpha');
assert(/WALLISH=\/[^/]*door[^/]*window/.test(src)&&src.includes('!p.terrainWall&&!p.wallMounted'));ok('wall pieces and wall-mounted dressing are skipped');
assert(CS('props-r102.js').includes('__STORYWORLD_PROP_SHADOW_R329__?.before?.(frameBase,'));ok('R102 animated props call the shadow hook before frameBase');
// 실행 검사: 가짜 전역으로 설치하고 drawProp → sprite 한 번에 그림자 두 장(brightness(0))이 먼저 그려지는지
const calls=[];const ctx={save(){},restore(){},translate(x,y){calls.push(['t',x,y]);},scale(a,b){calls.push(['s',a,b]);}};
const g={window:{},localStorage:{getItem:()=>null,setItem(){}},ctx,project:(x,y)=>({x:x*10,y:y*10})};
const W=new Function('window','localStorage','ctx','project','src',`let drawProp=function(p){sprite(p.path,p.x*10,p.y*10,80,{alpha:1});},sprite=(path,x,y,h,o)=>__c.push(['sprite',path,o&&o.filter||'none',o&&o.alpha]),drawAssetFrame3=()=>{};const __c=[];${src}\n;return {drawProp:()=>drawProp,calls:__c,api:window.__STORYWORLD_PROP_SHADOW_R329__};`)({},g.localStorage,ctx,g.project,src);
W.drawProp()({id:'statue',path:'assets/x/statue.webp',x:3,y:4});
const sp=W.calls.filter(c=>c[0]==='sprite');assert.strictEqual(sp.length,3,JSON.stringify(sp));assert(sp[0][2]==='brightness(0)'&&sp[1][2]==='brightness(0)'&&sp[2][2]==='none');ok('a prop draws two black silhouettes first, then itself');
W.calls.length=0;W.drawProp()({id:'door-0',path:'assets/x/door.webp',x:1,y:1});assert.strictEqual(W.calls.filter(c=>c[2]==='brightness(0)').length,0);ok('door props get no cast shadow');
W.api.set(false);W.calls.length=0;W.drawProp()({id:'statue2',path:'assets/x/s.webp',x:2,y:2});assert.strictEqual(W.calls.filter(c=>c[2]==='brightness(0)').length,0);ok('toggle off disables it');
// 근처 광원: 왼쪽(x 작은 쪽)에 화로가 있으면 그림자가 오른쪽(빛 반대)으로, 기본(보는 사람 쪽 빛)과 다른 자리
{const tr=[];const c2={save(){},restore(){},translate(x,y){tr.push([x,y]);},scale(){}};const win={__STORYWORLD_LIGHT_ATMOS_R300__:{lightsOf:()=>[{x:1,y:4,r:3,prop:true}]}};
 const W2=new Function('window','localStorage','ctx','project','src','room',`let drawProp=function(p){sprite(p.path,p.x*10,p.y*10,80,{alpha:1});},sprite=()=>{},drawAssetFrame3=()=>{};${src}\n;return {drawProp:()=>drawProp,api:window.__STORYWORLD_PROP_SHADOW_R329__};`)(win,{getItem:()=>null,setItem(){}},c2,(x,y)=>({x:x*10,y:y*10}),src,{});
 W2.drawProp()({id:'statue',path:'assets/x/statue.webp',x:3,y:4});const first=tr[0];assert(first&&first[0]>30+5,'shadow pushed away from light: '+JSON.stringify(tr.slice(0,2)));assert(W2.api.inspect().stats.lit>=1);
 ok('a nearby light source pushes the shadow away from it (else viewer-side light)');}
console.log(JSON.stringify({ok:true,checks:n,method:'static + CPU fake globals; headless capture separately; no GPU or device'}));
