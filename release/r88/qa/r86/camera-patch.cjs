'use strict';
// Keep the native settings control and saved preference. Only its PC default
// and reset value change; the existing one-owner camera keeps its framing.
const fs=require('fs'),path=require('path');
const file=process.argv[2]||path.resolve(__dirname,'../../hospital-three-pc/site/index.html');
let s=fs.readFileSync(file,'utf8');
const replacements=[
 ["requested=Number.isFinite(p.factor)?cl(p.factor,1,2):device==='mobile'?2:1;", "requested=Number.isFinite(p.factor)?cl(p.factor,1,2):device==='mobile'?2:1.5;"],
 ["function reset(){choose();requested=device==='mobile'?2:1;", "function reset(){choose();requested=device==='mobile'?2:1.5;"],
 ["2배는 가로·세로가 각각 2배, 면적이 약 4배입니다.", "PC 기본은 가로·세로 각각 1.5배(면적 2.25배)입니다. 2배는 가로·세로가 각각 2배, 면적이 약 4배입니다."]
];
for(const [before,after] of replacements){if(s.includes(after))continue;if(s.split(before).length!==2)throw Error('Missing unique PC camera anchor: '+before);s=s.replace(before,after);}
fs.writeFileSync(file,s);
