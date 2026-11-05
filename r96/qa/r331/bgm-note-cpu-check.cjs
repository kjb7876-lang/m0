// R331 맵 곡 한 줄 설명 검사 — 모든 곡 제목에 짧은 한국어 설명이 있고, 곡이 바뀔 때만 7초 띄운다.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/hud-bgm-hwando-w-r313.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/hud-bgm-hwando-w-r313.js'),'utf8'));ok('client-source and runtime copies agree');
const obj=name=>{const i=src.indexOf('const '+name+'={');let d=0,j=src.indexOf('{',i);for(let k=j;k<src.length;k++){if(src[k]==='{')d++;else if(src[k]==='}'){d--;if(!d)return Function('return '+src.slice(j,k+1))();}}};
const T=obj('TITLES'),D=obj('DESC');
for(const k of Object.keys(T))assert(D[k],'missing desc: '+k);ok('every catalogued title ('+Object.keys(T).length+') has a description');
for(const[k,v]of Object.entries(D)){assert(/[가-힣]/.test(v)&&v.length<=60,'short Korean: '+k);assert(!/[A-Za-z]{4,}/.test(v),'no English words: '+v);}ok('descriptions are one short Korean line (<=60 chars)');
assert(/if\(d\)showNote\(shown\+' · '\+d\)/.test(src)&&/NOTE_SEC=7/.test(src));ok('shown once per track change for 7 s');
assert(/pointer-events:none/.test(src));ok('note never blocks input');
// VM: R308 quiet 사슬·안 들릴 때 만료·같은 한국어 제목의 다른 녹음(Codex 리뷰)
{const vm=require('vm');let now=1000;const el=id=>({id,style:{},isConnected:true,hidden:false,textContent:'',title:'',appendChild(){},insertBefore(){},parentNode:null});
 const name=el('regionName');name.parentNode=el('p');const notes=[];
 const doc={hidden:false,head:{appendChild(){}},body:{appendChild:n=>{n.isConnected=true;notes.push(n);}},getElementById:id=>id==='regionName'?name:null,createElement:()=>el(''),addEventListener(){}};
 const deck={id:'danse-macabre-1925',paused:false,muted:false,ended:false,readyState:4,volume:.6};
 const map={active:true,prefs:{on:true},decks:[deck],failed:[]};
 const cat={'danse-macabre-1925':{composer:'Camille Saint-Saëns',title:'Danse macabre, Op. 40 (historic 1925 recording)'},'danse-macabre':{composer:'Camille Saint-Saëns',title:'Danse macabre, Op. 40'}};
 const c={console,Object,Math,JSON,Number,Map,Set,WeakSet,Promise,performance:{now:()=>now},localStorage:{getItem:()=>null,setItem(){}},document:doc,
  fetch:async p=>({ok:true,json:async()=>p.includes('/r308/')?{tracks:cat}:{}}),settings:{music:true,bgm:.8},player:{hero:'x'},effects:[],
  updateHUD(){},musicTick(){},tick(){},__STORYWORLD_BGM_MAP_R308__:{inspect:()=>map},__STORYWORLD_BGM_CLASSICAL_R195__:{inspect:()=>({prefs:{on:true}})}};
 c.window=c;vm.createContext(c);vm.runInContext(src,c);
 (async()=>{await new Promise(r=>setImmediate(r));
  const frame=()=>{c.updateHUD();/* R308 quiet: music=false 로 옛 사슬을 부른다 */const m=c.settings.music;c.settings.music=false;try{c.musicTick();}finally{c.settings.music=m;}};
  for(let i=0;i<30;i++){now+=50;frame();}const note=notes[0];assert(note&&note.style.opacity==='1'&&/1925/.test(note.textContent),'note under quiet chain: '+(note&&note.textContent));ok('description appears even with R308 quiet() calling the muted music chain each frame');
  deck.id='danse-macabre';for(let i=0;i<10;i++){now+=50;frame();}assert(!/1925/.test(note.textContent)&&/해골/.test(note.textContent),'refresh: '+note.textContent);ok('same Korean title but a different recording refreshes the description');
  c.settings.music=false;now+=8000;c.updateHUD();assert.strictEqual(note.style.opacity,'0');ok('description hides when music becomes inaudible');
  console.log(JSON.stringify({ok:true,checks:n,method:'static + VM fake DOM; no device'}));})().catch(e=>{console.error(e);process.exit(1);});}

