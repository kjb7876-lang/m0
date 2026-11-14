// R1026 브라우저 확인(헤드리스, 귀로 듣는 검증 아님): R993 은 켠 채로 R1026 끈 상태와 켠 상태를 비교한다.
//  ① 따로 재생: 몹 사망·몹 피격·적중음·보스 피격·영웅 타격·영웅 피격을 하나씩 내고 마스터 압축기 뒤 실제 출력의 K 가중 순간 최대와 소리 끝 뒤 꼬리 에너지를 잰다.
//  ② 폭주: 몹 소리 60번(300ms) + 처치 12번(.09초 간격) + 영웅 평타 6·피격 2. 실제로 시작한 사망음 수, 영웅 어택 빼앗김, 동시 수.
//  ③ 페이지 오류·R993/R1026 내부 오류 0.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1026/r1026-browser.mjs   (끝나면 r96/qa/r1026/browser-results.json)
import {chromium,boot} from '../r444/lib.mjs';
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
const SOLO=[['몹사망','r955Die_ghoul'],['몹사망','r955Die_spider'],['몹사망','r541Death'],['몹피격','r955Hit_spider'],['몹피격','r955Hit_glass'],['적중음','r785Hit_hwando'],['적중음','enemyHit'],['보스피격','r788BHit_root'],['영웅타격','r546Atk_hwando'],['영웅피격','r544Hurt_hwando']];
const errs=[];const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
async function run(on){
 const {p,ctx}=await boot(b,{vp:{width:640,height:360},init:on?{}:{'storyworld.r1026.sfx':'0'}});p.on('pageerror',e=>errs.push((on?'on ':'off ')+String(e).slice(0,160)));
 const res=await p.evaluate(async({SOLO})=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;modal=null;await wait(1500);
  const ac=audioContext,sr=ac.sampleRate,sp=ac.createScriptProcessor(2048,2,1),chunks=[];sp.onaudioprocess=ev=>{const a=ev.inputBuffer.getChannelData(0),c=ev.inputBuffer.numberOfChannels>1?ev.inputBuffer.getChannelData(1):a,m=new Float32Array(a.length);for(let i=0;i<a.length;i++)m[i]=(a[i]+c[i])/2;chunks.push({t:ev.playbackTime,d:Array.from(m)});ev.outputBuffer.getChannelData(0).fill(0);};
  masterGain.connect(sp);sp.connect(ac.destination);
  const dieRe=/^(r955Die_|r954Die_|r541Death$)/;const DIE=['r955Die_ghoul','r955Die_spider','r955Die_glass','r541Death','r955Die_boneguard','r955Die_cultist'];
  const kinds=[...new Set([...SOLO.map(x=>x[1]),...DIE,'r955Hit_spider','r955Atk_boneguard','r955Hit_glass','r955Atk_ghoul','r546Atk_hwando','r544Hurt_hwando','r544Hurt_slayer'])].filter(k=>soundProfiles[k]?.length);
  await Promise.all(kinds.flatMap(k=>soundProfiles[k].map(r=>Promise.resolve(audioBuffer(r.path)).catch(()=>null))));
  // 따로 재생 동안은 modal=true 로 게임 쪽 소리(실제 몹 공격 등)를 막고 시험 소리만 allowModal 로 낸다(꼬리 측정에 다른 소리가 섞이지 않게)
  modal=true;const plays=[];for(let rep=0;rep<3;rep++)for(const [cat,kind] of SOLO){if(!soundProfiles[kind]?.length){plays.push({cat,kind,rep,missing:true});continue;}sfxCooldown.clear();const n0=sfxLive.length;const t=ac.currentTime;try{sound(kind,true);}catch(_){}await wait(60);
   const v=sfxLive[sfxLive.length-1],au=(window.__STORYWORLD_SFX_MIX_R993__?.inspect().audit||[]).filter(x=>x.kind==='start'&&x.kindName===kind).pop();
   plays.push({cat,kind,rep,t,at:au?au.at:null,dur:v&&v.kind===kind?v.source.buffer.duration/(v.source.playbackRate?.value||1):null,started:sfxLive.length>n0});await wait(1400);}
  await wait(400);modal=null;
  // 폭주
  const watch={total:0,deathPeak:0,deathStarted:0,heroStolen:0,heroStarted:0,seen:new Map()};const heroRe=/^(r546Atk_|r544Hurt_|hurt$)/;
  const iv=setInterval(()=>{const live=sfxLive.filter(v=>!v.stopping);watch.total=Math.max(watch.total,live.length);watch.deathPeak=Math.max(watch.deathPeak,live.filter(v=>dieRe.test(v.kind)).length);
   for(const v of sfxLive){if(!watch.seen.has(v)){watch.seen.set(v,{at:ac.currentTime,dur:v.source?.buffer?.duration||0,hero:heroRe.test(v.kind)});if(heroRe.test(v.kind))watch.heroStarted++;if(dieRe.test(v.kind))watch.deathStarted++;}
    const s=watch.seen.get(v);if(v.stopping&&s.hero&&!s.counted&&ac.currentTime-s.at<Math.min(.3,s.dur-.06)){s.counted=true;watch.heroStolen++;}}},10);
  sfxCooldown.clear();const mob=['r955Hit_spider','r955Atk_boneguard','r955Hit_glass','r955Atk_ghoul'];
  for(let i=0;i<60;i++)setTimeout(()=>{try{sound(mob[i%mob.length]);}catch(_){}},i*5);
  for(let i=0;i<12;i++)setTimeout(()=>{try{const k=DIE[i%DIE.length];sfxCooldown.delete(k);sound(k);}catch(_){}},20+i*90);
  for(let i=0;i<6;i++)setTimeout(()=>{try{sfxCooldown.delete('attack');sfxCooldown.delete('r546Atk_hwando');sound('r546Atk_hwando');}catch(_){}},50+i*200);
  setTimeout(()=>{try{sound('r544Hurt_hwando');}catch(_){}},310);setTimeout(()=>{try{sfxCooldown.delete('hurt');sound('r544Hurt_slayer');}catch(_){}},710);
  await wait(2400);clearInterval(iv);sp.disconnect();masterGain.disconnect(sp);
  const X=window.__STORYWORLD_SFX_MIX_R993__,P=window.__STORYWORLD_SFX_PUNCH_R1026__;
  return {sr,chunks,plays,watch:{total:watch.total,deathPeak:watch.deathPeak,deathStarted:watch.deathStarted,heroStolen:watch.heroStolen,heroStarted:watch.heroStarted},r993:X?X.inspect().stats:null,r1026:P?P.inspect():null};},{SOLO});
 await ctx.close();return res;}
