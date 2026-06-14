/* ============================================================================
   OOTT Mini-Games — Tester Feedback wrapper (drop-in)
   ----------------------------------------------------------------------------
   Adds a floating "Report / Feedback" button to ANY game, captures which game
   is being tested + a screenshot + an error log, and files it to Supabase for
   Lea Anne (and only Lea Anne) to triage.

   HOW TO ADD TO A GAME (one line, after the game sets its OOTT_GAME globals):
     <script type="module" src="../_engine/feedback.js"></script>
   It reuses the same window.OOTT_GAME / OOTT_GAME_NAME the leaderboard uses, so
   the report always knows which game it came from. No other wiring needed.

   WHO SEES THE BUTTON (tester-gated; the public never sees it):
     • the link has ?test=1            (persists in localStorage so it follows
                                         the tester across every game)
     • OR the signed-in account is a tester/admin (profiles.is_tester/is_admin)
     • turn it off with ?test=0
   Submitted feedback is readable ONLY by admins (enforced by RLS) — see
   feedback_schema.sql.
   ============================================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SB_URL = "https://avltolzpzxcdmgrjnsfa.supabase.co";
const SB_KEY = "sb_publishable_zI6klteA7Kz4wbBoMCfOng_sb1Dz-pK";
const sb = createClient(SB_URL, SB_KEY);

const GAME      = window.OOTT_GAME      || (location.pathname.split('/').filter(Boolean).pop() || 'unknown');
const GAME_NAME = window.OOTT_GAME_NAME || GAME;

/* ---- error capture: starts the moment this module loads -------------------- */
const ERR_RING = [];
function pushErr(o){ try{ ERR_RING.push(Object.assign({t:new Date().toISOString()},o)); while(ERR_RING.length>20) ERR_RING.shift(); }catch(_){} }
window.addEventListener('error', e=>pushErr({type:'error', msg:String(e.message||e.error||''), src:(e.filename||'')+':'+(e.lineno||'')}));
window.addEventListener('unhandledrejection', e=>pushErr({type:'promise', msg:String((e.reason&&e.reason.message)||e.reason||'')}));
(function(){ const o=console.error; console.error=function(){ try{pushErr({type:'console', msg:[...arguments].map(a=>{try{return typeof a==='string'?a:JSON.stringify(a);}catch(_){return String(a);}}).join(' ')});}catch(_){ } return o.apply(console,arguments); }; })();
function collectErrors(){
  const out = ERR_RING.slice();
  // also sweep any per-game localStorage error logs (e.g. oott_daily_err)
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(/err/i.test(k)&&/^oott/i.test(k)){ try{ const v=JSON.parse(localStorage.getItem(k)); if(Array.isArray(v)) v.slice(-6).forEach(x=>out.push(Object.assign({from:k},x))); }catch(_){} } } }catch(_){}
  return out;
}

/* ---- tester gate ----------------------------------------------------------- */
function testerMode(){
  const p = new URLSearchParams(location.search);
  if(p.get('test')==='0'){ try{localStorage.removeItem('ott_tester_mode');}catch(_){} return false; }
  if(p.get('test')==='1'){ try{localStorage.setItem('ott_tester_mode','1');}catch(_){} return true; }
  try{ if(localStorage.getItem('ott_tester_mode')==='1') return true; }catch(_){}
  return false; // account-based testers are resolved async in boot()
}

