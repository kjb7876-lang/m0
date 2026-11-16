// R1065 브라우저 검사(헤드리스): Dots 공격 시트 7종이 실제 공격 중 그려지는지(칸 3개 이상), 크기가 걷기 때와 같은지(±15%), 좌우가 R444 와 같은지, 오류 0 인지 본다.
// 사용: URL=http://127.0.0.1:4412/m0/ node r96/qa/r1065/r1065-browser.mjs [shotdir]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.URL||'http://127.0.0.1:4396/';const SHOT=process.argv[2]||null;const SECS=+process.env.SECS||14;
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(typeof modal!=='undefined'&&modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
ok(!!(await p.evaluate(()=>window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__?.revision)),'overlay installed');
await p.evaluate(()=>{window.__R1065={watch:null,rec:null};setInterval(()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.render.__r1065t)return;const f=r.render;
 r.render=function(fr){try{const W=window.__R1065;const w=W.watch&&room.enemies.find(x=>x.id===W.watch);if(w&&W.rec){let best=null;for(const c of fr.commands){if(c.kind!=='image'||c.owner?.kind!=='enemy'||!c.points)continue;if(!String(c.owner.id||'').endsWith(w.id))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(!best||hh>best.hh)best={hh,c};}
  if(best){const c=best.c,st=w.attack&&!w.attack.r286Fake?'atk':w.rangedWindup>0?'aim':(w.hitTimer>0?'hit':'calm');const R=W.rec;const s=String(c.sourcePath||'').replace(/^.*assets\//,'');
   if(st==='atk'||st==='aim'){if(/^r1065\//.test(s)){R[st+'Dots']++;R.cells[s+'#'+Math.round(c.sourceRect?.[0]||0)]=1;R.atkS.push(best.hh/(c.sourceRect?.[3]||1));const flipped=c.points[1][0]<c.points[0][0];const L=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(w);if(typeof L==='boolean'){R.face[flipped===L?'ok':'bad']++;}}else{if(time-R.t0>=1.5)R[st+'Other']++;else R.firstLoad=(R.firstLoad||0)+1;const k2=s+'#'+(c.sourceRect||[]).map(Math.round).join(',');R.other[k2]=(R.other[k2]||0)+1;if(time-R.t0>=1.5&&R.otherT.length<400&&R.lastOT!==time&&(R.lastOT=time,true))R.otherT.push([+(time-R.t0).toFixed(2),+(w.attack?.elapsed||0).toFixed(2),!!w.moving,w.r286?.mode||null,window.__STORYWORLD_MOB_MOTION_R286__?.kindOf?.(w),!!(typeof readyImage==='function'&&readyImage(window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__.inspect().sheets['MA-08'].path)),w.attack?.id]);}}
   else if(st==='calm'){R.calmS.push(best.hh/(c.sourceRect?.[3]||1));R.calmP[s]=(R.calmP[s]||0)+1;}}}}catch(err){window.__R1065.err=String(err);}return f.apply(this,arguments);};r.render.__r1065t=true;},300);});
async function watch(zone,nid,name){await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},zone);await p.waitForFunction(z=>!loading&&room?.id===z,zone,{timeout:150000});await skip(p);
 const id=await p.evaluate(([nid,name])=>{const e=room.enemies.find(x=>(!nid||x.nativeId===nid)&&x.name===name&&x.hp>0);if(!e)return null;
  for(const o of room.enemies){if(o!==e&&o.hp>0&&Math.hypot(o.x-player.x,o.y-player.y)<9){o.x=player.x+14;o.y=player.y+3;o.homeX=o.x;o.homeY=o.y;}}
  e.x=player.x+1.2;e.y=player.y+.3;e.homeX=player.x;e.homeY=player.y;e.cd=0;e.graceUntil=0;e.awake=true;e.aggro=true;if(e.spawnState)e.spawnState='active';const mh=e.maxHp;Object.defineProperty(e,'hp',{configurable:true,enumerable:true,get(){return mh;},set(v){}});
  window.__R1065.watch=e.id;window.__R1065.rec={atkDots:0,atkOther:0,aimDots:0,aimOther:0,cells:{},atkS:[],calmS:[],calmP:{},other:{},otherT:[],t0:time,face:{ok:0,bad:0}};return e.id;},[nid,name]);
 if(!id)return null;const t=await p.evaluate(()=>time);await p.waitForFunction(a=>{try{player.hp=player.maxHp;if(storyScene)advanceScene();}catch(_){}return time>=a;},t+SECS,{timeout:600000,polling:400});
 const out=await p.evaluate(()=>{const W=window.__R1065,e=room.enemies.find(x=>x.id===W.watch);return {...W.rec,kind:window.__STORYWORLD_MOB_MOTION_R286__?.kindOf?.(e),v1064:window.__STORYWORLD_MOB_LUNGE_R1064__?.verdict?.(e),covers:window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__.covers(e)};});
 if(SHOT){await p.evaluate(()=>{const W=window.__R1065;W.rec=null;});await p.waitForFunction(()=>{const e=room.enemies.find(x=>x.id===window.__R1065.watch);return e&&e.attack&&!e.attack.r286Fake&&e.attack.elapsed>.35;},null,{timeout:120000,polling:30}).catch(()=>{});await p.screenshot({path:`${SHOT}/${zone}-${nid}.png`});}
 await p.evaluate(()=>{const W=window.__R1065;const e=room.enemies.find(x=>x.id===W.watch);if(e){e.x=player.x+14;e.y=player.y-3;}W.watch=null;W.rec=null;});return out;}