function kw(x,fs){const bq=(sig,b,a)=>{let x1=0,x2=0,y1=0,y2=0;const y=new Float64Array(sig.length);for(let i=0;i<sig.length;i++){const v=b[0]*sig[i]+b[1]*x1+b[2]*x2-a[1]*y1-a[2]*y2;x2=x1;x1=sig[i];y2=y1;y1=v;y[i]=v;}return y;};
 let f0=1681.974450955533,G=3.999843853973347,Q=.7071752369554196,K=Math.tan(Math.PI*f0/fs),Vh=Math.pow(10,G/20),Vb=Math.pow(Vh,.4996667741545416),a0=1+K/Q+K*K;
 const y1=bq(x,[(Vh+Vb*K/Q+K*K)/a0,2*(K*K-Vh)/a0,(Vh-Vb*K/Q+K*K)/a0],[1,2*(K*K-1)/a0,(1-K/Q+K*K)/a0]);
 f0=38.13547087602444;Q=.5003270373238773;K=Math.tan(Math.PI*f0/fs);const d=1+K/Q+K*K;return bq(y1,[1,-2,1],[1,2*(K*K-1)/d,(1-K/Q+K*K)/d]);}
const slice=(r,t0,len)=>{const fs=r.sr,x=[];for(const c of r.chunks){if(c.t+c.d.length/fs<=t0||c.t>=t0+len)continue;for(let i=0;i<c.d.length;i++){const t=c.t+i/fs;if(t>=t0&&t<t0+len)x.push(c.d[i]);}}return x;};
function loud(r,t0,len=1.3){const x=slice(r,t0,len);if(!x.length)return null;const fs=r.sr,y=kw(x,fs),w=Math.round(.4*fs),h=Math.round(.1*fs);let best=0;for(let i=0;i+w<=y.length;i+=h){let s=0;for(let j=i;j<i+w;j++)s+=y[j]*y[j];best=Math.max(best,s/w);}return best>1e-12?10*Math.log10(best)-.691:null;}
// 캡처 시각은 ScriptProcessor 지연만큼 어긋나므로 실제 시작(첫 표본 |x|>.003)을 신호에서 찾아 그 뒤 길이로 꼬리 구간을 잡는다
function onset(r,t){const fs=r.sr,x=slice(r,t-.05,.9);let mx=0;for(const v of x)mx=Math.max(mx,Math.abs(v));if(!(mx>0))return null;for(let i=0;i<x.length;i++)if(Math.abs(x[i])>mx*.05)return t-.05+i/fs;return null;}
// 울림 길이: 시작 앞 .05초부터 1.6초 안에서 20ms RMS 가 문턱(아래) 아래로 마지막으로 떨어지기 전까지(초). 꼬리가 있으면 길어진다.
// 마스터에는 앰비언스 등 바탕 소리도 섞이므로, 시작 앞 .25~.05초 평균 에너지의 3배와 최대−40dB 중 큰 값을 문턱으로 쓴다.
function ring(r,t){const fs=r.sr,x=slice(r,t-.05,1.65),w=Math.round(.02*fs),e=[];for(let i=0;i+w<=x.length;i+=w){let s=0;for(let j=i;j<i+w;j++)s+=x[j]*x[j];e.push(s/w);}if(!e.length)return null;
 const pre=slice(r,t-.25,.2);let fl=0;for(const v of pre)fl+=v*v;fl=pre.length?fl/pre.length:0;
 const mx=Math.max(...e);if(!(mx>0))return null;const th=Math.max(mx*1e-4,fl*3);let first=-1,last=-1;for(let i=0;i<e.length;i++)if(e[i]>th){if(first<0)first=i;last=i;}return first<0?null:+((last-first+1)*.02).toFixed(3);}
