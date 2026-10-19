"""Scoped upgrades over the pinned R73 runtime; old source packs stay exact."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def once(s,a,b):
    if s.count(a)!=1:raise RuntimeError('R74 combat anchor drift: '+a[:100])
    return s.replace(a,b,1)
def script(html,id,change):
    tag='<script id="'+id+'">';a=html.index(tag)+len(tag);b=html.index('</script>',a)
    return html[:a]+change(html[a:b])+html[b:]
def transform(html):
    html=script(html,'golden-core-r72',lambda s:'\n'+(ROOT/'client-source/golden-core-r74.js').read_text()+'\n')
    html=once(html,"saveGame(false);showUpgrades()});button('upClose'","saveGame(false);window.__STORYWORLD_NATIVE_PASSIVES_R74__.show()});button('upClose'")
    html=once(html,'const oldUpgrades=showUpgrades;',"const oldUpgrades=showUpgrades;window.__STORYWORLD_NATIVE_PASSIVES_R74__=Object.freeze({show:oldUpgrades});")
    html=once(html,"el.onclick=()=>{const u=UPGRADES.find", "el.onclick=()=>{if(!el.isConnected)return;const u=UPGRADES.find")
    def golden(s):
        s=once(s,' const C=StoryGoldenCoreR72,'," let uiKindR74='gold';const uiStateR74=p=>window.__STORYWORLD_DANCES_R74__?.state(uiKindR74,p)||state(p),channelNameR74=()=>uiKindR74==='silver'?'은색실':'황금실';\n const C=StoryGoldenCoreR72,")
        s=once(s,'function dispatch(command,p=local()){',"function dispatch(command,p=local(),kind=uiKindR74){if(window.__STORYWORLD_DANCES_R74__)return window.__STORYWORLD_DANCES_R74__.command(kind,p,command);")
        s=once(s,'function applyCommand(p,cmd){',"function applyCommand(p,cmd){if(window.__STORYWORLD_DANCES_R74__)return window.__STORYWORLD_DANCES_R74__.command('gold',p,cmd);")
        s=once(s,"function cancelAll(reason){", "function cancelAll(reason){window.__STORYWORLD_DANCES_R74__?.cancelAll(reason);")
        s=once(s,'function cast(index=0,aim=null,manual=true){',"function cast(index=0,aim=null,manual=true){if(window.__STORYWORLD_DANCES_R74__)return window.__STORYWORLD_DANCES_R74__.cast('gold',index,aim,manual);")
        s=once(s,'const p=local(),s=state(p);return{s,stats:C.stats(s),p};','const p=local(),s=uiStateR74(p);return{s,stats:C.stats(s),p};')
        s=once(s,"function manage(message=''){", "function manage(message='',kind=uiKindR74){uiKindR74=kind;")
        s=once(s,"['slots','도안 저장칸'],",'')
        s=s.replace('<h2>황금실 필살검무</h2>',"<h2>'+channelNameR74()+'</h2>").replace('황금실 도안 제작',"'+channelNameR74()+' 도안 제작")
        s=once(s,"(key==='equip'?3:1)","(key==='equip'?7:1)")
        s=once(s,"'필살검무 습득 · 1점'","(uiKindR74==='silver'?'은색실 습득 · 기존 실검무 필요':'황금실 습득 · 1점')")
        s=once(s,'(공통 강화 후 최소 6초)','(공통 강화 후 최소 3초)')
        s=once(s,'G: 첫 도안 / Shift+G: 두 번째 / 전투 화면 우클릭 조준 후 G','G: 황금실 연속 / Shift+G: 2번부터 / Ctrl+G: 3번부터 · T: 기본 실검무 또는 장착한 은색실')
        s=once(s,'수치 강화 최대 10단계, 저장칸 3→12개, 장착 1→2개.','도안 7개, 동시장착 해금은 총 7점으로 1→3개. 속도 최대 7단계, 재사용 최소 3초, 피해는 단계 제한 없이 1점씩 강화합니다. 기존 저장칸·초과 속도 투자는 한 번만 포인트로 돌려줍니다.')
        s=once(s,"const run=cmd=>{const r=dispatch(cmd);", "const kindAtOpenR74=uiKindR74,run=cmd=>{const r=dispatch(cmd,p,kindAtOpenR74);")
        s=once(s,"button('goldTest',()=>{closePanel(true);cast(0);});", "button('goldTest',()=>{const k=kindAtOpenR74;closePanel(true);window.__STORYWORLD_DANCES_R74__.cast(k,0);});")
        s=once(s,"function editor(id=null){", "function editor(id=null,kind=uiKindR74){uiKindR74=kind;const editorKindR74=kind;")
        s=once(s,'const d=state(local()).designs.find','const d=uiStateR74(local()).designs.find')
        s=once(s,"const r=dispatch({op:'save',id,name:$('goldName').value,strokes});", "const r=dispatch({op:'save',id,name:$('goldName').value,strokes},local(),editorKindR74);")
        s=once(s,"c.strokeStyle='#efc65e';", "c.strokeStyle=uiKindR74==='silver'?'#dce6f0':'#efc65e';")
        old="b.onclick=()=>manage();actions.appendChild(b);"
        if s.count(old)!=2:raise RuntimeError('R74 management button anchor drift')
        s=s.replace(old,"b.onclick=()=>manage('','gold');actions.appendChild(b);")
        s=once(s,'if(e.altKey)manage();else cast(e.shiftKey?1:0,groundAim);',"if(e.altKey)manage('','gold');else cast(e.ctrlKey?2:e.shiftKey?1:0,groundAim);")
        s=once(s,"<button id=\"goldHudSecond\">2번 도안</button>","<button id=\"goldHudSecond\">2번부터</button><button id=\"goldHudThird\">3번부터</button>")
        s=once(s,"button('goldHudOpen',()=>manage());", "button('goldHudOpen',()=>manage('','gold'));button('goldHudThird',()=>cast(2));")
        s=once(s,"cd=Math.max(0,(p.goldenReadyAtR72||0)-time),b=", "cd=window.__STORYWORLD_DANCES_R74__?.cooldown('gold',p)??Math.max(0,(p.goldenReadyAtR72||0)-time),b=")
        s=once(s,"b.textContent=cd>0?'황금실 '+Math.ceil(cd)+'초':'황금실 발동';", "b.textContent=window.__STORYWORLD_GOLDEN_R72__?.isCasting(p)?'황금실 연속 중':cd>0?'황금실 '+Math.ceil(cd)+'초':'황금실 연속';")
        s=once(s,"$('goldHudSecond').style.display=C.stats(s).equip>1?'':'none';", "$('goldHudSecond').style.display=C.stats(s).equip>1?'':'none';$('goldHudThird').style.display=C.stats(s).equip>2?'':'none';")
        s=once(s,'{state,stats:p=>C.stats(state(p)),manage,editor,cast,',"{state,stats:p=>C.stats(state(p)),manage:()=>manage('','gold'),manageSilver:()=>manage('','silver'),editor:id=>editor(id,'gold'),cast,")
        # Decorate after all editor previews and management handlers are bound.
        anchor="document.querySelectorAll('[data-gold-preview]').forEach(v=>paint(v,s.designs.find(d=>d.id===v.dataset.goldPreview).strokes));"
        s=once(s,anchor,anchor+"window.__STORYWORLD_DANCES_R74__?.decorateManager?.(uiKindR74,()=>manage('',kindAtOpenR74));")
        s=once(s,"uiCleanup=()=>{if(frame)","window.__STORYWORLD_DANCES_R74__?.decorateEditor?.(cv,()=>strokes,rows=>{finish();strokes=rows;redo=[];draw();});uiCleanup=()=>{if(frame)")
        s=once(s,"strokes.reduce((n,s)=>n+s.length,0)+' / 2048 입력점';}","strokes.reduce((n,s)=>n+s.length,0)+' / 2048 입력점';window.__STORYWORLD_DANCES_R74__?.refreshEditorTools?.(cv,strokes.length);}")
        return s
    html=script(html,'golden-thread-r72',golden)
    def silver(s):
        s=once(s,"if(window.__STORYWORLD_GOLDEN_R72__?.isCasting(p))return false;", "if(coopMode()==='off'&&window.__STORYWORLD_DANCES_R74__?.customSilver(manual))return true;")
        s=once(s,"&&time>=cooldownR66.deadline(p));", "&&time>=cooldownR66.deadline(p)&&!(coopMode()==='off'&&window.__STORYWORLD_DANCES_R74__?.nativeActive(p)));" )
        s=once(s,'function strike(p,roomAt,target,origin,seq,hitIndex,skillRank,castState,targetIndex,owned){', 'function strikeLegacyR74(p,roomAt,target,origin,seq,hitIndex,skillRank,castState,targetIndex,owned){')
        anchor=' function cast(manual=false){'
        helper=" function strike(...a){const api=window.__STORYWORLD_DANCES_R74__;return coopMode()==='off'&&api?api.nativeStrike(a[0],a[1],a[7],()=>strikeLegacyR74(...a)):strikeLegacyR74(...a);}\n function deferredThreadR74(p,castState,fn){const api=window.__STORYWORLD_DANCES_R74__;return coopMode()==='off'&&api?api.nativeStrike(p,room,castState,fn):fn();}\n"
        helper+=" function threadDelayR74(castState,seconds,fn,actor){const api=window.__STORYWORLD_DANCES_R74__;return coopMode()==='off'&&api?api.scheduleNative(castState.motionTokenR74,seconds,fn,actor):delay(seconds,fn,actor); }\n"
        s=once(s,anchor,helper+anchor)
        s=once(s,'const spot=nearestFree(target,origin,seq+hitIndex);',"const spot=nearestFree(target,coopMode()==='off'?{x:p.x,y:p.y}:origin,seq+hitIndex);")
        s=once(s,'if(!blocked(x,y,.27)&&distance({x,y},e)<2)',"if(!blocked(x,y,.27)&&distance({x,y},e)<2&&(coopMode()!=='off'||clearPath3(from,{x,y},.27)))")
        s=once(s,"};cooldownR66.start(p);p.threadDanceAtR63=time;", "};if(coopMode()==='off')castState.motionTokenR74=window.__STORYWORLD_DANCES_R74__?.nativeBegin(p,roomAt,initial);cooldownR66.start(p);p.threadDanceAtR63=time;")
        s=once(s,'const at=ti*.22+h*.075;',"const at=coopMode()==='off'?(ti*hitCount+h)*.34:ti*.22+h*.075;")
        s=once(s,'delay(last+.22,()=>withActor(p,()=>{',"delay(last+(coopMode()==='off'?.34:.22),()=>{if(coopMode()==='off'&&window.__STORYWORLD_DANCES_R74__)return window.__STORYWORLD_DANCES_R74__.nativeFinish(p,castState.motionTokenR74);return withActor(p,()=>{")
        s=once(s,"p.y=initial.y;p.moving=false;}}),p.coopIdR62||'threadDanceR63');", "p.y=initial.y;p.moving=false;}});},p.coopIdR62||'threadDanceR63');")
        s=once(s,'delay(strikeIndex*.035,()=>withActor(p,()=>{', 'delay(strikeIndex*.035,()=>deferredThreadR74(p,castState,()=>withActor(p,()=>{')
        s=once(s,"hitEnemy(target,perHit/3,damageEvent);}),p.coopIdR62", "hitEnemy(target,perHit/3,damageEvent);})),p.coopIdR62")
        s=once(s,'delay(.04,()=>withActor(p,()=>{', 'delay(.04,()=>deferredThreadR74(p,castState,()=>withActor(p,()=>{')
        s=once(s,"hitEnemy(secondary,base*.35,linked);}),p.coopIdR62", "hitEnemy(secondary,base*.35,linked);})),p.coopIdR62")
        for start in ['at,()=>strike','strikeIndex*.035,()=>deferredThreadR74','.04,()=>deferredThreadR74',"last+(coopMode()==='off'?.34:.22),()=>{"]:
            s=once(s,'delay('+start,'threadDelayR74(castState,'+start)
        return s
    html=script(html,'campaign-combat-r63r1',silver)
    # R71 bosses round their public base to a 666 suffix. Increase that exact
    # public value; ordinary enemies multiply the existing tier factor once.
    html=once(html,'const factor=TIERS[validTier(tier)].hp,oldFactor=',
              "const factor=TIERS[validTier(tier)].hp*(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.cosmicGuardianR63?1:1.66),oldFactor=")
    html=once(html,'const target=healthR71BossSuffix(canonical);','const target=healthR71BossSuffix(canonical)*1.66;')
    for old,new in [('기본 적 체력 20%','일반 적 기본 체력 33.2%'),('기본 적 체력 25%','일반 적 기본 체력 41.5%'),('기본 적 체력 40%','일반 적 기본 체력 66.4%')]:
        html=once(html,old,new)
    html=once(html,'적 기본 체력과 받는 피해, 첫 클리어 포인트가 표시된 값으로 적용됩니다.',
              '일반 적과 보스 체력은 이전 공개판보다 66% 높습니다. 난이도별 일반 적 기본 체력과 받는 피해, 첫 클리어 포인트가 표시된 값으로 적용됩니다.')
    html=once(html,'Math.round(TIERS[mapMode()].hp*100)', '(TIERS[mapMode()].hp*166).toFixed(1)')
    html=once(html,"['실검무',()=>window.__STORYWORLD_THREAD_DANCE_R63__?.cast(true),","[window.__STORYWORLD_DANCES_R74__?.state('silver')?.equipped?.length?'은색실':'기본 실검무',()=>window.__STORYWORLD_THREAD_DANCE_R63__?.cast(true),")
    html=once(html,"name:'실검무 · 은실의 분기',icon:'haste',text:'","name:'실검무 · 은실의 분기',icon:'haste',text:'기본 실검무 습득 후 은색실 편집기로 직접 그린 궤적을 별도 저장·장착할 수 있습니다. T와 실검무 버튼은 장착한 은색실을 우선 사용하며, 장착 해제 시 기존 기본 동작으로 돌아갑니다. " )
    html=once(html,'if(distance(player,exitPoint(d))<.85){travel(d);break}',
              'if(distance(player,exitPoint(d))<.85&&!window.__STORYWORLD_DANCES_R74__?.moving(player)){travel(d);break}')
    html=once(html,"window.__STORYWORLD_GOLDEN_R72__?.cancelAll('coop-start');", "window.__STORYWORLD_DANCES_R74__?.cancelAll('coop-start');window.__STORYWORLD_GOLDEN_R72__?.cancelAll('coop-start');")
    return html