const I0=await p.evaluate(()=>window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__.inspect());const ONLY=process.env.ONLY?process.env.ONLY.split(','):null;
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[s.length>>1]:NaN;};
for(const [z,nid,name,ma] of [['ep1b05','b05-a1','붉은 하이힐 칼날','MA-02'],['ep1b05','b05-p2','공중을 가르는 립스틱 탄환','MA-03'],['ep1b07','b07-s1','불길 속의 용','MA-04'],['ep1b09','b09-h1','강철 턱의 사이보그 개','MA-06'],
 ['kair08','kair-guardian-28','시간수문장 28','MA-07'],['murder01','murder04-e2','끊어진 통화의 인과 잔향 1','MA-08'],['kair08',null,'태엽 수집자','MA-10']]){
 if(ONLY&&!ONLY.includes(ma))continue;const r=await watch(z,nid,name);if(!r){ok(false,ma+' '+name+' found in '+z);continue;}
 const cells=Object.keys(r.cells).length;const SH=I0.sheets[ma];const cp=Object.entries(r.calmP).sort((a,b)=>b[1]-a[1])[0]?.[0];const B=SH.bases[cp];const ratio=B?med(r.atkS)*SH.bodyH/(med(r.calmS)*B.bodyH):NaN;
 const top=Object.entries(r.other).sort((a,b)=>b[1]-a[1]).slice(0,4);
 console.log(ma,name,JSON.stringify({atkDots:r.atkDots,atkOther:r.atkOther,aimDots:r.aimDots,aimOther:r.aimOther,cells,ratio:+ratio.toFixed(3),face:r.face,kind:r.kind,v1064:r.v1064,covers:r.covers,calm:cp,other:top,otherT:r.otherT.slice(0,40)}));
 if(ma==='MA-10'&&!r.covers){const o=Object.keys(r.other);ok(o.length>0&&o.every(k=>/m033\.webp#\d+,640,/.test(k)),'MA-10 태엽 수집자: 이 구역 공급자가 공격 줄(y640)을 이미 씀 → 손대지 않음 ('+o.slice(0,2)+')');continue;}
 ok(r.covers&&(r.atkDots+r.aimDots)>=10&&cells>=3,ma+' '+name+': Dots 공격 칸 실제로 그려짐 ('+(r.atkDots+r.aimDots)+'회, 칸 '+cells+')');
 // 처음 1.5초(순간이동 직후 첫 공격, 시트 읽는 중)는 뺀다 — 실제 플레이에서는 몹을 처음 볼 때 미리 읽음
 ok(r.atkOther<=Math.max(3,r.atkDots*.1),ma+': 공격 중 옛 걷기 칸 거의 없음 ('+r.atkOther+', 첫 1.5초 '+(r.firstLoad||0)+')');
 ok(Number.isFinite(ratio)&&ratio>.85&&ratio<1.15,ma+': 공격 칸 키가 걷기 때와 같음 (비 '+ratio.toFixed(3)+')');
 ok(r.face.bad===0||r.face.bad<=r.face.ok*.05,ma+': 좌우 R444 와 같음 ('+JSON.stringify(r.face)+')');
 ok(r.kind!=='move-only'&&r.kind!=='static'&&r.v1064!=='lunge',ma+': R286·R1064 내딛기 겹치지 않음 ('+r.kind+'/'+r.v1064+')');}
const I=await p.evaluate(()=>window.__STORYWORLD_MOB_ATTACK_DOTS_R1065__.inspect());ok(I.stats.errors===0,'overlay errors 0 '+(I.lastError||''));ok(errs.length===0,'page errors 0 '+JSON.stringify(errs.slice(0,3)));
await b.close();console.log(fails?'R1065 browser FAILED '+fails:'R1065 browser passed');process.exit(fails?1:0);
