'use strict';
// R1344 탐색: 3D render 를 감싸는 오버레이를 모두 한 vm 에 올려 주기 감싸기를 돌리고 prototype·인스턴스 render 깊이가 느는지 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.resolve(__dirname,'../..');
const FILES=process.argv.slice(2);Error.stackTraceLimit=Infinity;
const store={},intervals=[];const noop=()=>{};
const el=()=>new Proxy(function(){},{get:(t,k)=>k==='style'||k==='dataset'||k==='classList'?new Proxy({},{get:()=>noop,set:()=>true}):k==='appendChild'||k==='addEventListener'||k==='setAttribute'?noop:k==='getContext'?()=>null:undefined});
const sb={console:{log(){},warn(){},error(){}},JSON,Date,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,Math,Promise,isFinite,isNaN,parseFloat,parseInt,URL,Proxy,Reflect,RegExp,Float32Array,Uint8Array,Int32Array,Uint16Array,
 setTimeout:()=>0,TextEncoder,TextDecoder,clearTimeout(){},setInterval:(f)=>{intervals.push(f);return intervals.length;},clearInterval(){},requestAnimationFrame:()=>0,performance:{now:()=>Date.now()},
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},location:{search:'',href:'http://x/m0/'},navigator:{userAgent:'x'},
 document:{createElement:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:noop,body:el(),documentElement:el(),head:el()},addEventListener:noop,MutationObserver:function(){this.observe=noop;},Image:function(){}};
sb.window=sb;sb.globalThis=sb;vm.createContext(sb);
vm.runInContext(`var started=true,modal=false,loading=false,storyScene=null,layer='STORY',time=100,zone='ep1b04',settings={};
 var player={hero:'gunner',x:10,y:10,hp:100,ego:3};var room={id:'ep1b04',layer:'STORY',props:[],enemies:[]};
 var __d=()=>new Error().stack.split('\\n').length,__depth=0;
 function DrawCommands(){this.commands=[];}DrawCommands.prototype.push=function(kind,data){this.commands.push({kind,...data});};
 function ThreeRenderer(){}var __st='';ThreeRenderer.prototype.render=function(frame){__depth=__d();__st=new Error().stack;};
 ['activateTerrain','admitTerrain','clearScene'].forEach(k=>ThreeRenderer.prototype[k]=function(){});
 var StoryPhase1={DrawCommands,ThreeRenderer};var __inst=new ThreeRenderer();__inst.render=ThreeRenderer.prototype.render;
 window.__STORYWORLD_PHASE1__={controller:{state:{three:__inst}}};function tick(){time+=.016;}function drawEffect(){}var ctx=new DrawCommands();`,sb);
const loadErr={};for(const f of FILES){try{vm.runInContext(fs.readFileSync(path.join(R,'client-source',f),'utf8'),sb,{filename:f});}catch(e){loadErr[f]=String(e).slice(0,80);}}
const pump=k=>{for(let i=0;i<k;i++){for(const f of intervals.slice())try{f();}catch(_){}try{vm.runInContext('tick()',sb);}catch(_){}}};
const d=()=>{const o={};try{vm.runInContext('__inst.render({commands:[]})',sb);o.inst=vm.runInContext('__depth',sb);}catch(e){o.inst=String(e).slice(0,40);}
 try{vm.runInContext('new ThreeRenderer().render({commands:[]})',sb);o.proto=vm.runInContext('__depth',sb);}catch(e){o.proto=String(e).slice(0,40);}return o;};
pump(3);const a=d();pump(300);const b=d();
const by=w=>{const fr={};try{vm.runInContext(w,sb);}catch(_){}for(const l of String(vm.runInContext('__st',sb)).split('\n').slice(1)){const m=/\(?([\w.-]+\.js)/.exec(l);const k=m?m[1]:'?';fr[k]=(fr[k]||0)+1;}return Object.entries(fr).filter(([k,v])=>v>3).sort((x,y)=>y[1]-x[1]);};
const grow={inst:by('__inst.render({commands:[]})'),proto:by('new ThreeRenderer().render({commands:[]})')};
console.log(JSON.stringify({a,b,grow,loadErr}));
