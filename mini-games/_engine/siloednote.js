/* ============================================================================
   OOTT Mini-Games — "Siloed view" framing note  (shared)
   ----------------------------------------------------------------------------
   The hand-building drills show ONE slice of the game: just your tiles + the
   card. Real play also reads the Charleston and every discard — those are their
   own drills (Four-Charleston, Discard-Detective). This component frames that
   honestly without overwhelming: a fuller Prim beat the FIRST time a player
   opens a given drill, then a quiet one-liner on return visits.

   API (window.OOTTSILO):
     seen(key)        -> has this player seen the intro beat for <key>?
     mark(key)        -> remember they've seen it
     beatHTML()       -> the fuller first-time framing (block)
     noteHTML()       -> the persistent one-liner
     mountNote(el)    -> render the one-liner into el
   `key` is a per-game string (e.g. "coached") so each drill frames once.
   American Mah Jongg (NMJL) only.
   ============================================================================ */
(function(){
  "use strict";
  var LINE="A focused drill — just your hand and the card. Real play also reads the Charleston and every discard; those are their own drills.";
  var BEAT="One thing before we start: this is a slice of the game. Here it's just you, your tiles, and the card. At a real table you're also working the Charleston and reading every discard — we drill those separately. Right now, let's nail the choices in front of you.";
  function ensureCSS(){
    if(document.getElementById('oott-silo-css')) return;
    var s=document.createElement('style'); s.id='oott-silo-css';
    s.textContent=
      '.oott-silonote{font-style:italic;color:#6B5F54;font-size:.9rem;margin:2px 0 12px;line-height:1.4;}'+
      '.oott-silobeat{font-style:italic;color:#6B5F54;background:#F3EADc;border:1px solid #E2D6C4;border-radius:12px;padding:11px 14px;margin:0 0 14px;line-height:1.45;font-size:.95rem;}';
    document.head.appendChild(s);
  }
  function seen(key){ try{ return localStorage.getItem('oott_silo_'+key)==='1'; }catch(e){ return false; } }
  function mark(key){ try{ localStorage.setItem('oott_silo_'+key,'1'); }catch(e){} }
  function noteHTML(){ return '<p class="oott-silonote">'+LINE+'</p>'; }
  function beatHTML(){ return '<div class="oott-silobeat">'+BEAT+'</div>'; }
  function mountNote(el){ if(!el) return; ensureCSS(); el.innerHTML=noteHTML(); }
  window.OOTTSILO={ LINE:LINE, BEAT:BEAT, seen:seen, mark:mark, noteHTML:noteHTML, beatHTML:beatHTML, mountNote:mountNote, ensureCSS:ensureCSS };
})();
