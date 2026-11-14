// dist03 → last303 뒤 R760 시트들이 imageCache 에 준비돼 있는지, addImage 가 다시 읽는지 확인
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const seq=(process.argv[2]||'dist03,last303').split(',');
const snap=()=>p.evaluate(()=>{const rows=[];for(const [k,v] of imageCache)if(/r760\/boss\/|bulmyeongwi_/.test(k))rows.push(k.replace(/^.*\//,'')+':'+(v.ready?'R':v.error?'E':'L'));
 const A=[];try{for(const [k,v] of assets)if(/r760\/boss\//.test(k))A.push(k.replace(/^.*\//,'')+':'+JSON.stringify(Object.fromEntries(Object.entries(v).filter(([a,b])=>typeof b!=='object'))).slice(0,80));}catch(e){A.push('assets?'+e)}
 const I=window.__STORYWORLD_BULMYEONGWI_R760__?.inspect?.();return {room:room.id,cache:rows,assets:A.slice(0,6),r760:I?JSON.stringify(I.stats||I).slice(0,300):null};});
for(const z of seq){await go(p,z);await p.waitForTimeout(8000);console.log(JSON.stringify(await snap()));}
await p.waitForTimeout(15000);console.log('later',JSON.stringify(await snap()));
await b.close();
