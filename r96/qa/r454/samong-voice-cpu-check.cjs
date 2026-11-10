'use strict';// R454 사몽 ② 녹음 서사 음성: 서문~S-07 문장이 모두 R381 녹음 목록에 있고, 영화 모드가 사몽 구역 장면을 녹음으로 트는지.
//  사용자 2026-11-09 "사몽회상진행본 토대로 음성만들어서 적용해줘 스토리모드처럼". 녹음 = 사용자 PC Qwen3-TTS 1.7B CustomVoice(Sohee),
//  문장 = 영화 모드 sentences(), 파일 이름 = SHA-1(문장)[:16] (스토리모드 R381 과 같은 규칙·같은 폴더 assets/r381/voice/).
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),{TextEncoder}=require('util');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
const CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
for(const f of ['voice-r381-data.js','samong-text-r103.js'])ok(RT(f)===CS(f),f+' runtime-text 사본 = client-source');
const load=f=>{const sb={};sb.window=sb;vm.createContext(sb);vm.runInContext(CS(f),sb);return sb;};
const D=load('voice-r381-data.js').__STORYWORLD_VOICE_R381_DATA__,T=load('samong-text-r103.js').__STORYWORLD_SAMONG_TEXT_R103__;
ok(T.sha256==='dc0100ea6da3c4f3b879fea721f91537e0b96d1d51ba907fe605e30796604c8c','사몽 원문 = R448 회상 진행형 정본',T.sha256);
// 영화 모드 sentences() 를 파일에서 그대로 떼어 쓴다(복사본이 어긋나지 않게).
const m=CS('cinema-mode-r370.js').match(/function sentences\(text\)\{[\s\S]*?\n return out;\}/);ok(!!m,'영화 모드 sentences() 찾음');
const sentences=vm.runInNewContext('('+m[0]+')');const sid=t=>crypto.createHash('sha1').update(String(t).trim()).digest('hex').slice(0,16);
const ids=new Set(D.ids),keys=Object.keys(T.sections),LAST=keys.indexOf('S-07');ok(keys[0]==='prelude'&&LAST>0,'사몽 ② 범위 서문~S-07',keys.slice(0,3));
const cover=ks=>{let tot=0,miss=[];const seen=new Set();for(const k of ks)for(const b of T.sections[k].blocks)for(const p of b.paras)for(const x of sentences(p)){const t=x.text;if(!/[0-9A-Za-z가-힣]/.test(t))continue;const id=sid(t);if(seen.has(id))continue;seen.add(id);tot++;if(!ids.has(id))miss.push(k+' '+t.slice(0,24));}return{tot,miss};};
const two=cover(keys.slice(0,LAST+1));
ok(two.tot>=1660&&two.miss.length===0,'사몽 ② 서문~S-07 문장 전부 녹음 있음',{tot:two.tot,miss:two.miss.length,first:two.miss.slice(0,3)});
let missFile=0;const dir=path.join(R,'runtime-text','assets','r381','voice');const sizes=[];
for(const k of keys.slice(0,LAST+1))for(const b of T.sections[k].blocks)for(const p of b.paras)for(const x of sentences(p)){const id=sid(x.text);if(!ids.has(id))continue;const f=path.join(dir,id+'.mp3');if(!fs.existsSync(f))missFile++;else sizes.push(fs.statSync(f).size);}
ok(missFile===0&&sizes.every(s=>s>1500),'사몽 녹음 파일 모두 있고 비어 있지 않음',{missFile,min:Math.min(...sizes)});
const rest=cover(keys.slice(LAST+1));console.log('사몽역행·엔딩(이번 범위 밖) 녹음:',rest.tot-rest.miss.length,'/',rest.tot);
// ── 영화 모드: 사몽 구역 장면(R115 scenesFor 와 같은 꼴) → 녹음으로 재생 ──
let clock=0;const timers=[];const setT=(f,ms)=>{const t={at:clock+Math.max(0,ms||0)/1000,f,dead:false};timers.push(t);return t;};
const run=s=>{const end=clock+s;for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.find(t=>!t.dead&&t.at<=end);if(!t)break;clock=Math.max(clock,t.at);t.dead=true;t.f();}clock=end;};
const audios=[];function Audio(){this.src='';this.currentTime=0;this.paused=true;this.duration=NaN;audios.push(this);}
Audio.prototype.play=function(){const a=this;a.paused=false;a.duration=3;setT(()=>{a.currentTime=.1;a.onplaying&&a.onplaying();},30);setT(()=>{if(!a.paused&&a.src){a.paused=true;a.onended&&a.onended();}},3000/(a.playbackRate||1));return Promise.resolve();};
Audio.prototype.pause=function(){this.paused=true;};Audio.prototype.load=function(){};Audio.prototype.removeAttribute=function(k){if(k==='src')this.src='';};
const spoken=[];let su=null;const ss={getVoices:()=>[{name:'ko',lang:'ko-KR'}],speak(u){spoken.push(u.text);su=u;setT(()=>{if(su===u){su=null;u.onend&&u.onend();}},u.text.length/(7*u.rate)*1000);},cancel(){su=null;},pause(){},resume(){},addEventListener(){}};
const el=()=>({style:{},children:[],classList:{add(){},remove(){},toggle(){}},querySelector:()=>({}),appendChild(){},setAttribute(){},isConnected:true});
const sb={localStorage:{getItem:()=>null,setItem(){}},speechSynthesis:ss,SpeechSynthesisUtterance:function(t){this.text=t;},Audio,TextEncoder,performance:{now:()=>clock*1000},setTimeout:setT,clearTimeout:t=>{if(t)t.dead=true;},setInterval:f=>{sb.__iv=f;},addEventListener(){},
 document:{hidden:false,getElementById:()=>null,createElement:el,head:el(),body:el(),querySelector:()=>null},toast(){},Math,JSON,String,Array,Set,Map,Object,Number,RegExp,Promise,Int32Array,Uint8Array};
