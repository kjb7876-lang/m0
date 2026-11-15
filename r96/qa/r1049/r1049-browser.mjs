// R1049 브라우저 확인(헤드리스, 귀로 듣는 검증 아님): 실제 게임에서 ① 파생본 경로 바꿔 끼우기 ② 모든 R1049 음원이 Chromium 에서 해독됨
// ③ 걷기(실제 키 입력)에 발걸음, 체력 20% 에 심장, 레벨 +1 에 레벨업이 R993 재생 기록(start)에 남음 ④ 창 열림 중 심장 없음 ⑤ 페이지 오류 0.
// 사용: SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1049/r1049-browser.mjs   (결과 r96/qa/r1049/browser-results.json)
import {chromium,boot} from '../r444/lib.mjs';
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
const errs=[];const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const {p}=await boot(b,{vp:{width:640,height:360}});p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const res={};
res.setup=await p.evaluate(async()=>{try{await unlockAudio();}catch(_){}settings.sound=true;settings.volume=1;
 const A=window.__STORYWORLD_SFX_RULES_R1049__,rows=Object.values(soundProfiles).flat().filter(r=>r&&r.r1049From);
 const paths=[...new Set([...Object.values(A.remap),...Object.values(A.gaps).flat()])];let decoded=0;const bad=[];
 for(const pth of paths){try{const buf=await audioBuffer(pth);if(buf&&buf.length>0)decoded++;else bad.push(pth);}catch(e){bad.push(pth);}}
 const X=window.__STORYWORLD_SFX_MIX_R993__;
 return {on:A.enabled(),remappedRows:rows.length,paths:paths.length,decoded,bad,gaps:['r1049Step','r1049Heart','r1049LevelUp'].map(k=>(soundProfiles[k]||[]).length),
  cat:['r1049Step','r1049Heart','r1049LevelUp'].map(k=>X.category(k)?.cls||null),alias:window.__STORYWORLD_SFX_COMFORT__.aliases.r1049Step};});
ok(res.setup.on,'R1049 켜짐');ok(res.setup.remappedRows>=40,'파생본 경로 바꿔 끼운 줄 '+res.setup.remappedRows);
ok(res.setup.decoded===res.setup.paths&&res.setup.paths>=60,'R1049 음원 해독 '+res.setup.decoded+'/'+res.setup.paths+(res.setup.bad.length?' 실패 '+res.setup.bad.slice(0,3):''));
ok(res.setup.gaps.every(x=>x>=2),'빈칸 3종 프로필 '+res.setup.gaps);ok(res.setup.cat.join()==='low,mid,high','R993 범주 '+res.setup.cat);
const started=()=>p.evaluate(()=>window.__STORYWORLD_SFX_MIX_R993__.inspect().audit.filter(r=>r.kind==='start').map(r=>r.kindName));
// 걷기: 가까운 적을 멀리 보내고(이 확인만) 실제 화살표 키로 걷는다
await p.evaluate(()=>{for(const e of liveEnemies()){e.x=player.x+60;e.y=player.y+60;}});
const before=(await started()).length;await p.keyboard.down('ArrowRight');await p.waitForTimeout(4000);await p.keyboard.up('ArrowRight');
await p.keyboard.down('ArrowLeft');await p.waitForTimeout(4000);await p.keyboard.up('ArrowLeft');
res.walk=await p.evaluate(()=>window.__STORYWORLD_SFX_RULES_R1049__.inspect().stats);const s1=(await started()).slice(before);
ok(res.walk.steps>0&&s1.includes('r1049Step'),'걷기 → 발걸음 '+res.walk.steps+'번(재생 기록 '+s1.filter(k=>k==='r1049Step').length+')');
// 저체력
await p.evaluate(()=>{player.hp=maxHP()*.2;});const b2=(await started()).length;await p.waitForTimeout(3500);
const s2=(await started()).slice(b2);ok(s2.includes('r1049Heart'),'체력 20% → 심장 '+s2.filter(k=>k==='r1049Heart').length+'번');
await p.evaluate(()=>{modal='test-r1049';});const b3=(await started()).length;await p.waitForTimeout(2500);const s3=(await started()).slice(b3);
ok(!s3.includes('r1049Heart'),'창 열림 중 심장 없음');await p.evaluate(()=>{modal=null;player.hp=maxHP();});
// 레벨업
const b4=(await started()).length;await p.evaluate(()=>{player.level=Math.min(player.level+1,9999);});await p.waitForTimeout(2500);
const s4=(await started()).slice(b4);ok(s4.includes('r1049LevelUp'),'레벨 +1 → 레벨업 소리');
ok(errs.length===0,'페이지 오류 0'+(errs.length?' '+errs[0]:''));
res.errors=errs;res.at=new Date().toISOString();fs.writeFileSync(path.join(HERE,'browser-results.json'),JSON.stringify(res,null,1));
console.log(`\nR1049 browser: ${n-bad}/${n}`);await b.close();process.exit(bad?1:0);
