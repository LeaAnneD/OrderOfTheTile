/* ============================================================================
   OOTT Mini-Games — Shared Card-Year Selector  (step 2: multi-card toggle)
   ----------------------------------------------------------------------------
   Lets a game offer a "play along with which NMJL card" toggle. Card data files
   (card2026.js, card2025.js, …) each register into window.OOTT_CARDS[<year>].
   This component reads that registry, remembers the player's choice in
   localStorage, and renders a control at the top of the game.

   With only ONE card registered it renders a quiet label ("Playing along with
   2026 NMJL card"); with two or more it becomes a real selector. So dropping in
   a new card-year data file lights up the toggle automatically — no game edits.

   API (window.OOTTCARD):
     years()            -> ["2025","2026"] sorted
     year()             -> selected year (or latest if none saved)
     active()           -> the selected card's line array (or [])
     setYear(y)         -> persist a choice
     pointer()          -> "Open your <year> NMJL card to play along."
     mount(el, onChange)-> render selector into el; onChange(year) on switch
   American Mah Jongg (NMJL) only.
   ============================================================================ */
(function(){
  "use strict";
  var LS='oott_card_year';
  function cards(){ return window.OOTT_CARDS || {}; }
  function years(){ return Object.keys(cards()).sort(); }
  function latest(){ var y=years(); return y.length ? y[y.length-1] : null; }
  function year(){ var sel=null; try{ sel=localStorage.getItem(LS); }catch(e){} var ys=years(); return (sel && ys.indexOf(sel)>=0) ? sel : latest(); }
  function active(){ var y=year(); return (y && cards()[y]) || []; }
  function setYear(y){ if(cards()[y]){ try{ localStorage.setItem(LS,y); }catch(e){} } }
  function pointer(){ var y=year(); return 'Open your '+(y||'')+' NMJL card to play along.'; }

  function ensureCSS(){
    if(document.getElementById('oott-cardsel-css')) return;
    var s=document.createElement('style'); s.id='oott-cardsel-css';
    s.textContent=
      '.oott-cardsel{display:inline-flex;align-items:center;gap:8px;font-family:"Crimson Text",Georgia,serif;font-size:.9rem;color:#6B5F54;}'+
      '.oott-cardsel .ocs-lbl{text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;}'+
      '.oott-cardsel .ocs-one{color:#9A5662;font-family:"Playfair Display",Georgia,serif;font-weight:600;}'+
      '.oott-cardsel select.ocs-sel{font-family:inherit;font-size:.92rem;padding:5px 12px;border:1px solid #E2D6C4;border-radius:999px;background:#fff;color:#2B2622;cursor:pointer;box-shadow:0 1px 3px rgba(43,38,34,.08);}';
    document.head.appendChild(s);
  }

  function mount(el, onChange){
    if(!el) return;
    ensureCSS();
    var ys=years();
    el.innerHTML='';
    var wrap=document.createElement('div'); wrap.className='oott-cardsel';
    if(ys.length<=1){
      wrap.innerHTML='<span class="ocs-lbl">Playing along with</span> <b class="ocs-one">'+(year()||'—')+' NMJL card</b>';
    } else {
      var lbl=document.createElement('span'); lbl.className='ocs-lbl'; lbl.textContent='Card'; wrap.appendChild(lbl);
      var sel=document.createElement('select'); sel.className='ocs-sel';
      ys.forEach(function(y){ var o=document.createElement('option'); o.value=y; o.textContent=y+' NMJL card'; if(y===year()) o.selected=true; sel.appendChild(o); });
      sel.onchange=function(){ setYear(sel.value); if(typeof onChange==='function') onChange(sel.value); };
      wrap.appendChild(sel);
    }
    el.appendChild(wrap);
  }

  window.OOTTCARD={ years:years, year:year, active:active, setYear:setYear, latest:latest, pointer:pointer, mount:mount };
})();
