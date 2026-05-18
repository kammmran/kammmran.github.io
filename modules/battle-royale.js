// CHRONO SHIFT — Battle Royale bootstrap.
//
// Three modes share this page:
//   1) SOLO vs BOTS — local sim, 1 human + N bots.
//   2) HOST ROOM    — PeerJS broker, accepts up to 5 guest connections.
//   3) JOIN ROOM    — connects to a host's room code as a guest.
//
// The host (or solo player) runs the simulation. Guests forward input and render snapshots
// (same model as the existing online-2p mode, extended for N peers).

(function(){
  const params = new URLSearchParams(location.search);
  const diff = Math.max(0, Math.min(3, parseInt(params.get('diff')||'1',10)));
  const charIdx = Math.max(0, Math.min(CHARACTERS.length-1, parseInt(params.get('p1')||'0',10)));

  // Persisted across the page in window-scope so script.js helpers can reach them.
  window.BR = {
    active:false,
    soloBots:0,
    timeLeft:0,         // frames remaining in the round
    maxTime: 60*60*3,   // 3 minutes at 60fps
    placement:[],       // ordered list of pids in elimination order (last alive = winner)
    teleporterReachedBy:null,
    matchEnded:false,
    matchStartTime:0,
    netRole:null,       // 'host'/'guest'/null for solo
    peer:null,
    conns:[],           // host: array of guest DataConnections
    hostConn:null,      // guest: single connection to host
    code:'',
    peerInfo:[],        // host: list of {pid, label} for connected peers
  };

  // ── Lobby tabs ──────────────────────────────────────────
  let curTab='solo';
  window.brSetTab = function(t){
    curTab=t;
    document.getElementById('brSoloPane').style.display = t==='solo' ? 'block' : 'none';
    document.getElementById('brHostPane').style.display = t==='host' ? 'block' : 'none';
    document.getElementById('brJoinPane').style.display = t==='join' ? 'block' : 'none';
    ['brTabSolo','brTabHost','brTabJoin'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.className='btn btn-g'+(id==='brTab'+(t==='solo'?'Solo':t==='host'?'Host':'Join')?' on':'');
    });
  };

  // ── SOLO ────────────────────────────────────────────────
  window.brStartSolo = function(){
    const sel=document.getElementById('brBotCount');
    BR.soloBots = parseInt((sel&&sel.value)||'3',10);
    BR.netRole=null;
    startBRMatch();
  };

  // ── HOST ────────────────────────────────────────────────
  window.brHostRoom = function(){
    document.getElementById('brHostStatus').textContent='⏳ Generating room code…';
    document.getElementById('brHostBtn').disabled=true;
    const code = 'BR-'+_genCode(6);
    BR.code=code;
    BR.peer = new Peer(code, _peerOpts());
    BR.peer.on('open', id=>{
      document.getElementById('brHostStatus').textContent='✓ Room hosted. Share this code with friends.';
      const cd=document.getElementById('brHostCode'); cd.textContent=code; cd.style.display='block';
      document.getElementById('brHostStartBtn').style.display='inline-block';
      _updatePeerList();
    });
    BR.peer.on('connection', c=>{
      BR.conns.push(c);
      c.on('open', ()=>{
        c.on('data', d=>_onPacketFromGuest(d, c));
        c.on('close', ()=>{
          BR.conns = BR.conns.filter(x=>x!==c);
          _updatePeerList();
        });
        _updatePeerList();
      });
      c.on('error', e=>console.warn('[BR] guest conn error', e));
    });
    BR.peer.on('error', e=>{
      console.error('[BR] host peer error', e);
      document.getElementById('brHostStatus').textContent='✗ Hosting failed: '+e.type+'. Try again.';
      document.getElementById('brHostBtn').disabled=false;
    });
    BR.netRole='host';
  };
  function _updatePeerList(){
    const el=document.getElementById('brHostPeers');
    if(!el) return;
    const openCount = BR.conns.filter(c=>c.open).length;
    el.textContent = '👥 '+(openCount+1)+' / 6 players connected (you + '+openCount+' guests)';
  }
  window.brHostStart = function(){
    if(!BR.peer) return;
    // Tell each guest to launch with the seed/diff so we start in sync.
    const seed = Math.floor(Math.random()*0xffffffff);
    BR.matchSeed = seed;
    BR.conns.forEach(c=>{ if(c.open) try{ c.send({t:'br_start', diff, seed}); }catch(e){} });
    startBRMatch();
  };

  // ── JOIN ────────────────────────────────────────────────
  window.brJoinRoom = function(){
    const raw=(document.getElementById('brJoinCode')||{}).value||'';
    const code=raw.trim().toUpperCase();
    if(!code){ _setJoinStatus('Enter a code first.', true); return; }
    _setJoinStatus('⏳ Connecting to '+code+'…');
    BR.peer = new Peer(_peerOpts());
    BR.peer.on('open', ()=>{
      const c = BR.peer.connect(code, {reliable:true});
      BR.hostConn = c;
      c.on('open', ()=>{
        _setJoinStatus('✓ Connected. Waiting for host to start the match…');
        c.on('data', d=>_onPacketFromHost(d));
        c.on('close', ()=>_setJoinStatus('Host disconnected.', true));
      });
      c.on('error', e=>_setJoinStatus('Connection error: '+e.type, true));
    });
    BR.peer.on('error', e=>_setJoinStatus('Could not connect: '+e.type, true));
    BR.netRole='guest';
  };
  function _setJoinStatus(msg, err){
    const el=document.getElementById('brJoinStatus');
    if(el){ el.textContent=msg; el.style.color = err ? '#ff5577' : '#aaa'; }
  }

  // ── Packet handlers ─────────────────────────────────────
  function _onPacketFromGuest(d, c){
    if(!d) return;
    if(d.t==='input'){ c._lastInput = d.d || {}; return; }
    if(d.t==='emoji' && typeof QuickChat!=='undefined') QuickChat.onReceive(d);
  }
  function _onPacketFromHost(d){
    if(!d) return;
    if(d.t==='br_start'){ BR.matchSeed=d.seed|0; startBRMatch(); return; }
    if(d.t==='snapshot'){ BR.lastSnapshot = d; return; }
    if(d.t==='end'){ showResults(d.results||{}); return; }
    if(d.t==='emoji' && typeof QuickChat!=='undefined') QuickChat.onReceive(d);
  }

  // ── Start the match ─────────────────────────────────────
  function startBRMatch(){
    BR.active=true;
    BR.timeLeft=BR.maxTime;
    BR.placement=[];
    BR.matchEnded=false;
    BR.matchStartTime=Date.now();
    // Hide lobby, show HUD + canvas. NB: the global CSS has display:none on #gameCanvas and
    // most HUD bars; we must set explicit display values (block / flex) — clearing inline style
    // falls back to those defaults and leaves the screen blank.
    document.getElementById('brLobby').style.display='none';
    document.getElementById('brResults').style.display='none';
    document.getElementById('gameCanvas').style.display='block';
    document.getElementById('hud').style.display='flex';
    document.getElementById('modeBadge').style.display='flex';
    document.getElementById('skillBar').style.display='flex';
    document.getElementById('weapBar').style.display='flex';
    const lv=document.getElementById('leaveBtn'); if(lv) lv.style.display='block';
    const tc=document.getElementById('touch');   if(tc) tc.style.display='flex';
    const cb=document.getElementById('comboBox'); if(cb) cb.style.display='block';
    // Game engine entry. window.startGame is defined in script.js. We extend playerCount on
    // the fly: solo+bots and host-with-N-guests both need playerCount=1+others.
    const humans = BR.netRole==='host' ? 1+BR.conns.filter(c=>c.open).length
                 : BR.netRole==='guest' ? 0 // guest doesn't sim; just rendering
                 : 1;
    const bots = BR.netRole==='solo' || BR.netRole==null ? BR.soloBots : 0;
    window.brHumans = humans;
    window.brBots = bots;
    // Mark BR mode on the engine. brStart() in script.js does the real init.
    if(typeof brStart==='function'){
      brStart({ diff, charIdx, humans, bots, role:BR.netRole, conns:BR.conns, hostConn:BR.hostConn });
    } else {
      console.error('brStart() not found in script.js');
    }
  }

  // Called by the engine when the match concludes (host detects last-alive / teleporter /
  // timer expired). Pushes results to guests and shows the local results panel.
  window.brOnMatchEnd = function(results){
    if(BR.matchEnded) return;
    BR.matchEnded=true;
    // Broadcast to all guests so they see results too.
    if(BR.netRole==='host'){
      BR.conns.forEach(c=>{ if(c.open) try{ c.send({t:'end', results}); }catch(e){} });
    }
    showResults(results);
  };

  function showResults(results){
    document.getElementById('hud').style.display='none';
    document.getElementById('skillBar').style.display='none';
    document.getElementById('weapBar').style.display='none';
    document.getElementById('gameCanvas').style.display='none';
    document.getElementById('touch').style.display='none';
    const mb=document.getElementById('modeBadge'); if(mb) mb.style.display='none';
    const lv=document.getElementById('leaveBtn'); if(lv) lv.style.display='none';
    const cb=document.getElementById('comboBox'); if(cb) cb.style.display='none';
    const panel=document.getElementById('brResults');
    panel.style.display='block';
    const placement = (results && results.placement) || 1;
    const winner = (results && results.winner) || '';
    const kills = (results && results.kills) || 0;
    const coins = (results && results.coinsEarned) || 0;
    document.getElementById('brResultTitle').textContent = placement===1 ? '★ VICTORY ★' : 'ELIMINATED';
    document.getElementById('brResultPlacement').textContent = 'Placement: '+ordinal(placement)+(winner?' · Winner: '+winner:'');
    document.getElementById('brResultStats').textContent = 'Kills: '+kills+' · Coins earned: '+coins;
    // Final board (if provided).
    const boardEl=document.getElementById('brResultBoard');
    if(boardEl && Array.isArray(results.board)){
      boardEl.innerHTML = results.board.map((row,i)=>{
        return '<div style="display:flex;gap:12px;padding:6px 10px;background:rgba(10,10,30,.55);border:1px solid rgba(161,0,255,.25);border-radius:6px;font-size:12px">'
          +'<div style="width:32px;color:#ffcc00;font-weight:700">#'+(i+1)+'</div>'
          +'<div style="flex:1">'+_escape(row.name)+'</div>'
          +'<div style="color:#ff5577">'+(row.kills|0)+' kills</div>'
          +'</div>';
      }).join('');
    }
    // Cloud stats sync (best placement, total wins, total kills in BR).
    if(typeof Cloud!=='undefined' && Cloud.isSignedIn()){
      const cur = Cloud.profile && Cloud.profile.brStats || {wins:0, rounds:0, kills:0, bestPlacement:9};
      const patch = {
        brStats: {
          wins: cur.wins + (placement===1?1:0),
          rounds: cur.rounds + 1,
          kills: cur.kills + kills,
          bestPlacement: Math.min(cur.bestPlacement||9, placement),
        },
      };
      Cloud.syncStatsNow(patch).catch(e=>console.warn(e));
    }
  }

  window.brBackToLobby = function(){
    BR.active=false;
    BR.matchEnded=false;
    document.getElementById('brResults').style.display='none';
    document.getElementById('goPanel').style.display='none';
    document.getElementById('brLobby').style.display='block';
    // Also stop the engine loop & clear BR-engine state so a re-launch starts clean.
    if(typeof brMode!=='undefined') brMode=false;
    if(typeof state!=='undefined') state='menu';
  };

  // ── Helpers ─────────────────────────────────────────────
  function _peerOpts(){
    return {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
          { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        ],
      },
      debug: 1,
    };
  }
  function _genCode(n){
    const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s=''; for(let i=0;i<n;i++) s+=a[Math.floor(Math.random()*a.length)];
    return s;
  }
  function _escape(s){ return String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function ordinal(n){
    const s=['th','st','nd','rd'], v=n%100;
    return n+(s[(v-20)%10]||s[v]||s[0]);
  }
})();