const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---- styles (self-contained; OOTT palette) -------------------------------- */
function injectCSS(){
  if(document.getElementById('ottfb-css')) return;
  const css = `
  #ottfb-btn{position:fixed;right:16px;bottom:16px;z-index:99998;font-family:"Crimson Text",Georgia,serif;font-size:.92rem;
    background:#B76E79;color:#fff;border:1px solid #9A5662;border-radius:24px;padding:10px 16px;cursor:pointer;
    box-shadow:0 2px 6px rgba(43,38,34,.2),0 8px 24px rgba(43,38,34,.18);display:flex;align-items:center;gap:7px;}
  #ottfb-btn:hover{background:#9A5662;}
  #ottfb-btn .dot{width:8px;height:8px;border-radius:50%;background:#FBF6EE;}
  .ottfb-scrim{position:fixed;inset:0;z-index:99999;background:rgba(43,38,34,.45);display:flex;align-items:center;justify-content:center;padding:18px;}
  .ottfb-card{background:#FBF6EE;color:#2B2622;font-family:"Crimson Text",Georgia,serif;border:1px solid #E2D6C4;border-radius:16px;
    width:min(560px,96vw);max-height:92vh;overflow:auto;box-shadow:0 12px 40px rgba(43,38,34,.35);padding:20px 22px;}
  .ottfb-card h2{font-family:"Playfair Display",serif;font-weight:700;font-size:1.3rem;margin:.1em 0 .1em;}
  .ottfb-sub{color:#6B5F54;font-style:italic;margin:.1em 0 14px;font-size:.92rem;}
  .ottfb-row{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px;}
  .ottfb-chip{border:1px solid #E2D6C4;background:#fff;border-radius:20px;padding:7px 14px;cursor:pointer;font-size:.9rem;}
  .ottfb-chip[aria-pressed="true"]{background:#B76E79;color:#fff;border-color:#9A5662;}
  .ottfb-card label{display:block;font-size:.78rem;text-transform:uppercase;letter-spacing:.07em;color:#6B5F54;margin:10px 0 4px;}
  .ottfb-card textarea,.ottfb-card input{width:100%;font-family:inherit;font-size:1rem;padding:10px 12px;border:1px solid #E2D6C4;border-radius:10px;background:#fff;box-sizing:border-box;}
  .ottfb-card textarea{min-height:96px;resize:vertical;}
  .ottfb-shotwrap{border:1px dashed #E2D6C4;border-radius:12px;padding:10px;background:#fff;text-align:center;}
  .ottfb-shotwrap img{max-width:100%;max-height:200px;border-radius:8px;border:1px solid #E2D6C4;}
  .ottfb-mini{font-size:.82rem;border:1px solid #E2D6C4;background:#fff;color:#2B2622;border-radius:9px;padding:6px 12px;cursor:pointer;margin:6px 4px 0;}
  .ottfb-actions{display:flex;gap:10px;margin-top:16px;}
  .ottfb-actions button{flex:1;font-family:"Crimson Text",serif;font-size:1rem;border-radius:11px;padding:11px 16px;cursor:pointer;}
  .ottfb-go{background:#B76E79;color:#fff;border:1px solid #9A5662;}
  .ottfb-ghost{background:#fff;color:#2B2622;border:1px solid #E2D6C4;}
  .ottfb-msg{min-height:1.2em;font-size:.9rem;margin-top:8px;}
  .ottfb-msg.err{color:#B5524C;} .ottfb-msg.ok{color:#5E7D5A;}
  .ottfb-meta{font-size:.78rem;color:#6B5F54;margin-top:10px;border-top:1px solid #E2D6C4;padding-top:8px;}
  .ottfb-sev{display:none;}`;
  const el=document.createElement('style'); el.id='ottfb-css'; el.textContent=css; document.head.appendChild(el);
}

/* ---- html2canvas lazy-load ------------------------------------------------- */
let h2cPromise=null;
function loadH2C(){
  if(window.html2canvas) return Promise.resolve(window.html2canvas);
  if(h2cPromise) return h2cPromise;
  h2cPromise = new Promise((res,rej)=>{ const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    s.onload=()=>res(window.html2canvas); s.onerror=rej; document.head.appendChild(s); });
  return h2cPromise;
}
async function autoShot(){
  try{
    const h2c=await loadH2C();
    const scale=Math.min(1, 1200/Math.max(window.innerWidth,1));
    const canvas=await h2c(document.body,{scale:Math.max(scale,0.5),useCORS:true,backgroundColor:'#FBF6EE',
      ignoreElements:el=>el.id==='ottfb-btn'||(el.classList&&el.classList.contains('ottfb-scrim'))});
    return canvas.toDataURL('image/jpeg',0.82);
  }catch(_){ return null; }
}
function dataURLtoBlob(d){ const [h,b]=d.split(','); const mime=(h.match(/:(.*?);/)||[])[1]||'image/jpeg'; const bin=atob(b); const u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i); return new Blob([u],{type:mime}); }

