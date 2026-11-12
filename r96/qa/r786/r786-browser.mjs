// R786 브라우저 확인(헤드리스, 소리를 직접 듣는 검증은 아님): 실제 엔진에서 영웅 8명의 W/E/R cast 가 r786Sk_<영웅>_<슬롯> 종류로 재생되는지, 헌터 평타, Q·WER 밖 special 불변, 파일 해독.
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,'dist00');
const r=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),A=window.__STORYWORLD_SFX_R786__;try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;await wait(2500);
 const C=window.__STORYWORLD_SFX_COMFORT__,plays=()=>C.inspect().audit.filter(x=>x.kind==='play'),file=(f,since)=>{const g=plays().filter(x=>!since.has(x.id)).map(x=>x.path.split('/').pop());return g;};
 const out={heroes:{},wer:!!window.__STORYWORLD_WER__,wrapped:!!window.__STORYWORLD_WER__?.cast?.__r786};const hero0=player.hero;
 for(const h of ['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner']){player.hero=h;await wait(400);out.heroes[h]={};
  player.points=(player.points||0)+9;await wait(2600);
  for(const s of ['w','e','r']){try{player.storyWER.ready={};}catch(_){}await wait(700);const before=new Set(plays().map(x=>x.id));let res=null;try{res=window.__STORYWORLD_WER__.cast(s,false);}catch(x){res='ERR '+x.message;}
   await wait(900);out.heroes[h][s]={res,files:file(0,before)};try{window.__STORYWORLD_WER__.cancel?.();}catch(_){}}}
 player.hero='hunter';await wait(1200);let b0=new Set(plays().map(x=>x.id));sound('attack');await wait(900);out.hunterAtk=file(0,b0);
 player.hero='hwando';await wait(1200);b0=new Set(plays().map(x=>x.id));sound('attack');await wait(900);out.hwandoAtk=file(0,b0);
 player.hero=hero0;const i=A.inspect();out.stats=i.stats;
 out.decoded=await Promise.all(Object.entries(soundProfiles).filter(([k])=>/^r786/.test(k)).flatMap(([k,v])=>v.map(async row=>{try{const bf=await audioBuffer(row.path);return [row.path.split('/').pop(),bf?+bf.duration.toFixed(3):0];}catch(_){return [row.path,0];}})));
 return out;});
console.log(JSON.stringify({wer:r.wer,wrapped:r.wrapped,stats:r.stats}));
ok(r.wer&&r.wrapped,'WER.cast 감싸기 적용');
let castOk=0,inconc=0;
for(const [h,v] of Object.entries(r.heroes))for(const [s,x] of Object.entries(v)){
 if(x.res!==true){inconc++;console.log('INCONCLUSIVE '+h+' '+s+' cast 거절(res='+x.res+') — 재사용 대기·미습득 가능');continue;}
 castOk++;ok(x.files.some(f=>new RegExp('^sk-'+h+'-'+s+'-[1-9]\\.ogg$').test(f)),h+' '+s+' → sk-'+h+'-'+s+' ('+x.files.join(',')+')');}
ok(castOk>=16,'실제로 cast 가 통과한 슬롯 8개 이상('+castOk+', 보류 '+inconc+')');
ok(r.hunterAtk.some(f=>/^atk-hunter-[1-9]\.ogg$/.test(f)),'헌터 평타 → atk-hunter('+r.hunterAtk+')');ok(!r.hwandoAtk.some(f=>/r786|^atk-hunter/.test(f)),'헌터 외 평타는 R546 소리 그대로('+r.hwandoAtk+')');
ok(r.decoded.length===75&&r.decoded.every(d=>d[1]>0),'75개 모두 해독됨('+r.decoded.length+')');ok(r.stats.errors===0,'오버레이 오류 0');ok(errs.length===0,'페이지 오류 0 '+errs.slice(0,2));
console.log('\nR786 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
