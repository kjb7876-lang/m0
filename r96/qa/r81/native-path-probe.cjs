'use strict';
const {createHarness}=require('../harness.cjs');
(async()=>{
 const h=createHarness({timeoutMs:60000});const run=s=>h.run(s);console.log('boot',await h.boot());
 console.log('new',await run("newGame('hwando')"));run('for(let i=0;i<30&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;');
 console.log('state',run('({zone,started,modal,storyScene:storyScene?.key,loading,canTravel:canTravel(),errors})'));
 console.log('activate',await run("__STORYWORLD_CHEAT777__.activate('777')"));
 console.log('go',await run("__STORYWORLD_CHEAT777__.go('dist01','STORY')"));console.log('pending',run('__STORYWORLD_PROGRESSION_R71__.difficultyState()'));
 console.log('select',run("__STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal')"));
 console.log('confirm',await run('__STORYWORLD_PROGRESSION_R71__.confirmDifficulty()'));
 run('for(let i=0;i<30&&storyScene;i++)advanceScene();if(modal)closePanel(true);');
 console.log('entered',run('({zone,room:room?.id,started,loading,modal,storyScene:storyScene?.key,enemies:room?.enemies?.length,canTravel:canTravel(),errors})'));
 console.log('frame',run('(()=>{const f=__STORYWORLD_PHASE1__.capture();return{keys:Object.keys(f),zone:f.zone,hero:f.hero,entities:f.entities?.slice(0,2),exploration:f.exploration?.type,ready:f.ready}})()'));
 console.log('logs',h.logs.filter(x=>x[0]==='error'));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
