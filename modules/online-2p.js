// Online 2-player bootstrap. Uses PeerJS (loaded via CDN in the HTML) to broker a WebRTC
// data channel between two browsers. The host generates a short code; the joiner enters it.
//
// Once connected:
//   • Host runs the simulation (engine's startGame), receives input packets from the guest,
//     sends world snapshots ~30Hz.
//   • Guest skips simulation, sends its keyboard input ~30Hz, renders received state.
(function(){
  const params=new URLSearchParams(window.location.search);
  const diff=Math.max(0,Math.min(3,parseInt(params.get('diff')||'1',10)));
  // Engine globals.
  playerCount=2;
  selModeIdx=1;
  selDiffIdx=diff;

  // Hide the in-game HUD until the lobby resolves and the game actually starts.
  ['hud','skillBar','weapBar','modeBadge','leaveBtn'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  document.getElementById('gameCanvas').style.display='none';

  showPanel('lobbyPanel');
  Music.apply();

  // Short, friendly code: 6 chars, uppercase letters + digits (no I/O/0/1).
  function genCode(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s='';for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)];
    return 'CS-'+s;
  }

  let peer=null,connRef=null;
  let hostRetryAttempts=0;
  const HOST_MAX_RETRIES=4;

  function setLobbyView(which){
    ['lobbyInit','lobbyHosting','lobbyJoining','lobbyError'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.style.display=id===which?'block':'none';
    });
  }
  function showError(msg){
    document.getElementById('errMsg').textContent=msg;
    setLobbyView('lobbyError');
  }
  function destroyPeer(){
    if(peer){try{peer.destroy();}catch(e){}peer=null;}
    connRef=null;
  }

  function host(){
    destroyPeer();
    hostRetryAttempts=0;
    setLobbyView('lobbyHosting');
    spinHost();
  }
  // Spin up a fresh peer with a new code. Retries automatically on `unavailable-id`
  // collisions (very rare with a 6-char alphabet, but the broker is shared).
  function spinHost(){
    const code=genCode();
    document.getElementById('codeDisplay').textContent=code;
    document.getElementById('hostStatus').textContent='⏳ Waiting for friend to join…';
    destroyPeer();
    peer=new Peer(code,{
      debug:1,
      iceServers:[
        {urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},
        {urls:['stun:stun2.l.google.com:19302','stun:stun3.l.google.com:19302']},
        {urls:['stun:stun4.l.google.com:19302']}
      ]
    });
    peer.on('error',e=>{
      console.error('peer host error',e);
      if(e.type==='unavailable-id'){
        hostRetryAttempts++;
        if(hostRetryAttempts<HOST_MAX_RETRIES){
          document.getElementById('hostStatus').textContent='♻ Code taken — generating another…';
          setTimeout(spinHost,250);
        }else{
          showError('Could not generate a free code. Check your connection and try again.');
        }
        return;
      }
      if(e.type==='network'||e.type==='server-error'||e.type==='disconnected'){
        showError('Lost the matchmaking server. Check your internet and try again.');
        return;
      }
      showError('Hosting failed: '+e.type);
    });
    peer.on('open',()=>{hostRetryAttempts=0;});
    peer.on('connection',c=>{
      connRef=c;
      Net.role='host';
      Net.conn=c;
      c.on('open',()=>{
        c.on('data',d=>{if(d&&d.t==='i')Net.remoteInput=d.d||{};});
        c.on('close',()=>{showError('Friend disconnected.');});
        startNetGame();
      });
      c.on('error',e=>{console.error('connection error',e);showError('Connection error with guest: '+e.type);});
    });
  }
  function regenerateCode(){
    if(Net.role)return;  // already in-game
    document.getElementById('hostStatus').textContent='♻ Generating new code…';
    spinHost();
  }

  function join(rawCode){
    const code=(rawCode||'').toUpperCase().trim();
    if(!code){showError('Please enter a code.');return;}
    setLobbyView('lobbyJoining');
    document.getElementById('joinStatus').textContent='⏳ Connecting to '+code+'…';
    peer=new Peer({
      debug:1,
      iceServers:[
        {urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},
        {urls:['stun:stun2.l.google.com:19302','stun:stun3.l.google.com:19302']},
        {urls:['stun:stun4.l.google.com:19302']}
      ]
    });
    peer.on('error',e=>{console.error(e);showError('Could not connect: '+e.type);});
    peer.on('open',()=>{
      const c=peer.connect(code);
      connRef=c;
      Net.role='guest';
      Net.conn=c;
      c.on('open',()=>{
        c.on('data',d=>{if(d&&d.t==='s')Net.lastState=d;});
        c.on('close',()=>{showError('Host disconnected.');});
        startNetGame();
      });
      c.on('error',e=>{console.error('connection error',e);showError('Could not reach that code. Double-check it.');});
      // Fallback if open never fires
      setTimeout(()=>{if(!c.open)showError('Could not reach that code. Double-check it.');},10000);
    });
  }

  function startNetGame(){
    hidePanel('lobbyPanel');
    document.getElementById('bNet').textContent=Net.role==='host'?'HOST':'GUEST';
    // Engine's startGame populates HUD, players, and starts the loop. For the guest we still
    // call it so DOM is set up; the loop's role-aware branch skips physics.
    startGame(2,diff);
    // Online mode shows your friend's HP too.
    const hp2=document.getElementById('hpWrap2');if(hp2)hp2.style.display='block';
  }

  document.getElementById('btnHost').addEventListener('click',host);
  document.getElementById('btnJoin').addEventListener('click',()=>join(document.getElementById('joinCode').value));
  document.getElementById('joinCode').addEventListener('keydown',e=>{if(e.key==='Enter')join(e.target.value);});
  document.getElementById('btnCopy').addEventListener('click',()=>{
    const code=document.getElementById('codeDisplay').textContent;
    navigator.clipboard.writeText(code).then(()=>{
      const b=document.getElementById('btnCopy');b.textContent='✓ COPIED';
      setTimeout(()=>{b.textContent='📋 COPY';},1400);
    });
  });
  document.getElementById('btnRegen').addEventListener('click',regenerateCode);
})();
