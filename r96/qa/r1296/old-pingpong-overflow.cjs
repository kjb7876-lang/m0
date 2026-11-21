'use strict';
// R1296 원인 확인(가상 시계): R1290(#962, 2026-11-21 08:39Z 병합) 전 코드의 그리기 push 감싸기 핑퐁(R1286 1초·R1041 2초)이
//  몇 시간 쌓이면 그리기 명령 한 번(push)이 실제로 'Maximum call stack size exceeded' 를 내는지, 지금 코드는 안 내는지 본다.
//  qa/r1290/r1290-wrap-cpu-check.cjs 의 stage() 를 그대로 빌려, 옛 파일은 git(72745f97~1)에서 읽는다. 장면 캡처 안 깊이를 흉내 내려고 push 를 PAD 겹 재귀 안에서 부른다.
//  실행: node r96/qa/r1296/old-pingpong-overflow.cjs [최대 가상 시간(시간)=12]
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');const HOURS=+(process.argv[2]||12),PAD=+(process.env.PAD||200);
const T=fs.readFileSync(path.join(R,'qa/r1290/r1290-wrap-cpu-check.cjs'),'utf8');const body=T.slice(T.indexOf('function stage(){'),T.indexOf('\n// ① ②'));
const NAMES=['hero-dots-fx-r1041.js','ego-cloud-r1286.js'];
function run(label,rd){
 const stage=new Function('fs','path','vm','R','NAMES','rd',body+';return stage;')(fs,path,vm,R,NAMES,rd);
 Error.stackTraceLimit=10;const S=stage();S.pump(3);
 S.run(`var __pad=(n)=>n<=0?(ctx.push("image",{key:"x",points:[[0,0],[1,0],[1,1],[0,1]]}),0):1+__pad(n-1);`);
 const probe=()=>{try{S.run(`__pad(${PAD})`);return null;}catch(e){return String(e&&e.message||e);}};
 let sec=3,err=null;const step=600;
 while(sec<HOURS*3600){S.pump(step);sec+=step;err=probe();if(err)break;}
 const wraps=S.run('window.__STORYWORLD_EGO_CLOUD_R1286__.inspect().stats.wraps');
 console.log(`${label}: ${err?'터짐 «'+err+'» 가상 '+(sec/3600).toFixed(2)+'시간':'안 터짐 (가상 '+(sec/3600).toFixed(1)+'시간까지)'} · R1286 감싸기 ${wraps}번`);
 return {err,sec,wraps};}
const old=rev=>f=>{const rel=path.relative(ROOT,f).split(path.sep).join('/');try{return cp.execSync(`git show ${rev}:${rel}`,{cwd:ROOT,encoding:'utf8',maxBuffer:64<<20});}catch(_){return '';}};
const a=run('R1290 전(72745f97~1, 03:25Z~08:39Z 공개판)',old('72745f97~1'));
const b=run('지금 코드',f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}});
const pass=!!a.err&&/Maximum call stack/.test(a.err)&&!b.err;console.log(pass?'PASS 옛 코드는 몇 시간 뒤 스택 초과, 지금 코드는 안 터짐':'CHECK 결과 확인 필요');process.exit(pass?0:1);
