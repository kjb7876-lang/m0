// R150 CPU check: '가벼운 화면'(렉 줄이기 자동/켜기/끄기)·성능 표시. 실제 기기 장면 간격으로 판단, 자동 시험 브라우저에서는 자동으로 켜지 않음.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('perf-r150.js');
ok('runtime copy matches',fs.readFileSync(path.join(R,'runtime-text','perf-r150.js'),'utf8')===src);
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('index.html loads perf-r150 before audio-r98',html.indexOf('./perf-r150.js')>0&&html.indexOf('./perf-r150.js')<html.indexOf('./audio-r98.js'));
ok('public verify list includes perf-r150',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'perf-r150.js'"));
ok('R153: settings row sits right after 그래픽 품질 and mobile quick settings keep it unfolded',/g\.after\(row\)/.test(src)&&C('mobile-settings-r142.js').includes("quick.querySelector(':scope>#perfRowR150')"));
ok('R157: per-frame work timing (MessageChannel) runs only while the meter is shown',/if\(play&&ch&&!t0&&prefs\.meter\)/.test(src));
ok('R153: meter sits below the guide compass (does not cover the objective box)',/#perfMeterR150\{position:fixed;left:8px;top:150px;/.test(src));
ok('lite keeps darkness·torch·light pool (visibility) and only hides decoration',!/data-d="vig"|data-d="torch"|data-c="pool"|data-c="vig"/.test(src)&&/data-d="rust"/.test(src)&&/data-d="fog"/.test(src)&&/data-d="cv"/.test(src)&&/data-c="grain"/.test(src));
function el(tag){const e={tagName:tag,children:[],style:{},dataset:{},hidden:false,attrs:{},classList:{s:new Set(),toggle(c,on){on?this.s.add(c):this.s.delete(c);},contains(c){return this.s.has(c);}},
 setAttribute(k,v){this.attrs[k]=v;},appendChild(c){this.children.push(c);return c;},querySelectorAll(){return [];},querySelector(){return {checked:false};},set innerHTML(v){this._html=v;},get innerHTML(){return this._html||'';}};return e;}
function run({webdriver=false,stored=null,gapsMs=40,secs=8,play=true}={}){const ids={},toasts=[],frames=[];const root=el('html');
 const doc={documentElement:root,hidden:false,head:el('head'),body:el('body'),createElement:t=>el(t),getElementById:id=>ids[id]||null};doc.head.appendChild=c=>{if(c.id)ids[c.id]=c;return c;};doc.body.appendChild=c=>{if(c.id)ids[c.id]=c;return c;};
 const store={};if(stored)store['storyworld.r150.perf']=JSON.stringify(stored);
 const sb={window:{},document:doc,navigator:{webdriver},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},performance:{now:()=>0},MessageChannel:undefined,
  requestAnimationFrame:f=>{frames.push(f);return frames.length;},toast:t=>toasts.push(t),started:play,modal:null,loading:false,storyScene:null,showSettings(){}};
 vm.createContext(sb);vm.runInContext(src,sb);const api=sb.window.__STORYWORLD_PERF_R150__;
 let t=1000;for(let i=0;i<secs*1000/gapsMs;i++){const f=frames.shift();if(!f)break;t+=gapsMs;f(t);}
 return {api,root,toasts,store,ids,sb};}
{const r=run({gapsMs:40,secs:8});ok('slow frames (40ms ≈ 25/s) for 4s+ turn lite on automatically',r.root.classList.contains('swLiteR150')&&r.api.inspect().autoOn===1,r.api.inspect());ok('auto turn-on tells the player once',r.toasts.length===1,r.toasts);}
{const r=run({gapsMs:16.7,secs:10});ok('smooth frames (60/s) leave the full look',!r.root.classList.contains('swLiteR150')&&r.api.inspect().autoOn===0,r.api.inspect());}
{const r=run({gapsMs:40,secs:3});ok('short slow burst (<4s) does not switch',!r.root.classList.contains('swLiteR150'),r.api.inspect());}
{const r=run({gapsMs:40,secs:8,play:false});ok('menus/title (not playing) never count',!r.root.classList.contains('swLiteR150'),r.api.inspect());}
{const r=run({gapsMs:40,secs:8,webdriver:true});ok('automated test browsers (no GPU) never auto-switch',!r.root.classList.contains('swLiteR150')&&r.api.inspect().automated===true,r.api.inspect());}
{const r=run({gapsMs:40,secs:8,stored:{lite:'off'}});ok('setting 끄기 keeps the full look even when slow',!r.root.classList.contains('swLiteR150'),r.api.inspect());}
{const r=run({gapsMs:16.7,secs:2,stored:{lite:'on'}});ok('setting 켜기 forces lite at once',r.root.classList.contains('swLiteR150'),r.api.inspect());
 r.api.set({lite:'auto'});ok('back to 자동 (fast device) restores the full look',!r.root.classList.contains('swLiteR150'));ok('choice is saved',JSON.parse(r.store['storyworld.r150.perf']).lite==='auto');}
{const r=run({gapsMs:20,secs:5,stored:{meter:true}});const m=r.ids.perfMeterR150;ok('performance meter shows frames per second',m&&!m.hidden&&/장면\/초 50/.test(m.textContent),m&&m.textContent);}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
