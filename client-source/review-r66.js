/* R66: deterministic combat changes and allocation-bounded helpers.
 * No new animation loop, interval, global prototype patch, or save schema. */
(() => {
  'use strict';
  if (window.__STORYWORLD_R66__) return;
  const REVISION = 'R66-EGO-PERF';
  function isEgo(p) {
    return !!(p && (p.ego > 0 || (typeof isEgoVisit151 === 'function' && isEgoVisit151())));
  }
  function createCooldownTracker({now, isActive, normal = 20, active = 4}) {
    if (typeof now !== 'function' || typeof isActive !== 'function' || !(normal > 0 && active > 0 && active <= normal)) throw new TypeError('Invalid cooldown configuration');
    const actors = new WeakMap();
    function row(p) {
      if (!p || typeof p !== 'object') throw new TypeError('Cooldown requires an actor');
      const time = Number(now());
      if (!Number.isFinite(time)) throw new TypeError('Invalid simulation clock');
      const awake = !!isActive(p);
      let state = actors.get(p);
      if (!state) { state = {at: time, deadline: time, awake}; actors.set(p, state); }
      // Restoring/restarting a simulation must not inherit a future deadline.
      if (time < state.at - 1e-8) state.deadline = time;
      // One transition clamp, not repeated multiplication on every query.
      if (awake && !state.awake) state.deadline = Math.min(state.deadline, time + active);
      state.at = time;
      state.awake = awake;
      return state;
    }
    return Object.freeze({
      deadline(p) { return row(p).deadline; },
      start(p) { const s = row(p); s.deadline = s.at + (s.awake ? active : normal); return s.deadline; },
      remaining(p) { const s = row(p); return Math.max(0, s.deadline - s.at); },
      period(p) { return isActive(p) ? active : normal; }
    });
  }
  function hasTargets(candidates, actor, range, distance) {
    for (const e of candidates) if (e && e.hp > 0 && !e.deadRecorded && distance(actor, e) <= range) return true;
    return false;
  }
  function selectTargets(candidates, actor, range, distance) {
    const rows = [];
    for (let i = 0; i < candidates.length; i++) {
      const e = candidates[i];
      if (!e || !(e.hp > 0) || e.deadRecorded) continue;
      const d = distance(actor, e);
      if (d <= range) rows.push({e, d, i});
    }
    rows.sort((a, b) => a.d - b.d || a.i - b.i);
    return rows.map(row => row.e);
  }
  const formatter = new Intl.NumberFormat('ko-KR', {maximumFractionDigits: 0});
  let numberNode = null;
  function updateBossHP(boss) {
    const fill = document.getElementById('bossHP');
    if (!fill || !fill.parentElement || !boss) return false;
    if (!numberNode || !numberNode.isConnected) {
      numberNode = document.getElementById('bossHPNumbersR66');
      if (!numberNode) {
        numberNode = document.createElement('span');
        numberNode.id = 'bossHPNumbersR66';
        Object.assign(numberNode.style, {position:'absolute', inset:'0', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'11px', lineHeight:'18px', fontVariantNumeric:'tabular-nums', textShadow:'0 1px 2px #000,0 -1px 2px #000', pointerEvents:'none', whiteSpace:'nowrap', zIndex:'1'});
        const track = fill.parentElement;
        track.style.position = 'relative';
        track.style.minHeight = '18px';
        track.appendChild(numberNode);
      }
    }
    const maximum = Number.isFinite(boss.maxHp) ? Math.max(0, boss.maxHp) : 0;
    const current = Number.isFinite(boss.hp) ? Math.max(0, Math.min(maximum, boss.hp)) : 0;
    const text = formatter.format(Math.ceil(current)) + ' / ' + formatter.format(Math.ceil(maximum));
    if (numberNode.textContent !== text) numberNode.textContent = text;
    return true;
  }
  window.__STORYWORLD_R66__ = Object.freeze({revision:REVISION, isEgo, createCooldownTracker, hasTargets, selectTargets, updateBossHP, playerBaseMultiplier:2, threadMultiplier:2, normalCooldown:20, egoCooldown:4});
})();
