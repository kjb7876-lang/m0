// R1059 헤드리스: 불면귀 지역에서 옛 그림 파일(원래 경로)을 한 번도 받지 않고, 엔진이 옛 경로로 그려도(R760 꺼짐 = 그림 캐시가 비어 R760 이 못 바꾸는 프레임과 같은 조건) 새 그림이 나오는가.
// node r1059-browser.mjs <outDir> [off]  — off 면 R1059 를 끈 비교(옛 그림이 나와야 검사가 의미 있음)
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const out=process.argv[2]||'.',off=process.argv[3]==='off';fs.mkdirSync(out,{recursive:true});
const OLD=/(bulmyeongwi_(idle|attack|rain|transition|b)\.webp|mb-last302-v31231(-p[1-4])?\.(webp|png)|r760\/boss\/bulmyeongwi-(p[1-4]|rain|transition)\.webp)/;
const b=await chromium.launch();const init={'storyworld.r760.bulmyeongwi':JSON.stringify({on:false})};if(off)init['storyworld.r1059.oldart']=JSON.stringify({on:false});
const {ctx,p}=await boot(b,{init,vp:{width:960,height:540}});const reqs=[];p.on('request',r=>{const u=r.url();if(OLD.test(u))reqs.push(u.replace(/^.*\/m0\//,''));});
const res={off};let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('ok  ',m);}else{fail++;console.log('FAIL',m);}};
for(const z of ['last302','last303']){await go(p,z);await p.waitForTimeout(1500);
 res[z]=await p.evaluate(async z=>{const sel=room.enemies.filter(e=>e&&(e.boss||e.midboss));for(const e of sel){e.spawnState='active';e.x=player.x+1.6;e.y=player.y-.4;e.hp=Math.max(1,e.hp);e.speed=0;}
  const paths=[...new Set(sel.map(e=>e.path).filter(Boolean))];for(const q of paths)addImage(q,'r1059 probe');await new Promise(r=>setTimeout(r,2500));
  const rows=paths.map(q=>{const r=readyImage(q);return {path:q,src:r?String(r.image.currentSrc||r.image.src).replace(/^.*\/m0\//,''):null,w:r?.image?.naturalWidth||0};});
  return {bosses:sel.map(e=>({id:e.nativeId,name:e.name,path:e.path})),rows,api:window.__STORYWORLD_BULMYEONGWI_OLDART_R1059__?.inspect?.()};},z);
 await p.waitForTimeout(1200);await p.screenshot({path:`${out}/${z}${off?'-off':''}.png`});
 for(const r of res[z].rows)if(OLD.test(r.path))ok(off?!/assets\/r1059\//.test(r.src||''):/assets\/r1059\//.test(r.src||''),`${z} ${r.path.split('/').pop()} → ${r.src}`);}
res.oldRequests=[...new Set(reqs)];ok(off?res.oldRequests.length>0:res.oldRequests.every(u=>/assets\/r1059\//.test(u)),'old-path requests outside r1059: '+res.oldRequests.filter(u=>!/assets\/r1059\//.test(u)).length);
fs.writeFileSync(`${out}/probe${off?'-off':''}.json`,JSON.stringify(res,null,1));console.log(`R1059 browser ${pass}/${pass+fail}`);await b.close();process.exit(fail?1:0);
