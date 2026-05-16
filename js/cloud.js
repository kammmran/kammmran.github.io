// CHRONO SHIFT — Cloud (Firebase) wrapper.
//
// All cloud features are gated by `Cloud.ready`. If Firebase SDK isn't loaded or `firebaseConfig`
// is missing / placeholder, the module silently no-ops and the game continues on localStorage.
// Consumers (UI render code, hooks) call Cloud methods unconditionally and rely on this guard.

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
      this._userDoc().update(Object.assign({lastSeen:Date.now()}, p))
        .catch(e=>console.warn('[Cloud] syncStats failed', e));
    }, this._saveDelayMs);
  },
  // Immediate variant — used for high-water-mark fields (bestScore) where waiting 30s could
  // lose a session-end update. Still safe: bestScore is monotonic.
  syncStatsNow(patch){
    if(!this.ready || !this.user) return Promise.resolve();
    return this._userDoc().update(Object.assign({lastSeen:Date.now()}, patch))
      .catch(e=>console.warn('[Cloud] syncStatsNow failed', e));
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
