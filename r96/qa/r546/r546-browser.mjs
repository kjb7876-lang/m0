// R546 브라우저 확인(헤드리스, 소리를 직접 듣는 검증은 아님): 영웅마다 실제 sound('attack'|'special') 가 새 소리 파일로 재생되는지, 공용 소리·쓰러짐·창·이동, 해독 오류 0.
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,'dist00');
const r=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),C=window.__STORYWORLD_SFX_COMFORT__,A=window.__STORYWORLD_SFX_R541__;try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=.8;
 const plays=()=>C.inspect().audit.filter(x=>x.kind==='play');const out={heroes:{},common:{}};const hero0=player.hero;
 async function one(kind,allow){const before=new Set(plays().map(x=>x.id));for(let i=0;i<3;i++){try{sound(kind,allow);}catch(_){}await wait(700);const got=plays().filter(x=>!before.has(x.id));if(got.length)return got.map(x=>({role:x.role,file:x.path.split('/').pop(),level:+x.level.toFixed(3)}));}return [];}
 for(const h of ['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner']){player.hero=h;out.heroes[h]={attack:await one('attack'),special:await one('special')};}
 player.hero=hero0;for(const k of ['blink','dodge','parry','ego','awake','clear','upgrade','swEnemyDark'])out.common[k]=await one(k);
 const before=new Set(plays().map(x=>x.id));await wait(700);openPanel('<p>r546</p>');await wait(900);closePanel(true);out.open=plays().filter(x=>!before.has(x.id)).map(x=>x.path.split('/').pop());
 const i=A.inspect();out.rev=A.revision;out.r546=i.r546;out.errors=i.stats.errors;out.stats=i.stats;out.fallback=C.inspect().stats.conditioningFallback;
 out.decoded=await Promise.all(Object.entries(soundProfiles).filter(([k])=>/^r546/.test(k)).flatMap(([k,v])=>v.map(async row=>{try{const b=await audioBuffer(row.path);return [row.path.split('/').pop(),b?+b.duration.toFixed(2):0];}catch(e){return [row.path,0];}})));
 return out;});
console.log(JSON.stringify(r).slice(0,3000));
ok(r.rev==='R546'&&r.r546.on,'R546 켜짐');
for(const [h,v] of Object.entries(r.heroes)){ok(h==='hunter'?/bow-1/.test(v.attack[0]?.file||''):new RegExp('^atk-'+h+'-[12]\\.ogg$').test(v.attack[0]?.file||''),h+' 공격 → '+(v.attack[0]?.file||'없음')+'@'+(v.attack[0]?.level||0));ok(new RegExp('^sp-'+h+'-[12]\\.ogg$').test(v.special[0]?.file||''),h+' 고유기 → '+(v.special[0]?.file||'없음')+'@'+(v.special[0]?.level||0));}
for(const [k,w] of [['blink','blink-'],['dodge','dodge-1'],['parry','parry-'],['ego','ego-1'],['awake','awake-1'],['clear','clear-'],['upgrade','upgrade-1'],['swEnemyDark','eshot-']])ok((r.common[k][0]?.file||'').startsWith(w),k+' → '+(r.common[k][0]?.file||'없음')+'@'+(r.common[k][0]?.level||0));
ok(r.open.includes('open-1.ogg'),'창 열기 → open-1.ogg');
ok(r.decoded.length===45&&r.decoded.every(d=>d[1]>0),'45개 모두 해독됨');ok(r.errors===0&&r.fallback===0,'오버레이 오류 0·조절 실패 0');ok(errs.length===0,'페이지 오류 0');
console.log('\nR546 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
