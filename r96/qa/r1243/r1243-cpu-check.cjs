// R1243 7대죄 보스 키 튐 — R620 대기·맞음 시트로 바뀐 칸도 R463 '한 키' 잠금을 받는지 (CPU, 브라우저 없음)
//  원인(qa/r1243/hidle.mjs 실측): R463 sizeLock 은 그림 경로별 보이는 키 표(vis)로 몸 키를 영웅 키의 2.1배에 묶는다.
//  R620·R1147·R1160·R1163·R1164 가 서 있을 때 원본 그림을 idle6/hit4 시트로 바꾸면 그 경로가 표에 없어 잠금이 풀리고(R425 띠 1.9~2.3배 안에서 그대로)
//  레비아탄 몸이 155→140(−10%)으로 줄었다가 공격 때 다시 커졌다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'../..'),CS=path.join(R,'client-source');let fails=0,n=0;
const ok=(c,m)=>{n++;if(!c){fails++;console.log('FAIL',m);}};
const read=f=>fs.readFileSync(path.join(CS,f),'utf8');
function load(roomId){const store={};const win={};const sb={window:win,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},console,room:{id:roomId}};
 sb.window=sb;vm.createContext(sb);for(const f of ['sin-boss-art-r463-data.js','sin-boss-sheet-vis-r1243-data.js','sin-boss-art-r463.js']){if(!fs.existsSync(path.join(CS,f))){ok(false,'파일 없음 '+f);continue;}vm.runInContext(read(f),sb,{filename:f});}
 return sb;}
// R620 SHEETS 에서 원본 → 시트 경로 뽑기
const src620=read('boss-motion-r620.js');const pairs=[];
for(const m of src620.matchAll(/'(assets\/[^']+)':\{w:(\d+),h:(\d+)(?:,cells:\[[^\]]*\])?,idle:\{path:'([^']+)'[^}]*\}(?:,hit:\{path:'([^']+)')?/g))pairs.push({still:m[1],w:+m[2],h:+m[3],idle:m[4],hit:m[5]||null});
ok(pairs.length>=10,'R620 시트 목록 읽기 '+pairs.length);
const D=(()=>{const sb={window:{}};sb.window=sb;vm.createContext(sb);vm.runInContext(read('sin-boss-art-r463-data.js'),sb);return sb.__STORYWORLD_SIN_BOSS_ART_R463_DATA__;})();
let covered=0;
for(const [id,d] of Object.entries(D)){if(id.startsWith('b06'))continue;const sb=load(d.zone),A=sb.__STORYWORLD_SIN_BOSS_ART_R463__;
 for(const p of pairs){if(!(p.still in d.vis))continue;const base=A.sizeLock({nativeId:id},{sourcePath:'http://127.0.0.1/m0/'+p.still,sourceRect:[0,0,p.w,p.h]},1);ok(!!base,`${id} 원본 잠금 ${p.still}`);
  for(const sh of [p.idle,p.hit].filter(Boolean)){covered++;const L=A.sizeLock({nativeId:id},{sourcePath:'http://127.0.0.1/m0/'+sh,sourceRect:[p.w*2,0,p.w,p.h]},1);
   ok(!!L,`${id} 시트도 잠금 ${sh}`);if(!L||!base)continue;ok(Math.abs(L.band[0]-base.band[0])<1e-9,`${id} 같은 띠 ${sh}`);
   ok(L.frac>base.frac*.85&&L.frac<base.frac*1.15,`${id} 보이는 키 비율 원본 ±15% 안 ${sh} ${L.frac.toFixed(3)} vs ${base.frac.toFixed(3)}`);}}
 // 같은 id 를 빌린 다른 지역에서는 잠그지 않는다
 const other=load('zz-other').__STORYWORLD_SIN_BOSS_ART_R463__;for(const p of pairs)if(p.still in d.vis)ok(other.sizeLock({nativeId:id},{sourcePath:p.idle,sourceRect:[0,0,p.w,p.h]},1)===null,`${id} 다른 지역 안 잠금`);
 // 끄기(size:false)면 시트도 안 잠금
}
ok(covered>=6,'7대죄 시트 6개 이상 검사 '+covered);
// 끄기
{const id='b03-boss',d=D[id];const store={'storyworld.r463.sinboss':'{"size":false}'};const sb={localStorage:{getItem:k=>store[k]??null,setItem(){}},console,room:{id:d.zone}};sb.window=sb;vm.createContext(sb);
 for(const f of ['sin-boss-art-r463-data.js','sin-boss-sheet-vis-r1243-data.js','sin-boss-art-r463.js'])if(fs.existsSync(path.join(CS,f)))vm.runInContext(read(f),sb);
 ok(sb.__STORYWORLD_SIN_BOSS_ART_R463__.sizeLock({nativeId:id},{sourcePath:'assets/r620/bosses/b03-idle6.webp',sourceRect:[0,0,672,384]},1)===null,'끄기면 시트 잠금 없음');}
// 빌드 연결
const idx=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');ok(/sin-boss-sheet-vis-r1243-data\.js/.test(idx),'index.html 태그');
const ver=fs.readFileSync(path.join(R,'..','scripts/verify-r96-public.py'),'utf8');ok(ver.includes('sin-boss-sheet-vis-r1243-data.js'),'공개 검증 목록');
const man=fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8');ok(man.includes('sin-boss-sheet-vis-r1243-data.js'),'manifest');
const yml=fs.readFileSync(path.join(R,'..','.github/workflows/pages.yml'),'utf8');ok(yml.includes('qa/r1243/r1243-cpu-check.cjs'),'pages.yml 검사 줄');
console.log(`R1243 CPU ${n-fails}/${n}`);process.exit(fails?1:0);
