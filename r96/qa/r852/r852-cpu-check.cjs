// R852(한약과 불면귀 실플레이, 사용자 2026-11-12 05:53Z 결정 "두 지역에서 길 띠 빼기"):
// 불면귀 밤 두 구역(last302 잠들지 못하는 마을·last303 한약과 불면귀)의 흙길 띠(trail-r482)는 빛을 받지 않는 재질이라
// 등불·달빛 받은 바닥보다 약 13% 어두워 등불 없는 굽이에서 검은 연기 기둥처럼 보였다(헤드리스 켬/끔 밝기 비 .87, 색·투명도 손질 3회 미달).
// 검사: 두 구역은 길 띠를 만들지 않고, 다른 길 띠 구역은 그대로다. 사용: node r96/qa/r852/r852-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log('  ok '+m);};
const src=fs.readFileSync(path.join(__dirname,'../../client-source/trail-r482.js'),'utf8');
const g={console,Math,JSON,Object,Array,Set,Map,Number,String,Error,Infinity,performance:{now:()=>0},localStorage:{getItem:()=>null,setItem(){}},setInterval(){},settings:{}};g.window=g;vm.createContext(g);vm.runInContext(src,g);
const API=g.__STORYWORLD_TRAIL_R482__;ok(!!API&&typeof API.zoneOk==='function','길 띠 API 를 읽음');
for(const z of ['last302','last303'])ok(API.zoneOk(z)===false,`${z}: 길 띠를 만들지 않음`);
for(const z of ['hub','dist00','dist02','dist03','dist04','dist05','dist06','last301','last304','last305','kair04','kair05','ep1b06b','hando01','hando02'])ok(API.zoneOk(z)===true,`${z}: 길 띠 그대로`);
for(const z of ['ep1b06','last306',''])ok(API.zoneOk(z)===false,`'${z}': 원래대로 길 띠 없음`);
// 회귀: 길 계획·띠 메시 함수는 그대로(다른 구역 길 모양 불변)
ok(typeof API.plan==='function'&&typeof API.ribbon==='function'&&typeof API.findTrail==='function','plan·ribbon·findTrail 그대로');
const html=fs.readFileSync(path.join(__dirname,'../../runtime-text/trail-r482.js'),'utf8');ok(html===src,'runtime-text 사본이 client-source 와 같음(sync-r99)');
console.log('R852 CPU 검사 통과: '+n+'개');
