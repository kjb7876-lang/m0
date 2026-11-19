// R1230 위치 고정 적 전수(헤드리스): node r96/qa/r1230/fixed-census.mjs [out.json]
//  지역마다 makeRoom 한 적 목록 + 실제로 들어가 몇 초 둔 뒤의 적 목록에서 고정형(r75Tower·r170Tower·r446Pillar·r251Circle·stationary·turret·immobile·rooted)을 센다.
//  그리고 각 고정형의 '공격 순간 몸 모션 프레임 수'를 잰다: 몸 그림 명령(ctx.commands)의 모양이 공격 0.9초 동안 몇 가지로 바뀌는지.
import fs from 'node:fs';import {chromium,boot,go,skip} from '../r444/lib.mjs';
const out=process.argv[2]||'fixed-census.json';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const fixedSrc="e=>!!(e&&!e.hero&&(e.r75Tower||e.r170Tower||e.r446Pillar||e.r251Circle||e.stationary||e.turret||e.immobile||e.rooted))";
const stat=await p.evaluate(src=>{const F=eval(src),L=[];for(const id of Object.keys(regionById)){if(/mammon/i.test(id)||id==='ep1b06')continue;try{const r=makeRoom(id);const f=(r?.enemies||[]).filter(F);if(f.length)L.push({id,n:f.length,kinds:[...new Set(f.map(e=>(e.r251Circle?'r251':e.r170Tower?'r170':e.r75Tower?'r75':e.stationary?'stationary':'other')+':'+e.name))]});}catch(_){}}return L;},fixedSrc);
fs.writeFileSync(out,JSON.stringify({static:stat},null,1));console.log('static',stat.length,JSON.stringify(stat).slice(0,1500));
await b.close();
