// R1291 CPU 검사: UI 터치 영역·나침반 지역 이름(ui-tap-r1291.js) — 연결 5곳 + vm 에서 CSS 범위(터치만)·끄기.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let pass=0,fail=0;
const ok=(n,c,d)=>{if(c)pass++;else fail++;console.log((c?'ok   ':'FAIL ')+n+(c||d===undefined?'':' '+JSON.stringify(d).slice(0,300)));};
const F='ui-tap-r1291.js',src=fs.readFileSync(path.join(R,'client-source',F),'utf8');
ok('runtime-text copy identical',fs.existsSync(path.join(R,'runtime-text',F))&&fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===src);
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
ok('index.html: once, right after error-log-r1288',html.split('"./'+F+'"').length===2&&/<script src="\.\/error-log-r1288\.js"><\/script>\n<script src="\.\/ui-tap-r1291\.js"><\/script>\n/.test(html));
ok('verify-r96-public expects it',fs.readFileSync(path.join(ROOT,'scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"));
ok('pages.yml runs this check',fs.readFileSync(path.join(ROOT,'.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1291/r1291-cpu-check.cjs'));
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));ok('runtime-inputs lists it',JSON.stringify(inputs).includes(F));
// vm: 문서 흉내
function run(store){const head={children:[],appendChild(e){this.children.push(e);}};const els={};
 const document={readyState:'complete',head,getElementById:id=>head.children.find(e=>e.id===id)||null,createElement:()=>({id:'',textContent:'',remove(){head.children.splice(head.children.indexOf(this),1);}}),addEventListener(){}};
 const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}};
 const window={matchMedia:()=>({matches:true})};const c={window,document,localStorage};vm.createContext(c);vm.runInContext(src,c);return {api:window.__STORYWORLD_UI_TAP_R1291__,head};}
const a=run({});const css=a.api.CSS;
ok('style installed by default',a.head.children.length===1&&a.head.children[0].id==='r1291Css'&&a.api.inspect().installed);
// 터치 전용 규칙은 모두 @media (pointer:coarse) 안에 있다 — PC 마우스 크기는 그대로
const media=css.match(/@media \(pointer:coarse\)\{([\s\S]*?)\n\}/);ok('touch rules live inside @media (pointer:coarse)',!!media&&/input\[type=checkbox\]\{width:22px;height:22px/.test(media[1])&&/min-height:40px/.test(media[1]));
const outside=media?css.replace(media[0],''):css;ok('outside the touch block only the compass label rule (no checkbox/button/select sizes)',!/checkbox|select|button|summary/.test(outside)&&/#navCompassR100 \.label\{/.test(outside));
ok('compass label wraps to at most 2 lines',/-webkit-line-clamp:2/.test(outside)&&/white-space:normal/.test(outside));
ok('only allowed CSS (no filter/blur/position changes)',!/filter|blur|position:|display:none|opacity/.test(css));
ok('touch targets ≥ 40px for close/select/label',/button\[data-r176="back"\]\{min-height:40px/.test(css)&&/#panel select\{min-height:40px\}/.test(css)&&/label:has\(> input\[type=checkbox\]\)\{[^}]*min-height:40px/.test(css));
a.api.set(false);ok('set(false) removes the style and remembers 0',a.head.children.length===0&&!a.api.inspect().on);
const b=run({'storyworld.r1291.uiTap':'0'});ok('off switch in storage → no style',b.head.children.length===0);
const c2=run({'storyworld.r1291.uiTap':'1'});ok('storage 1 → on',c2.head.children.length===1);
console.log(`\nR1291 CPU: ${pass}/${pass+fail} 통과`);process.exit(fail?1:0);
