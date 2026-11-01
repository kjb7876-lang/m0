// R198 CPU check: Drive 8키 묶음 → 게임에 없던 이동·공격·대기 2장 스트립만, 기존 줄은 덮지 않음, 해시·출처 기록, R109 로더 연결.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.join(__dirname,'..','..'),A=f=>path.join(R,'runtime-text','assets',f),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ix=JSON.parse(fs.readFileSync(A('r198/mobs/index.json'),'utf8')),T=ix.tracks;
ok('13 tracks: move/attack/idle only, 2 frames each, visible height 150',T.length===13&&T.every(t=>['move','attack','idle'].includes(t.track)&&t.frames===2&&t.visibleHeight===150),T.map(t=>t.group+'-'+t.track));
ok('every strip hash/size matches and cell*2 = image width',T.every(t=>{const b=fs.readFileSync(path.join(R,'runtime-text',t.path));const w=b.readUInt32BE(16),h=b.readUInt32BE(20);return b.length===t.bytes&&sha(b)===t.sha256&&w===t.cell[0]*2&&h===t.cell[1];}));
ok('Drive provenance recorded (zip sha256 + original frame sha256 per strip)',T.every(t=>t.source.zips.length&&t.source.zips.every(z=>/^[0-9a-f]{64}$/.test(z.sha256))&&t.source.frames.length===2&&t.source.frames.every(f=>/^[0-9a-f]{64}$/.test(f.sha256))));
const r92=JSON.parse(fs.readFileSync(A('r92/mobs/index.json'),'utf8')).groups,have={};
for(const [g,v] of Object.entries(r92))for(const k of Object.keys(v.tracks||{}))(have[g]=have[g]||new Set()).add(k);
for(const p of ['r109/mobs/index.json','r116/mobs/index.json'])for(const t of JSON.parse(fs.readFileSync(A(p),'utf8')).tracks)(have[t.group]=have[t.group]||new Set()).add(t.track);
ok('no strip duplicates a motion the game already had (R92/R109/R116 untouched)',T.every(t=>!(have[t.group]&&have[t.group].has(t.track))),T.filter(t=>have[t.group]?.has(t.track)).map(t=>t.group+'-'+t.track));
ok('every strip names the mob ids it applies to',T.every(t=>t.ids.length>0));
ok('held motions listed with a reason (M005 move missing, M024 move / M033 idle height jump)',ix.skipped.length===3&&ix.skipped.every(s=>s.why));
const S=C('mobs-r109.js');
ok('mobs-r109 loads the R198 index and only fills empty slots',/R198='\.\/assets\/r198\/mobs\/index\.json'/.test(S)&&/if\(row\[tr\]\)continue;/.test(S)&&/get\(R198\)/.test(S));
ok('runtime copy matches',RT('mobs-r109.js')===S);
ok('runtime manifest lists the strips',fs.readFileSync(path.join(R,'runtime-manifest.json'),'utf8').includes('assets/r198/mobs/M036-attack.png'));
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');
