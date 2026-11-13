// R963 무한 생존: 곡 소개 쪽지(R313 #r331BgmNote, 화면 위 가운데 64px, 7초)가 생존 안내 줄(#r600Hud, 70px / 보스 막대가 있으면 100px)과
//  같은 자리에 겹쳐 두 글이 모두 안 읽히던 것(11-12 실입력 플레이 화면에서 확인) → 생존 중에는 쪽지를 안내 줄 아래로 내린다.
//  정적 검사: 생존 CSS 에 그 규칙이 있고, 내린 자리가 안내 줄(글 1줄 + 막대 2개 ≈ 36px)보다 아래인가. 실제 겹침은 r963-note-overlap.mjs(브라우저)가 잰다.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const rd=(d,f)=>fs.readFileSync(path.join(root,d,f),'utf8');
const sv=rd('client-source','survival-r600.js');assert.strictEqual(sv,rd('runtime-text','survival-r600.js'));ok('client-source and runtime copies agree');
const bgm=rd('client-source','hud-bgm-hwando-w-r313.js');
assert(/note\.id='r331BgmNote'/.test(bgm)&&/top:64px/.test(bgm),'R313 note is still #r331BgmNote at top 64px');ok('R313 note id and base position are what this fix assumes');
const hudTop=+(/#r600Hud\{[^}]*top:calc\((\d+)px/.exec(sv)||[])[1],lowTop=+(/#r600Hud\.low\{top:calc\((\d+)px/.exec(sv)||[])[1];
assert(hudTop>0&&lowTop>hudTop,'survival HUD tops readable');ok('survival HUD tops '+hudTop+' / '+lowTop);
const HUD_H=36; // 글 한 줄(12px·줄높이≈18) + 코어 막대(4+7) + 경험 막대(3+3) ≈ 35px — 브라우저 검사가 실측한다
const m=/body\.r600On #r331BgmNote\{top:calc\((\d+)px \+ env\(safe-area-inset-top,0px\)\)!important\}/.exec(sv);
assert(m,'survival CSS moves the BGM note while survival is on (inline top needs !important)');
assert(+m[1]>=hudTop+HUD_H,'note sits below the survival HUD: '+m[1]+' >= '+(hudTop+HUD_H));ok('note moved below the HUD: '+m[1]+'px');
const l=/body\.r600On:has\(#r600Hud\.low\) #r331BgmNote\{top:calc\((\d+)px \+ env\(safe-area-inset-top,0px\)\)!important\}/.exec(sv);
assert(l,'survival CSS also moves the note when the HUD is lowered under the boss bar');
assert(+l[1]>=lowTop+HUD_H,'note sits below the lowered HUD: '+l[1]+' >= '+(lowTop+HUD_H));ok('note moved below the lowered HUD: '+l[1]+'px');
assert(/classList\.toggle\('r600On'/.test(sv),'body.r600On is still toggled by the survival HUD');ok('body.r600On marker present');
console.log('R963 CPU check: '+n+' passed');
