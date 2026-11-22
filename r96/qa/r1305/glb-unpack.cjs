// R1305 — 동기 정적 검사에서 meshopt GLB 를 풀어 쓰는 도우미(glb-unpack.mjs 를 자식 프로세스로 부른다).
const cp=require('node:child_process'),path=require('node:path');
module.exports=function unpackGlb(file){return cp.execFileSync(process.execPath,[path.join(__dirname,'glb-unpack.mjs'),file],{maxBuffer:64<<20});};
