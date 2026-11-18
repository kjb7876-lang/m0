/* R108 hero select. The hero cards (title "기억을 걷는 영웅" and the sanctuary "거점에서
 * 영웅 변경") showed the small in-game walk sprite squeezed into a wide box. They now
 * carry painted character-select portraits (assets/r108/heroes, made from the same
 * hero illustrations) in a framed bust panel with the hero's name, calling and the
 * unchanged passive / Q text. The native dialog, its buttons and the hero change
 * itself are untouched; when a portrait cannot load the card falls back to the
 * sprite it showed before. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_HEROES_R108__||typeof showHeroes!=='function'||typeof urlFor!=='function')return;
 const ROOT='assets/r108/heroes/';
 const ROLE=Object.freeze({hwando:'정화의 검객',seoha:'백야의 술사',neon:'회로의 창기병',michaela:'성흔의 수호자',lauren:'잔향의 마법사',hunter:'추적의 사수',slayer:'종결의 처형자',gunner:'기억의 사수'});
 const stats={patched:0,fallbacks:0,opened:0};
 const css=document.createElement('style');css.id='heroes-r108-css';css.textContent=[
  '#panel .cards.r108{grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:10px}',
  '#panel .card.r108{display:grid;grid-template-columns:92px minmax(0,1fr);gap:12px;align-items:start;padding:10px;background:linear-gradient(160deg,#151a1f,#090d11);border:1px solid #4a4238;box-shadow:inset 0 0 0 1px #000a;border-radius:3px}',
  '#panel .card.r108:hover{border-color:#8a7a56}',
  '#panel .card.r108.selected{border-color:#d2b77e;background:linear-gradient(160deg,#2a2518,#130f0a);box-shadow:inset 0 0 0 1px #000a,0 0 18px #d2b77e40}',
  '#panel .card.r108 .pf{position:relative;width:92px;height:124px;border:1px solid #6b5a3c;background:#07090c;overflow:hidden;box-shadow:inset 0 0 22px #000}',
  '#panel .card.r108 .pf img{width:100%;height:100%;object-fit:cover;object-position:50% 14%;display:block;filter:saturate(.94) contrast(1.04)}',
  '#panel .card.r108 .pf img.sprite{object-fit:contain;object-position:50% 50%;padding:6px;box-sizing:border-box}',
  '#panel .card.r108 .pf:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 38%,transparent 52%,#000b 100%)}',
  '#panel .card.r108.selected .pf{border-color:#d2b77e}',
  '#panel .card.r108 .body{min-width:0}',
  '#panel .card.r108 strong{margin:2px 0 3px;font-size:15px;letter-spacing:.04em}',
  '#panel .card.r108 .role{display:block;font-size:10.5px;color:#c9a96a;letter-spacing:.14em;margin-bottom:6px}',
  '#panel .card.r108 small{font-size:11px;line-height:1.6}'].join('\n');
 document.head.appendChild(css);
 function patch(){const cards=document.querySelectorAll('#panel .cards .card[data-hero]');let n=0;
  for(const c of cards){if(c.classList.contains('r108'))continue;const id=c.dataset.hero,img=c.querySelector('img');if(!img)continue;
   c.classList.add('r108');c.parentElement.classList.add('r108');
   const pf=document.createElement('div');pf.className='pf';const sprite=img.getAttribute('src');
   const p=document.createElement('img');p.alt=img.alt||'';p.decoding='async';
   p.onerror=()=>{p.onerror=null;stats.fallbacks++;p.classList.add('sprite');p.src=sprite;};p.src=urlFor(ROOT+id+'.webp');
   pf.appendChild(p);img.replaceWith(pf);
   const body=document.createElement('div');body.className='body';while(pf.nextSibling)body.appendChild(pf.nextSibling);c.appendChild(body);
   const role=document.createElement('span');role.className='role';role.textContent=ROLE[id]||'';const name=body.querySelector('strong');if(name)name.after(role);else body.prepend(role);
   n++;}
  stats.patched+=n;return n;}
 let observer=null;
 function watchPanel(){const panel=document.getElementById('panel');if(!panel)return;if(observer)observer.disconnect();
  observer=new MutationObserver(()=>{if(!document.querySelector('#panel .cards .card[data-hero]')){observer.disconnect();observer=null;return;}patch();});
  observer.observe(panel,{childList:true});}
 const showBase=showHeroes;showHeroes=function(){const r=showBase.apply(this,arguments);stats.opened++;try{patch();watchPanel();}catch(_){}return r;};
 window.__STORYWORLD_HEROES_R108__=Object.freeze({revision:'R108-hero-select',roles:ROLE,portraitPath:id=>ROOT+id+'.webp',inspect:()=>({...stats,watching:!!observer,heroChangeLogicChanged:false})});
})();
