// R545 브라우저 확인(헤드리스, 소리를 직접 듣는 검증은 아님): 실제 sound() 재생이 다듬은 버퍼를 쓰는지, 엔진 조절기 캐시가 유지되는지, 서사 음성 경로는 건드리지 않는지.
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,'dist00');
const r=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),C=window.__STORYWORLD_SFX_COMFORT__,A=window.__STORYWORLD_SFX_R541__;try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=.8;
 const kinds=['special','attack','enemyHit','hurt','parry','special','attack','enemyHit','hurt','parry'];for(const k of kinds){try{sound(k);}catch(_){}await wait(450);}
 const st=C.inspect().stats,i=A.inspect(),path=soundProfiles.special[0].path,raw=await (async()=>{const base=buffers.get(cleanPath(path));return base;})(),soft=await audioBuffer(path);
 const low=(buf)=>{const d=buf.getChannelData(0),fs=buf.sampleRate;let lp=0,e=0,t=0;const a=1-Math.exp(-2*Math.PI*150/fs);for(let k=0;k<d.length;k++){lp+=a*(d[k]-lp);e+=lp*lp;t+=d[k]*d[k];}return e/(t||1);};
 return{rev:A.revision,on:A.enabledR545(),r545:i.r545,errors:i.stats.errors,st,sameLen:soft.length===raw.length,differs:soft!==raw,lowRaw:low(raw),lowSoft:low(soft),head:Math.abs(soft.getChannelData(0)[0]),plays:C.inspect().audit.filter(x=>x.kind==='play').length};});
console.log(JSON.stringify(r));
ok(r.rev==='R545'&&r.on,'R545 켜짐');ok(r.plays>=6,'실제 재생 '+r.plays+'번');ok(r.r545.softened>=4&&r.errors===0,'다듬은 버퍼 '+r.r545.softened+'개·오류 0');
ok(r.st.cacheHits>=3,'같은 소리를 다시 낼 때 엔진 조절기 캐시를 씀(cacheHits '+r.st.cacheHits+', conditioned '+r.st.conditioned+')');
ok(r.differs&&r.sameLen&&r.head<1e-4,'고유기 소리: 원본과 다른 버퍼·길이 같음·0 에서 시작');ok(r.lowSoft<r.lowRaw*.5,'고유기 소리 150Hz 아래 비중 절반 아래로('+r.lowRaw.toFixed(3)+' → '+r.lowSoft.toFixed(3)+')');
ok(!r.r545.paths.some(x=>/voice|narr|bgm|music/i.test(x)),'다듬은 경로에 서사 음성·BGM 없음');ok(errs.length===0,'페이지 오류 0');
console.log('\nR545 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
