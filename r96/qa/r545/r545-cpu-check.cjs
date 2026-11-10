'use strict';
// R545 — 사용자 2026-11-10 14:14Z "환도영웅으로 광장에서 길잡이모드로 플레이하는데 스피커터지는 소리가 반복적으로 들려서 거슬려 … 듣기좋은거 위주로", 14:15Z "기억사수로 플레이시에도 … 피격이나 적중음쪽인듯".
//  길잡이 모드 출력 녹음 실측: 깨짐(클리핑)은 없고(마스터 피크 0.17), 효과음마다 150Hz 아래 낮은 쿵이 26~55% 를 차지하며 공격·적중·죽음·고유기 넷이 한순간에 겹친다 → 작은 스피커에서 '터지는' 소리.
//  고침: ① 모든 효과음 버퍼를 한 번 150Hz 고역통과(2단)·부드러운 시작/끝으로 다듬어 쓴다(원본 파일·서사 음성·BGM 은 그대로) ② R544 21개를 낮은 쿵·2~5kHz 없이 다시 다듬고 배율을 낮춘다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const src=rd(path.join(R,'client-source/sfx-r541.js'));
ok(rd(path.join(R,'runtime-text/sfx-r541.js'))===src&&src.length>0,'sfx-r541.js runtime-text 사본 = client-source');
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r545/r545-cpu-check.cjs'),'pages.yml CPU 검사 줄');
// ── 음원 기준(귀에 편한 소리): 낮은 쿵·거슬리는 대역·딸깍·큰 피크 없음
let idx={files:{}};try{idx=JSON.parse(rd(path.join(R,'runtime-text/assets/r544/sfx/index.json')));}catch(_){}
const F=idx.files||{};ok(Object.keys(F).length===21,'R544 음원 21개');
for(const [k,f] of Object.entries(F)){const hit=/^hit-/.test(k),death=/^death-/.test(k),hurt=/^hurt-/.test(k),click=k==='click-1';
 ok(f.lowShare200<=.08,k+': 200Hz 아래 낮은 쿵 8% 이하('+f.lowShare200+')');
 ok(f.harshShare2to5k<=.2,k+': 2~5kHz 거슬리는 대역 20% 이하('+f.harshShare2to5k+')');
 ok(f.peakDb<=-12.5,k+': 피크 -12.5dB 이하('+f.peakDb+')');
 ok(f.tailDb<=-30,k+': 끝이 조용히 닫힘('+f.tailDb+'dB)');
 if(!click)ok(f.riseMs>=10,k+': 시작을 10ms 넘게 올림('+f.riseMs+'ms)');
 if(hit)ok(f.duration<=.3&&f.gain<=.55,k+': 0.3초 이하·배율 .55 이하');
 if(death)ok(f.gain<=.45,k+': 배율 .45 이하');
 if(hurt)ok(f.gain<=.6,k+': 배율 .6 이하');}
// ── 동작(vm)
const SR=44100;
function fakeBuffer(data){return{sampleRate:SR,length:data.length,numberOfChannels:1,duration:data.length/SR,getChannelData:()=>data};}
function tone(){const x=new Float32Array(SR*.4|0);for(let i=0;i<x.length;i++)x[i]=.5*Math.sin(2*Math.PI*60*i/SR+1.2)+.25*Math.sin(2*Math.PI*1000*i/SR+.7);return x;}
function band(x,f){let re=0,im=0;const a=SR*.1|0,b=x.length-(SR*.1|0);for(let i=a;i<b;i++){re+=x[i]*Math.cos(2*Math.PI*f*i/SR);im+=x[i]*Math.sin(2*Math.PI*f*i/SR);}return 2*Math.hypot(re,im)/(b-a);}
function mk(opt={}){const raw={},calls=[];
 const ctx={window:{},localStorage:{getItem:k=>k==='storyworld.r545.sfx'?(opt.pref5??null):null,setItem(){}},performance:{now:()=>1e5},setInterval:()=>0,console,Math,Float32Array,Promise,Map,Set,Object,
  document:{addEventListener(){}} ,
  soundProfiles:{attack:[{path:'sfx/a.wav'}],enemyHit:[{path:'sfx/hit.wav'}],hurt:[{path:'sfx/hurt.wav'}]},
  audioContext:{createBuffer:(c,len,sr)=>{const d=Array.from({length:c},()=>new Float32Array(len));return{sampleRate:sr,length:len,numberOfChannels:c,duration:len/sr,getChannelData:i=>d[i]};}},
  setupAudio:()=>'base',started:true,modal:null,loading:false,player:{hp:10,hero:'hwando',x:1,y:1,level:3},room:{id:'A',enemies:[]}};
 ctx.audioBuffer=function(p){calls.push(p);if(opt.missing===p)return null;raw[p]=raw[p]||Promise.resolve(fakeBuffer(tone()));return opt.fresh?raw[p].then(b=>b):raw[p];};
 ctx.sound=function(kind){const rows=ctx.soundProfiles[kind]||[];return rows[0]?ctx.audioBuffer(rows[0].path):null;};
 ctx.hitEnemy=()=>true;ctx.killEnemy=()=>{};
 ctx.window.window=ctx.window;vm.createContext(ctx);let err=null;try{vm.runInContext('var window=this.window;'+src,ctx);}catch(e){err=e;}
 return{ctx,raw,calls,err,api:ctx.window.__STORYWORLD_SFX_R541__};}
