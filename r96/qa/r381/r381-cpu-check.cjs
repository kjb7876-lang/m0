'use strict';// R381 녹음 서사 음성: 등록·목록·해시·영화 모드 연결(녹음 우선, 없으면/실패하면 브라우저 음성)
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),{TextEncoder}=require('util');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
const RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');const CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
for(const f of ['voice-r381-data.js','voice-r381.js','cinema-mode-r370.js'])ok(RT(f)===CS(f),f+' runtime-text 사본 = client-source');
const html=RT('index.html');
ok(/<script src="\.\/approved-mobs-r380\.js"><\/script><script src="\.\/voice-r381-data\.js"><\/script><script src="\.\/voice-r381\.js"><\/script>/.test(html)&&html.split('voice-r381.js').length===2&&html.split('voice-r381-data.js').length===2,'스크립트 태그 한 번씩, 목록 → 모듈 순, R380 뒤');
const vp=fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8');ok(vp.includes("'voice-r381-data.js','voice-r381.js',"),'공개 확인 목록(쉼표 포함)');
const inputs=JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'));const manifest=JSON.parse(fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8'));
const mrows=new Map(manifest.files.map(r=>[r.path,r]));
ok(inputs.textPaths.includes('voice-r381.js')&&inputs.textPaths.includes('voice-r381-data.js'),'런타임 입력 목록');
// 목록 ↔ 파일 ↔ 런타임 매니페스트
const sb0={};sb0.window=sb0;vm.createContext(sb0);vm.runInContext(CS('voice-r381-data.js'),sb0);const D=sb0.__STORYWORLD_VOICE_R381_DATA__;
ok(D.model==='Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice'&&D.speaker==='Sohee'&&D.license==='Apache-2.0','모델·화자·라이선스 표기');
ok(Array.isArray(D.ids)&&D.ids.length>=615&&new Set(D.ids).size===D.ids.length&&D.ids.every(i=>/^[0-9a-f]{16}$/.test(i)),'id 목록 615개 이상, 중복 없음',D.ids.length);
let missFile=0,missManifest=0,badHash=0;for(const id of D.ids){const rel='assets/r381/voice/'+id+'.mp3',p=path.join(R,'runtime-text',rel);
 if(!fs.existsSync(p)){missFile++;continue;}const row=mrows.get(rel);if(!row||!inputs.textPaths.includes(rel)){missManifest++;continue;}
 const b=fs.readFileSync(p);if(row.bytes!==b.length||row.sha256!==crypto.createHash('sha256').update(b).digest('hex'))badHash++;}