function rmsDb(r,t0,len){const x=slice(r,t0,len);if(!x.length)return null;let s=0;for(const v of x)s+=v*v;s/=x.length;return s>1e-14?10*Math.log10(s):-140;}
const off=await run(false),on=await run(true);
const table=[];for(let i=0;i<on.plays.length;i++){const a=off.plays[i],c=on.plays[i];if(c.missing){table.push({cat:c.cat,kind:c.kind,missing:true});continue;}
 const row={cat:c.cat,kind:c.kind,off:loud(off,a.t),on:loud(on,c.t)};row.delta=Number.isFinite(row.off)&&Number.isFinite(row.on)?+(row.on-row.off).toFixed(2):null;
 if(/^(r955Die_|r541Death)/.test(c.kind)&&c.dur&&a.dur&&Number.isFinite(a.at)&&Number.isFinite(c.at)){const oa=onset(off,a.t),oc=onset(on,c.t);if(Number.isFinite(oa)&&Number.isFinite(oc)){row.ringOff=ring(off,a.t);row.ringOn=ring(on,c.t);row.tailOff=rmsDb(off,oa+a.dur+.02,.25);row.tailOn=rmsDb(on,oc+c.dur+.02,.25);}}
 table.push(row);}
{const agg=new Map();for(const r of table){if(r.missing)continue;const a=agg.get(r.kind)||{cat:r.cat,kind:r.kind,off:[],on:[],tailOff:[],tailOn:[],ringOff:[],ringOn:[]};for(const k of ['off','on','tailOff','tailOn','ringOff','ringOn'])if(Number.isFinite(r[k]))a[k].push(r[k]);agg.set(r.kind,a);}
 const md=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null;};table.length=0;
 for(const a of agg.values()){const row={cat:a.cat,kind:a.kind,n:a.on.length,off:md(a.off),on:md(a.on)};row.delta=Number.isFinite(row.off)&&Number.isFinite(row.on)?+(row.on-row.off).toFixed(2):null;if(a.tailOn.length){row.tailOff=+md(a.tailOff).toFixed(1);row.tailOn=+md(a.tailOn).toFixed(1);row.ringOff=md(a.ringOff);row.ringOn=md(a.ringOn);}table.push(row);}}