(async()=>{
 const A=mk();ok(!A.err&&!!A.api,'오버레이가 오류 없이 올라옴'+(A.err?' ('+A.err.message+')':''));
 ok(/^R54[56]$/.test(A.api?.revision||'')&&A.api?.enabledR545?.()===true,'revision R545·켜짐');
 const soft=await A.ctx.audioBuffer('sfx/hit.wav'),orig=await A.raw['sfx/hit.wav'];
 ok(!!soft&&soft!==orig&&soft.length===orig.length,'효과음 경로는 다듬은 버퍼를 돌려줌(길이 같음)');
 const o=orig.getChannelData(0),s=soft?.getChannelData?.(0)||o;
 const lo=20*Math.log10(band(s,60)/band(o,60)),mid=20*Math.log10(band(s,1000)/band(o,1000));
 ok(lo<=-10,'60Hz 낮은 쿵 10dB 넘게 줄임('+lo.toFixed(1)+'dB)');ok(Math.abs(mid)<=1.5,'1kHz 는 그대로(±1.5dB, '+mid.toFixed(2)+'dB)');
 ok(Math.abs(s[0])<1e-4&&Math.abs(s[s.length-1])<1e-3,'시작·끝 표본이 0 에서 열리고 닫힘(딸깍 없음)');
 let j=0;for(let i=1;i<441;i++)j=Math.max(j,Math.abs(s[i]-s[i-1]));ok(j<.05,'처음 10ms 안 표본 사이 뜀 .05 미만('+j.toFixed(3)+')');
 ok(o[0]!==0&&Math.abs(o[5]-(.5*Math.sin(2*Math.PI*60*5/SR+1.2)+.25*Math.sin(2*Math.PI*1000*5/SR+.7)))<1e-6,'원본 버퍼는 건드리지 않음');
 ok(await A.ctx.audioBuffer('sfx/hit.wav')===soft,'같은 경로는 한 번만 다듬음(캐시)');
 const nar=await A.ctx.audioBuffer('voice/line-1.mp3');ok(nar===await A.raw['voice/line-1.mp3'],'효과음 프로필에 없는 경로(서사 음성 등)는 원본 그대로');
 A.ctx.soundProfiles.r999New=[{path:'sfx/new.wav'}];const late=await A.ctx.audioBuffer('sfx/new.wav');ok(late!==await A.raw['sfx/new.wav'],'나중에 등록된 효과음 프로필도 다듬음');
 const viaSound=await A.ctx.sound('attack');ok(viaSound!==await A.raw['sfx/a.wav'],'sound() 를 거친 재생이 다듬은 버퍼를 받음');
 const M=mk({missing:'sfx/hit.wav'});ok(M.ctx.audioBuffer('sfx/hit.wav')===null,'엔진이 null 을 주면 null 그대로');
 const Fr=mk({fresh:true}),f1=await Fr.ctx.audioBuffer('sfx/hit.wav'),f2=await Fr.ctx.audioBuffer('sfx/hit.wav');ok(f1===f2&&f1!==await Fr.raw['sfx/hit.wav']&&Fr.api.inspect().r545.softened===1,'엔진이 매번 새 약속 객체를 줘도 같은 버퍼는 한 번만 다듬음(조절기 캐시 유지)');
 const st=A.api?.inspect?.().r545;ok(st&&st.highpassHz===150&&st.softened>=3&&st.directListeningVerified===false,'inspect 에 다듬은 수·150Hz·직접 청취 미검증 표시');
 const O=mk({pref5:'0'});ok(O.api?.enabledR545?.()===false&&await O.ctx.audioBuffer('sfx/hit.wav')===await O.raw['sfx/hit.wav'],"storyworld.r545.sfx='0' 이면 원본 그대로");
 console.log('\nR545 CPU checks: '+(n-bad)+'/'+n);process.exit(bad?1:0);
})();
