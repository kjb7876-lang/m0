// R993 브라우저 확인(헤드리스, 귀로 듣는 검증 아님): 실제 엔진 출력(마스터 압축기 뒤)을 받아 범주별 실제 음량·폭을 재고,
// 몹 소리 폭주 속에서 영웅 타격음이 빼앗기는지, 잘림 고친 파생본 3개가 쓰이는지 R993 끈 상태와 켠 상태를 비교한다.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r993/r993-browser.mjs   (끝나면 r96/qa/r993/browser-results.json)
import {chromium,boot} from '../r444/lib.mjs';
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
const T=JSON.parse(fs.readFileSync(path.join(HERE,'sfx-table.json'),'utf8'));
// 범주마다 서로 다른 종류 최대 5개(표 순서대로 고르게) + 파생본 3개 종류
const SAMPLE={'타격':['r546Atk_hwando','r546Atk_slayer','r546Atk_neon','r787Atk_hunter','swMetal'],'적피격':['r785Hit_hwando','r785Hit_gunner','r785HitBig_slayer','r785Kill','r785Hit_michaela'],
 '영웅피격':['r544Hurt_hwando','r544Hurt_slayer','r544Hurt_neon','hurt','swShield'],'스킬':['r787Sk_hwando_w','r787Sk_neon_r','r546Sp_lauren','r546Ego','rc141TimeAwakening5'],
 '투사체':['r546EnemyShot','swEnemyEnergy','swEnemyHeavy','swEnemyDark'],'보스':['r788BAtk_root','r788BDie_balrog','r788BHit_lucifer','r789MAtk_'+'*','r761BossRain','boss'],
 '일반몹':['r955Hit_spider','r955Die_ghoul','r955Atk_boneguard','r954Hit_*','r543Growl'],'패시브·회복':['swHeal'],'UI·보상':['r544Click','r546Clear','r546Upgrade','pickup','r541Door'],'환경':['r543Thunder']};
const kinds=Object.keys(T.kinds);const pick=k=>k.endsWith('*')?kinds.find(x=>x.startsWith(k.slice(0,-1))):k;
const LIST=Object.entries(SAMPLE).flatMap(([c,a])=>a.map(pick).filter(k=>k&&T.kinds[k]).map(k=>({cat:c,kind:k})));
const errs=[];const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
async function run(on){
 const {p,ctx}=await boot(b,{vp:{width:640,height:360},init:on?{}:{'storyworld.r993.sfx':'0'}});p.on('pageerror',e=>errs.push((on?'on ':'off ')+String(e).slice(0,160)));
 const res=await p.evaluate(async({LIST})=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;modal=null;await wait(1500);
  const X=window.__STORYWORLD_SFX_MIX_R993__||null;
  // 마스터 압축기 뒤를 받아 적는다(출력은 0 으로 내보내 다른 소리에 영향 없음)
  const ac=audioContext,sr=ac.sampleRate,sp=ac.createScriptProcessor(2048,2,1),chunks=[];sp.onaudioprocess=ev=>{const a=ev.inputBuffer.getChannelData(0),c=ev.inputBuffer.numberOfChannels>1?ev.inputBuffer.getChannelData(1):a,m=new Float32Array(a.length);for(let i=0;i<a.length;i++)m[i]=(a[i]+c[i])/2;chunks.push({t:ev.playbackTime,d:Array.from(m)});ev.outputBuffer.getChannelData(0).fill(0);};
  compressor.connect(sp);sp.connect(ac.destination);
  // 디코딩 미리(첫 재생이 내려받기로 빠지지 않게)
  await Promise.all(LIST.flatMap(x=>(soundProfiles[x.kind]||[]).map(r=>Promise.resolve(audioBuffer(r.path)).catch(()=>null))));
  const plays=[];for(const x of LIST){sfxCooldown.clear();const t=ac.currentTime;try{sound(x.kind,true);}catch(_){}plays.push({...x,t,path:(soundProfiles[x.kind]||[])[0]?.path||null});await wait(1350);}
  await wait(500);sp.disconnect();compressor.disconnect(sp);
  const prof=k=>(soundProfiles[k]||[]).map(r=>r.path);
  const derived={rc141TimeAwakening5:prof('rc141TimeAwakening5'),boss:prof('boss'),r761BossRain:prof('r761BossRain')};
  const dec=await Promise.all(Object.values(derived).flat().filter(p=>/r993/.test(p)).map(async p=>{try{const bf=await audioBuffer(p);return bf?bf.duration:0;}catch(_){return 0;}}));
  // 폭주: 몹 피격·사망·공격 소리 60번을 300ms 에, 영웅 평타 6번, 영웅 피격 2번. sfxLive 를 10ms 마다 본다.
  const watch={total:0,low:0,heroStolen:0,heroStarted:0,seen:new Map()};const heroRe=/^(r546Atk_|r544Hurt_|hurt$)/,lowRe=/^(r955|r954|r543|r541Death|r544(Hit|Death)_)/;
  const iv=setInterval(()=>{const live=sfxLive.filter(v=>!v.stopping);watch.total=Math.max(watch.total,live.length);watch.low=Math.max(watch.low,live.filter(v=>lowRe.test(v.kind)).length);
   for(const v of sfxLive){if(!watch.seen.has(v)){watch.seen.set(v,{at:ac.currentTime,dur:v.source?.buffer?.duration||0,hero:heroRe.test(v.kind)});if(heroRe.test(v.kind))watch.heroStarted++;}
    const s=watch.seen.get(v);if(v.stopping&&s.hero&&!s.counted&&ac.currentTime-s.at<Math.min(.3,s.dur-.06)){s.counted=true;watch.heroStolen++;}}},10);
  sfxCooldown.clear();const mob=['r955Hit_spider','r955Die_ghoul','r955Atk_boneguard','r955Hit_glass','r955Die_spider','r955Atk_ghoul'];
  for(let i=0;i<60;i++)setTimeout(()=>{try{sound(mob[i%mob.length]);}catch(_){}},i*5);
  for(let i=0;i<6;i++)setTimeout(()=>{try{sfxCooldown.delete('attack');sound('r546Atk_hwando');}catch(_){}},20+i*210);
  setTimeout(()=>{try{sound('r544Hurt_hwando');}catch(_){}},150);setTimeout(()=>{try{sfxCooldown.delete('hurt');sound('r544Hurt_slayer');}catch(_){}},700);
  await wait(2200);clearInterval(iv);
  const audit=X?X.inspect().audit.filter(a=>a.kind==='start'):[];
  const targets=X?Object.fromEntries(LIST.map(x=>[x.kind,X.category(x.kind)?.target??null])):null;
  return {targets,sr,chunks,plays,derived,dec,watch:{total:watch.total,low:watch.low,heroStolen:watch.heroStolen,heroStarted:watch.heroStarted},audit,stats:X?X.inspect().stats:null,comfort:window.__STORYWORLD_SFX_COMFORT__.inspect().stats};},{LIST});
 await ctx.close();return res;}
