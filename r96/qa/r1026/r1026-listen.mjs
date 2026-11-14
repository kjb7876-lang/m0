// R1026 들어 볼 전후 파일 만들기(헤드리스 실제 엔진 출력을 그대로 녹음, 사람 귀로 고른 것 아님).
// 사용: SW_URL=http://127.0.0.1:4410/m0/ OUT=/mnt/project-files/sfx-r1026 node r96/qa/r1026/r1026-listen.mjs
//  → OUT/<이름>-전.wav·-후.wav (R1026 끔/켬, R993 은 둘 다 켬). mp3 변환은 ffmpeg 로 따로.
import {chromium,boot} from '../r444/lib.mjs';
import fs from 'fs';import path from 'path';
const OUT=process.env.OUT||'.';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
async function rec(on){const {p,ctx}=await boot(b,{vp:{width:640,height:360},init:on?{}:{'storyworld.r1026.sfx':'0'}});
 const r=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;modal=null;await wait(1200);
  const ac=audioContext,sr=ac.sampleRate,sp=ac.createScriptProcessor(4096,2,1),chunks=[];let cap=false;sp.onaudioprocess=ev=>{if(cap){const a=ev.inputBuffer.getChannelData(0),c=ev.inputBuffer.getChannelData(1);const m=new Float32Array(a.length);for(let i=0;i<a.length;i++)m[i]=(a[i]+c[i])/2;chunks.push(Array.from(m));}ev.outputBuffer.getChannelData(0).fill(0);};
  compressor.connect(sp);sp.connect(ac.destination);
  const kinds=['r955Die_ghoul','r955Die_spider','r955Die_glass','r541Death','r955Die_boneguard','r955Die_cultist','r955Hit_spider','r955Hit_glass','r955Atk_boneguard','r955Atk_ghoul','r785Hit_hwando','enemyHit','r546Atk_hwando','r544Hurt_hwando','r544Hurt_slayer'].filter(k=>soundProfiles[k]?.length);
  await Promise.all(kinds.flatMap(k=>soundProfiles[k].map(r=>Promise.resolve(audioBuffer(r.path)).catch(()=>null))));
  const segs={};
  async function seg(name,fn,ms){chunks.length=0;cap=true;await fn();await wait(ms);cap=false;await wait(100);segs[name]=chunks.flat();}
  // 1) 몹 사망 3종(조용한 곳에서 하나씩)
  await seg('몹사망-단독',async()=>{modal=true;for(const k of ['r955Die_ghoul','r955Die_spider','r541Death']){sfxCooldown.clear();sound(k,true);await wait(1300);}},200);
  // 2) 영웅 평타 → 적중음 → 몹 피격(한 대 때릴 때 겹치는 세 겹)
  await seg('타격-적중-몹피격',async()=>{modal=true;for(let i=0;i<4;i++){sfxCooldown.clear();sound('r546Atk_hwando',true);await wait(70);sound('r785Hit_hwando',true);await wait(30);sound('r955Hit_'+(i%2?'glass':'spider'),true);await wait(520);}},400);
  // 3) 전투 폭주(게임 소리도 섞임): 몹 소리 60번 + 처치 12번 + 영웅 평타 6·피격 2
  await seg('전투폭주',async()=>{modal=null;sfxCooldown.clear();const mob=['r955Hit_spider','r955Atk_boneguard','r955Hit_glass','r955Atk_ghoul'],DIE=['r955Die_ghoul','r955Die_spider','r955Die_glass','r541Death','r955Die_boneguard','r955Die_cultist'];
   for(let i=0;i<60;i++)setTimeout(()=>{try{sound(mob[i%mob.length]);}catch(_){}},i*5);
   for(let i=0;i<12;i++)setTimeout(()=>{try{const k=DIE[i%DIE.length];sfxCooldown.delete(k);sound(k);}catch(_){}},20+i*90);
   for(let i=0;i<6;i++)setTimeout(()=>{try{sfxCooldown.delete('attack');sfxCooldown.delete('r546Atk_hwando');sound('r546Atk_hwando');}catch(_){}},50+i*200);
   setTimeout(()=>{try{sound('r544Hurt_hwando');}catch(_){}},310);setTimeout(()=>{try{sfxCooldown.delete('hurt');sound('r544Hurt_slayer');}catch(_){}},710);},2600);
  return {sr,segs};});
 await ctx.close();return r;}
function wav(file,x,sr){const n=x.length,buf=Buffer.alloc(44+n*2);buf.write('RIFF',0);buf.writeUInt32LE(36+n*2,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(sr,24);buf.writeUInt32LE(sr*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(n*2,40);
 for(let i=0;i<n;i++){const v=Math.max(-1,Math.min(1,Number.isFinite(x[i])?x[i]:0));buf.writeInt16LE(Math.round(v*32767),44+i*2);}fs.writeFileSync(file,buf);}
for(const [on,tag] of [[false,'전'],[true,'후']]){const r=await rec(on);for(const [name,x] of Object.entries(r.segs)){const f=path.join(OUT,name+'-'+tag+'.wav');wav(f,x,r.sr);console.log(f,(x.length/r.sr).toFixed(2)+'s');}}
await b.close();
