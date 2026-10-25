/* Local ZIP test launcher only. The engine, story rules and save format are unchanged. */
(()=>{'use strict';
 const prefix='storyworld.hospital-three-pc.maze.v11:';
 const wrap=document.createElement('div');wrap.id='hospitalDirectLauncher';
 wrap.style.cssText='position:fixed;z-index:12000;bottom:20px;left:50%;transform:translateX(-50%);padding:12px 18px;background:#17232bef;border:1px solid #b6a16a;border-radius:8px;text-align:center;color:#fff;max-width:90vw';
 const button=document.createElement('button');button.id='hospitalDirectStart';button.textContent='병원 바로 시작';button.disabled=true;button.style.cssText='font-size:18px;padding:12px 24px;cursor:pointer';
 const status=document.createElement('div');status.id='hospitalDirectStatus';status.style.cssText='font-size:12px;margin-top:8px';status.textContent='병원 직행 테스트 · 별도 저장 · 초기 자료 준비 중';
 /* R84_SETTINGS_NATIVE_ACTION */
 wrap.append(button,status);let busy=false;
 function sync(){if(!busy)button.disabled=!booted||loading;}
 async function start(){
  if(busy||!booted||loading)return false;
  if(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix!==prefix)throw Error('테스트 저장 분리를 확인하지 못했습니다.');
  if((window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')!=='off')throw Error('병원 직행 테스트는 단독 모드입니다.');
  const rendererR84=window.__STORYWORLD_PHASE1__?.controller;
  if(!rendererR84||!rendererR84.inspect().requiredThree||rendererR84.state.failed||!rendererR84.state.three){status.textContent=!rendererR84?'Three.js 런타임 누락':rendererR84.state.failed?'Three.js 실행 실패: '+rendererR84.state.reason:'Three.js 화면 준비 중 · 준비 후 다시 시작하세요';return false;}
  busy=true;button.disabled=true;status.textContent='병원 자료를 읽는 중';
  try{
   const api=window.__STORYWORLD4__,store=window.__STORYWORLD_TEST_STORAGE_B1__.store,text=store.getItem(normalSaveKeyR73());
   let raw;
   if(text){raw=JSON.parse(text);}else{
    // A synthetic, isolated test checkpoint. Mark only the native campaign prefix
    // as completed; the hospital itself, its narrative, waves and boss stay intact.
    raw=JSON.parse(JSON.stringify(api.save()));raw.progress={STORY:{},DREAM:{}};
    const order=window.__STORYWORLD_STORY_PROFILE_R54__.campaignOrder,at=order.indexOf('ep1a08');if(at<0)throw Error('기존 병원 지역을 찾지 못했습니다.');
    for(const id of order.slice(0,at))raw.progress.STORY[id]=true;
    const entry=window.StoryPhase1.HOSPITAL_CORE_B2.starts[1];raw.zone='ep1a08';raw.layer='STORY';raw.player.x=entry.x;raw.player.y=entry.y;raw.auto=false;raw.guide=false;
   }
   // Production restore calls the existing hospital enterRegion pipeline, including
   // validators, assets, safe placement, native narrative and save-slot wrappers.
   if(await api.restore(raw)===false)throw Error('병원 테스트 진행을 불러오지 못했습니다.');
   if(zone!=='ep1a08'){
    if(await api.entry('ep1a08',{restore:true,layer:'STORY'})!==true)throw Error('기존 병원 진입에 실패했습니다.');
   }
   const rendererFailureR83=window.__STORYWORLD_PHASE1__?.controller?.state;if(rendererFailureR83?.failed)throw Error('Three.js 화면 오류: '+rendererFailureR83.reason);if(room?.id!=='ep1a08'||!room.exploration?.hospitalDoorsB3)throw Error('병원 진입 상태를 확인하지 못했습니다.');
   status.textContent='병원 테스트 시작';wrap.hidden=true;return true;
  }catch(error){status.textContent='시작 실패: '+error.message;throw error;}finally{busy=false;sync();}
 }
 button.onclick=()=>start().catch(error=>console.error('Hospital direct test:',error));
 window.__STORYWORLD_HOSPITAL_DIRECT_R84__=Object.freeze({container:wrap,button,status,start,sync});
 setInterval(sync,250);sync();
})();
