// CHRONO SHIFT — Cloud (Firebase) wrapper.
//
// All cloud features are gated by `Cloud.ready`. If Firebase SDK isn't loaded or `firebaseConfig`
// is missing / placeholder, the module silently no-ops and the game continues on localStorage.
// Consumers (UI render code, hooks) call Cloud methods unconditionally and rely on this guard.

// ── Per-user storage namespace ─────────────────────────────────────────
// All gameplay data (coins, upgrades, inventory, achievements, daily, loot, high score) is
// stored in localStorage. To keep accounts isolated on the same browser, each save key is
// prefixed with the current user's UID. This block reads the UID Firebase persists in
// localStorage SYNCHRONOUSLY at script load — before script.js runs Upgrades.load() / etc. —
// so modules pick the correct namespace on first read with no race.
//
// Anonymous (signed-out) users keep the legacy unprefixed keys ("csUpgrades", etc.) so
// existing pre-auth saves remain accessible.
window.__currentUid = (function(){
  try{
    if(!window.firebaseConfig || !window.firebaseConfig.apiKey) return null;
    // Prefer the UID we pinned via _onAuthStateChanged on the previous run. This is the
    // single source of truth and prevents reload loops when stale firebase:authUser:* keys
    // from prior sessions disagree with the currently-signed-in user.
    const pinned = localStorage.getItem('cs_activeUid');
    if(pinned) return pinned;
    // Fallback: scan Firebase Auth's persisted user. The exact key changes across SDK
    // versions / app names, so we scan instead of hard-coding the format.
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k && k.indexOf('firebase:authUser:')===0){
        const raw=localStorage.getItem(k);
        if(!raw) continue;
        const data=JSON.parse(raw);
        if(data && data.uid) return data.uid;
      }
    }
    return null;
  }catch(e){ return null; }
})();
// Helper used by every save/load in script.js. Anonymous → base key; signed-in → 'u_<uid>_'+base.
window.userKey = function(base){
  return window.__currentUid ? ('u_'+window.__currentUid+'_'+base) : base;
};

