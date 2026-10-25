/* StoryVFX v1.1.0 | Standalone, deterministic Canvas2D vector/sprite effects.
 * Coordinates are centered and normalized. render() does not clear the canvas.
 * Sprite images are drawn unchanged; callers own image loading and disposal.
 * No network, timers, DOM dependency, or mutation of effect/image inputs.
 * Copyright 2026. Provided as part of the StoryWorld dynamic-asset package.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StoryVFX = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var TAU = Math.PI * 2, MAX = 96;
  var MOTIFS = ['gold-thread', 'silver-thread', 'scalpel', 'poison-syringe',
    'poison', 'bleed', 'shock', 'freeze', 'burn', 'charm', 'weakness',
    'corruption', 'binding', 'harvest', 'disease', 'portal'];
  var PALETTE = {
    'gold-thread': '#f4ca60', 'silver-thread': '#d6e8ff', scalpel: '#bbf4ff',
    'poison-syringe': '#95e84b', poison: '#8cdb54', bleed: '#ef4365',
    shock: '#ffe982', freeze: '#85e5ff', burn: '#ff9144', charm: '#ff8ecb',
    weakness: '#bab1d9', corruption: '#c888ff', binding: '#e5c783',
    harvest: '#c7e695', disease: '#c4ca62', portal: '#ae9bff'
  };
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function finite(v, fallback) { return typeof v === 'number' && isFinite(v) ? v : fallback; }
  function smooth(v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); }
  function mix(a, b, p) { return a + (b - a) * p; }
  function hash(seed) {
    var s = String(seed === undefined ? 1 : seed), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var state = hash(seed);
    return function () {
      state += 0x6D2B79F5;
      var t = state;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function safeColor(v, fallback) {
    // Colors remain local Canvas2D style strings, never markup or URLs.
    return typeof v === 'string' && v.length < 80 && !/[<>;{}]|url\s*\(/i.test(v) ? v : fallback;
  }
  function sample(effect, tSeconds, seed) {
    effect = effect && typeof effect === 'object' ? effect : {};
    var duration = finite(effect.duration, 0.9);
    if (duration <= 0) duration = 0.9;
    var t = finite(tSeconds, -1), p = clamp(t / duration, 0, 1);
    var frame = {active: t >= 0 && t < duration, progress: p, primitives: []};
    if (!frame.active) return frame;
    var a = frame.primitives, random = rng(seed), role = effect.role || 'impact';
    var motion = effect.motion || '';
    var panel = motion === 'panel-rise-hold', stitch = motion === 'stitch-inward';
    var binding = motion === 'chain-lock-pulse' || motion === 'inward-bind';
    var harvesting = motion === 'scythe-and-inward-motes' || motion === 'inward-harvest';
    var inward = stitch || binding || harvesting;
    var flying = role === 'projectile' && !panel;
    var motif = typeof effect.motif === 'string' ? effect.motif : 'generic';
    var color = safeColor(effect.color, PALETTE[motif] || '#b2dfff');
    var soft = '#f7f5ff', dark = '#503569';
    var env = smooth(p / 0.075) * (1 - smooth((p - 0.74) / 0.26));
    var travel = smooth((p - 0.08) / 0.65);
    var cx = flying ? mix(-0.92, 0.72, travel) : 0;
    var cy = panel ? 0.34 * (1 - smooth(p / 0.26)) : flying ? -0.15 * Math.sin(travel * Math.PI) : 0;
    var pulse = panel ? 1 : stitch ? 0.88 + 0.12 * smooth(p / 0.6) : 0.93 + 0.07 * Math.sin(p * TAU * 2);
    var phase = role === 'warning' ? 'spawn' : role === 'residue' ? 'fade' : role === 'projectile' ? 'travel' : 'contact';
    var enabledLayers = Array.isArray(effect.layers) ? effect.layers : null;
    function enabled(layer) {
      if (!enabledLayers || !enabledLayers.length) return true;
      return enabledLayers.some(function (l) { return l === layer || (l && (l.name === layer || l.type === layer || l.phase === layer)); });
    }
    function add(type, x, y, props, layer) {
      if (a.length >= MAX || !enabled(layer || phase)) return;
      var q = {type: type, layer: layer || phase, x: finite(x, 0), y: finite(y, 0), color: color, alpha: env};
      for (var key in props) if (Object.prototype.hasOwnProperty.call(props, key)) q[key] = props[key];
      q.alpha = clamp(finite(q.alpha, 0), 0, 1);
      if (q.alpha > 0.001) a.push(q);
    }
    function line(x1, y1, x2, y2, width, alpha, c, layer) {
      add('line', cx + x1, cy + y1, {x2: cx + x2, y2: cy + y2, width: width || 0.025, alpha: env * (alpha === undefined ? 1 : alpha), color: c || color}, layer);
    }
    function ring(x, y, radius, width, alpha, c, layer) {
      add('ring', cx + x, cy + y, {radius: radius, width: width || 0.02, alpha: env * (alpha === undefined ? 1 : alpha), color: c || color}, layer);
    }
    function particle(x, y, radius, alpha, c, shape, layer, rotation) {
      add('particle', cx + x, cy + y, {radius: radius, alpha: env * (alpha === undefined ? 1 : alpha), color: c || color, shape: shape || 'circle', rotation: rotation || 0}, layer);
    }
    function arc(x, y, radius, start, end, width, alpha, c, layer, rotation) {
      add('arc', cx + x, cy + y, {radius: radius, start: start, end: end, width: width || 0.025, alpha: env * (alpha === undefined ? 1 : alpha), color: c || color, rotation: rotation || 0}, layer);
    }
    function poly(points, width, alpha, c, layer) {
      for (var n = 1; n < points.length; n++) line(points[n - 1][0], points[n - 1][1], points[n][0], points[n][1], width, alpha, c, layer);
    }
    function spoke(angle, r0, r1, width, alpha, c, layer) {
      line(Math.cos(angle) * r0, Math.sin(angle) * r0, Math.cos(angle) * r1, Math.sin(angle) * r1, width, alpha, c, layer);
    }
    // A role-specific first layer gives even unrecognized motifs useful timing.
    var spawn = 1 - smooth(p / 0.26);
    if (!panel && !inward) ring(0, 0, 0.1 + 0.52 * smooth(p / 0.26), 0.022, spawn * 0.75, color, 'spawn');
    if (panel) {
      // The catalog role is projectile_or_panel, but this is a rising wall.
      // Horizontal position never changes; deployment settles into a hold.
      line(-0.48, 0.48, 0.48, 0.48, 0.025, 0.68, color, 'spawn');
      for (var pillar = -1; pillar <= 1; pillar += 2) {
        line(pillar * 0.48, 0.48, pillar * 0.48, mix(0.4, -0.52, smooth(p / 0.26)), 0.02, 0.58, color, 'travel');
      }
      for (var wallSpark = 0; wallSpark < 4; wallSpark++) {
        var wallY = 0.4 - ((p * 0.6 + wallSpark / 4) % 1) * 0.8;
        particle(wallSpark % 2 ? 0.47 : -0.47, wallY, 0.023, 0.64, soft, 'diamond', 'travel');
      }
    } else if (stitch) {
      // Regenerative stitches converge and join, not an outgoing damage burst.
      var closure = smooth(p / 0.7), opening = 0.36 * (1 - closure);
      for (var stitchIndex = 0; stitchIndex < 5; stitchIndex++) {
        var stitchY = (stitchIndex - 2) * 0.13;
        line(-opening - 0.1, stitchY - 0.035, opening + 0.1, stitchY + 0.035, 0.015, 0.8, color, 'travel');
        particle(-opening - 0.1, stitchY - 0.035, 0.026, 0.8, soft, 'circle', 'travel');
        particle(opening + 0.1, stitchY + 0.035, 0.026, 0.8, soft, 'circle', 'travel');
      }
      arc(0, 0, mix(0.65, 0.27, closure), -0.9, 1.2, 0.018, 0.5, color, 'travel', p * 0.4);
      arc(0, 0, mix(0.65, 0.27, closure), Math.PI - 0.9, Math.PI + 1.2, 0.018, 0.5, color, 'travel', p * 0.4);
    } else if (binding) {
      // Tightening restraint, not a growing area-of-effect warning.
      ring(0, 0, mix(0.7, 0.38, smooth(p / 0.7)), 0.018, 0.45, color, 'spawn');
    } else if (harvesting) {
      // Collection halo contracts toward the scythe rather than exploding away.
      ring(0, 0, mix(0.78, 0.18, smooth(p / 0.8)), 0.022, 0.6, soft, 'contact');
    } else if (role === 'warning') {
      ring(0, 0, 0.62 + 0.04 * Math.sin(p * TAU * 3), 0.026, 0.62, color, 'spawn');
      ring(0, 0, 0.78, 0.012, 0.25 + p * 0.3, color, 'spawn');
      for (var wi = 0; wi < 8; wi++) {
        var wa = wi * TAU / 8 + p * 0.3;
        spoke(wa, 0.68, 0.75, 0.021, 0.85, color, 'spawn');
      }
    } else if (flying) {
      for (var ti = 0; ti < 7; ti++) {
        var tail = (ti + 1) * 0.065;
        particle(-tail, 0.015 * Math.sin(ti + p * 10), 0.045 - ti * 0.004, 0.48 * (1 - ti / 7), color, 'circle', 'travel');
      }
    } else if (role === 'impact') {
      var hit = smooth(p / 0.24);
      ring(0, 0, 0.12 + hit * 0.8, 0.035 * (1 - p) + 0.005, (1 - smooth((p - 0.1) / 0.65)) * 0.65, soft, 'contact');
    } else if (role === 'residue') {
      ring(0, 0.28, 0.34 + p * 0.16, 0.03, 0.3 * (1 - p), color, 'fade');
    }
    // Optional original raster layer. Source is metadata, never fetched here.
    if (effect.source) {
      add('sprite', cx, cy, {size: (role === 'warning' ? 1.27 : 1.12) * pulse,
        rotation: finite(effect.rotation, 0), alpha: env * (role === 'residue' ? 0.68 : 0.96),
        source: effect.source}, phase);
    } else {
      // Original code-drawn forms, designed to remain distinct at small sizes.
      switch (motif) {
      case 'gold-thread':
      case 'silver-thread': {
        var gold = motif === 'gold-thread';
        for (var strand = 0; strand < 2; strand++) {
          var previous = null;
          for (var j = 0; j <= 18; j++) {
            var u = j / 18, xx = mix(-0.66, 0.66, u);
            var yy = Math.sin(u * TAU * 1.4 + p * TAU + strand * Math.PI) * (gold ? 0.16 : 0.11);
            if (previous) line(previous[0], previous[1], xx, yy, strand ? 0.014 : 0.026, strand ? 0.56 : 1, strand ? soft : color);
            previous = [xx, yy];
          }
        }
        for (var knot = 0; knot < 4; knot++) {
          var ku = (knot / 4 + p * 0.22) % 1;
          particle(mix(-0.6, 0.6, ku), Math.sin(ku * TAU * 1.4 + p * TAU) * (gold ? 0.16 : 0.11), 0.045, 0.95 * smooth(ku / 0.1) * smooth((1 - ku) / 0.1), soft, 'diamond', phase, p * 2);
        }
        arc(0, 0, 0.48, 0.15, 2.4, 0.012, 0.25, color, 'spawn', p);
        break;
      }
      case 'scalpel':
        poly([[-0.5, 0.36], [-0.35, 0.42], [0.12, -0.1], [0.07, -0.16], [-0.5, 0.36]], 0.027, 0.9);
        poly([[0.07, -0.16], [0.24, -0.43], [0.58, -0.55], [0.29, -0.18], [0.12, -0.1]], 0.032, 1, soft);
        line(-0.34, 0.24, -0.17, 0.1, 0.012, 0.7, soft);
        arc(0.08, -0.08, 0.58, -1.2 + p, 0.55 + p, 0.017, 0.55);
        particle(0.52, -0.5, 0.07, 0.9, soft, 'spark');
        break;
      case 'poison-syringe':
        // Diagonal barrel, visible plunger, needle, graduations and poison drops.
        poly([[-0.38, 0.17], [-0.17, 0.38], [0.23, -0.02], [0.02, -0.23], [-0.38, 0.17]], 0.028, 1, soft);
        line(-0.3, 0.23, 0.1, -0.12, 0.085, 0.58);
        line(-0.28, 0.28, -0.45, 0.45, 0.033, 1, soft);
        line(-0.55, 0.35, -0.35, 0.55, 0.033, 1, soft);
        line(0.13, -0.12, 0.49, -0.48, 0.018, 1, soft);
        for (var si = 0; si < 3; si++) line(-0.2 + si * 0.1, 0.05 - si * 0.1, -0.12 + si * 0.1, 0.13 - si * 0.1, 0.014, 0.9, dark);
        particle(0.53, -0.57 + p * 0.12, 0.075, 0.9, color, 'droplet');
        ring(0.53, -0.56, 0.15 + p * 0.08, 0.012, 0.3);
        break;
      case 'poison':
        ring(0, 0.09, 0.29, 0.08, 0.6);
        particle(-0.18, -0.05, 0.17, 0.9);
        particle(0.18, -0.05, 0.17, 0.9);
        line(-0.08, 0.17, -0.08, 0.34, 0.055, 0.9);
        line(0.08, 0.17, 0.08, 0.34, 0.055, 0.9);
        for (var pi = 0; pi < 6; pi++) {
          var pa = pi * TAU / 6 + p;
          ring(Math.cos(pa) * 0.44, Math.sin(pa) * 0.3 - p * 0.14, 0.035 + pi % 3 * 0.025, 0.017, 0.65);
        }
        break;
      case 'bleed':
        for (var bi = 0; bi < 5; bi++) {
          var bx = (bi - 2) * 0.17, by = -0.23 + (bi % 2) * 0.14 + p * 0.36;
          particle(bx, by, 0.09 + (bi % 2) * 0.02, 0.88, color, 'droplet');
          line(bx, by - 0.12, bx - 0.04, by - 0.3, 0.014, 0.4);
        }
        arc(0, 0.36, 0.36, 0, Math.PI, 0.045, 0.4, color, 'fade');
        break;
      case 'shock':
        poly([[0.17, -0.57], [-0.24, -0.02], [0.07, -0.06], [-0.17, 0.55], [0.32, -0.13], [0.02, -0.09]], 0.075, 0.35);
        poly([[0.17, -0.57], [-0.24, -0.02], [0.07, -0.06], [-0.17, 0.55]], 0.028, 1, soft);
        for (var ei = 0; ei < 5; ei++) {
          var ea = ei * TAU / 5 + p * 0.6;
          var ex = Math.cos(ea), ey = Math.sin(ea);
          poly([[ex * 0.35, ey * 0.35], [ex * 0.54 - ey * 0.06, ey * 0.54 + ex * 0.06], [ex * 0.63, ey * 0.63]], 0.018, 0.8);
        }
        break;
      case 'freeze':
        for (var fi = 0; fi < 6; fi++) {
          var fa = fi * TAU / 6 + p * 0.12, fx = Math.cos(fa), fy = Math.sin(fa);
          spoke(fa, 0, 0.51, 0.025, 0.95);
          for (var branch = -1; branch <= 1; branch += 2) {
            line(fx * 0.3, fy * 0.3, fx * 0.4 - fy * branch * 0.14, fy * 0.4 + fx * branch * 0.14, 0.02, 0.85, soft);
          }
          particle(fx * 0.55, fy * 0.55, 0.043, 0.7, soft, 'diamond');
        }
        ring(0, 0, 0.13, 0.026, 0.8, soft);
        break;
      case 'burn':
        for (var fl = 0; fl < 7; fl++) {
          var fv = (p * 1.25 + fl / 7) % 1;
          particle(Math.sin(fl * 2.4 + p * 4) * (0.22 - fv * 0.1), 0.25 - fv * 0.7,
            0.14 * (1 - fv) + 0.025, smooth(fv / 0.12) * (1 - fv) * 0.9, fl % 2 ? '#ffd775' : color, 'droplet', phase, 0);
        }
        arc(0, 0.19, 0.33, 0.15, Math.PI - 0.15, 0.04, 0.75);
        particle(0, 0.18, 0.13, 0.72, '#fff1bb');
        break;
      case 'charm':
        // Two arcs and a V make a legible heart without a raster asset.
        arc(-0.16, -0.12, 0.19, Math.PI, TAU, 0.065, 0.95);
        arc(0.16, -0.12, 0.19, Math.PI, TAU, 0.065, 0.95);
        poly([[-0.35, -0.12], [-0.27, 0.08], [0, 0.36], [0.27, 0.08], [0.35, -0.12]], 0.065, 0.95);
        for (var hi = 0; hi < 5; hi++) {
          var ha = hi * TAU / 5 - p;
          particle(Math.cos(ha) * 0.55, Math.sin(ha) * 0.47, 0.045, 0.8, soft, 'spark', phase, p);
        }
        break;
      case 'weakness':
        poly([[-0.38, -0.38], [0, -0.5], [0.38, -0.38], [0.31, 0.15], [0, 0.47], [-0.31, 0.15], [-0.38, -0.38]], 0.032, 0.65);
        poly([[0.1, -0.39], [-0.1, -0.12], [0.08, 0.01], [-0.12, 0.32]], 0.038, 1, soft);
        for (var weak = -1; weak <= 1; weak += 2) {
          var wx = weak * 0.54;
          line(wx, -0.06, wx, 0.3 + p * 0.08, 0.025, 0.8);
          poly([[wx - 0.08, 0.23 + p * 0.08], [wx, 0.31 + p * 0.08], [wx + 0.08, 0.23 + p * 0.08]], 0.025, 0.8);
        }
        break;
      case 'corruption':
        for (var co = 0; co < 3; co++) arc(0, 0, 0.18 + co * 0.15, co * 2 + p * (co % 2 ? -4 : 3), co * 2 + p * (co % 2 ? -4 : 3) + 4.3, 0.025 + co * 0.009, 0.9 - co * 0.17);
        for (var crack = 0; crack < 6; crack++) {
          var ca = crack * TAU / 6 + 0.2;
          poly([[Math.cos(ca) * 0.16, Math.sin(ca) * 0.16], [Math.cos(ca + 0.15) * 0.36, Math.sin(ca + 0.15) * 0.36], [Math.cos(ca) * 0.58, Math.sin(ca) * 0.58]], 0.017, 0.8, soft);
        }
        particle(0, 0, 0.08 * pulse, 0.95, '#e7bfff', 'diamond');
        break;
      case 'binding':
        for (var chain = 0; chain < 8; chain++) {
          var chainAngle = chain * TAU / 8 + p * 0.14;
          var chainRadius = binding ? mix(0.62, 0.32, smooth(p / 0.7)) : 0.42;
          ring(Math.cos(chainAngle) * chainRadius, Math.sin(chainAngle) * chainRadius, 0.11, 0.032, 0.85);
        }
        poly([[-0.13, 0.04], [-0.13, 0.27], [0.13, 0.27], [0.13, 0.04], [-0.13, 0.04]], 0.03, 1, soft);
        arc(0, 0.04, 0.1, Math.PI, TAU, 0.03, 1, soft);
        line(0, 0.13, 0, 0.2, 0.026, 0.9);
        break;
      case 'harvest':
        line(-0.29, 0.49, 0.19, -0.39, 0.04, 0.9);
        arc(-0.01, -0.12, 0.4, -1.19, 0.8, 0.055, 0.95, soft);
        arc(-0.01, -0.12, 0.47, -1.15, 0.7, 0.015, 0.65);
        for (var grain = 0; grain < 6; grain++) {
          var gu = (grain / 6 + p * 0.3) % 1, ga = mix(-0.6, 2.5, gu);
          particle(Math.cos(ga) * (0.6 - gu * 0.36), Math.sin(ga) * (0.6 - gu * 0.36), 0.055 * (1 - gu) + 0.018, 0.85 * smooth(gu / 0.1) * smooth((1 - gu) / 0.1), color, 'diamond', phase, ga);
        }
        break;
      case 'disease':
        ring(0, 0, 0.25, 0.06, 0.8);
        for (var germ = 0; germ < 9; germ++) {
          var germA = germ * TAU / 9 + p * 0.42;
          spoke(germA, 0.28, 0.44, 0.025, 0.85);
          particle(Math.cos(germA) * 0.46, Math.sin(germA) * 0.46, 0.055, 0.85);
        }
        particle(-0.07, -0.05, 0.04, 0.9, dark);
        particle(0.11, 0.06, 0.055, 0.9, dark);
        particle(-0.08, 0.13, 0.025, 0.9, dark);
        break;
      case 'portal':
        for (var portal = 0; portal < 4; portal++) {
          var pr = 0.21 + portal * 0.115;
          arc(0, 0, pr * pulse, p * (portal % 2 ? -3 : 2) + portal, p * (portal % 2 ? -3 : 2) + portal + Math.PI * 1.55, 0.018 + portal * 0.007, 0.9 - portal * 0.12, portal % 2 ? soft : color);
        }
        for (var rune = 0; rune < 8; rune++) {
          var ra = rune * TAU / 8 - p * 0.6;
          particle(Math.cos(ra) * 0.65, Math.sin(ra) * 0.65, 0.042, 0.85, color, 'diamond', phase, ra);
        }
        ring(0, 0, 0.1, 0.045, 0.85, soft);
        break;
      default:
        ring(0, 0, 0.35 * pulse, 0.025, 0.75);
        for (var gi = 0; gi < 6; gi++) {
          var ga0 = gi * TAU / 6 + p * 0.7;
          spoke(ga0, 0.42, 0.56, 0.024, 0.75);
          particle(Math.cos(ga0) * 0.28, Math.sin(ga0) * 0.28, 0.045, 0.85, soft, 'diamond', phase, ga0);
        }
      }
    }
    // Deterministic bounded burst: same seed gives same path at every sample.
    var count = role === 'warning' ? 8 : role === 'residue' ? 10 : 14;
    for (var k = 0; k < count; k++) {
      var angle = random() * TAU, speed = 0.28 + random() * 0.6;
      var jitter = random(), age = clamp((p - jitter * 0.16) / (1 - jitter * 0.16), 0, 1);
      // Delayed particles must be invisible before birth, then fade in locally.
      // Preserve RNG consumption for deterministic geometry even while hidden.
      var birth = smooth(age / 0.06);
      var r = inward ? 0.12 + (1 - age) * speed : 0.14 + age * speed;
      var px = Math.cos(angle) * r, py = Math.sin(angle) * r;
      if (panel) { px = (k % 2 ? 1 : -1) * (0.44 + jitter * 0.04); py = 0.43 - age * 0.86; }
      else if (role === 'residue' && !inward) py -= age * 0.36;
      if (flying) px -= age * 0.3;
      var layer = age > 0.7 ? 'fade' : role === 'warning' ? 'spawn' : role === 'projectile' ? 'travel' : 'contact';
      particle(px, py, (0.014 + random() * 0.025) * (1 - age * 0.6), birth * (1 - age) * 0.8, k % 4 === 0 ? soft : color, k % 3 === 0 ? 'diamond' : 'circle', layer, angle + p);
      if (k < 4 && role !== 'warning' && !panel) {
        var direction = inward ? -1 : 1;
        line(px, py, px - direction * Math.cos(angle) * 0.09 * age, py - direction * Math.sin(angle) * 0.09 * age, 0.009, birth * (1 - age) * 0.35, color, layer);
      }
    }
    if (p > 0.56 && !panel && !inward) ring(0, 0, 0.5 + (p - 0.56) * 0.7, 0.012, (1 - p) * 0.35, color, 'fade');
    // Stable painter order. Sprites remain between the role halo and sparks.
    var order = {spawn: 0, travel: 1, contact: 2, fade: 3};
    a.sort(function (u, v) { return order[u.layer] - order[v.layer]; });
    return frame;
  }
  function render(ctx, frame, image) {
    if (!ctx || !ctx.canvas || !frame || !frame.active || !Array.isArray(frame.primitives)) return;
    var w = finite(ctx.canvas.width, 0), h = finite(ctx.canvas.height, 0);
    if (w <= 0 || h <= 0) return;
    var scale = Math.min(w, h) * 0.35;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var i = 0; i < Math.min(frame.primitives.length, MAX); i++) {
      var q = frame.primitives[i];
      if (!q || !isFinite(q.x) || !isFinite(q.y)) continue;
      ctx.save();
      ctx.globalAlpha *= clamp(finite(q.alpha, 1), 0, 1);
      ctx.fillStyle = safeColor(q.color, '#ffffff');
      ctx.strokeStyle = safeColor(q.color, '#ffffff');
      ctx.lineWidth = Math.max(0.001, finite(q.width, 0.02));
      ctx.translate(q.x, q.y);
      var r = clamp(finite(q.radius, 0.03), 0, 4);
      if (q.type === 'sprite') {
        // Accept one image, or a source-keyed image map. No fetching occurs.
        var img = image && typeof image === 'object' && !('width' in image) ? image[q.source] : image;
        var iw = img && finite(img.naturalWidth || img.videoWidth || img.width, 0);
        var ih = img && finite(img.naturalHeight || img.videoHeight || img.height, 0);
        if (img && iw > 0 && ih > 0 && img.complete !== false) {
          var size = clamp(finite(q.size, 1), 0, 4), ratio = iw / ih;
          var sw = ratio >= 1 ? size : size * ratio, sh = ratio >= 1 ? size / ratio : size;
          ctx.rotate(finite(q.rotation, 0));
          ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
        }
      } else if (q.type === 'line') {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(finite(q.x2, q.x) - q.x, finite(q.y2, q.y) - q.y); ctx.stroke();
      } else if (q.type === 'ring' || q.type === 'arc') {
        ctx.rotate(finite(q.rotation, 0)); ctx.beginPath();
        ctx.arc(0, 0, r, q.type === 'ring' ? 0 : finite(q.start, 0), q.type === 'ring' ? TAU : finite(q.end, TAU)); ctx.stroke();
      } else if (q.type === 'particle') {
        ctx.rotate(finite(q.rotation, 0)); ctx.beginPath();
        if (q.shape === 'diamond') {
          ctx.moveTo(0, -r * 1.3); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.3); ctx.lineTo(-r, 0); ctx.closePath();
        } else if (q.shape === 'spark') {
          for (var s = 0; s < 8; s++) {
            var sr = s % 2 ? r * 0.25 : r * 1.4, sa = s * Math.PI / 4;
            if (s === 0) ctx.moveTo(Math.cos(sa) * sr, Math.sin(sa) * sr);
            else ctx.lineTo(Math.cos(sa) * sr, Math.sin(sa) * sr);
          }
          ctx.closePath();
        } else if (q.shape === 'droplet') {
          ctx.moveTo(0, -r * 1.7);
          ctx.bezierCurveTo(r * 0.28, -r * 0.65, r * 1.25, r * 0.3, r * 0.55, r * 0.8);
          ctx.bezierCurveTo(0, r * 1.2, -r * 1.15, r * 0.65, -r * 0.6, -r * 0.05);
          ctx.closePath();
        } else ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  return Object.freeze({version: '1.1.0', maxPrimitives: MAX, motifs: Object.freeze(MOTIFS), sample: sample, render: render});
}));
