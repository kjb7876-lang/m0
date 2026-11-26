'use strict';
// 사용자 2026-11-26: 3D 영웅 기본공격은 3D 직접 모션, 2D 영웅 등장은 스킬 쪽. → 기본공격 2D 소환(SW-0027)은 기본 꺼짐.
// 다시 켜기: ?summonEcho=1 또는 localStorage storyworld.r1302.basicEcho=on (SW-0027 검사가 쓰는 opt-in).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=process.argv[2]||path.resolve(__dirname,'../../..');
const src=fs.readFileSync(path.join(root,'r96/client-source/hwando-3d-r1302.js'),'utf8');
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('ok',n,m);};
const b=src.indexOf('// basic-echo-gate:begin'),e=src.indexOf('// basic-echo-gate:end');
ok(b>0&&e>b,'① 게이트 구간 표시가 있다');
const gate=src.slice(b,e);
function run(search,store){
 const c={location:{search},localStorage:store,result:null};vm.createContext(c);
 vm.runInContext(gate+';result=basicEchoOn();',c);return c.result;}
const mem=v=>({getItem:k=>k==='storyworld.r1302.basicEcho'?v:null});
ok(run('',mem(null))===false,'② 기본값은 꺼짐');
ok(run('',mem('off'))===false,'③ 저장값 off → 꺼짐');
ok(run('',mem('on'))===true,'④ 저장값 on → 켜짐(SW-0027 opt-in)');
ok(run('',{getItem(){throw new Error('blocked');}})===false,'⑤ 저장소 막힘 → 꺼짐, 오류 없음');
ok(run('?summonEcho=1',mem(null))===true,'⑥ ?summonEcho=1 → 켜짐');
ok(run('?a=2&summonEcho=1',mem(null))===true,'⑦ 다른 인자 뒤 &summonEcho=1 → 켜짐');
ok(run('?summonEcho=10',mem(null))===false,'⑧ ?summonEcho=10 은 켜짐 아님(경계)');
ok(run('?hwando3d=1',mem(null))===false,'⑨ 3D 켜기 인자만으로는 2D 소환 안 켜짐');
const consume=src.slice(src.indexOf('function consume('),src.indexOf('updateModel(r,body.owner'));
ok(/if\(basicEcho\)\{echo=planSummon\(/.test(consume),'⑩ consume 은 게이트가 켜졌을 때만 planSummon 을 부른다');
ok(!/[^)]\{?echo=planSummon\(/.test(consume.replace('if(basicEcho){echo=planSummon(','')),'⑪ 게이트 밖 planSummon 호출 없음');
ok(/else resetSummon\(group,true\)/.test(consume),'⑫ 꺼짐이면 남은 소환 상태를 지운다');
ok(/HERO==='hwando'/.test(consume),'⑬ 환도 먹 접점(스킬 쪽)은 게이트와 상관없이 그대로');
ok(/const ECHO_HEROES=new Set\(\['hwando','slayer','hunter'\]\)/.test(src),'⑭ 회귀: opt-in 용 소환 장치(3명)는 남아 있다');
ok(/let basicEcho=basicEchoOn\(\);/.test(src)&&/basicEcho:\(\)=>basicEcho/.test(src)&&/setBasicEcho/.test(src),'⑮ 공개 API basicEcho·setBasicEcho');
const html=fs.readFileSync(path.join(root,'r96/qa/hero-summon-v1/browser.mjs'),'utf8');
ok(/storyworld\.r1302\.basicEcho','on'/.test(html),'⑯ SW-0027 브라우저 검사는 opt-in 으로 기존 단언을 그대로 돈다');
console.log('basic-echo-off: '+n+' ok');