const Cloud = {
  ready:false,
  user:null,           // firebase.User or null
  profile:null,        // last-known profile doc data
  leaderboard:[],      // most recent top-N leaderboard snapshot
  friends:[],          // resolved friend profiles
  _unsubProfile:null,
  _unsubLeaderboard:null,
  _saveTimer:null,
  _saveDelayMs:30000,  // batch profile updates to once per 30s to stay under free-tier quota
  _minWriteIntervalMs:10000,  // hard floor between ANY two profile writes (covers syncStatsNow bursts)
  _lastWriteAt:0,
  _pendingNowPatch:null,
  _pendingNowTimer:null,

  init(){
    if(typeof firebase==='undefined'){
      console.log('[Cloud] Firebase SDK not loaded.');
      return;
    }
    if(!window.firebaseConfig || !window.firebaseConfig.apiKey ||
       window.firebaseConfig.apiKey==='PASTE_YOUR_API_KEY_HERE'){
      console.log('[Cloud] firebase-config.js missing or not configured.');
      return;
    }
    try{
      // initializeApp is idempotent across module pages: only init if no app exists.
      if(!firebase.apps || !firebase.apps.length){
        firebase.initializeApp(window.firebaseConfig);
      }
      this.auth=firebase.auth();
      this.db=firebase.firestore();
      this.ready=true;
      this.auth.onAuthStateChanged(u=>this._onAuthStateChanged(u));
    }catch(e){
      console.error('[Cloud] init failed', e);
    }
  },
  isReady(){return this.ready;},
  isSignedIn(){return !!this.user;},
  displayName(){return this.user?this.user.displayName||'Player':null;},
  photoURL(){return this.user?this.user.photoURL:null;},
  uid(){return this.user?this.user.uid:null;},

  // ── Auth ──────────────────────────────────────────────
  signIn(){
    if(!this.ready) return Promise.reject(new Error('Cloud not configured'));
    const provider=new firebase.auth.GoogleAuthProvider();
    return this.auth.signInWithPopup(provider).catch(e=>{
      console.error('[Cloud] sign-in failed', e);
      throw e;
    });
  },
  signOut(){
    if(!this.ready) return Promise.resolve();
    return this.auth.signOut();
  },
  _onAuthStateChanged(u){
    const newUid = u ? u.uid : null;
    const prevUid = window.__currentUid;
    // If the UID changed since page load, the localStorage namespace is wrong — every module
    // has already loaded from the old user's keys. Migrate anonymous progress (if any) into the
    // new user's namespace on first sign-in, then hard reload so all modules re-read with the
    // correct keys. This guarantees account isolation.
    if(newUid !== prevUid){
      // Guard against reload loops: if we already reloaded for an auth change within the
      // last few seconds, stop reloading and just continue with the wrong namespace this
      // session rather than refreshing forever. The pinned UID below means a fresh manual
      // reload will pick up the correct namespace.
      const RELOAD_GUARD='cs_uid_reload_ts';
      const lastReload=parseInt(sessionStorage.getItem(RELOAD_GUARD)||'0', 10);
      const looping = (Date.now()-lastReload) < 5000;
      // Pin the active UID so the NEXT page load reads the correct namespace immediately
      // and the (newUid !== prevUid) check converges instead of looping.
      try{
        if(newUid) localStorage.setItem('cs_activeUid', newUid);
        else localStorage.removeItem('cs_activeUid');
      }catch(e){}
      if(newUid && !prevUid){
        // First-time sign-in: copy anonymous saves into the user namespace if the user has
        // none yet. This preserves the player's pre-auth progress on first link to an account.
        const KEYS = ['csUpgrades','csInventory','csAchievements','csCoupons','csDailyMissions','csLootBoxes','csBest2'];
        KEYS.forEach(k=>{
          const userKey = 'u_'+newUid+'_'+k;
          if(localStorage.getItem(userKey)===null){
            const anon = localStorage.getItem(k);
            if(anon!==null) localStorage.setItem(userKey, anon);
          }
        });
      }
      if(looping){
        console.warn('[Cloud] auth UID mismatch but reload loop detected — staying on page');
        window.__currentUid = newUid;
        // Fall through to normal signed-in handling below.
      }else{
        try{ sessionStorage.setItem(RELOAD_GUARD, String(Date.now())); }catch(e){}
        window.location.reload();
        return;
      }
    }
    // UID matched the persisted one — modules already loaded the right namespace; nothing to do.
    this.user=u;
    if(this._unsubProfile){this._unsubProfile(); this._unsubProfile=null;}
    if(u){
      this._ensureProfile().then(()=>this._subscribeToProfile()).catch(e=>console.error(e));
    }else{
      this.profile=null;
      this.friends=[];
    }
    if(typeof refreshCloudUI==='function') refreshCloudUI();
  },

  // ── Profile ───────────────────────────────────────────
  _userDoc(uid){return this.db.collection('users').doc(uid||this.user.uid);},
  async _ensureProfile(){
    if(!this.user) return;
    const ref=this._userDoc();
    const snap=await ref.get();
    if(!snap.exists){
      await ref.set({
        displayName:this.user.displayName||'Player',
        photoURL:this.user.photoURL||null,
        avatar:0,
        bestScore:0, totalCoins:0, totalKills:0, levelsCleared:0, bossesDown:0,
        friends:[],
        shortCode:this._generateShortCode(),
        createdAt:Date.now(),
        lastSeen:Date.now(),
      });
    }else{
      try{await ref.update({lastSeen:Date.now()});}catch(e){}
    }
  },
  _subscribeToProfile(){
    if(!this.user) return;
    this._unsubProfile=this._userDoc().onSnapshot(snap=>{
      this.profile=snap.data()||null;
      // Resolve friend display names whenever the friends array changes.
      this._refreshFriends();
      if(typeof refreshCloudUI==='function') refreshCloudUI();
    });
  },
  _generateShortCode(){
    // 6-char base32-ish code (alphabet skips 0/1/I/O for legibility).
    const alpha='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out=''; for(let i=0;i<6;i++) out+=alpha[Math.floor(Math.random()*alpha.length)];
    return out;
  },

  // ── Stat sync ─────────────────────────────────────────
  // Called by game-event hooks. Batches writes to once every _saveDelayMs to stay polite to
  // the free tier — call this whenever stats change locally, but the write is debounced.
  syncStats(patch){
    if(!this.ready || !this.user) return;
    this._pendingPatch=Object.assign(this._pendingPatch||{}, patch);
    if(this._saveTimer) return;
    this._saveTimer=setTimeout(()=>{
      const p=this._pendingPatch; this._pendingPatch=null; this._saveTimer=null;
      if(!p) return;
      this._writeProfile(p, 'syncStats');
    }, this._saveDelayMs);
  },
  // "Immediate" variant — used for high-water-mark fields (bestScore) where waiting 30s could
  // lose a session-end update. Still rate-limited by _minWriteIntervalMs so rapid game-overs
  // (or any future per-frame caller) can't hammer Firestore. Patches coalesce while waiting.
  syncStatsNow(patch){
    if(!this.ready || !this.user) return Promise.resolve();
    this._pendingNowPatch=Object.assign(this._pendingNowPatch||{}, patch);
    const wait=Math.max(0, this._minWriteIntervalMs - (Date.now() - this._lastWriteAt));
    if(wait===0){
      const p=this._pendingNowPatch; this._pendingNowPatch=null;
      return this._writeProfile(p, 'syncStatsNow');
    }
    if(this._pendingNowTimer) return Promise.resolve();
    return new Promise(resolve=>{
      this._pendingNowTimer=setTimeout(()=>{
        const p=this._pendingNowPatch; this._pendingNowPatch=null; this._pendingNowTimer=null;
        this._writeProfile(p, 'syncStatsNow').then(resolve, resolve);
      }, wait);
    });
  },
  _writeProfile(patch, label){
    this._lastWriteAt=Date.now();
    return this._userDoc().update(Object.assign({lastSeen:Date.now()}, patch))
      .catch(e=>console.warn('[Cloud] '+label+' failed', e));
  },

  // ── Leaderboard ───────────────────────────────────────
  // Subscribe to top-N players by bestScore. Auto-refreshes via Firestore onSnapshot.
  subscribeLeaderboard(limit=50){
    if(!this.ready) return;
    if(this._unsubLeaderboard) this._unsubLeaderboard();
    this._unsubLeaderboard=this.db.collection('users')
      .orderBy('bestScore','desc').limit(limit)
      .onSnapshot(snap=>{
        this.leaderboard=snap.docs.map((d,i)=>{
          const data=d.data();
          return {
            uid:d.id,
            rank:i+1,
            displayName:data.displayName||'Player',
            photoURL:data.photoURL||null,
            bestScore:data.bestScore|0,
            avatar:data.avatar|0,
          };
        });
        if(typeof refreshCloudUI==='function') refreshCloudUI();
      }, e=>console.warn('[Cloud] leaderboard subscribe failed', e));
  },
  unsubscribeLeaderboard(){
    if(this._unsubLeaderboard){this._unsubLeaderboard(); this._unsubLeaderboard=null;}
  },

  // ── Friends ───────────────────────────────────────────
  async addFriendByCode(code){
    if(!this.ready || !this.user) return {ok:false, msg:'Sign in first'};
    const c=(code||'').trim().toUpperCase();
    if(!c || c.length!==6) return {ok:false, msg:'Code must be 6 characters'};
    if(this.profile && this.profile.shortCode===c) return {ok:false, msg:"That's your own code"};
    try{
      const q=await this.db.collection('users').where('shortCode','==',c).limit(1).get();
      if(q.empty) return {ok:false, msg:'No player with that code'};
      const friend=q.docs[0];
      const fuid=friend.id;
      const cur=(this.profile&&this.profile.friends)||[];
      if(cur.includes(fuid)) return {ok:false, msg:'Already friends'};
      const next=cur.slice(); next.push(fuid);
      await this._userDoc().update({friends:next});
      return {ok:true, msg:'Added '+(friend.data().displayName||'Player')};
    }catch(e){
      console.error('[Cloud] addFriendByCode', e);
      return {ok:false, msg:'Error: '+e.message};
    }
  },
  async removeFriend(fuid){
    if(!this.ready||!this.user) return;
    const cur=(this.profile&&this.profile.friends)||[];
    const next=cur.filter(x=>x!==fuid);
    try{await this._userDoc().update({friends:next});}catch(e){console.warn(e);}
  },
  async _refreshFriends(){
    if(!this.profile || !Array.isArray(this.profile.friends) || this.profile.friends.length===0){
      this.friends=[];
      return;
    }
    try{
      const results=await Promise.all(this.profile.friends.map(fuid=>this._userDoc(fuid).get()));
      this.friends=results.filter(s=>s.exists).map(s=>{
        const d=s.data();
        return {
          uid:s.id,
          displayName:d.displayName||'Player',
          photoURL:d.photoURL||null,
          bestScore:d.bestScore|0,
          lastSeen:d.lastSeen|0,
          shortCode:d.shortCode||'',
        };
      });
    }catch(e){console.warn('[Cloud] friends refresh failed', e);}
  },
};

// Defer init until the SDK + config script tags have parsed.
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', ()=>Cloud.init());
}else{
  Cloud.init();
}
