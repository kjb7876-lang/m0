// R1122 정적 검사: 교주의 사몽(cult04) DREAM 만 R171 서사 지도를 받고, cult04 STORY·다른 NATIVE 지역 DREAM 은 그대로인지.
//  story-maps-r171.js 의 dreamMaps~eligible 구간을 떼어 가짜 전역으로 실제 실행해 본다(브라우저 아님).
const fs=require('fs'),vm=require('vm');let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d):''));};
const js=fs.readFileSync('r96/client-source/story-maps-r171.js','utf8'),rt=fs.readFileSync('r96/runtime-text/story-maps-r171.js','utf8');
ok(js===rt,'runtime 복사본 일치');
const a=js.indexOf(' const dreamMaps='),endMark='&&(cultDream||!awakening(id));}',b=js.indexOf(endMark,a);
ok(a>0&&b>a,'eligible 구간 찾음');
const body=js.slice(a,b+endMark.length);
const run=(store)=>{const ctx={localStorage:{getItem:k=>store[k]??null},window:{},
  prefs:{on:true},coop:()=>'off',SAFE:new Set(['restHando']),NATIVE:new Set(['hando01','hando02','hando03','kair02','kair03','last301','cult04']),
  region:id=>({id,theme:'cathedral',safe:false}),profiles:()=>new Proxy({},{get:()=>({mode:'indoor'})}),awakening:id=>id==='cult04'||id==='kair09'};
 vm.createContext(ctx);vm.runInContext(body+';this.eligible=eligible;',ctx);return ctx.eligible;};
const E=run({});
ok(E('cult04','DREAM')===true,'cult04 DREAM → R171 지도 받음');
ok(E('cult04','STORY')===false,'cult04 STORY(교주 결전 병동 미로)는 그대로');
ok(['hando01','hando02','hando03','kair02','kair03','last301'].every(id=>E(id,'DREAM')===false&&E(id,'STORY')===false),'다른 NATIVE 지역은 두 층 모두 그대로');
ok(E('cult01','DREAM')===true&&E('cult01','STORY')===true,'일반 지역(cult01)은 그대로 두 층 R171');
ok(E('kair09','DREAM')===false,'각성 기록 지역 예외는 cult04 DREAM 에만 풀림');
ok(E('restHando','DREAM')===false&&E('ep1a08','DREAM')===false,'쉼터·ep1a08 그대로 제외');
ok(run({'storyworld.r1122.cultDream':'0'})('cult04','DREAM')===false,'끄기 설정(storyworld.r1122.cultDream=0)이면 예전 틀');
ok(run({'storyworld.r1098b.dreamMaps':'0'})('cult04','DREAM')===false,'R1098b DREAM 지도 끄기면 cult04 도 예전 틀');
console.log(`${n-bad}/${n}`);process.exit(bad?1:0);