ok(missFile===0&&missManifest===0&&badHash===0,'모든 녹음 파일이 있고 런타임 목록·해시와 맞음',{missFile,missManifest,badHash});
const extra=fs.readdirSync(path.join(R,'runtime-text','assets','r381','voice')).filter(f=>!D.ids.includes(f.replace(/\.mp3$/,'')));ok(extra.length===0,'목록에 없는 녹음 파일 없음',extra.slice(0,3));
// 정본 문장 범위: 프롤로그 ~ 모든 지역 ~ 최종장 전부 녹음(읽을 글자 없는 조각 제외)
const sbC={};sbC.window=sbC;vm.createContext(sbC);vm.runInContext(CS('story-canon-r106-data.js'),sbC);const C=sbC.__STORYWORLD_STORY_CANON_R106__;
const sentences=t=>{const out=[];String(t||'').split(/\n\s*\n/).forEach(pa=>{const p=pa.replace(/\s+/g,' ').trim();if(!p)return;for(const r of (p.match(/[^.?!…。]+(?:[.?!…。]+["”’」』)]*|$)/g)||[p])){const x=r.trim();if(x)out.push(x);}});return out;};
const sid=t=>crypto.createHash('sha1').update(t).digest('hex').slice(0,16),ids=new Set(D.ids);
const keys=Object.keys(C.zones);let tot=0,miss=[];const all=[C.prologue.pre,C.prologue.post];for(const k of keys)for(const b of C.zones[k].blocks)all.push(b.paras.join('\n\n'));all.push(C.finale.text);
for(const t of all)for(const s of sentences(t)){if(!/[0-9A-Za-z가-힣]/.test(s))continue;tot++;if(!ids.has(sid(s)))miss.push(s.slice(0,30));}
ok(tot>=1629&&miss.length===0,'프롤로그~최종장 문장 전부 녹음 있음',{tot,miss:miss.slice(0,3)});
// ── 모듈 단독: 동기 SHA-1, has/play/stop ──
let clock=0;const timers=[];const setT=(f,ms)=>{const t={at:clock+Math.max(0,ms||0)/1000,f,dead:false};timers.push(t);return t;};
const run=s=>{const end=clock+s;for(;;){timers.sort((a,b)=>a.at-b.at);const t=timers.find(t=>!t.dead&&t.at<=end);if(!t)break;clock=Math.max(clock,t.at);t.dead=true;t.f();}clock=end;};
const audios=[];let failSrc=null,stallSrc=null;
function Audio(){this.src='';this.currentTime=0;this.paused=true;this.duration=NaN;audios.push(this);}
Audio.prototype.play=function(){const a=this;a.paused=false;const id=(a.src.match(/([0-9a-f]{16})\.mp3$/)||[])[1];
 if(failSrc&&id===failSrc){setT(()=>a.onerror&&a.onerror(),50);return Promise.resolve();}
 if(stallSrc&&id===stallSrc)return Promise.resolve();
 a.duration=3;setT(()=>{a.currentTime=.1;a.onplaying&&a.onplaying();},30);setT(()=>{if(!a.paused&&a.src){a.paused=true;a.onended&&a.onended();}},3000/(a.playbackRate||1));return Promise.resolve();};
Audio.prototype.pause=function(){this.paused=true;};Audio.prototype.load=function(){};Audio.prototype.removeAttribute=function(k){if(k==='src')this.src='';};
const spoken=[];let su=null;
const ss={getVoices:()=>[{name:'ko',lang:'ko-KR'}],speak(u){spoken.push(u.text);su=u;setT(()=>{if(su===u){su=null;u.onend&&u.onend();}},u.text.length/(7*u.rate)*1000);},cancel(){su=null;},pause(){},resume(){},addEventListener(){}};
const el=()=>({style:{},children:[],classList:{add(){},remove(){},toggle(){}},querySelector:()=>({}),appendChild(){},setAttribute(){},isConnected:true});
const sb={localStorage:{getItem:()=>null,setItem(){}},speechSynthesis:ss,SpeechSynthesisUtterance:function(t){this.text=t;},Audio,TextEncoder,performance:{now:()=>clock*1000},setTimeout:setT,clearTimeout:t=>{if(t)t.dead=true;},setInterval:f=>{sb.__iv=f;},addEventListener(){},
 document:{hidden:false,getElementById:()=>null,createElement:el,head:el(),body:el(),querySelector:()=>null},toast(){},Math,JSON,String,Array,Set,Map,Object,Number,RegExp,Promise,Int32Array,Uint8Array};
sb.window=sb;sb.__STORYWORLD_PLAY_R169__={collect(){}};vm.createContext(sb);
vm.runInContext(CS('voice-r381-data.js'),sb);vm.runInContext(CS('voice-r381.js'),sb);const V=sb.__STORYWORLD_VOICE_R381__;
const probes=['가','héllo 漢字 😀 “따옴표”','x'.repeat(130),C.prologue.pre.split('\n\n')[0]];
ok(probes.every(t=>V.idOf(t)===sid(t.trim())),'브라우저용 동기 SHA-1 = node crypto');
ok(V.count===D.ids.length&&V.has(D.sample)&&!V.has('정본에 없는 새 문장이다.'),'has: 녹음 있는 문장만 참');
// ── 영화 모드 연결 ──
vm.runInContext(`var started=true,loading=false,modal=false,guide=true,auto=true,guideTimer=0,storyScene=null,storyQueue=[],storyDone=null,settings={voice:.6},
 room={id:'dist00',enemies:[{hp:10}]},regionById={dist00:{title:'x'}};
 function stopVoice(){}function advanceScene(){storyScene=storyQueue.shift()||null;if(!storyScene){const d=storyDone;storyDone=null;if(d)d();}}
 function playScenes(sc,done){storyQueue=sc.slice();storyDone=done||null;storyScene=null;advanceScene();}
 async function enterRegion(){return true;}function showSettings(){}`,sb);
vm.runInContext(CS('cinema-mode-r370.js'),sb);const api=sb.__STORYWORLD_CINEMA_MODE_R370__;api.set({on:true});
const tickIv=s=>{for(let i=0;i<s;i++){run(1);sb.__iv&&sb.__iv();}};
ok(/^R370-cinema-[34]$/.test(api.inspect().revision),'영화 모드 rev 3 이상');
const scene=sentences(C.prologue.pre).slice(0,4);const fresh='정본에 없는 새 문장이다.';
failSrc=sid(scene[2]);
vm.runInContext(`playScenes([{key:'prologue.pre',id:'dist00',title:'t',text:${JSON.stringify(scene.slice(0,3).join(' ')+' '+fresh)}}],null)`,sb);
tickIv(120);const st=api.inspect().stats;
const playedIds=audios.filter(a=>a.duration===3).map(a=>a.src.replace(/^.*\//,'').replace('.mp3',''));
ok(playedIds.includes(sid(scene[0]))&&audios.every(a=>!a.src||a.src.startsWith('assets/r381/voice/')),'녹음 있는 문장은 assets/r381/voice/<id>.mp3 재생',playedIds);
ok(!spoken.includes(scene[0])&&!spoken.includes(scene[1])||!playedIds.includes(sid(scene[1])),'녹음으로 튼 문장은 브라우저 음성으로 겹쳐 읽지 않음',spoken);
ok(spoken.includes(fresh),'녹음 없는 문장은 브라우저 음성',spoken);
ok(spoken.includes(scene[2])&&st.recordFail>=1,'녹음 못 받으면(오류) 같은 문장을 브라우저 음성으로',{spoken,st});
ok(st.recorded>=1&&audios.filter(a=>a.duration===3).every(a=>Math.abs(a.volume-.6)<1e-9&&a.playbackRate>=.85&&a.playbackRate<=1.2),'설정 음량·재생 속도(0.85~1.2) 적용',st);
// 끊김(8초 넘게 시작 못 함) → 브라우저 음성
failSrc=null;stallSrc=sid(scene[3]);const before=spoken.length;
vm.runInContext(`playScenes([{key:'prologue.pre2',id:'dist00',title:'t',text:${JSON.stringify(scene[3])}}],null)`,sb);tickIv(30);
ok(spoken.slice(before).includes(scene[3]),'녹음 받기가 멈추면 8초 뒤 브라우저 음성으로',spoken.slice(before));
// 끄기 → 재생 중 녹음 멈춤
stallSrc=null;vm.runInContext(`playScenes([{key:'prologue.pre3',id:'dist00',title:'t',text:${JSON.stringify(scene[0])}}],null)`,sb);run(.5);
const live=audios.filter(a=>!a.paused&&a.src);api.set({on:false});ok(live.length===1&&live[0].src===''&&live[0].paused,'영화 모드 끄면 녹음도 멈춤',live.map(a=>a.src));
// 목소리 없이 자막만 → 녹음도 틀지 않음
api.set({on:true,voice:'none'});const na=audios.length,ns=spoken.length;vm.runInContext(`playScenes([{key:'prologue.pre4',id:'dist00',title:'t',text:${JSON.stringify(scene[1])}}],null)`,sb);tickIv(20);
ok(audios.length===na&&spoken.length===ns,"'목소리 없이 자막만'이면 녹음·브라우저 음성 모두 없음");
api.set({voice:''});const r=api.preview();ok(r==='녹음 음성(Sohee)'&&audios[audios.length-1].src.endsWith(sid(D.sample)+'.mp3'),'시험 듣기는 녹음 음성',r);
console.log(JSON.stringify({total:n,failed:bad}));process.exit(bad?1:0);
