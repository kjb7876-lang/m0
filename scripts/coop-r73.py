"""Keep public co-op on its existing R63R1 transport during the solo release."""

import hashlib
from pathlib import Path

R71_HTML_SHA256 = 'de6536bca2f3860c7195b39e4f7d1397ff8db7acb1558015f14a95c1b4e16646'


def _script(html, script_id):
    start_tag = f'<script id="{script_id}">'
    start = html.index(start_tag) + len(start_tag)
    end = html.index('</script>', start)
    return start, end, html[start:end]


def _once(source, old, new):
    if source.count(old) != 1:
        raise RuntimeError('R73 solo co-op guard anchor drift: ' + old[:100])
    return source.replace(old, new, 1)


def transform(html):
    _, _, client = _script(html, 'coop-client-r62')
    if client.count("revision='R63R1'") != 1 or 'R73R1' in client:
        raise RuntimeError('Solo release must preserve the existing R63R1 co-op client')

    baseline_path = Path('_r71/docs/index.html')
    if not baseline_path.is_file():
        raise RuntimeError('Pinned R71 co-op transport baseline is required')
    baseline = baseline_path.read_bytes()
    if hashlib.sha256(baseline).hexdigest() != R71_HTML_SHA256:
        raise RuntimeError('Pinned R71 co-op transport HTML hash drift')
    baseline_text = baseline.decode('utf8')
    _, _, legacy_sim = _script(baseline_text, 'coop-sim-r62')
    _, end, current_sim = _script(html, 'coop-sim-r62')
    if 'R73R1' in current_sim or 'mazeR73:' in current_sim:
        raise RuntimeError('R73 protocol fields must not enter the solo release')
    html = html[:html.index('<script id="coop-sim-r62">')] + \
        f'<script id="coop-sim-r62">{legacy_sim}</script>' + \
        html[end + len('</script>'):]

    start, end, golden = _script(html, 'golden-thread-r72')
    golden = _once(golden, "const coop=()=>window.__STORYWORLD_COOP_SIM_R62__,guest=()=>coop()?.mode()==='guest';",
                   "const coop=()=>window.__STORYWORLD_COOP_SIM_R62__,coopMode=()=>coop()?.mode?.()||'off',coopActive=()=>coopMode()!=='off',guest=()=>coopMode()==='guest';")
    golden = _once(golden, ' function dispatch(command,p=local()){\n',
                   " function dispatch(command,p=local()){\n  if(coopActive())return fail('황금실 필살검무의 협동 지원은 추후 업데이트됩니다. 지금은 솔로 플레이에서 사용할 수 있습니다.');\n")
    golden = _once(golden, "if(guest()||!p||!cmd||typeof cmd!=='object')return fail('권한을 확인하세요.');",
                   "if(coopActive()||guest()||!p||!cmd||typeof cmd!=='object')return fail(coopActive()?'황금실 필살검무의 협동 지원은 추후 업데이트됩니다.':'권한을 확인하세요.');")
    golden = _once(golden, "const p=current();if(guest()){if(!coop().inspect().guestInputReady||modal||loading)return false;",
                   "const p=current();if(coopActive()){if(manual)toast('황금실 필살검무의 협동 지원은 추후 업데이트됩니다.',2);return false;}if(guest()){if(!coop().inspect().guestInputReady||modal||loading)return false;")
    golden = _once(golden, "function autoCast(){const p=current();if(!p||!state(p).autoUse||",
                   "function autoCast(){const p=current();if(coopActive()||!p||!state(p).autoUse||")
    golden = _once(golden, "function manage(message=''){\n  if(!started||loading||storyScene)return;",
                   "function manage(message=''){\n  if(coopActive()){toast('황금실 필살검무의 협동 지원은 추후 업데이트됩니다.',2);return;}if(!started||loading||storyScene)return;")
    golden = _once(golden, " function editor(id=null){\n  const d=",
                   " function editor(id=null){\n  if(coopActive()){toast('황금실 필살검무의 협동 지원은 추후 업데이트됩니다.',2);return;}const d=")
    golden = _once(golden, "if(started&&!storyScene){const actions=$('panel')?.querySelector('.actions');",
                   "if(started&&!storyScene&&!coopActive()){const actions=$('panel')?.querySelector('.actions');")
    golden = _once(golden, "actions=$('panel')?.querySelector('.actions');if(actions){const b=document.createElement('button');b.id='goldPassiveOpen';",
                   "actions=$('panel')?.querySelector('.actions');if(actions&&!coopActive()){const b=document.createElement('button');b.id='goldPassiveOpen';")
    golden = _once(golden, "if(started&&!modal&&!loading){e.preventDefault();const r=canvas.getBoundingClientRect();groundAim=unproject",
                   "if(started&&!modal&&!loading&&!coopActive()){e.preventDefault();const r=canvas.getBoundingClientRect();groundAim=unproject")
    golden = _once(golden, "e.target?.matches?.('input,textarea,select,[contenteditable=\"true\"]'))return;e.preventDefault();",
                   "e.target?.matches?.('input,textarea,select,[contenteditable=\"true\"]')||coopActive())return;e.preventDefault();")
    golden = _once(golden, "hud.style.display=started&&!loading&&!modal?'flex':'none';if(started&&player){",
                   "hud.style.display=started&&!loading&&!modal&&!coopActive()?'flex':'none';if(started&&player&&!coopActive()){")
    html = html[:start] + golden + html[end:]

    start, end, saver = _script(html, 'golden-save-r72')
    old = "const exportBase=serializeSave;serializeSave=function(...a){const raw=exportBase.apply(this,a);if(player){raw.goldenR72=C.sanitize(player.goldenR72);raw.goldenR72.readyIn=Math.max(0,Math.min(24,(player.goldenReadyAtR72||0)-time));}return raw;};"
    if saver.count(old) != 1:
        raise RuntimeError('Golden save compatibility anchor drift')
    new = "const exportBase=serializeSave;serializeSave=function(...a){const raw=exportBase.apply(this,a);const mode=window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off';if(mode!=='off'){delete raw.goldenR72;return raw;}if(player){raw.goldenR72=C.sanitize(player.goldenR72);raw.goldenR72.readyIn=Math.max(0,Math.min(24,(player.goldenReadyAtR72||0)-time));}return raw;};"
    saver = saver.replace(old, new, 1)
    return html[:start] + saver + html[end:]
