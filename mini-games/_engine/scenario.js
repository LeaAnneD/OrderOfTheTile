/* ============================================================================
   OOTT Mini-Games — Shared Scenario Engine  (Wave 3)
   ----------------------------------------------------------------------------
   Pure vanilla JS, zero dependencies. INLINE this whole file inside each drill's
   <script> so every game stays self-contained (no fetch, runs from file://).
   Canonical source lives at Website/Mini-Games/_engine/scenario.js — edit here,
   then re-inline. Exposes a single global: window.OOTTKit.

   American Mah Jongg (NMJL) only. "The card is invisible" — these helpers model
   tiles, hands, discards and Charleston passing; they never render the NMJL card.

   Build a 152-tile wall:
     Dots 1-9 ×4, Bams 1-9 ×4, Craks 1-9 ×4   = 108
     Winds E/S/W/N ×4                          =  16
     Dragons Red/Green/Soap ×4                 =  12   (Red=crak, Green=bam, Soap=White=dot)
     Flowers ×8, Jokers ×8                     =  16
                                                 = 152
   ============================================================================ */
window.OOTTKit = (function(){
  "use strict";

  /* ---------- RNG (Math.random-backed; deterministic seed optional) ---------- */
  function rng(seed){
    if(seed==null) return Math.random;
    let s = seed>>>0 || 1;
    return function(){ s^=s<<13; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; };
  }
  const R = rng();
  const ri = (n,rand)=>Math.floor((rand||R)()*n);
  function shuffle(a, rand){ rand=rand||R; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  const pick = (a,rand)=>a[ri(a.length,rand)];

  /* ---------- tile model ----------
     A tile is a plain object: {id, fam, rank, label, short, color}
       fam:  dot | bam | crak | wind | dragon | flower | joker
       rank: 1-9 for suits; wind letter E/S/W/N; dragon R/G/0; null for flower/joker
       short: compact code e.g. "5B", "9D", "We", "Dr", "Fl", "Jk"
  */
  const FAM_COLOR = { dot:"#3F6FB0", bam:"#3E7D52", crak:"#B5524C", wind:"#2B2622", dragon:"#9A5662", flower:"#B76E79", joker:"#C9A24A" };
  const WIND_NAME = { E:"East", S:"South", W:"West", N:"North" };
  const DRAGON = { R:{label:"Red Dragon", short:"Dr", color:"#B5524C"},
                   G:{label:"Green Dragon", short:"Dg", color:"#3E7D52"},
                   "0":{label:"Soap (White Dragon)", short:"So", color:"#6B5F54"} };

  function suitTile(fam, rank){
    const pre = fam==="dot"?"Dot":fam==="bam"?"Bam":"Crak";
    const sc  = fam==="dot"?"D":fam==="bam"?"B":"C";
    return { id:rank+sc, fam, rank, label:rank+" "+pre, short:rank+sc, color:FAM_COLOR[fam] };
  }
  function windTile(w){ return { id:"W"+w, fam:"wind", rank:w, label:WIND_NAME[w]+" Wind", short:w.toLowerCase()==w?w:WIND_NAME[w][0], color:FAM_COLOR.wind }; }
  function dragonTile(d){ const x=DRAGON[d]; return { id:"D"+d, fam:"dragon", rank:d, label:x.label, short:x.short, color:x.color }; }
  function flowerTile(){ return { id:"FL", fam:"flower", rank:null, label:"Flower", short:"Fl", color:FAM_COLOR.flower }; }
  function jokerTile(){ return { id:"JK", fam:"joker", rank:null, label:"Joker", short:"Jk", color:FAM_COLOR.joker }; }

  // one full 152-tile wall (fresh objects each call)
  function wall(){
    const w=[];
    ["dot","bam","crak"].forEach(fam=>{ for(let r=1;r<=9;r++) for(let k=0;k<4;k++) w.push(suitTile(fam,r)); });
    ["E","S","W","N"].forEach(x=>{ for(let k=0;k<4;k++) w.push(windTile(x)); });
    ["R","G","0"].forEach(d=>{ for(let k=0;k<4;k++) w.push(dragonTile(d)); });
    for(let k=0;k<8;k++) w.push(flowerTile());
    for(let k=0;k<8;k++) w.push(jokerTile());
    return w;
  }
  // distinct face list (34 faces) — useful for "which tile" questions
  function faces(){
    const f=[];
    ["dot","bam","crak"].forEach(fam=>{ for(let r=1;r<=9;r++) f.push(suitTile(fam,r)); });
    ["E","S","W","N"].forEach(x=>f.push(windTile(x)));
    ["R","G","0"].forEach(d=>f.push(dragonTile(d)));
    f.push(flowerTile()); f.push(jokerTile());
    return f;
  }
  // how many of a given face exist in a full wall (4 for most, 8 for flower/joker)
  function faceCount(t){ return t.fam==="flower"||t.fam==="joker" ? 8 : 4; }
  // count copies of a face inside an array of tiles (matches by id)
  function countSeen(t, seen){ return seen.filter(x=>x.id===t.id).length; }
  // remaining-in-wall estimate given everything you can see (your hand + discards + exposures)
  function remaining(t, seen){ return Math.max(0, faceCount(t) - countSeen(t, seen)); }

  function deal(n, rand){ return shuffle(wall(), rand).slice(0,n); }
  function sortHand(h){
    const order={dot:0,bam:1,crak:2,wind:3,dragon:4,flower:5,joker:6};
    return h.slice().sort((a,b)=> order[a.fam]-order[b.fam] || (a.rank>b.rank?1:a.rank<b.rank?-1:0));
  }

  /* ---------- a "leaning" hand: tiles biased toward a target family/suit ----------
     Used by the detective + charleston drills so a hand has a readable direction.
     targetSuit: 'dot'|'bam'|'crak'  (or null for honors-heavy)
  */
  function leaningHand(targetSuit, n, rand){
    rand=rand||R; const w=shuffle(wall(),rand); const out=[]; const want=targetSuit;
    // ~60% on-target suit, rest mixed
    for(const t of w){
      if(out.length>=n) break;
      const onTarget = want ? t.fam===want : (t.fam==="wind"||t.fam==="dragon");
      if(onTarget && rand()<0.72) out.push(t);
      else if(!onTarget && rand()<0.34) out.push(t);
    }
    while(out.length<n) out.push(w[out.length]); // top up if short
    return sortHand(out.slice(0,n));
  }

  /* ---------- discard-sequence simulation (generate-backward from secret targets) ----------
     Each of the 4 seats secretly leans toward a target suit. On a turn a seat
     discards a tile that is OFF its target (preferring its least-wanted suit), so
     the discard pile leans AWAY from what they're building — the deduction signal.
     Returns { targets:[suit×4], events:[{seat, tile}], discardsBySeat:[[...]×4] }.
     seats are 0..3; seat names supplied by the drill (e.g. winds).
  */
  const SUITS=["dot","bam","crak"];
  function simulateDiscards(turns, rand){
    rand=rand||R;
    const targets = [0,1,2,3].map(()=>pick(SUITS,rand));
    const events=[]; const discardsBySeat=[[],[],[],[]];
    const w=shuffle(wall(),rand); let wi=0;
    for(let t=0;t<turns;t++){
      const seat=t%4;
      // draw a couple, discard the one furthest from target
      const drawn=[]; for(let k=0;k<3 && wi<w.length;k++) drawn.push(w[wi++]);
      // prefer discarding a tile NOT of the seat's target suit; honors are also fair discards
      let dump = drawn.find(x=>x.fam!==targets[seat] && SUITS.includes(x.fam))
              || drawn.find(x=>x.fam==="wind"||x.fam==="dragon")
              || drawn[0];
      events.push({seat, tile:dump});
      discardsBySeat[seat].push(dump);
    }
    return { targets, events, discardsBySeat };
  }

  /* ---------- Charleston passing ----------
     Standard NMJL first Charleston: pass RIGHT, ACROSS, LEFT.
     Second Charleston: pass LEFT, ACROSS, RIGHT.  (3 tiles each pass.)
     Seats 0..3 arranged to the right: 0->1->2->3->0.
       right  = give to (seat+1)%4    (receiver is seat to your right)
       left   = give to (seat+3)%4
       across = give to (seat+2)%4
     applyPass(hands, dir, chooser) -> {hands:newHands, moved:[{from,to,tiles}]}
     chooser(hand, seat) returns the 3 tile-indices to pass (default: 3 least-wanted).
  */
  function passTargets(dir){
    if(dir==="right")  return s=>(s+1)%4;
    if(dir==="left")   return s=>(s+3)%4;
    return s=>(s+2)%4; // across
  }
  function defaultChooser(hand){
    // pass the 3 "least useful": honors/flowers first, then break the smallest suit group
    const idx=hand.map((t,i)=>i);
    const score=t=> t.fam==="joker"?99 : t.fam==="flower"?5 : (t.fam==="wind"||t.fam==="dragon")?4 : 1;
    idx.sort((a,b)=>score(hand[b])-score(hand[a]));
    return idx.slice(0,3);
  }
  function applyPass(hands, dir, chooser){
    chooser=chooser||defaultChooser;
    const to=passTargets(dir);
    const give=hands.map((h,s)=>chooser(h.slice(),s).slice(0,3));
    const newHands=hands.map(h=>h.slice());
    const moved=[];
    // remove given tiles
    for(let s=0;s<4;s++){ const g=give[s].slice().sort((a,b)=>b-a); g.forEach(i=>newHands[s].splice(i,1)); }
    // deliver
    for(let s=0;s<4;s++){ const dest=to(s); const tiles=give[s].map(i=>hands[s][i]); tiles.forEach(t=>newHands[dest].push(t)); moved.push({from:s,to:dest,tiles}); }
    return { hands:newHands.map(sortHand), moved };
  }
  const FIRST_CHARLESTON=["right","across","left"];
  const SECOND_CHARLESTON=["left","across","right"];

  /* ---------- UI: tile chip + injected styles ---------- */
  let stylesInjected=false;
  function injectStyles(){
    if(stylesInjected) return; stylesInjected=true;
    const css=`
      .ok-tile{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;
        width:42px;height:56px;border-radius:7px;background:#FBF6EE;border:1px solid #E9DFcd;
        box-shadow:0 2px 5px rgba(43,38,34,.18);font-family:"Playfair Display",serif;font-weight:700;
        line-height:1;user-select:none;padding:2px;}
      .ok-tile .r{font-size:1.05rem;} .ok-tile .s{font-size:.56rem;letter-spacing:.04em;text-transform:uppercase;margin-top:2px;opacity:.85;}
      .ok-tile.sm{width:30px;height:40px;border-radius:5px;} .ok-tile.sm .r{font-size:.8rem;} .ok-tile.sm .s{font-size:.46rem;}
      .ok-tile.big{width:58px;height:78px;border-radius:9px;} .ok-tile.big .r{font-size:1.5rem;} .ok-tile.big .s{font-size:.62rem;}
      .ok-tile.sel{outline:3px solid var(--rose,#B76E79);outline-offset:1px;}
      .ok-tile.ghost{opacity:.35;}
      .ok-row{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;}
    `;
    const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
  }
  // short face text for the chip body
  function chipFace(t){
    if(t.fam==="dot"||t.fam==="bam"||t.fam==="crak") return {r:String(t.rank), s:t.fam==="crak"?"Crak":t.fam==="bam"?"Bam":"Dot"};
    if(t.fam==="wind")   return {r:t.rank, s:"Wind"};
    if(t.fam==="dragon") return {r:t.rank==="R"?"R":t.rank==="G"?"G":"○", s:"Drg"};
    if(t.fam==="flower") return {r:"❀", s:"Flwr"};
    return {r:"J", s:"Joker"};
  }
  function tileChip(t, size){
    injectStyles(); const f=chipFace(t);
    const cls="ok-tile"+(size==="sm"?" sm":size==="big"?" big":"");
    return `<span class="${cls}" data-id="${t.id}" title="${t.label}" style="color:${t.color}"><span class="r">${f.r}</span><span class="s">${f.s}</span></span>`;
  }
  function tileRow(tiles, size){ injectStyles(); return `<div class="ok-row">${tiles.map(t=>tileChip(t,size)).join("")}</div>`; }

  /* ---------- UI: confetti + Prim congrats (first full completion milestone) ----------
     Matches the Hand-Building-Race pattern so the suite feels consistent.
  */
  function confetti(){
    let c=document.getElementById('cfx');
    if(!c){c=document.createElement('canvas'); c.id='cfx'; c.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:3000;'; document.body.appendChild(c);}
    c.width=innerWidth; c.height=innerHeight; const ctx=c.getContext('2d');
    const COLORS=['#B76E79','#C9A24A','#7E8A6F','#9A5662','#E2B33C','#5DCAA5','#D4537E'];
    let P=[]; const cx=innerWidth/2, cy=innerHeight*0.34;
    for(let i=0;i<170;i++){const a=Math.random()*Math.PI*2,s=3+Math.random()*8;P.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3,g:0.14,rot:Math.random()*6,vr:(Math.random()-.5)*.4,sz:5+Math.random()*7,c:COLORS[i%COLORS.length],life:130});}
    for(let i=0;i<130;i++){P.push({x:Math.random()*innerWidth,y:-10-Math.random()*60,vx:(Math.random()-.5)*1.5,vy:2+Math.random()*3,g:0.06,rot:Math.random()*6,vr:(Math.random()-.5)*.3,sz:5+Math.random()*6,c:COLORS[i%COLORS.length],life:200});}
    function tick(){ctx.clearRect(0,0,c.width,c.height); P.forEach(p=>{p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.life--; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha=Math.max(0,Math.min(1,p.life/30)); ctx.fillStyle=p.c; ctx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz*.6); ctx.restore();}); P=P.filter(p=>p.life>0&&p.y<c.height+40); if(P.length)requestAnimationFrame(tick); else ctx.clearRect(0,0,c.width,c.height);}
    tick();
  }
  // primCongrats(bodyHTML, onClose) — drill supplies its own Prim message body.
  function primCongrats(bodyHTML, onClose){
    confetti();
    const scrim=document.createElement('div'); scrim.className="scrim show"; scrim.id="primScrim";
    scrim.innerHTML=`<div class="card prim-card"><h2>Prim sees you.</h2>${bodyHTML}
      <div class="modal-actions" style="grid-template-columns:1fr;"><button class="btn" id="primGo">Keep playing</button></div></div>`;
    document.body.appendChild(scrim);
    scrim.querySelector('#primGo').onclick=()=>{ scrim.remove(); if(onClose)onClose(); };
  }

  /* ---------- public API ---------- */
  return {
    rng, ri, shuffle, pick,
    wall, faces, faceCount, countSeen, remaining, deal, sortHand,
    suitTile, windTile, dragonTile, flowerTile, jokerTile,
    leaningHand, simulateDiscards,
    applyPass, passTargets, FIRST_CHARLESTON, SECOND_CHARLESTON, defaultChooser,
    injectStyles, tileChip, tileRow, chipFace,
    confetti, primCongrats,
    SUITS, WIND_NAME, FAM_COLOR
  };
})();
