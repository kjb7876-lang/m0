// R1062 지역 소품 주제 — 헤드리스 브라우저 전수 측정(게임 그래픽 검증 아님: 소프트웨어 렌더, GPU·실기기 미검증).
//  본편(STORY) 전 지역에 들어가 R204 거르기가 끝난 뒤(room.r1062Props 또는 6초) room.props 의 엔진 공통 소품(assets/props/…) 그림을 모아
//  실내 주제(theme-pools.json indoorThemes) 지역에 바깥 전용 그림(outdoorOnly)이 이름 없이 남아 있지 않은지 본다. LAYER=DREAM 으로 사몽 층도 측정만 한다(판정 없음).
//  사용: SW_URL=http://127.0.0.1:4410/m0/ [LAYER=STORY] [OUTF=결과.json] node r96/qa/r1062/prop-theme-browser.mjs [지역…]
import {chromium,boot,skip} from '../r444/lib.mjs';import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),P=JSON.parse(fs.readFileSync(path.join(HERE,'theme-pools.json'),'utf8')),INDOOR=new Set(P.indoorThemes),OUT=new Set(P.outdoorOnly);
const LAYER=process.env.LAYER||'STORY';let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d).slice(0,300):''));};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
const all=await p.evaluate(()=>Object.keys(regionById)),zones=process.argv.slice(2).length?process.argv.slice(2):all,res={};
for(const z of zones){try{await p.evaluate(([z,L])=>enterRegion(z,null,{layer:L,restore:true}),[z,LAYER]);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:150000});await skip(p);
  const kind=await p.evaluate(z=>window.__STORYWORLD_CAVE_R204__?.zoneKind?.(z)||null,z);
  if(kind&&LAYER==='STORY')await p.waitForFunction(()=>room.r1062Props===true,null,{timeout:60000}).catch(()=>{});else await p.waitForTimeout(1500);await skip(p);
  const r=await p.evaluate(()=>({done:room.r1062Props===true,ps:(room.props||[]).filter(q=>q&&q.visible!==false&&/assets\/props\//.test(String(q.path||''))).map(q=>[String(q.path).split('/').pop().replace(/\.(webp|png)$/,''),q.name||null])}));
  const arts=[...new Set(r.ps.map(q=>q[0]))].sort(),theme=P.zones[z]?.theme||'field';res[z]={theme,kind,done:r.done,arts,named:r.ps.filter(q=>q[1])};
  if(LAYER==='STORY'&&INDOOR.has(theme)){ok(r.done,z+'('+theme+'): 주제 거르기가 돌았음');const leak=r.ps.filter(q=>!q[1]&&OUT.has(q[0])).map(q=>q[0]);ok(!leak.length,z+'('+theme+'): 이름 없는 바깥 전용 그림 없음',[...new Set(leak)]);}
 }catch(e){ok(false,z+': 들어가기 실패',String(e).slice(0,120));try{await skip(p);}catch(_){}}}
if(LAYER==='STORY'&&res.ep1a09){await p.evaluate(()=>enterRegion('ep1a09',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='ep1a09',null,{timeout:150000});await skip(p);await p.waitForTimeout(2500);
 const c=await p.evaluate(()=>window.__STORYWORLD_ROOMS_R523__?.inspect?.()?.stats?.cabinets||0);ok(c>=2,'ep1a09: 갈망 약병장 2점이 약장 그림으로 그려짐(R1061)',c);}
ok(!errs.length,'페이지 오류 0',errs.slice(0,3));if(process.env.OUTF)fs.writeFileSync(process.env.OUTF,JSON.stringify(res,null,1));
console.log('\nR1062 browser('+LAYER+'): '+(n-bad)+'/'+n+', 지역 '+Object.keys(res).length);await b.close();process.exit(bad?1:0);