// K 가중(BS.1770, 표본률에 맞춘 이중 2차 필터) 400ms 순간 최대
function kw(x,fs){// 두 단 연결
 const bq=(sig,b,a)=>{let x1=0,x2=0,y1=0,y2=0;const y=new Float64Array(sig.length);for(let i=0;i<sig.length;i++){const v=b[0]*sig[i]+b[1]*x1+b[2]*x2-a[1]*y1-a[2]*y2;x2=x1;x1=sig[i];y2=y1;y1=v;y[i]=v;}return y;};
 let f0=1681.974450955533,G=3.999843853973347,Q=.7071752369554196,K=Math.tan(Math.PI*f0/fs),Vh=Math.pow(10,G/20),Vb=Math.pow(Vh,.4996667741545416),a0=1+K/Q+K*K;
 const y1=bq(x,[(Vh+Vb*K/Q+K*K)/a0,2*(K*K-Vh)/a0,(Vh-Vb*K/Q+K*K)/a0],[1,2*(K*K-1)/a0,(1-K/Q+K*K)/a0]);
 f0=38.13547087602444;Q=.5003270373238773;K=Math.tan(Math.PI*f0/fs);const d=1+K/Q+K*K;return bq(y1,[1,-2,1],[1,2*(K*K-1)/d,(1-K/Q+K*K)/d]);}
function loudAt(r,t0,len=1.25){const fs=r.sr,parts=r.chunks.filter(c=>c.t+c.d.length/fs>t0&&c.t<t0+len);if(!parts.length)return null;const x=[];for(const c of parts)for(let i=0;i<c.d.length;i++){const t=c.t+i/fs;if(t>=t0&&t<t0+len)x.push(c.d[i]);}
 const y=kw(x,fs),w=Math.round(.4*fs),h=Math.round(.1*fs);let best=0;for(let i=0;i+w<=y.length;i+=h){let s=0;for(let j=i;j<i+w;j++)s+=y[j]*y[j];best=Math.max(best,s/w);}return best>1e-12?10*Math.log10(best)-.691:null;}
