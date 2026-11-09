// R446 CPU check — 벽 윗선 한 높이·문틀 2.4(벽이 문 위를 감쌈)·상인방 윗면·벽 밖 빈 공간 검게.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
for(const f of ['world-doors-r83.js','doors-fit-r413.js','play-r115.js','world-presentation-r81.js']){const s=C(f);ok(f+': runtime copy matches',RT(f)===s);try{new vm.Script(s);ok(f+': syntax',true);}catch(e){ok(f+': syntax '+e.message,false);}}
const d83=C('world-doors-r83.js');
ok('R83: no fixed HEIGHT/LEAF left, door height comes from DH()',!/\bHEIGHT\b/.test(d83)&&!/\bLEAF\b/.test(d83)&&(d83.match(/DH\(\)/g)||[]).length>=10);
// DH: 일반 지역 2.4, 병원 ep1a08 2.7, 끄면 2.7
const dh=(id,off)=>{const m=d83.match(/let r446=true;[^\n]*\n const DH=[^\n]*\n/);const sb={room:id?{id}:null,localStorage:{getItem:()=>off?'{"on":false}':null},JSON,out:0};vm.createContext(sb);vm.runInContext(m[0].replace(/\bconst DH/,'DH')+'out=DH();',sb);return sb.out;};
ok('door frame 2.4 in story rooms',dh('ep1b02')===2.4&&dh('kair02')===2.4);
ok('hospital ep1a08 keeps 2.7',dh('ep1a08')===2.7);
ok('switch off → 2.7',dh('ep1b02',true)===2.7);
ok('R83 exposes doorHeight for R413',/doorHeight:\(\)=>DH\(\)/.test(d83));
const d413=C('doors-fit-r413.js');
ok('R413 lintel starts at the R83 door height',/DOOR_H=Number\(T\?\.doorHeight\?\.\(\)\)\|\|2\.7/.test(d413)&&!/const REV=[^\n]*DOOR_H=2\.7/.test(d413));
ok('R446 3D lintel: clones the parallel jamb wall mesh (same material), shrinks to door span, door top → wall top, falls back to the 2D band',/function lintel3d\(/.test(d413)&&/if\(lintel3d\(r,L,d,top,DOOR_H\)\)return true;/.test(d413)&&/new t\.T\.Mesh\(g,m0\.material\)/.test(d413)&&/m\.position\.set\(d\.x,DH\+hgt\/2,d\.y\)/.test(d413));
ok('R446 3D lintel cache follows its source jamb (rebuilt wall row or swapped fade material) instead of keeping a stale material; set(false) removes cached lintels',/r446SrcId:src\.w\.id/.test(d413)&&/t\.wallRows\.get\?\.\(have\.userData\.r446SrcId\)\?\.mesh===hs/.test(d413)&&/if\(have\.material!==hs\.material\)have\.material=hs\.material;/.test(d413)&&/function set\(v\)\{on=v!==false;if\(!on\)\{try\{clear3d\(\);L3room=null;/.test(d413));
ok('R446 3D lintel only from walls parallel to the door, unrotated',/if\(spanX\?!\(w\.width>w\.depth\):!\(w\.depth>w\.width\)\)continue;/.test(d413)&&/if\(alongX!==spanX\)return false;/.test(d413));
ok('R446 3D lintels cleared when the room changes',/room\?\.exploration!==L3room\)\{clear3d\(\)/.test(d413));
const p115=C('play-r115.js');
ok('R115: one wall top (max(h0,2.85)), no ±18% jitter or door spikes while R446 is on; hospital untouched',/if\(r446Flat&&room\?\.id!=='ep1a08'\)h=Math\.max\(h0,DOOR\+\.15\);/.test(p115));
const w81=C('world-presentation-r81.js');
ok('void roof caps near black (not hospital core)',/if\(r446Void&&!L\.hospitalCoreB2\)m\.color\.setRGB\(\.011,\.0095,\.009\)/.test(w81));
ok('ground void plane near black every frame (not hospital core)',/voidMaterialR81\.color\.setHex\(r446Void&&!L\.hospitalCoreB2\?0x0d0b0b:0x817985\)/.test(w81));
ok('one off switch storyworld.r446.walls in all three',[d83,p115,w81].every(s=>/storyworld\.r446\.walls/.test(s)));
ok('presentation only: no collision/door-state writes added',![d83,d413,w81].some(s=>/\.walls\s*=[^=]|floorCells\s*=[^=]|\.open\s*=[^=]/.test(s.split('R446')[1]||'')));
console.log(bad?bad+' failed':'all '+n+' passed');process.exit(bad?1:0);
