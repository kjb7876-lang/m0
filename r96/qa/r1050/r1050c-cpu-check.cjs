// R1050c CPU check: 공격 중 밀림(엔진 '걷는 중 아님')이 R119 걷기 그림을 부르지 않게(R1050b 환도와 같은 규칙, 라우렌 등 R143 영웅).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const v=C('visual-r119.js');
ok('runtime copy matches',RT('visual-r119.js')===v);
const m=v.match(/function walkTailR1050c\([^)]*\)\{[^\n]*?\}\}?/);
let W=null;if(m){try{W=vm.runInNewContext('('+m[0]+')');}catch(e){}}
ok('R119 defines pure walkTailR1050c',typeof W==='function');
if(typeof W==='function'){
 ok('normal: moved .05s ago, no attack → walking',W(.05,false,0,true)===true);
 ok('semi-auto sidestep without attack (no moving flag) → walking (R134 kept)',W(.05,false,0,false)===true);
 ok('input walk during attack → walking (R895 decides)',W(.05,false,.3,true)===true);
 ok('pushed during attack (engine not moving) → not walking',W(.05,false,.3,false)===false);
 ok('boundary .15s → not walking',W(.15,false,0,true)===false);
 ok('attack over tail → not walking',W(.05,true,.3,true)===false);
 ok('NaN time → not walking; NaN attack treated as none',W(NaN,false,0,true)===false&&W(.05,false,NaN,false)===true);
 ok('moving flag missing keeps old behavior',W(.05,false,.3,undefined)===true);
}
ok('R119 walk decision adds walkTailR1050c with the engine moving flag on top of movingNow',/const walkNow=movingNow&&walkTailR1050c\(0,false,player\.attackAnim,player\.moving\);/.test(v)&&/if\(!walkNow\)\{if\(!busy/.test(v));
// 환도·슬레이어: R440 스킬 동안 휘두르기가 끝났거나 끊긴 뒤에도 공격 마지막 칸, 환도 피격은 스킬을 덮지 않음, 슬레이어 밀림은 걷기 아님
const h=C('hwando-r271.js'),sl=C('slayer-r351.js');
ok('runtime copies hwando/slayer match',RT('hwando-r271.js')===h&&RT('slayer-r351.js')===sl);
ok('R271: sw440 read once per choose',/const sw440=!!window\.__STORYWORLD_SKILL_ATTACK_R440__\?\.swapping\?\.\(\)/.test(h));
ok('R271: skill hold after swing ends or was cut',/if\(sw440&&!moving\)\{const d=aimDir\(\),a=atkOf\(d\);if\(a\)\{S\.dir=d;stats\.skillHold=\(stats\.skillHold\|\|0\)\+1;return draw\(rec,st,best,'attack',d,frameAt\(a\.ms,1e9,false\)\);\}\}/.test(h));
ok('R271: hit reaction does not cover a skill',/if\(S\.hit&&!moving&&!sw440/.test(h));
ok('R271: skill hold comes before hit and walk branches',h.indexOf('if(sw440&&!moving)')<h.indexOf('if(S.hit&&!moving&&!sw440')&&h.indexOf('if(sw440&&!moving)')<h.indexOf(' if(moving){'));
ok('R351: pushed during attack is not walking',/moving=t-S\.movedAt<\.15&&!M\?\.attackOverTail\?\.\(\)\/\* R895 규칙 5 \*\/&&!\(atk>0&&player\.moving===false\)/.test(sl));
ok('R351: skill hold after swing ends or was cut, before walk',/if\(sw440&&!moving\)\{const d=aimSide\(\),SA=clip\('attack',d\)\|\|A;if\(SA\)/.test(sl)&&sl.indexOf('if(sw440&&!moving)')<sl.indexOf(' if(moving){'));
// frameAt(ms,1e9,false) = 마지막 칸(경계)
{const fa=h.match(/function frameAt\([^)]*\)\{[^\n]*?return ms\.length-1;\}/);let F=null;try{F=vm.runInNewContext('('+fa[0]+')');}catch(e){}
 ok('frameAt(…,1e9) is the last frame; NaN-safe',F&&F([50,50,50],1e9,false)===2&&F([50,50,50],0,false)===0&&Number.isInteger(F([50,50],NaN,false)));}
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name);
console.log(`R1050c ${checks.length-fail.length}/${checks.length}`);if(fail.length)process.exit(1);
