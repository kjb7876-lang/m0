// R240 CPU check: 보스·중간보스 근접 공격에도 기 모으기·타격 그림(그 몹 팔레트·지역 모양)을 몸집만큼 키워 쓰고, 타격 순간 발밑 핏빛 균열·어둠 고리를 더한다.
// 777 실측(fxsurvey): 잡몹은 R169 이펙트가 있었지만 보스·중간보스 근접 공격은 공격 그림이 0개였다.
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const src=C('play-r169.js');
ok('runtime copy matches; CI step present',RT('play-r169.js')===src&&/qa\/r240\/r240-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('bosses/midbosses are no longer skipped (only when bossFx is turned off)',/major\(e\)&&!prefs\.bossFx/.test(src)&&/bossFx:true/.test(src)&&!/e\.hp<=0\|\|major\(e\)\|\|/.test(src));
ok('size scale: boss 2, midboss 1.6, other majors 1.8, ordinary 1',/const SC=e=>!major\(e\)\?1:e\.boss\?2:e\.midboss\|\|e\.samongMidR162\?1\.6:1\.8/.test(src));
ok('boss hit adds a ground quake (blood crack + dark ring) drawn in the existing painted sprites',/kind:'quake'/.test(src)&&/S\.draw\('crack'/.test(src)&&/S\.draw\('ring',\{a:\[30,6,10\]/.test(src));
ok('the boss frame animation stays at 1.6 so it does not hide the hero',/k:sc>1\?1\.6:1\.3/.test(src));
ok('effect cap stays bounded (14 ordinary, 18 with majors)',/cap=sc>1\?18:14/.test(src));
const pass=checks.filter(c=>c.pass).length;for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R240 ${pass}/${checks.length}`);if(pass!==checks.length)process.exit(1);
