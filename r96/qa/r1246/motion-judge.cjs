// R1246 영웅 모션 판정(헤드리스 수집 결과 collect.mjs → JSON). 실행: node motion-judge.cjs <motion.json>
//  ① 기본공격 중 맞음(공격·피격 둘 다, 스킬·대시·막기 아님) → 피격 그림 10% 이하(공격 모션 유지)
//  ② 스킬·궁극기 중 맞음 → 피격 그림 10% 이하
//  ③ 회귀: 맞기만 할 때 피격 그림을 쓰던 영웅(수정 전 80% 이상: 서하·네온·미카엘라·라우렌·사수·EGO)은 여전히 80% 이상
//  ①~③ 은 상태가 0.1게임초 넘게 이어진 칸만 센다(EGO R1048 재생기는 상태가 바뀔 때 0.05~0.1초 앞 그림과 섞어 넘기므로 바뀐 직후 칸은 섞기 그림)
//  ④ 같은 상태 연속 두 칸 몸 키 튐 >30% 가 2% 이하(달리기 공중 칸·자세 차이는 15~25% 라 30% 로 본다), 그리기 값 유한
const fs=require('fs');const all=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
let n=0,bad=0;const ok=(c,m)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m);};
const HIT=/hit|hurt/i,KEEP=['seoha','neon','michaela','lauren','gunner','ego'];
const POOL={atk:[],sk:[]};
const st=x=>x.sk>0||x.ul>0?'skill':x.aa>0?'atk':x.hu>0?'hurt':x.da>0?'dash':x.mv?'walk':'idle';
for(const [h,R] of Object.entries(all)){const r=R.filter(x=>x.src);if(r.length<50){console.log('NOTE',h,'몸 그림 표본 부족',r.length,'(페르소나는 그리기 뒤 단계에서 몸을 바꿔 이 수집기로 못 잼)');continue;}
 const frac=a=>a.length?a.filter(x=>HIT.test(x.src)).length/a.length:0;
 const cA=x=>x.hu>0&&x.aa>0&&!(x.sk>0||x.ul>0||x.da>0||x.gd),cS=x=>x.hu>0&&(x.sk>0||x.ul>0)&&!(x.da>0||x.gd),cH=x=>x.hu>0&&!(x.aa>0||x.sk>0||x.ul>0||x.da>0||x.gd);
 const steady=c=>{const out=[];let since=null;for(const x of r){if(c(x)){if(since===null)since=x.t;if(x.t-since>.1-1e-6)out.push(x);}else since=null;}return out;};
 const atk=steady(cA),sk=steady(cS),hu=steady(cH);
 POOL.atk.push(...atk);POOL.sk.push(...sk);
 if(atk.length>=5)ok(frac(atk)<=.10,`① ${h}: 기본공격 중 맞아도 공격 모션(피격 그림 ${(frac(atk)*100).toFixed(0)}%, n=${atk.length})`);
 if(sk.length>=5)ok(frac(sk)<=.10,`② ${h}: 스킬 중 맞아도 스킬 모션(피격 그림 ${(frac(sk)*100).toFixed(0)}%, n=${sk.length})`);
 if(KEEP.includes(h)&&hu.length>=5)ok(frac(hu)>=.80,`③ ${h}: 맞기만 할 땐 피격 그림 그대로(${(frac(hu)*100).toFixed(0)}%, n=${hu.length})`);
 let pairs=0,jumps=0;for(let i=1;i<r.length;i++){const a=r[i-1],b=r[i];if(a.visH==null||b.visH==null||st(a)!==st(b)||b.t-a.t>.2)continue;pairs++;const q=(b.visH/b.z)/(a.visH/a.z);if(q>1.3||q<1/1.3)jumps++;}
 ok(pairs<20||jumps/pairs<=.02,`④ ${h}: 같은 상태 연속 칸 몸 키 튐 >30% ${jumps}/${pairs}`);
 ok(R.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)&&(x.H==null||Number.isFinite(x.H))),`④ ${h}: 그리기 값 유한`);}
{const f=a=>a.length?a.filter(x=>HIT.test(x.src)).length/a.length:0;
 ok(POOL.atk.length>=10&&f(POOL.atk)<=.10,`① 전체: 기본공격 중 맞아도 공격 모션(피격 그림 ${(f(POOL.atk)*100).toFixed(0)}%, n=${POOL.atk.length})`);
 ok(POOL.sk.length>=10&&f(POOL.sk)<=.10,`② 전체: 스킬 중 맞아도 스킬 모션(피격 그림 ${(f(POOL.sk)*100).toFixed(0)}%, n=${POOL.sk.length})`);}
console.log(JSON.stringify({total:n,failed:bad,headless:true}));process.exit(bad?1:0);