/* ---- the form -------------------------------------------------------------- */
let CURRENT_USER=null;
function openForm(){
  injectCSS();
  let kind='bug', shot=null;
  const scrim=document.createElement('div'); scrim.className='ottfb-scrim';
  const loggedIn=!!CURRENT_USER;
  scrim.innerHTML=`<div class="ottfb-card" role="dialog" aria-modal="true">
    <h2>Tell Lea Anne what happened</h2>
    <p class="ottfb-sub">You're testing <b>${esc(GAME_NAME)}</b>. Good or bad — it all helps.</p>
    <div class="ottfb-row" id="ottfb-kinds">
      <button class="ottfb-chip" data-k="bug"       aria-pressed="true">🐞 Something broke</button>
      <button class="ottfb-chip" data-k="confusing" aria-pressed="false">❓ Confusing</button>
      <button class="ottfb-chip" data-k="idea"      aria-pressed="false">💡 Idea</button>
      <button class="ottfb-chip" data-k="praise"    aria-pressed="false">💛 Love it</button>
    </div>
    <div class="ottfb-sev" id="ottfb-sevwrap">
      <label>How bad?</label>
      <div class="ottfb-row" id="ottfb-sev">
        <button class="ottfb-chip" data-s="blocker" aria-pressed="false">Couldn't continue</button>
        <button class="ottfb-chip" data-s="annoying" aria-pressed="true">Annoying</button>
        <button class="ottfb-chip" data-s="minor" aria-pressed="false">Minor</button>
      </div>
    </div>
    <label>What happened / what do you want to share?</label>
    <textarea id="ottfb-body" placeholder="Tell me what you saw, what you expected, or what you'd love changed…"></textarea>
    <label>Screenshot <span style="text-transform:none;letter-spacing:0;font-style:italic;">(auto-captured — retake or attach your own)</span></label>
    <div class="ottfb-shotwrap" id="ottfb-shotwrap">
      <div id="ottfb-shotmsg" style="color:#6B5F54;font-style:italic;">Capturing the screen…</div>
      <div>
        <button class="ottfb-mini" id="ottfb-retake" type="button">⟳ Retake</button>
        <button class="ottfb-mini" id="ottfb-attach" type="button">📎 Attach mine</button>
        <button class="ottfb-mini" id="ottfb-clear" type="button">✕ No screenshot</button>
        <input type="file" id="ottfb-file" accept="image/*" style="display:none;">
      </div>
    </div>
    ${loggedIn ? '' : `
    <label>Your name &amp; email <span style="text-transform:none;letter-spacing:0;font-style:italic;">(so I can reply &amp; tell you when it's released)</span></label>
    <input id="ottfb-name" type="text" placeholder="Name (optional)" style="margin-bottom:8px;">
    <input id="ottfb-email" type="email" placeholder="Email (optional, but lets me follow up)">`}
    <div class="ottfb-msg" id="ottfb-msg"></div>
    <div class="ottfb-actions">
      <button class="ottfb-ghost" id="ottfb-cancel" type="button">Cancel</button>
      <button class="ottfb-go" id="ottfb-send" type="button">Send to Lea Anne</button>
    </div>
    <div class="ottfb-meta">Sends: game = ${esc(GAME)} · build = ${esc(buildStamp())} · screen ${window.innerWidth}×${window.innerHeight} · plus any error log. Only Lea Anne can read this.</div>
  </div>`;
  document.body.appendChild(scrim);
  const $=s=>scrim.querySelector(s);
  scrim.addEventListener('click',e=>{ if(e.target===scrim) scrim.remove(); });

  // kind chips
  $('#ottfb-kinds').addEventListener('click',e=>{ const b=e.target.closest('.ottfb-chip'); if(!b)return;
    kind=b.dataset.k; [...$('#ottfb-kinds').children].forEach(c=>c.setAttribute('aria-pressed', c===b));
    $('#ottfb-sevwrap').style.display = kind==='bug' ? 'block':'none'; });
  // severity chips
  $('#ottfb-sev').addEventListener('click',e=>{ const b=e.target.closest('.ottfb-chip'); if(!b)return;
    [...$('#ottfb-sev').children].forEach(c=>c.setAttribute('aria-pressed', c===b)); });
  $('#ottfb-sevwrap').style.display='block';

  function setShot(dataURL){ shot=dataURL; const w=$('#ottfb-shotmsg');
    if(dataURL){ w.innerHTML=`<img src="${dataURL}" alt="screenshot preview">`; }
    else { w.textContent='No screenshot attached.'; } }

  // auto-capture (hide modal briefly so it grabs the game, not the form)
  scrim.style.visibility='hidden';
  autoShot().then(d=>{ scrim.style.visibility='visible'; setShot(d); if(!d) $('#ottfb-shotmsg').textContent='Couldn’t auto-capture — attach your own if you like.'; });

  $('#ottfb-retake').onclick=()=>{ $('#ottfb-shotmsg').textContent='Capturing…'; scrim.style.visibility='hidden';
    autoShot().then(d=>{ scrim.style.visibility='visible'; setShot(d); }); };
  $('#ottfb-attach').onclick=()=>$('#ottfb-file').click();
  $('#ottfb-clear').onclick=()=>setShot(null);
  $('#ottfb-file').onchange=e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>setShot(r.result); r.readAsDataURL(f); };
  // paste-to-attach
  scrim.addEventListener('paste',e=>{ const it=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/')); if(it){ const f=it.getAsFile(); const r=new FileReader(); r.onload=()=>setShot(r.result); r.readAsDataURL(f);} });

  $('#ottfb-cancel').onclick=()=>scrim.remove();
  $('#ottfb-send').onclick=async()=>{
    const msg=$('#ottfb-msg'); const body=$('#ottfb-body').value.trim();
    if(!body){ msg.className='ottfb-msg err'; msg.textContent='Tell me a little about what happened first.'; return; }
    const send=$('#ottfb-send'); send.disabled=true; msg.className='ottfb-msg'; msg.textContent='Sending…';
    try{
      let name=CURRENT_USER?.user_metadata?.display_name||null, email=CURRENT_USER?.email||null;
      if(!CURRENT_USER){ name=($('#ottfb-name').value||'').trim()||null; email=($('#ottfb-email').value||'').trim()||null; }
      const sev = kind==='bug' ? ($('#ottfb-sev').querySelector('[aria-pressed="true"]')?.dataset.s||null) : null;
      let shot_path=null;
      if(shot){
        const id=(crypto&&crypto.randomUUID?crypto.randomUUID():String(Date.now()));
        const path=`${GAME}/${id}.jpg`;
        const { error:upErr }=await sb.storage.from('feedback-shots').upload(path, dataURLtoBlob(shot), {contentType:'image/jpeg',upsert:false});
        if(!upErr) shot_path=path; // a failed screenshot upload shouldn't block the report
      }
      const { error }=await sb.from('feedback').insert({
        game:GAME, game_name:GAME_NAME, kind, severity:sev, body,
        user_id:CURRENT_USER?.id||null, reporter_name:name, reporter_email:email,
        build_stamp:buildStamp(), page_url:location.href, user_agent:navigator.userAgent,
        viewport:`${window.innerWidth}x${window.innerHeight}`, error_log:collectErrors(), shot_path
      });
      if(error) throw error;
      if(email){ try{ await sb.from('tester_emails').upsert({email, name, source:'feedback'},{onConflict:'email',ignoreDuplicates:true}); }catch(_){} }
      msg.className='ottfb-msg ok'; msg.textContent='Sent — thank you. Lea Anne will take it from here.';
      $('#ottfb-send').textContent='Sent ✓';
      setTimeout(()=>scrim.remove(),1300);
    }catch(err){ msg.className='ottfb-msg err'; msg.textContent=(err&&err.message)||'Could not send — try again.'; send.disabled=false; }
  };
}

function buildStamp(){
  const el=document.getElementById('buildStamp'); if(el) return (el.textContent||'').replace(/^build\s*/i,'').trim()||'—';
  return (window.BUILD!=null? String(window.BUILD) : '—');
}

/* ---- button + boot --------------------------------------------------------- */
function mountButton(){
  if(document.getElementById('ottfb-btn')) return;
  injectCSS();
  const b=document.createElement('button'); b.id='ottfb-btn'; b.type='button';
  b.innerHTML='<span class="dot"></span> Report / Feedback';
  b.title='Testing mode — tell Lea Anne what you found';
  b.onclick=openForm; document.body.appendChild(b);
}

async function boot(){
  // resolve current user (shared session from the leaderboard login)
  try{ const { data:{ user } }=await sb.auth.getUser(); CURRENT_USER=user||null; }catch(_){}
  let show=testerMode();
  if(!show && CURRENT_USER){
    try{ const { data }=await sb.from('profiles').select('is_tester,is_admin').eq('id',CURRENT_USER.id).single();
      if(data&&(data.is_tester||data.is_admin)) show=true; }catch(_){}
  }
  if(show){
    if(document.body) mountButton();
    else document.addEventListener('DOMContentLoaded',mountButton);
  }
  // expose for manual trigger / debugging
  window.OOTT_FEEDBACK={ open:openForm, show:()=>{try{localStorage.setItem('ott_tester_mode','1');}catch(_){}; mountButton();} };
}
boot();
