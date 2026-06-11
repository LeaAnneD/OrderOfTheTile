/* ============================================================================
   OOTT Mini-Games — Shared Supabase auth + leaderboard module
   ----------------------------------------------------------------------------
   Load as a module AFTER the drill sets its three globals:
     <script>
       window.OOTT_GAME      = "discard-detective";   // sessions.game slug
       window.OOTT_GAME_NAME = "Discard Detective";    // shown on the high-score board
       window.OOTT_REDIRECT  = "https://www.orderofthetile.com/mini-games/discard-detective/";
     </script>
     <script type="module" src="../_engine/leaderboard.js"></script>

   Requires these elements in the page (same ids the template uses):
     #authStatus #authBtn #logoutBtn #lbBtn  and the .scrim/.card modal styles.

   Exposes window.OOTT = { user, logSession({mode,level,accuracy,duration_sec,clean}),
                           openAuth(), openLeaderboard() }.
   Shared backend (project avltolzpzxcdmgrjnsfa): leaderboards lb_time (cross-drill
   total time) + lb_highscores (fastest clean run per game/mode/level).
   ============================================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SB_URL  = "https://avltolzpzxcdmgrjnsfa.supabase.co";
const SB_KEY  = "sb_publishable_zI6klteA7Kz4wbBoMCfOng_sb1Dz-pK";
const GAME      = window.OOTT_GAME      || "unnamed-drill";
const GAME_NAME = window.OOTT_GAME_NAME || "this drill";
const REDIRECT  = window.OOTT_REDIRECT  || (location.origin + location.pathname);

const sb = createClient(SB_URL, SB_KEY);
let user = null;
const q   = s => document.querySelector(s);
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = s => { s=Math.round(s); if(s<60)return s+'s'; const m=Math.floor(s/60),r=s%60; if(m<60)return m+'m '+r+'s'; return Math.floor(m/60)+'h '+(m%60)+'m'; };

function renderBar(){
  const st=q("#authStatus"), a=q("#authBtn"), o=q("#logoutBtn");
  if(!st) return;
  if(user){ st.textContent='Signed in as '+(user.user_metadata?.display_name||user.email); if(a)a.style.display='none'; if(o)o.style.display=''; }
  else { st.textContent='Playing as guest — scores aren’t saved'; if(a)a.style.display=''; if(o)o.style.display='none'; }
}
function modal(html){
  const scrim=document.createElement('div'); scrim.className='scrim show';
  scrim.innerHTML='<div class="card">'+html+'</div>';
  scrim.addEventListener('click',e=>{if(e.target===scrim)scrim.remove();});
  document.body.appendChild(scrim); return scrim;
}
function openAuth(){
  let signup=false;
  const m=modal(`<h2 id="aTitle">Log in</h2>
    <p class="verdict">Save your progress and join the leaderboard.</p>
    <div class="authform">
      <input id="aName" type="text" placeholder="Display name (shown on leaderboard)" style="display:none;">
      <input id="aEmail" type="email" placeholder="Email" autocomplete="email">
      <input id="aPass" type="password" placeholder="Password (6+ characters)" autocomplete="current-password">
      <div class="authmsg" id="aMsg"></div>
      <button class="btn" id="aGo">Log in</button>
      <button class="btn ghost" id="aToggle">New here? Create an account</button>
      <p class="note" style="font-size:.82rem; color:var(--ink-soft); font-style:italic; margin:6px 0 0;">We never sell your information. Your login only saves your stats and lets you appear on the leaderboard.</p>
    </div>`);
  const name=m.querySelector('#aName'),email=m.querySelector('#aEmail'),pass=m.querySelector('#aPass'),msg=m.querySelector('#aMsg'),go=m.querySelector('#aGo'),tog=m.querySelector('#aToggle'),title=m.querySelector('#aTitle');
  tog.onclick=()=>{ signup=!signup; name.style.display=signup?'':'none'; title.textContent=signup?'Create account':'Log in'; go.textContent=signup?'Create account':'Log in'; tog.textContent=signup?'Have an account? Log in':'New here? Create an account'; msg.textContent=''; };
  go.onclick=async()=>{
    msg.className='authmsg'; msg.textContent='Working…'; go.disabled=true;
    try{
      if(signup){
        const {data,error}=await sb.auth.signUp({email:email.value.trim(),password:pass.value,options:{emailRedirectTo:REDIRECT,data:{display_name:name.value.trim()||email.value.split('@')[0]}}});
        if(error)throw error;
        if(data.session){ msg.className='authmsg ok'; msg.textContent='Account created — you’re in.'; setTimeout(()=>m.remove(),700); }
        else { msg.className='authmsg ok'; msg.innerHTML='Almost there — we sent a confirmation link to <b>'+esc(email.value.trim())+'</b>. Click it, then come back and log in.'; }
      }else{
        const {error}=await sb.auth.signInWithPassword({email:email.value.trim(),password:pass.value});
        if(error)throw error;
        msg.className='authmsg ok'; msg.textContent='Welcome back.'; setTimeout(()=>m.remove(),500);
      }
    }catch(err){ msg.className='authmsg'; msg.textContent=(err&&err.message)||String(err); }
    go.disabled=false;
  };
}
async function openLeaderboard(){
  const m=modal(`<h2>Leaderboard</h2>
    <div class="lbtabs"><button class="btn mini" id="lbT1">Most time played</button><button class="btn ghost mini" id="lbT2">High scores</button></div>
    <div id="lbBody">Loading…</div>
    <div class="modal-actions" style="grid-template-columns:1fr;"><button class="btn ghost" id="lbClose">Close</button></div>`);
  m.querySelector('#lbClose').onclick=()=>m.remove();
  const body=m.querySelector('#lbBody'), t1=m.querySelector('#lbT1'), t2=m.querySelector('#lbT2');
  async function showTime(){
    t1.className='btn mini'; t2.className='btn ghost mini'; body.textContent='Loading…';
    const {data,error}=await sb.from('lb_time').select('*').limit(25);
    if(error){body.innerHTML='<p class="note">'+esc(error.message)+'</p>';return;}
    if(!data.length){body.innerHTML='<p class="note">No players yet — be the first.</p>';return;}
    body.innerHTML='<p class="note" style="margin-top:0;">Time played across every Order of the Tile drill.</p><table class="lbtable"><thead><tr><th>#</th><th>Player</th><th>Time played</th><th>Rounds</th></tr></thead><tbody>'+data.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.display_name)}</td><td>${fmt(r.total_seconds)}</td><td>${r.rounds_played}</td></tr>`).join('')+'</tbody></table>';
  }
  async function showHigh(){
    t2.className='btn mini'; t1.className='btn ghost mini'; body.textContent='Loading…';
    const {data,error}=await sb.from('lb_highscores').select('*').eq('game',GAME);
    if(error){body.innerHTML='<p class="note">'+esc(error.message)+'</p>';return;}
    if(!data.length){body.innerHTML='<p class="note">No clean (100%) runs yet — set the first record.</p>';return;}
    body.innerHTML='<p class="note" style="margin-top:0;">Fastest clean run in <b>'+esc(GAME_NAME)+'</b>.</p><table class="lbtable"><thead><tr><th>Mode</th><th>Level</th><th>Record holder</th><th>Best</th></tr></thead><tbody>'+data.map(r=>`<tr><td>${esc(r.mode||'—')}</td><td>${r.level}</td><td>${esc(r.display_name)}</td><td>${(+r.best_seconds).toFixed(1)}s</td></tr>`).join('')+'</tbody></table>';
  }
  t1.onclick=showTime; t2.onclick=showHigh; showTime();
}
window.OOTT={
  get user(){return user;},
  async logSession(d){
    if(!user)return;
    try{ await sb.from('sessions').insert({user_id:user.id,game:GAME,mode:d.mode,level:d.level,accuracy:d.accuracy,duration_sec:d.duration_sec,clean:!!d.clean}); }catch(e){}
  },
  openAuth, openLeaderboard
};
const ab=q("#authBtn"); if(ab)ab.onclick=openAuth;
const lb=q("#lbBtn"); if(lb)lb.onclick=openLeaderboard;
const lo=q("#logoutBtn"); if(lo)lo.onclick=async()=>{ await sb.auth.signOut(); };
sb.auth.onAuthStateChange((_e,session)=>{ user=session?.user||null; renderBar(); });
const {data:{session}}=await sb.auth.getSession(); user=session?.user||null; renderBar();
