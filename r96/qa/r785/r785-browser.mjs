// R785 브라우저 확인(헤드리스, 소리를 직접 듣는 검증은 아님): 영웅마다 실제 hitEnemy 가 r785 적중음 파일로 재생되는지, 스킬 적중·처치 마무리·겹침 제한, 파일 해독.
import {chromium,boot,go} from '../r444/lib.mjs';
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};const errs=[];
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e)));
await go(p,'dist00');
const r=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),C=window.__STORYWORLD_SFX_COMFORT__,A=window.__STORYWORLD_SFX_R785__;try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;
 await wait(3500);const plays=()=>C.inspect().audit.filter(x=>x.kind==='play');const out={heroes:{},foes:room.enemies.filter(e=>e.hp>0).length};const hero0=player.hero;
 const foe=()=>{let e=room.enemies.find(x=>x.hp>0&&!x.boss);if(!e)return null;e.hp=e.maxHp=1e6;e.x=player.x+.6;e.y=player.y;e.flash=0;return e;};
 async function strike(v,src,hp){const e=foe();if(!e)return{file:'적 없음'};if(hp)e.hp=hp;const before=new Set(plays().map(x=>x.id));let res=null;for(let t=0;t<4&&!res;t++){try{if(hp)e.hp=hp;res=hitEnemy(e,v,src);}catch(x){return{file:'ERR '+x.message};}if(!res)await wait(400);}
  await wait(1500);const got=plays().filter(x=>!before.has(x.id));const g=got.find(x=>/r785/.test(x.path))||got[0];if(g)return{file:g.path.split('/').pop(),role:g.role,level:+g.level.toFixed(3),res,all:got.map(x=>x.path.split('/').pop())};return{file:null,res};}
 for(const h of ['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner']){player.hero=h;await wait(1500);out.heroes[h]={hit:await strike(1),big:await strike(1,{attackKind9:'skill'}),kill:await strike(5,null,3)};await wait(700);}
 player.hero=hero0;
 const e=foe();let c0=A.inspect().stats.passed;if(e){for(let i=0;i<10;i++)try{hitEnemy(e,1)}catch(_){}}out.burst=A.inspect().stats.passed-c0;
 const i=A.inspect();out.stats=i.stats;out.errors=i.stats.errors;out.fallback=C.inspect().stats.conditioningFallback;
 out.decoded=await Promise.all(Object.entries(soundProfiles).filter(([k])=>/^r785/.test(k)).flatMap(([k,v])=>v.map(async row=>{try{const bf=await audioBuffer(row.path);return [row.path.split('/').pop(),bf?+bf.duration.toFixed(3):0];}catch(_){return [row.path,0];}})));
 return out;});
console.log(JSON.stringify({stats:r.stats,burst:r.burst}));
ok(r.foes>0,'현재 구역에 적이 있음('+r.foes+')');
for(const [h,v] of Object.entries(r.heroes)){if(!v.hit.res)console.log('INCONCLUSIVE '+h+' 첫 타격: 엔진이 피해를 받아주지 않아(hitEnemy=false) 소리 없음이 정상 — 아래 스킬 적중·처치로 같은 영웅 확인');else ok(new RegExp('^hit-'+h+'-[1-4]\\.ogg$').test(v.hit.file||''),h+' 적중 → '+(v.hit.file||'없음'));ok(new RegExp('^hitbig-'+h+'-[12]\\.ogg$').test(v.big.file||''),h+' 스킬 적중 → '+(v.big.file||'없음'));ok(/^kill-[1-5]\.ogg$/.test(v.kill.file||''),h+' 처치 → '+(v.kill.file||'없음'));}
ok(r.burst<=1,'같은 순간 10번 적중해도 새 타격음 '+r.burst+'번');
ok(r.decoded.length===53&&r.decoded.every(d=>d[1]>0),'53개 모두 해독됨('+r.decoded.length+')');ok(r.errors===0&&r.fallback===0,'오버레이 오류 0·조절 실패 0');ok(errs.length===0,'페이지 오류 0 '+errs.slice(0,2));
console.log('\nR785 browser: '+(n-bad)+'/'+n);await b.close();process.exit(bad?1:0);
