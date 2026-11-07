// SW-0004 / R374: natural locomotion for actors with no walking frames.
// The initial shadow prototype failed readability review. Use the user's allowed
// dash alternative: a short gather and burst, with existing attack/idle artwork.
// No new effects, damage, invulnerability, speed stat, authored assets or save data.
// R230/R268/R286 ask canRelocate BEFORE changing coordinates, including RAF moves.
(() => {
  'use strict';
  if (window.__STORYWORLD_MOB_SHADOW_R374__) return;
  const KEY = 'storyworld.r374.shadow', HOLD = .18, BURST = .18, SAMPLE = .08, MAX_SAMPLES = 128;
  let on = true, states = new WeakMap();
  try { on = localStorage.getItem(KEY) !== '0'; } catch (_) {}
  const stats = { gathers: 0, bursts: 0, poses: 0, admitted: 0, blocked: 0, errors: 0 };
  let lastError = null;
  const fail = e => { stats.errors++; lastError = String(e?.message || e).slice(0, 160); };
  const now = () => typeof time === 'number' ? time : 0;
  const currentRoom = () => typeof room === 'object' ? room : null;
  function solo() {
    try { const m = window.__STORYWORLD_COOP_SIM_R62__?.mode?.(); return !m || m === 'off'; }
    catch (_) { return false; }
  }
  function excluded(e) {
    return !e || !(e.hp > 0) || e.spawnState !== 'active' || e.visible === false || e.disabled ||
      e.boss || e.midboss || e.persona || e.cosmic || e.trial || e.samongBoss || e.combatProfile?.major ||
      e.elite === 'boss' || /중간보스/.test(String(e.name || '')) ||
      e.stationary || e.r75Tower || e.r170Tower || e.turret || e.rooted || e.immobile || e.r251Circle ||
      e.r193Doll || e.r74Monster || (Number.isFinite(e.speed) && e.speed <= 0) ||
      (typeof zone !== 'undefined' && zone === 'ep1a08');
  }
  // Resolve current renderer precedence, including lazy R363 tags. An installed
  // walk sheet must disable fallback immediately, not after a cached timeout.
  function kindOf(e) {
    if (excluded(e)) return null;
    if (window.__STORYWORLD_MOB_ART_VARIANTS_R306__?.inspect?.().mode === 'pixel') return null;
    const U = window.__STORYWORLD_MOB_UNIQUE_R248__;
    if (U?.inspect?.().prefs?.on !== false && U?.sheetFor?.(e)) return null;
    const L = window.__STORYWORLD_MOB_LEGACY_R363__;
    if (L?.inspect?.().prefs?.on !== false && L?.rows && Object.values(L.rows).some(r =>
      r.nativeId === e.nativeId && r.name === (U?.baseName?.(e.name) || e.name))) return null;
    if (e.r200Shade || e.r208Mob || window.__STORYWORLD_STORY_MOBS_R208__?.assign?.(e)) return null;
    const M = window.__STORYWORLD_MOBS_R109__;
    if (!M?.trackFor || M.inspect?.().state !== 'ready' || M.prefs?.().frames === false) return null;
    const art = window.__STORYWORLD_DRIVE_ART_R105__?.artFor?.(e);
    if (art) return String(art).replace(/^\.\//, '') === 'assets/r105/drive/mob-paper-figure.webp' ? null : 'static';
    const t = M.trackFor(e);
    if (t?.move && (t.move.frames == null || Number(t.move.frames) > 1)) return null;
    if (!t && e.profile?.frames?.move && e.profile.frames.move !== e.profile.frames.idle) return null;
    return t?.attack ? 'attack-only' : t?.idle ? 'idle-only' : 'static';
  }
  const radius = e => Math.max(.3, Number(e.combatProfile?.bodyBlock?.r) || .3);
  function free(e, x, y, r) {
    return Number.isFinite(x + y) && typeof blocked === 'function' && !blocked(x, y, radius(e), r);
  }
  function pathSafe(e, a, b, r = currentRoom()) {
    const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / SAMPLE));
    if (!Number.isFinite(d) || n > MAX_SAMPLES || !free(e, a.x, a.y, r)) return false;
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      if (!free(e, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, r)) return false;
    }
    return true;
  }
  function canRelocate(e, to) {
    if (!on || !solo()) return true;
    try {
      if (!kindOf(e)) return true;
      const r = currentRoom();
      let ok = !!r && pathSafe(e, e, to, r);
      if (ok && typeof player === 'object' && player && Math.hypot(to.x - player.x, to.y - player.y) < radius(e) + .25) ok = false;
      // Relocation destinations must not overlap a live actor. This is checked
      // only for the bounded special moves, never in every ordinary path sample.
      if (ok && Math.hypot(to.x - e.x, to.y - e.y) > .25) {
        for (const other of r.enemies || []) if (other !== e && other.hp > 0 && other.spawnState === 'active' &&
            Math.hypot(to.x - other.x, to.y - other.y) < radius(e) + radius(other)) { ok = false; break; }
      }
      stats[ok ? 'admitted' : 'blocked']++;
      return ok;
    } catch (err) { fail(err); return false; }
  }
  function paused() {
    return (typeof started !== 'undefined' && !started) || (typeof loading !== 'undefined' && loading) ||
      (typeof modal !== 'undefined' && modal) || (typeof storyScene !== 'undefined' && storyScene) ||
      typeof player !== 'object' || !player || !(player.hp > 0);
  }
  const busy = e => !!(e.attack || e.rangedWindup > 0 || e.hitTimer > 0 || e.rest > 0 || e.r268Dash || e.r286?.mode);
  function stateFor(e) {
    const r = currentRoom(), t = now();
    let s = states.get(e);
    if (!s || s.room !== r || t < s.at || t - s.at > .12 || Math.hypot(e.x - s.x, e.y - s.y) > .35) {
      s = { room: r, at: t, x: e.x, y: e.y, phase: 'gather', age: 0, credit: 0 };
      states.set(e, s); stats.gathers++;
    }
    s.at = t; return s;
  }
  if (typeof moveAI3 === 'function') {
    const base = moveAI3;
    moveAI3 = function (e, goal, dt, ...args) {
      if (!on || !solo() || paused() || !kindOf(e) || !(dt > 0) || dt > .1 || busy(e)) {
        if (e) states.delete(e);
        return base.call(this, e, goal, dt, ...args);
      }
      const s = stateFor(e);
      if (Math.hypot(goal.x - e.x, goal.y - e.y) < .1) { states.delete(e); return base.call(this, e, goal, dt, ...args); }
      if (s.phase === 'gather') {
        s.credit += dt; s.age += dt;
        e.moving = false; e.moveDX = e.moveDY = 0;
        if (s.age + 1e-8 >= HOLD) { s.phase = 'burst'; s.age = 0; stats.bursts++; }
        return;
      }
      // Repay only time accumulated by actual engine movement requests. Over a
      // complete cycle the base AI receives exactly the original total dt.
      const extra = s.credit * Math.min(1, dt / Math.max(dt, BURST - s.age));
      s.credit = Math.max(0, s.credit - extra); s.age += dt;
      const before = { x: e.x, y: e.y };
      const result = base.call(this, e, goal, dt + extra, ...args);
      // Use the engine nav path, but sweep the resulting step with its full body
      // radius so accelerated steps cannot cut diagonally through a corner.
      if (free(e, before.x, before.y, s.room) && !pathSafe(e, before, e, s.room)) {
        e.x = before.x; e.y = before.y; e.moving = false; e.moveDX = e.moveDY = 0; e.nav = [];
        states.delete(e); stats.blocked++; return result;
      }
      s.x = e.x; s.y = e.y;
      if (!e.moving) { states.delete(e); return result; }
      if (s.age + 1e-8 >= BURST) { s.phase = 'gather'; s.age = 0; stats.gathers++; }
      return result;
    };
  }
  function motion(e) {
    if (!on || !solo() || !kindOf(e) || busy(e)) return null;
    const s = states.get(e);
    return s && s.room === currentRoom() && now() >= s.at && now() - s.at <= .12 ? s : null;
  }
  if (typeof drawEnemy === 'function') {
    const base = drawEnemy;
    drawEnemy = function (e, ...args) {
      const s = motion(e), k = s && kindOf(e);
      if (!s || k !== 'attack-only') return base.apply(this, [e, ...args]);
      const hadAttack = Object.prototype.hasOwnProperty.call(e, 'attack');
      const attack = e.attack, moving = e.moving, sh = e.combatProfile?.attackShape || {};
      const w = Math.max(.05, Number(sh.windup) || .3);
      // Render-only pose: never call strike, enemyShot, hurt, or create a real
      // attack. R109 supplies the already-authored attack strip for this enemy.
      const angle = Math.atan2((e.moveDY || 0), (e.moveDX || 0));
      // Stop before the strike frame: locomotion may gather/brace, but must not
      // advertise a hit that gameplay never makes. Real attacks keep all frames.
      e.attack = { elapsed: s.phase === 'gather' ? s.age / HOLD * w * .98 : w * .98,
        angle, committed: true, struckQuality: true, id: -374, shape154: sh, origin154: { x: e.x, y: e.y }, r286Fake: true };
      e.moving = false; stats.poses++;
      try { return base.apply(this, [e, ...args]); }
      finally { if (hadAttack) e.attack = attack; else delete e.attack; e.moving = moving; }
    };
  }
  // Drop movement credit when combat/pause/room transition interrupts locomotion.
  if (typeof tick === 'function') {
    const base = tick;
    tick = function (...args) {
      const r = currentRoom(), t = now();
      const result = base.apply(this, args);
      if (!on || paused() || r !== currentRoom() || now() < t) states = new WeakMap();
      else for (const e of r?.enemies || []) if (busy(e) || excluded(e)) states.delete(e);
      return result;
    };
  }
  window.__STORYWORLD_MOB_SHADOW_R374__ = Object.freeze({
    revision: 'R374-visible-dash-3', kindOf, pathSafe, canRelocate,
    motion: e => { const s = motion(e); return s ? { phase: s.phase, age: s.age, credit: s.credit } : null; },
    set(v) { on = v !== false; states = new WeakMap(); try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (_) {} return on; },
    inspect: () => ({ on, existingArtOnly: true, constants: { HOLD, BURST, SAMPLE, MAX_SAMPLES }, stats: { ...stats }, lastError })
  });
})();