console.table(table);
const by=c=>table.filter(r=>r.cat===c&&Number.isFinite(r.delta));const med=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:NaN;};
const dm=c=>med(by(c).map(r=>r.delta)),om=c=>med(by(c).map(r=>r.on));
ok(table.length>=9&&table.every(r=>Number.isFinite(r.on)&&r.n===3),'켠 상태에서 고른 '+table.length+'종류 ×3번 모두 실제 출력에 소리 있음');
ok(dm('몹사망')>=2.5,'몹 사망 실제 출력 +'+dm('몹사망').toFixed(1)+'dB (≥2.5)');
ok(dm('몹피격')>=2.5,'몹 피격 실제 출력 +'+dm('몹피격').toFixed(1)+'dB (≥2.5)');
ok(dm('적중음')>=1,'적중음 실제 출력 +'+dm('적중음').toFixed(1)+'dB (≥1)');
// R993 이 소리마다 음량을 ±0.8~1dB 흔든다 → 3번 중앙값끼리 ±1.5dB 안이면 그대로로 본다
ok(Math.abs(dm('영웅타격'))<=1.5&&Math.abs(dm('영웅피격'))<=1.5,'영웅 타격·피격은 그대로(3번 중앙값 ±1.5dB: '+dm('영웅타격').toFixed(2)+', '+dm('영웅피격').toFixed(2)+')');
ok(om('영웅피격')>om('몹사망'),'실제 출력 위계: 영웅 피격('+om('영웅피격')+') > 몹 사망('+om('몹사망')+')');
const tails=table.filter(r=>Number.isFinite(r.tailOn)&&Number.isFinite(r.tailOff));ok(tails.length>=3&&tails.filter(r=>r.tailOn>=r.tailOff+6).length>=2&&tails.every(r=>r.tailOn<r.on-12),'사망음 끝 뒤 .25초 꼬리 에너지: 켠 쪽이 6dB 넘게 큼(3개 중 2개 이상)·본체보다 12dB 넘게 작음 ('+tails.map(r=>r.tailOff+'→'+r.tailOn+'dB').join(', ')+'; 울림 길이 '+tails.map(r=>r.ringOff+'→'+r.ringOn+'s').join(', ')+')');
console.log('폭주 off',JSON.stringify(off.watch),'on',JSON.stringify(on.watch));
ok(on.watch.deathStarted>=6&&on.watch.deathStarted>=off.watch.deathStarted+3,'폭주 속 처치 12번 중 사망음 시작 '+off.watch.deathStarted+' → '+on.watch.deathStarted);
ok(on.watch.heroStarted>=off.watch.heroStarted,'폭주 속 영웅 소리 시작 수 줄지 않음 ('+off.watch.heroStarted+' → '+on.watch.heroStarted+')');
ok(on.watch.heroStolen===0&&on.watch.heroStarted>=6,'폭주 속 영웅 어택 빼앗김 0 (시작 '+on.watch.heroStarted+')');
ok(on.watch.total<=4&&on.watch.deathPeak<=2,'동시 ≤4·사망음 동시 ≤2 ('+on.watch.total+'·'+on.watch.deathPeak+')');
console.log('R1026 통계',JSON.stringify(on.r1026&&on.r1026.stats));
ok(on.r1026&&on.r1026.stats.errors===0&&on.r993&&on.r993.errors===0&&on.r1026.stats.tails>=3&&on.r1026.stats.eq>=5,'R993·R1026 내부 오류 0·꼬리 '+(on.r1026&&on.r1026.stats.tails)+'·EQ '+(on.r1026&&on.r1026.stats.eq));
ok(off.r1026&&off.r1026.on===false&&off.r1026.stats.eq===0,'끈 상태: R1026 아무것도 안 함');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2));
fs.writeFileSync(path.join(HERE,'browser-results.json'),JSON.stringify({at:new Date().toISOString(),url:process.env.SW_URL||null,directListeningVerified:false,table,watch:{off:off.watch,on:on.watch},r1026:on.r1026&&on.r1026.stats,r993:{off:off.r993,on:on.r993}},null,1));
console.log(`\nR1026 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
