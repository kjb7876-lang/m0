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
console.log(JSON.stringify({ok:true,checks:n,method:'static; no device'}));
