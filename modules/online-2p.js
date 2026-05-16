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
  const map=Math.max(0,Math.min(LAYOUTS.length-1,parseInt(params.get('map')||'0',10)));
  // Online: each browser only knows its OWN character pick. The friend's pick will arrive on
  // their browser via the same query param (in the URL they opened). The partner stays at the
  // engine default until they actually join — visible default is CRIMSON for the remote side.
  const p1=Math.max(0,Math.min(CHARACTERS.length-1,parseInt(params.get('p1')||'0',10)));
  // Engine globals.
  playerCount=2;
  selModeIdx=2;
  selDiffIdx=diff;
  selMapIdx=map;
  selectedMap=map;
  selP1CharIdx=p1;

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

  // ICE servers: Google STUN for direct hole-punching + Open Relay TURN as a relay
  // fallback. Without TURN, peers behind symmetric NAT (cellular, many office
  // networks) fail with `negotiation-failed`.
  // If the openrelayproject credentials stop working, sign up for free creds at
  // https://www.metered.ca/tools/openrelay/ and replace the entries below.
  const ICE_SERVERS=[
    {urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},
    {urls:['stun:stun2.l.google.com:19302','stun:stun3.l.google.com:19302']},
    {urls:['stun:stun4.l.google.com:19302']},
    {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
    {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
    {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}
  ];
  const PEER_OPTS={debug:1,config:{iceServers:ICE_SERVERS}};

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
  // The code is only revealed in the UI after the broker confirms registration —
  // otherwise a fast guest could enter the code before the host exists on the
  // broker and would get a "could not reach" error.
  function spinHost(){
    const code=genCode();
    document.getElementById('codeDisplay').textContent='…';
    document.getElementById('hostStatus').textContent='⏳ Registering with matchmaking server…';
    destroyPeer();
    peer=new Peer(code,PEER_OPTS);
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
    peer.on('open',()=>{
      hostRetryAttempts=0;
      document.getElementById('codeDisplay').textContent=code;
      document.getElementById('hostStatus').textContent='⏳ Waiting for friend to join…';
    });
    peer.on('connection',c=>{
      connRef=c;
      Net.role='host';
      Net.conn=c;
      c.on('open',()=>{
        c.on('data',d=>{if(d&&d.t==='i')Net.remoteInput=d.d||{};});
        c.on('close',()=>{showError('Friend disconnected.');});
        startNetGame();
      });
      c.on('error',e=>{
        console.error('connection error',e);
        showError('Connection error with guest: '+e.type+'. If this keeps happening, both players may be behind a firewall blocking WebRTC.');
      });
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
    destroyPeer();
    peer=new Peer(PEER_OPTS);
    let joinAttempts=0;
    const JOIN_MAX_ATTEMPTS=3;

    // `peer-unavailable` means the broker doesn't know that code yet — usually
    // because the host hasn't finished registering. Retry a couple of times
    // before giving up.
    peer.on('error',e=>{
      console.error('peer guest error',e);
      if(e.type==='peer-unavailable'){
        joinAttempts++;
        if(joinAttempts<JOIN_MAX_ATTEMPTS){
          document.getElementById('joinStatus').textContent='⏳ Host not ready yet — retrying ('+joinAttempts+'/'+JOIN_MAX_ATTEMPTS+')…';
          setTimeout(()=>tryConnect(code),1200);
          return;
        }
        showError('No host found for code "'+code+'". Make sure your friend is on the lobby screen.');
        return;
      }
      if(e.type==='network'||e.type==='server-error'||e.type==='disconnected'){
        showError('Lost the matchmaking server. Check your internet and try again.');
        return;
      }
      showError('Could not connect: '+e.type);
    });
    peer.on('open',()=>tryConnect(code));
  }

  function tryConnect(code){
    if(!peer) return;
    const c=peer.connect(code,{reliable:true});
    connRef=c;
    Net.role='guest';
    Net.conn=c;
    c.on('open',()=>{
      c.on('data',d=>{if(d&&d.t==='s')Net.lastState=d;});
      c.on('close',()=>{showError('Host disconnected.');});
      startNetGame();
    });
    c.on('error',e=>{
      console.error('connection error',e);
      showError('Connection error: '+e.type+'. If this keeps happening, both players may be behind a firewall blocking WebRTC.');
    });
    // Fallback if neither open nor error fires within 15s.
    setTimeout(()=>{if(c&&!c.open&&!Net.lastState)showError('Connection timed out. Double-check the code or try a different network.');},15000);
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
