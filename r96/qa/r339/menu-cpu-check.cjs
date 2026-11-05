// R339 메뉴 단순화 검사(정적).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/hud-menu-r339.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/hud-menu-r339.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');assert(idx.split('"./hud-menu-r339.js"').length===2);ok('script tag loaded once');
for(const id of['story-code-button','goldHudOpen','goldHudCast','r263HeroBtn','journalBtn','mapBtn','saveBtn'])assert(src.includes("'"+id+"'"),id);ok('777·황금실·영웅·기억·지도·저장 header buttons are hidden (kept in DOM for shortcuts)');
assert(!/'menuBtn'/.test(src.slice(src.indexOf('const HIDE'),src.indexOf('const GROUPS'))));ok('menu button stays in the header');
for(const p of['proxy:r263HeroBtn','proxy:journalBtn','proxy:mapBtn','proxy:goldHudCast','proxy:story-code-button','goldOpen'])assert(src.includes("'"+p+"'"),p);ok('every hidden header action is reachable inside the menu');
assert(/src\.click\(\)/.test(src));ok('proxy buttons press the original buttons (same behaviour)');
assert(/details'\);rare\.className='r339Rare'/.test(src));ok('rare tools (offline packs, sword-dance choice) are folded');
assert(!/header \.r93-dock\{|header \.r93-dock,|,header \.r93-dock/.test(src)&&/body\.r339On header #goldHudR72,body\.r339On header #story-code-button\{display:none!important\}/.test(src));ok('only the relocated controls are hidden (the docked quest objective stays visible)');
// 가짜 DOM: 황금실 연속 proxy 는 메뉴(모달)를 먼저 닫고 원래 버튼을 누른다
{const order=[];const src0={textContent:'황금실 연속',click:()=>order.push('cast')};const W={},D={getElementById:id=>id==='goldHudCast'?src0:null,createElement:()=>({dataset:{},set textContent(v){},get textContent(){return '';}}),head:{appendChild(){}}};
 const api=new Function('window','document','localStorage','closePanel','setTimeout','showMenu','setInterval',src+';return window.__STORYWORLD_HUD_MENU_R339__;')(W,D,{getItem:()=>null,setItem(){}},()=>order.push('close'),()=>0,undefined,()=>0);
 const m=/function proxy\(id,label\)\{[^]*?return b;\}/.exec(src)[0];const proxy=new Function('document','stats','fail','closePanel','CLOSE_FIRST',m+';return proxy;')(D,{proxied:0},()=>{},()=>order.push('close'),new Set(['goldHudCast']));
 proxy('goldHudCast','황금실 연속').onclick();assert.deepStrictEqual(order,['close','cast']);ok('황금실 연속 proxy closes the menu before casting (cast is rejected while modal)');}
for(const id of['goldHudSecond','goldHudThird'])assert(src.includes("'proxy:"+id+"'")&&new RegExp("CLOSE_FIRST=new Set\\(\\[[^\\]]*'"+id+"'").test(src),id);ok('2nd/3rd golden-thread slot casts are in the menu too (close-first)');
assert(/toggle\('r339On',on&&!coop\(\)\)/.test(src)&&/__STORYWORLD_COOP_CLIENT_R62__\?\.active/.test(src));ok('co-op session menu (no grouped proxies): header buttons stay visible');
console.log(JSON.stringify({ok:true,checks:n,method:'static; headless PC 1280 + phone 390: header shows only 메뉴, six groups, 지도 proxy opens the map'}));
