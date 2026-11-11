// R786 — 사용자 2026-11-11 "모든 것들 기본 체력바 발아래쪽에 둬. 위쪽 말고 아래에 둬야 이미지 안 가리니까. 영웅처럼"
//  몹·중간보스·광폭화 보스(R425 머리 위 줄)·소환물(R251 피의 육망성 진)·탑(R170)·정화의 코어(R170·R162)의 기본 체력 줄은 발 아래(몸 그림 밖)에 둔다.
//  R425 머리 위 줄은 prefs.feetBars=false 로 다시 켤 수 있다. 화면 상단 보스 UI 줄(#bossbar)·생존 코어 줄(이미 발치)은 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
for(const f of ['combat-flow-r425.js','combat-r170.js','summoning-r251.js','samong-play-r162.js']){ok(f+' runtime copy matches client source',RT(f)===C(f));try{new vm.Script(C(f));ok(f+' syntax',true);}catch(e){ok(f+' syntax '+e.message,false);}}
// ① R425 머리 위 줄: 기본 설정으로는 아무도 머리 위로 올리지 않는다
{const src=C('combat-flow-r425.js');const pm=src.match(/\nlet prefs=\{[^\n]*\};/),fm=src.match(/function wantHeadBar\(e,ex\)\{[\s\S]*?\n/);
 ok('prefs default line found',!!pm);ok('wantHeadBar found',!!fm);
 if(pm&&fm){const mk=(o={})=>{const g={enr:e=>!!e.enr};vm.createContext(g);vm.runInContext(pm[0]+';'+fm[0]+';this.f=wantHeadBar;this.prefs=prefs;',g);Object.assign(g.prefs,o);return g;};
  const g=mk(),f=g.f;
  ok('default: feetBars on',g.prefs.feetBars===true);
  ok('default: damaged normal mob bar stays at feet',f({hp:3,maxHp:10},false)===false);
  ok('default: midboss bar stays at feet',f({hp:3,maxHp:10,midboss:true},false)===false);
  ok('default: enraged boss bar stays at feet',f({hp:3,maxHp:10,boss:true,enr:1},false)===false);
  ok('default: calm boss unchanged',f({hp:3,maxHp:10,boss:true},false)===false);
  ok('boundary: dead mob / excluded never moved',f({hp:0,maxHp:10},false)===false&&f({hp:3,maxHp:10},true)===false);
  const h=mk({feetBars:false});ok('feetBars:false restores R425/R596 overhead bars (opt-out)',h.f({hp:3,maxHp:10},false)===true&&h.f({hp:3,maxHp:10,boss:true,enr:1},false)===true);}
 ok('settings key documented',/feetBars/.test(src.split('\n').slice(15,30).join('\n')));}
// ② 따로 그리는 막대: 막대 y 식이 발(q.y) 위가 아니라 아래
const bars=[['combat-r170.js',/const W=hh\*\.55,y=(q\.y.*?),r=/,'tower'],['combat-r170.js',/const W=hh\*1\.5,y=(q\.y.*?),r=/,'purify core (R170)'],['summoning-r251.js',/const W=h\*1\.1,y=(q\.y.*?),r=/,'summoned blood circle'],['samong-play-r162.js',/const W=h\*1\.6,y=(q\.y.*?),r=/,'samong core']];
for(const [f,re,label] of bars){const m=C(f).match(re);ok(label+' bar y expression found',!!m);if(!m)continue;
 for(const [h,z] of [[30,.6],[66,1],[120,2]]){const y=new Function('q','h','hh','zoom','return '+m[1])({y:100},h,h,z);ok(label+' bar at/below the feet (h='+h+', y='+y.toFixed(1)+')',y>=100);}}
// 이름표(소환물): 막대와 같이 발 아래, 몸 위로 안 올라온다
{const m=C('summoning-r251.js').match(/ctx\.fillText\(e\.name,q\.x,([^)]*)\)/);ok('circle name label found',!!m);if(m){const y=new Function('q','h','y','return '+m[1])({y:100},66,100+66*.12);ok('circle name label below feet (y='+y.toFixed(1)+')',y>=100);}}
console.log(JSON.stringify({ok:bad===0,checks:n,failed:bad}));process.exit(bad?1:0);
