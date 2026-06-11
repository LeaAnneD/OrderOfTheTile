/* ============================================================================
   OOTT Mini-Games — Shared TILE ART renderer
   ----------------------------------------------------------------------------
   Renders Order of the Tile's real hand-painted tile set (in ../_tiles/<code>.png)
   instead of generic text chips. One face = one image; the art carries the tile,
   so no tile ever prints its own name on its face.

   Face codes: 1B..9B (Bam) · 1C..9C (Crak) · 1D..9D (Dot) · N/E/W/S (winds) ·
               RD/GD/WD (Red/Green/White=Soap dragons) · F (flower) · JK (joker).

   API (window.OOTTTILES):
     code(faceOrKitTile)  -> normalize a face-code string OR an OOTTKit tile object to a code
     img(faceOrKitTile, size)  -> <img> HTML string ('sm' | '' | 'big'); falls back to text if the PNG 404s
     label(code)          -> human label ("2 Bam", "Soap", "Red Dragon", "East", "Flower", "Joker")

   FUTURE: this is the single place to swap tile designs. To offer a user-chosen
   deck, set OOTTTILES.base = "../_tiles/<deckname>/" before rendering (or expose a picker).
   ============================================================================ */
window.OOTTTILES = (function(){
  "use strict";
  const api = { base: "../_tiles/" };

  api.code = function(t){
    if(t==null) return 'JK';
    if(typeof t==='string') return t;            // already a face code
    if(!t.fam) return 'JK';
    if(t.fam==='dot')    return t.rank+'D';
    if(t.fam==='bam')    return t.rank+'B';
    if(t.fam==='crak')   return t.rank+'C';
    if(t.fam==='wind')   return t.rank;           // 'E'|'S'|'W'|'N'
    if(t.fam==='dragon') return t.rank==='R'?'RD':t.rank==='G'?'GD':'WD'; // '0' (Soap) -> WD
    if(t.fam==='flower') return 'F';
    return 'JK';
  };

  const SUITNAME={B:'Bam',C:'Crak',D:'Dot'};
  api.label = function(c){
    if(/^[1-9][BCD]$/.test(c)) return c[0]+' '+SUITNAME[c[1]];
    if(c==='WD') return 'Soap (White Dragon)';
    if(c==='RD') return 'Red Dragon';
    if(c==='GD') return 'Green Dragon';
    if(c==='N')  return 'North';
    if(c==='E')  return 'East';
    if(c==='W')  return 'West';
    if(c==='S')  return 'South';
    if(c==='F')  return 'Flower';
    if(c==='JK') return 'Joker';
    return c;
  };
  // tiny text used only if a PNG fails to load
  function shortText(c){
    if(/^[1-9][BCD]$/.test(c)) return c[0]+({B:'B',C:'C',D:'D'}[c[1]]);
    return ({WD:'○',RD:'R',GD:'G',N:'N',E:'E',W:'W',S:'S',F:'❀',JK:'J'}[c])||c;
  }

  let injected=false;
  function inject(){
    if(injected) return; injected=true;
    const css=`
      .tface{height:60px;width:auto;display:inline-block;vertical-align:middle;border-radius:7px;
        -webkit-user-drag:none;user-select:none;filter:drop-shadow(0 2px 4px rgba(43,38,34,.22));}
      .tface.sm{height:42px;border-radius:5px;} .tface.big{height:82px;border-radius:8px;}
      .tfb{display:inline-flex;align-items:center;justify-content:center;height:60px;width:45px;
        background:#FBF6EE;border:1px solid #E1D6c2;border-radius:7px;font-family:"Playfair Display",serif;
        font-weight:700;color:#6B5F54;box-shadow:0 2px 4px rgba(43,38,34,.18);}
      .tfb.sm{height:42px;width:32px;border-radius:5px;font-size:.8rem;} .tfb.big{height:82px;width:62px;border-radius:8px;font-size:1.2rem;}
    `;
    const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
  }

  api.img = function(faceOrTile, size){
    inject();
    const c=api.code(faceOrTile);
    const cls='tface'+(size?(' '+size):'');
    return `<img class="${cls}" src="${api.base}${c}.png" alt="${api.label(c)}" title="${api.label(c)}" `+
           `draggable="false" loading="lazy" data-code="${c}" onerror="window.OOTTTILES.fb(this)">`;
  };
  // fallback: replace a broken img with a small text tile of the same size
  api.fb = function(imgEl){
    try{
      const c=imgEl.getAttribute('data-code')||'';
      const size = imgEl.classList.contains('big')?'big':imgEl.classList.contains('sm')?'sm':'';
      const span=document.createElement('span'); span.className='tfb'+(size?(' '+size):'');
      span.textContent=shortText(c); imgEl.replaceWith(span);
    }catch(_){}
  };

  return api;
})();