sb.window=sb;sb.__STORYWORLD_PLAY_R169__={collect(){}};vm.createContext(sb);
vm.runInContext(CS('voice-r381-data.js'),sb);vm.runInContext(CS('voice-r381.js'),sb);
vm.runInContext(`var started=true,loading=false,modal=false,guide=true,auto=true,guideTimer=0,storyScene=null,storyQueue=[],storyDone=null,settings={voice:.6},
 room={id:'samong-host',samongR115:{zone:'sz115-S01-2'},enemies:[{hp:10}]},regionById={};
 function stopVoice(){}function advanceScene(){storyScene=storyQueue.shift()||null;if(!storyScene){const d=storyDone;storyDone=null;if(d)d();}}
 function playScenes(sc,done){storyQueue=sc.slice();storyDone=done||null;storyScene=null;advanceScene();}
 async function enterRegion(){return true;}function showSettings(){}`,sb);
vm.runInContext(CS('cinema-mode-r370.js'),sb);const api=sb.__STORYWORLD_CINEMA_MODE_R370__;api.set({on:true,voice:''});
const tickIv=s=>{for(let i=0;i<s;i++){run(1);sb.__iv&&sb.__iv();}};
const S1=T.sections['S-01'],paras=S1.blocks[0].paras.slice(0,2),scene={id:'samong-host',record:{title:S1.title,narrator:S1.blocks[0].narrator,chapter:''},part:'body',text:paras.join('\n\n'),title:S1.title+' · 구역',narrator:'〈'+S1.blocks[0].narrator+'〉',chapter:'',key:'DREAM:sz115:sz115-S01-2:cue:0'};
const want=sentences(scene.text).map(x=>x.text).filter(t=>/[가-힣]/.test(t));
vm.runInContext('playScenes('+JSON.stringify([scene])+',null)',sb);tickIv(200);
const played=audios.filter(a=>a.duration===3).map(a=>a.src.replace(/^.*\//,'').replace('.mp3',''));const st=api.inspect().stats;
ok(played.length>=2&&played.every(id=>ids.has(id))&&audios.every(a=>!a.src||a.src.startsWith('assets/r381/voice/')),'사몽 구역 장면 문장이 assets/r381/voice/<id>.mp3 녹음으로 재생',{played:played.length,st:{recorded:st.recorded,spoken:st.spoken}});
ok(played.includes(sid(want[0]))&&!spoken.includes(want[0]),'첫 문장은 녹음으로만(브라우저 음성 겹침 없음)',{first:want[0].slice(0,20),spoken:spoken.slice(0,2)});
ok(st.recordFail===0,'녹음 재생 실패 없음',st);
console.log(JSON.stringify({total:n,failed:bad,samong2:two.tot,recorded:st.recorded}));process.exit(bad?1:0);
