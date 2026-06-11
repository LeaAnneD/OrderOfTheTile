/* ============================================================================
   OOTT Mini-Games — Shared Micro-Puzzle Bank  (powers Tile Storm + The Run)
   ----------------------------------------------------------------------------
   Pure vanilla JS. Depends on window.OOTTKit (scenario.js) for the tile model
   and tile chips. Exposes window.OOTTMICRO with:
       gen(level, rand)  -> a puzzle {kind, promptHTML, choices[], answer, explain}
       renderInto(el, puzzle, onPick)  -> renders prompt + choice buttons
   Each puzzle is one quick, single-answer micro-question that reuses a skill the
   trainer already teaches: name-the-tile, spot-the-section, legal/illegal,
   whose-turn, tiles-remaining. American Mah Jongg (NMJL) only. The card is never
   rendered — section questions use number-archetypes, not printed card lines.

   ⚠ ACCURACY: the LEGAL[] rules bank below is built from standard NMJL rules and
   the trainer's references — Lea Anne is the final authority; these are the spots
   to spot-check first.
   ============================================================================ */
window.OOTTMICRO = (function(){
  "use strict";
  const Kit = window.OOTTKit;
  // render a tile as real OOTT art when available, else fall back to the text chip
  const T = (t,size)=> window.OOTTTILES ? window.OOTTTILES.img(t,size) : Kit.tileChip(t,size);
  const ri = (n,rand)=>Math.floor((rand||Math.random)()*n);
  const pick = (a,rand)=>a[ri(a.length,rand)];
  function shuffle(a,rand){ rand=rand||Math.random; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  function fourChoices(correct, pool, rand){
    const distract = shuffle(pool.filter(x=>x!==correct), rand).slice(0,3);
    return shuffle([correct,...distract], rand);
  }

  /* ---------- name the tile ---------- */
  function pName(rand){
    const faces = Kit.faces();
    const t = pick(faces, rand);
    const correct = t.label;
    const choices = fourChoices(correct, faces.map(f=>f.label), rand);
    return { kind:'name',
      promptHTML:`<div class="qlead">What tile is this?</div><div class="qtiles">${T(t,'big')}</div>`,
      choices, answer:choices.indexOf(correct),
      explain:`That's the <b>${correct}</b>.` };
  }

  /* ---------- which tile is it? (reverse: pick the named tile) ---------- */
  function pFind(rand){
    const faces = Kit.faces();
    const t = pick(faces, rand);
    const others = shuffle(faces.filter(f=>f.label!==t.label), rand).slice(0,3);
    const set = shuffle([t,...others], rand);
    const tilesHTML = set.map((x,i)=>`<span class="qpicktile" data-i="${i}">${T(x,'big')}</span>`).join('');
    return { kind:'find', tilePick:true,
      promptHTML:`<div class="qlead">Tap the <b>${t.label}</b>.</div><div class="qtiles">${tilesHTML}</div>`,
      choices:set.map(x=>x.label), answer:set.indexOf(t),
      explain:`The <b>${t.label}</b> is the one you wanted.` };
  }

  /* ---------- spot the section (number archetype) ---------- */
  const SUITS=[['B','Bam'],['C','Crak'],['D','Dot']];
  function suitTileN(n, suitCode){ return Kit.suitTile(suitCode==='B'?'bam':suitCode==='C'?'crak':'dot', n); }
  function pSection(rand){
    const archetypes=[
      {name:'2468 — Even Numbers', nums:[2,4,6,8], gloss:'all even numbers'},
      {name:'13579 — Odd Numbers', nums:[1,3,5,7,9], gloss:'all odd numbers'},
      {name:'369', nums:[3,6,9], gloss:'threes — 3, 6 and 9', forceAll:true},
      {name:'Consecutive Run', nums:'run', gloss:'a run of numbers in a row'}
    ];
    const a = pick(archetypes, rand);
    const suit = pick(SUITS, rand)[0];
    let nums;
    if(a.nums==='run'){ const start=1+ri(7,rand); nums=[start,start+1,start+2]; }
    else if(a.forceAll){ nums=[3,6,9]; }
    else { nums=shuffle(a.nums.slice(),rand).slice(0,3).sort((x,y)=>x-y); }
    const tilesHTML = nums.map(n=>T(suitTileN(n,suit),'big')).join('');
    const choices = fourChoices(a.name, archetypes.map(x=>x.name), rand);
    return { kind:'section',
      promptHTML:`<div class="qlead">A hand built only from tiles like these is reaching for which kind of card section?</div><div class="qtiles">${tilesHTML}</div>`,
      choices, answer:choices.indexOf(a.name),
      explain:`These are ${a.gloss} — that's the <b>${a.name.split(' — ')[0]}</b> family.` };
  }

  /* ---------- whose turn (engine convention: play moves E→S→W→N to the right) ---------- */
  const SEATS=['East','South','West','North'];
  function pTurn(rand){
    const cur=ri(4,rand); const next=SEATS[(cur+1)%4];
    const variant=ri(2,rand);
    let prompt, ans, expl;
    if(variant===0){
      prompt=`<div class="qlead"><b>${SEATS[cur]}</b> just discarded and nobody called it. Whose turn is it now?</div>`;
      ans=next; expl=`Play moves to the right — ${SEATS[cur]} → <b>${next}</b>.`;
    } else {
      const caller=SEATS[(cur+2)%4]; // someone across calls
      const afterCaller=SEATS[((cur+2)%4 +1)%4];
      prompt=`<div class="qlead"><b>${SEATS[cur]}</b> discarded and <b>${caller}</b> called it for an exposure. After ${caller} discards, whose turn is it?</div>`;
      ans=afterCaller; expl=`A call jumps the turn to the caller (${caller}); then play resumes to the caller's right — <b>${afterCaller}</b>.`;
    }
    const choices=fourChoices(ans, SEATS.slice(), rand);
    return { kind:'turn', promptHTML:prompt, choices, answer:choices.indexOf(ans), explain:expl };
  }

  /* ---------- tiles remaining ---------- */
  function pRemaining(rand){
    const faces=Kit.faces().filter(f=>f.fam!=='flower'&&f.fam!=='joker');
    const t=pick(faces,rand);
    const seen=ri(4,rand); const left=4-seen;
    const opts=new Set([left]); while(opts.size<4){ opts.add(ri(5,rand)); }
    const choices=shuffle([...opts],rand).map(String);
    return { kind:'remaining',
      promptHTML:`<div class="qlead">You can already see <b>${seen}</b> of the four <b>${t.label}</b> tiles. How many are still unseen?</div><div class="qtiles">${T(t,'big')}</div>`,
      choices, answer:choices.indexOf(String(left)),
      explain:`Four of each suit/honor tile exist — you see ${seen}, so <b>${left}</b> remain. (Only Flowers and Jokers have eight copies.)` };
  }

  /* ---------- legal / illegal (NMJL rules bank) ---------- */
  const LEGAL=[
    {q:"Can a Joker stand in for a tile inside a <b>pair</b>?", a:"No", o:["No","Yes"], e:"Jokers only fill groups of three or more (pung, kong, quint) — never a single or a pair."},
    {q:"Can a Joker complete a <b>single</b> in a Singles-and-Pairs hand?", a:"No", o:["No","Yes"], e:"Jokers can't be used for singles or pairs — those must be natural tiles."},
    {q:"How many tiles are in a complete winning hand?", a:"14", o:["13","14","15","16"], e:"A winning hand is 14 tiles. You play from 13 and win on the 14th."},
    {q:"You claimed a discard to make a pung. Must those tiles go <b>face-up</b> on your rack?", a:"Yes — exposed", o:["Yes — exposed","No — stay hidden"], e:"Any group made from a claimed discard must be exposed face-up for the table to see."},
    {q:"After you expose a group, may you quietly rearrange it later?", a:"No", o:["No","Yes"], e:"Exposures are committed. Once face-up, that group is locked."},
    {q:"On your turn, can you redeem a Joker from an exposure if you hold the matching natural tile?", a:"Yes", o:["Yes","No"], e:"On your turn you may swap your natural tile for a Joker showing in any exposure — yours or an opponent's."},
    {q:"Can you call a discard just to complete a <b>pair</b> (not for Mahjong)?", a:"No", o:["No","Yes"], e:"You may only claim a discard for a pung/kong/exposure — or for the very last pair to declare Mahjong."},
    {q:"Is a Flower a kind of Joker?", a:"No", o:["No","Yes"], e:"Flowers are their own tiles. Some hands specifically call for Flowers; they never substitute like Jokers."},
    {q:"Must the matching dragon for a <b>Bam</b> hand be the Green dragon?", a:"Yes", o:["Yes","No"], e:"Green goes with Bam, Red with Crak, Soap (White) with Dot."},
    {q:"A <b>quint</b> is five matching tiles. Can you ever make one with no Joker?", a:"No", o:["No","Yes"], e:"Only four of each tile exist, so a quint of five always needs at least one Joker."},
    {q:"You expose a pung using a Joker. Can an opponent take that Joker by discarding the natural tile?", a:"No", o:["No","Yes — on their turn","Yes — anytime"], e:"A Joker is redeemed only by a player who holds the matching natural tile, on their own turn — never by discarding."},
    {q:"During the Charleston, can you pass a <b>Joker</b>?", a:"No", o:["No","Yes"], e:"Jokers may never be passed in the Charleston."},
    {q:"Your hand needs a pair of Soaps (0). Can a Joker fill one of them?", a:"No", o:["No","Yes"], e:"A pair is two tiles — no Jokers in pairs, even Soap pairs."},
    {q:"Is the Soap tile the same as the White Dragon?", a:"Yes", o:["Yes","No"], e:"Soap is the White Dragon — it also plays the number 0 in the 2026 hands."}
  ];
  function pLegal(rand){
    const item=pick(LEGAL,rand);
    const choices=item.o.slice();
    return { kind:'legal',
      promptHTML:`<div class="qlead">${item.q}</div>`,
      choices, answer:choices.indexOf(item.a),
      explain:item.e };
  }

  /* ---------- difficulty tiers ---------- */
  const EASY=[pName, pFind, pTurn];
  const MED =[pName, pFind, pTurn, pSection, pRemaining];
  const HARD=[pFind, pTurn, pSection, pRemaining, pLegal, pLegal];
  function gen(level, rand){
    rand=rand||Math.random;
    const pool = level<=1?EASY : level===2?MED : HARD;
    return pick(pool, rand)(rand);
  }

  /* ---------- shared choice renderer ---------- */
  function renderInto(el, puzzle, onPick){
    el.innerHTML = `<div class="qprompt">${puzzle.promptHTML}</div><div class="qchoices"></div>`;
    const cc = el.querySelector('.qchoices');
    if(puzzle.tilePick){
      // answer by tapping a tile in the prompt
      el.querySelectorAll('.qpicktile').forEach(span=>{
        span.style.cursor='pointer';
        span.onclick=()=>onPick(+span.dataset.i);
      });
      cc.remove();
      return;
    }
    puzzle.choices.forEach((c,i)=>{
      const b=document.createElement('button'); b.className='qbtn'; b.innerHTML=c;
      b.onclick=()=>onPick(i); cc.appendChild(b);
    });
  }

  return { gen, renderInto, LEGAL };
})();
