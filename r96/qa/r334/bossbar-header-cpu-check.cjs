// R334 보스 체력창을 맨 위 header 로 옮김 검사(정적 + 가짜 DOM).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/hud-bossbar-r334.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/hud-bossbar-r334.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');assert(idx.split('"./hud-bossbar-r334.js"').length===2&&/id="bossbar"/.test(idx)&&/<header>/.test(idx));ok('script tag loaded once; engine #bossbar and header exist');
assert(/head\.insertBefore\(bar,nav\|\|null\)/.test(src)&&!/createElement\('div'\)[^;]*bossbar/.test(src));ok('moves the same #bossbar node (engine updates keep working), placed before the nav buttons');
assert(/@media\(max-width:1000px\)\{header #bossbar\{position:absolute;left:8px;right:8px;top:100%/.test(src));ok('narrow screens: thin strip right under the header');
// 가짜 DOM 실행
const kids=[];const nav={};const head={children:kids,querySelector:s=>s==='.topnav'?nav:null,insertBefore(el,ref){el.parentNode=head;kids.push(el);}};
const stage={insertBefore(el){el.parentNode=stage;}};const bar={parentNode:stage,nextSibling:null};const styles=[];const cls=new Set();
const doc={readyState:'complete',body:{classList:{contains:c=>cls.has(c)}},getElementById:id=>id==='bossbar'?bar:id==='r334Style'?styles[0]||null:null,querySelector:s=>s==='header'?head:null,createElement:()=>({}),head:{appendChild:e=>{e.id='r334Style';styles.push(e);}},addEventListener(){}};
const win={};let tickFn=null;new Function('window','document','localStorage','setInterval','setTimeout','getComputedStyle',src)(win,doc,{getItem:()=>null,setItem(){}},f=>{tickFn=f;return 0;},f=>f(),()=>({display:'flex'}));
assert.strictEqual(bar.parentNode,head);assert(styles.length===1);ok('mounts #bossbar inside header with its style');
cls.add('mobile-live-r63');tickFn();assert.strictEqual(bar.parentNode,stage);ok('mobile live play (header hidden) puts the bar back on the stage so it stays visible');
cls.delete('mobile-live-r63');tickFn();assert.strictEqual(bar.parentNode,head);ok('back in the header when the header is visible again');
console.log(JSON.stringify({ok:true,checks:n,method:'static + fake DOM; headless PC 1280 / 844 / 740 captures'}));
