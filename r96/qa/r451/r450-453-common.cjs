// R450~R453 CPU 검사 공용: 런타임 사본·매니페스트·스크립트 순서·공개 검증 목록, 그리고 브라우저 없이 오버레이를 돌릴 vm 상자.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),RT=path.join(R,'runtime-text'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const FILES=['weather-r450.js','local-light-r451.js','ground-fringe-r452.js','actor-tone-r453.js'];
function wiring(ok,file){const src=C(file);ok(file+' runtime copy matches client-source',fs.readFileSync(path.join(RT,file),'utf8')===src);
 const man=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8')),M=new Map(man.files.map(f=>[f.path,f.sha256]));
 ok(file+' runtime-manifest hash matches',M.get(file)===crypto.createHash('sha256').update(fs.readFileSync(path.join(RT,file))).digest('hex'));
 ok(file+' listed in runtime-inputs textPaths',JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')).textPaths.includes(file));
 const html=fs.readFileSync(path.join(RT,'index.html'),'utf8');
 ok(file+' loads once, in order perf-r441 → (R440 · R442) → R450 → R451 → R452 → R453 → combat-r118',html.split('./'+file).length===2&&
  /<script src="\.\/perf-r441\.js"><\/script>(?:<script src="\.\/skill-attack-r440\.js"><\/script>)?(?:<script src="\.\/enemy-skill-pose-r442\.js"><\/script>)?<script src="\.\/weather-r450\.js"><\/script><script src="\.\/local-light-r451\.js"><\/script><script src="\.\/ground-fringe-r452\.js"><\/script><script src="\.\/actor-tone-r453\.js"><\/script>\s*<script src="\.\/combat-r118\.js">/.test(html)&&
  html.indexOf('light-r182.js')<html.indexOf('weather-r450.js')&&html.indexOf('cave-r204.js')<html.indexOf('weather-r450.js')&&html.indexOf('combat-read-r409.js')<html.indexOf('actor-tone-r453.js'));
 ok(file+' never wraps R54 frameFor (R442 stays the outermost frameFor even though R450~R453 load after it)',!/frameFor|STORY_COMBAT_R54/.test(src.replace(/\/\/.*$/gm,'')));
 ok(file+' listed in verify-r96-public.py',fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+file+"'"));}
// 브라우저 대역: window·localStorage·setInterval(돌지 않음)·StoryPhase1.ThreeRenderer
function box(extra={}){const store={};const ctx={console,performance,Math,JSON,Map,Set,WeakMap,WeakSet,String,Number,Array,Object,Error,Promise,Symbol,Float32Array,Float64Array,Uint8Array,Int32Array,Uint32Array,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);}},setInterval:()=>0,clearInterval:()=>{},store,...extra};ctx.window=ctx;
 function TR(){}TR.prototype.render=function(){};TR.prototype.dispose=function(){};ctx.StoryPhase1={ThreeRenderer:TR};vm.createContext(ctx);return ctx;}
function load(ctx,file){vm.runInContext(C(file),ctx,{filename:file});}
function runner(name){const checks=[];const ok=(n,p,d)=>{checks.push({name:n,pass:!!p,detail:d});};
 const done=()=>{const bad=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass||c.detail===undefined?'':' '+JSON.stringify(c.detail).slice(0,400)));
  console.log(name+' '+(checks.length-bad.length)+'/'+checks.length);if(bad.length)process.exit(1);};return{ok,done};}
module.exports={R,RT,C,FILES,wiring,box,load,runner};