const pct=(a,q)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(q*s.length))];};
const off=await run(false),on=await run(true);
const table=[];for(const r of [off,on])for(const pl of r.plays)pl.lufs=loudAt(r,pl.t);
const TG=on.targets||{};for(let i=0;i<on.plays.length;i++){const k=on.plays[i].kind,tg=TG[k];table.push({cat:on.plays[i].cat,kind:k,target:tg,before:off.plays[i].lufs,after:on.plays[i].lufs,devBefore:Number.isFinite(tg)&&Number.isFinite(off.plays[i].lufs)?off.plays[i].lufs-tg:null,devAfter:Number.isFinite(tg)&&Number.isFinite(on.plays[i].lufs)?on.plays[i].lufs-tg:null});}
const cats=[...new Set(table.map(r=>r.cat))],summary={};
for(const c of cats){const rs=table.filter(r=>r.cat===c),bv=rs.map(r=>r.before).filter(Number.isFinite),av=rs.map(r=>r.after).filter(Number.isFinite);
 const db=rs.map(r=>r.devBefore).filter(Number.isFinite),da=rs.map(r=>r.devAfter).filter(Number.isFinite);
 summary[c]={n:rs.length,devSpreadBefore:db.length?+(Math.max(...db)-Math.min(...db)).toFixed(1):null,devSpreadAfter:da.length?+(Math.max(...da)-Math.min(...da)).toFixed(1):null,beforeMed:+pct(bv,.5)?.toFixed(1),beforeSpread:bv.length?+(Math.max(...bv)-Math.min(...bv)).toFixed(1):null,afterMed:+pct(av,.5)?.toFixed(1),afterSpread:av.length?+(Math.max(...av)-Math.min(...av)).toFixed(1):null,silentAfter:rs.length-av.length};}
console.log(JSON.stringify(summary,null,1));
const targetsOn=(on.stats&&on.stats.targets)||{};
ok(table.every(r=>Number.isFinite(r.after)),'켠 상태에서 고른 '+table.length+'종류 모두 실제 출력에 소리 있음('+table.filter(r=>!Number.isFinite(r.after)).map(r=>r.kind)+')');
for(const c of cats){const s=summary[c];if(s.n<2)continue;ok(Number.isFinite(s.devSpreadAfter)&&s.devSpreadAfter<=6,c+': 실제 출력에서 쓰임별 목표와의 차이 폭 '+s.devSpreadBefore+' → '+s.devSpreadAfter+'dB (≤6, 원래 음량 폭 '+s.beforeSpread+' → '+s.afterSpread+')');}
const m=c=>summary[c]?.afterMed;ok(m('영웅피격')>m('일반몹')+4&&m('타격')>m('일반몹')+3&&m('타격')>m('투사체'),'실제 출력 위계: 영웅 피격·타격 > 몹 층·투사체');
const fixed=['rc141TimeAwakening5','boss','r761BossRain'];
ok(fixed.every(k=>(on.derived[k]||[]).some(p=>/assets\/r993\/sfx\//.test(p)))&&on.dec.length>=3&&on.dec.every(d=>d>.4),'잘림 고친 파생본 3개 연결·해독('+on.dec.map(d=>d.toFixed(2))+')');
ok(fixed.every(k=>!(off.derived[k]||[]).some(p=>/r993/.test(p))),'끈 상태는 원래 파일(되돌리기 가능)');
console.log('폭주 off',JSON.stringify(off.watch),'on',JSON.stringify(on.watch));
ok(on.watch.heroStolen===0&&on.watch.heroStarted>=6,'폭주 속 영웅 타격·피격 어택(첫 0.3초) 빼앗김 0 (전 '+off.watch.heroStolen+', 시작 '+on.watch.heroStarted+')');
ok(on.watch.low<=2&&on.watch.total<=4,'폭주 속 몹 층 동시 ≤2·전체 ≤4 (전 몹 '+off.watch.low+'·전체 '+off.watch.total+' → '+on.watch.low+'·'+on.watch.total+')');
const au=on.audit;ok(au.length>=20&&au.every(a=>Number.isFinite(a.rate)&&a.rate>.9&&a.rate<1.1&&Number.isFinite(a.trimDb)&&Math.abs(a.trimDb)<=18),'실제 재생 '+au.length+'건 변주·trim 유한·범위 안');
ok(new Set(au.filter(a=>/^r955/.test(a.kindName)).map(a=>a.rate.toFixed(4))).size>=3,'몹 소리 음높이가 매번 조금씩 다름');
ok(!errs.length,'페이지 오류 0 '+errs.slice(0,2));
fs.writeFileSync(path.join(HERE,'browser-results.json'),JSON.stringify({at:new Date().toISOString(),url:process.env.SW_URL||null,summary,table,watch:{off:off.watch,on:on.watch},targets:targetsOn,comfort:{off:off.comfort,on:on.comfort}},null,1));
console.log(`\nR993 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
