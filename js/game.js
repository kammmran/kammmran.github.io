// ──────────────────────────────────────────────
// PER-USER STORAGE NAMESPACE FALLBACK
//
// cloud.js (loaded before this file) defines window.userKey() to prefix every save key with
// the signed-in user's UID, so accounts stay isolated on the same browser. If cloud.js failed
// to load (e.g., CDN down), this fallback keeps the game working with legacy unscoped keys.
// ──────────────────────────────────────────────
if(typeof window.userKey!=='function'){
  window.userKey = function(base){ return window.__currentUid ? ('u_'+window.__currentUid+'_'+base) : base; };
}

// ──────────────────────────────────────────────
// AUDIO
// ──────────────────────────────────────────────
const AU=(()=>{
  let ac=null;
  const g=()=>{if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac;};
  const o=(f,tp,d,v,dl=0,sw=0)=>{const c=g(),os=c.createOscillator(),gn=c.createGain();os.connect(gn);gn.connect(c.destination);os.type=tp||'sine';os.frequency.setValueAtTime(f,c.currentTime+dl);if(sw)os.frequency.exponentialRampToValueAtTime(sw,c.currentTime+dl+d);gn.gain.setValueAtTime(0,c.currentTime+dl);gn.gain.linearRampToValueAtTime(v||.2,c.currentTime+dl+.01);gn.gain.exponentialRampToValueAtTime(.001,c.currentTime+dl+d);os.start(c.currentTime+dl);os.stop(c.currentTime+dl+d+.05);};
  const nz=(d,v,fc=800)=>{const c=g(),buf=c.createBuffer(1,c.sampleRate*d,c.sampleRate),dt=buf.getChannelData(0);for(let i=0;i<dt.length;i++)dt[i]=Math.random()*2-1;const s=c.createBufferSource(),f=c.createBiquadFilter(),gn=c.createGain();f.type='bandpass';f.frequency.value=fc;s.buffer=buf;s.connect(f);f.connect(gn);gn.connect(c.destination);gn.gain.setValueAtTime(v||.15,c.currentTime);gn.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);s.start();};
  return{
    jump(){o(280,'square',.12,.18,0,480)},dblJump(){o(380,'square',.08,.16);o(580,'square',.1,.14,.06);o(780,'square',.08,.12,.12)},
    hit(){nz(.18,.3,600);o(70,'sawtooth',.12,.28)},shoot(){nz(.05,.12,1600);o(600,'square',.04,.08)},
    plasmaShoot(){o(800,'sawtooth',.06,.12,0,200)},timeShoot(){o(440,'sine',.1,.15,0,880)},
    enemyDie(big=false){nz(.15,big?.4:.25,500);o(big?120:200,'sawtooth',.12,big?.3:.2)},
    collect(){o(880,'sine',.07,.2);o(1320,'sine',.1,.15,.05)},
    combo(n){o(300+n*80,'sine',.1,.22)},
    shield(){o(660,'sine',.15,.2);o(990,'sine',.2,.15,.05)},
    freeze(){o(220,'sine',.3,.18,0,440)},
    overdrive(){o(330,'sawtooth',.1,.2);o(660,'sawtooth',.15,.2,.05)},
    rewind(){[0,.08,.18].forEach((t,i)=>o([500,350,200][i],'sine',.15,.2,t))},
    levelOK(){[523,659,784,1047].forEach((f,i)=>o(f,'sine',.35,.3,i*.12))},
    gameOver(){[350,220,110].forEach((f,i)=>o(f,'sawtooth',.4,.22,i*.18))},
    dash(){nz(.06,.12,1200);o(180,'sawtooth',.07,.18,0,80)},
    buy(){o(1047,'sine',.15,.25);o(1320,'sine',.12,.2,.08)},
  };
})();

// ──────────────────────────────────────────────
// PARTICLES
// ──────────────────────────────────────────────
class Particles{
  constructor(){this.p=[];}
  emit(x,y,n,op={}){
    for(let i=0;i<n;i++){
      const a=(op.angle??0)+(Math.random()-.5)*(op.spread??Math.PI*2);
      const s=(op.speed??4)*(0.5+Math.random()*.8);
      const col=Array.isArray(op.color)?op.color[0|Math.random()*op.color.length]:(op.color||'#fff');
      this.p.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,dec:op.decay??(0.016+Math.random()*.018),sz:(op.size??4)*(0.6+Math.random()*.8),color:col,grav:op.grav??0,glow:op.glow??false,shape:op.shape??'circle'});
    }
  }
  hitBlast(x,y,big=false){
    const n=big?40:22;
    this.emit(x,y,n,{speed:big?10:6,color:['#ff0055','#ff3300','#ff8800','#ffcc00','#fff'],size:big?8:5,decay:.022,grav:.12,glow:true,shape:'star'});
    this.emit(x,y,n*.5,{speed:big?5:3,color:['#ff0055','#cc0033'],size:3,decay:.02,grav:.05});
  }
  bulletHit(x,y,col='#ff0055'){this.emit(x,y,12,{speed:4,color:[col,'#fff'],size:4,decay:.04,glow:true});}
  enemyDie(x,y,col='#ff0055'){
    this.emit(x,y,30,{speed:7,color:[col,'#ff8800','#ffcc00','#fff'],size:6,decay:.022,grav:.08,glow:true,shape:'star'});
    this.emit(x,y,15,{speed:3,color:[col],size:3,decay:.018});
  }
  orbBurst(x,y){this.emit(x,y,22,{speed:5,color:['#a100ff','#00f5ff','#ff00d4','#fff'],size:4,decay:.02,grav:.04,glow:true});}
  dashBurst(x,y,dir){this.emit(x,y,12,{speed:5,angle:dir>0?Math.PI:0,spread:.9,color:['#00f5ff','#0066ff','#fff'],size:4,decay:.03,glow:true});}
  shieldPulse(cx,cy){
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;this.emit(cx+Math.cos(a)*80,cy+Math.sin(a)*80,2,{speed:2,angle:a,spread:.5,color:['#00f5ff','#fff'],size:5,decay:.04,glow:true});}
  }
  landDust(x,y){this.emit(x,y,8,{speed:2.5,angle:-Math.PI/2,spread:Math.PI*.7,color:['rgba(42,26,78,.9)','rgba(161,0,255,.5)'],size:5,decay:.04,grav:.06});}
  portalVortex(x,y){this.emit(x,y,50,{speed:8,color:['#00f5ff','#a100ff','#ff00d4','#fff'],size:6,decay:.018,grav:-.04,glow:true});}
  freezeArea(x,y){this.emit(x,y,35,{speed:6,color:['#66aaff','#00aaff','#cceeff','#fff'],size:5,decay:.02,glow:true});}
  overdriveAura(x,y){this.emit(x,y,8,{speed:3,color:['#ffcc00','#ff8800','#fff'],size:5,decay:.06,glow:true});}
  exhaust(x,y){this.emit(x,y,2,{speed:1,color:['#777','#555','#aaa'],size:3,decay:.05,grav:-.02});}
  update(ts=1){
    this.p=this.p.filter(p=>{
      p.x+=p.vx*ts;p.y+=p.vy*ts;p.vy+=p.grav;p.vx*=.95;p.vy*=.97;
      p.life-=p.dec;p.sz*=.975;return p.life>0&&p.sz>.2;
    });
  }
  draw(cx){
    this.p.forEach(p=>{
      cx.save();cx.globalAlpha=p.life;
      if(p.glow){cx.shadowColor=p.color;cx.shadowBlur=10;}
      cx.fillStyle=p.color;cx.translate(p.x,p.y);
      if(p.shape==='star'){
        cx.beginPath();
        for(let i=0;i<5;i++){const a=i/5*Math.PI*2-Math.PI/2,ai=(i+.5)/5*Math.PI*2-Math.PI/2;i===0?cx.moveTo(Math.cos(a)*p.sz,Math.sin(a)*p.sz):cx.lineTo(Math.cos(a)*p.sz,Math.sin(a)*p.sz);cx.lineTo(Math.cos(ai)*p.sz*.4,Math.sin(ai)*p.sz*.4);}
        cx.closePath();cx.fill();
      }else{cx.beginPath();cx.arc(0,0,p.sz,0,Math.PI*2);cx.fill();}
      cx.restore();
    });
  }
}

// ──────────────────────────────────────────────
// FLOAT TEXT
// ──────────────────────────────────────────────
class FloatText{
  constructor(){this.t=[];}
  add(x,y,txt,col='#fff',sz=22,big=false){this.t.push({x,y:y-10,txt,col,sz:big?sz*1.5:sz,life:1,vy:-1.8+Math.random()*.5,vx:(Math.random()-.5)*.7,big});}
  update(){this.t=this.t.filter(t=>{t.x+=t.vx;t.y+=t.vy;t.vy*=.93;t.vx*=.95;t.life-=.018;return t.life>0;});}
  draw(cx){this.t.forEach(t=>{cx.save();cx.globalAlpha=Math.min(1,t.life*2);if(t.big){cx.shadowColor=t.col;cx.shadowBlur=18;}cx.font=`${t.big?'900':'700'} ${t.sz}px 'Segoe UI',sans-serif`;cx.textAlign='center';cx.fillStyle=t.col;cx.fillText(t.txt,t.x,t.y);cx.restore();});}
}

// ──────────────────────────────────────────────
// SCREEN FX
// ──────────────────────────────────────────────
const SFX={shake:0,fc:null,fa:0,vig:0,
  hit(big=false){this.shake=big?14:8;this.fc='rgba(255,0,85,1)';this.fa=big?.4:.2;},
  good(){this.fc='rgba(161,0,255,1)';this.fa=.07;},
  clear(){this.fc='rgba(0,245,255,1)';this.fa=.55;},
  danger(pct){this.vig=Math.max(0,(1-pct/25));},
  getOff(){if(this.shake<.5){this.shake=0;return{x:0,y:0};}const x=(Math.random()-.5)*this.shake,y=(Math.random()-.5)*this.shake;this.shake*=.78;return{x,y};},
  drawFlash(cx,w,h){
    if(this.fa>.005){cx.save();cx.globalAlpha=this.fa;cx.fillStyle=this.fc;cx.fillRect(0,0,w,h);cx.restore();this.fa*=.72;}
    if(this.vig>.01){const g=cx.createRadialGradient(w/2,h/2,h*.3,w/2,h/2,h*.9);g.addColorStop(0,'rgba(255,0,0,0)');g.addColorStop(1,`rgba(180,0,0,${this.vig*.5})`);cx.save();cx.fillStyle=g;cx.fillRect(0,0,w,h);cx.restore();}
  }
};

// ──────────────────────────────────────────────
// COMBO
// ──────────────────────────────────────────────
const Combo={count:0,timer:0,maxT:180,mult:1,
  add(){this.count++;this.timer=this.maxT;this.mult=Math.min(12,1+Math.floor(this.count/2));document.getElementById('comboBox').style.display='block';document.getElementById('comboCount').textContent='x'+this.mult;return this.mult;},
  update(){if(this.timer>0){this.timer--;document.getElementById('comboFill').style.width=(this.timer/this.maxT*100)+'%';if(this.timer===0)this.reset();}},
  reset(){this.count=0;this.mult=1;document.getElementById('comboBox').style.display='none';},
  score(b){return b*this.mult;}
};

// ──────────────────────────────────────────────
// DIFFICULTY CONFIG
// ──────────────────────────────────────────────
const DIFFS=[
  {name:'EASY',  speedM:.65,drainM:.5, hpM:1,   rewinds:5,enemyShoot:false,portalFree:true,  ammoBonus:20},
  {name:'NORMAL',speedM:1,  drainM:1,  hpM:1,   rewinds:3,enemyShoot:false,portalFree:true,  ammoBonus:10},
  {name:'HARD',  speedM:1.55,drainM:1.5,hpM:2,  rewinds:1,enemyShoot:false,portalFree:false, ammoBonus:5},
  {name:'PRO',   speedM:2.1,drainM:2,  hpM:3,   rewinds:0,enemyShoot:true, portalFree:false, ammoBonus:0},
];

// ──────────────────────────────────────────────
// SKILLS
// ──────────────────────────────────────────────
// SKILL_EFFECTS — id → function(player, skillObj). Each character's `skills` array references
// these by id. Effects are kept here in a single table for readability.
const SKILL_EFFECTS={
  // NEON (original kit)
  shieldPulse:(p,sk)=>{
    shieldTimer=Math.max(shieldTimer,60);
    PS.shieldPulse(p.x+16,p.y+16);
    obstacles.forEach(ob=>{
      let bx=0,by=0,bd=Infinity;
      players.forEach(pl=>{const dx=(ob.x+ob.width/2)-(pl.x+16),dy=(ob.y+ob.height/2)-(pl.y+16),d=Math.hypot(dx,dy)||1;if(d<bd){bd=d;bx=dx/d;by=dy/d;}});
      const f=300/Math.max(1,bd);
      ob.vx+=bx*f*.15;ob.vy+=by*f*.1;
    });
    AU.shield();FT.add(p.x+16,p.y,'SHIELD PULSE!','#00f5ff',20,true);
    SFX.fc='rgba(0,245,255,1)';SFX.fa=.2;
  },
  timeBomb:(p,sk)=>{
    freezeTimer=240;
    PS.freezeArea(p.x+16,p.y+16);
    AU.freeze();FT.add(p.x+16,p.y,'FREEZE!','#66aaff',22,true);
    SFX.fc='rgba(100,150,255,1)';SFX.fa=.25;
  },
  overdrive:(p,sk)=>{
    overdriveTmr=180;
    AU.overdrive();FT.add(p.x+16,p.y,'OVERDRIVE!','#ffcc00',24,true);
    SFX.fc='rgba(255,200,0,1)';SFX.fa=.25;
  },

  // CRIMSON
  bladeBurst:(p,sk)=>{
    p.dash.charges=p.dash.maxCh;
    p.invincTimer=Math.max(p.invincTimer,30);
    PS.dashBurst(p.x+16,p.y+16,p.facing||1);
    AU.dash();FT.add(p.x+16,p.y,'BLADE BURST!','#ff5577',20,true);
  },
  flameTrail:(p,sk)=>{
    p.flameTrailT=240;
    FT.add(p.x+16,p.y,'FLAME TRAIL!','#ff5500',20,true);
    SFX.fc='rgba(255,80,0,1)';SFX.fa=.2;
  },
  adrenaline:(p,sk)=>{
    p.adrenalineT=240;
    FT.add(p.x+16,p.y,'ADRENALINE!','#ff8800',22,true);
    AU.overdrive();SFX.fc='rgba(255,140,0,1)';SFX.fa=.22;
  },

  // EMERALD
  bloomHeal:(p,sk)=>{
    let healed=0;
    players.forEach(pl=>{
      const d=Math.hypot((pl.x+16)-(p.x+16),(pl.y+16)-(p.y+16));
      if(d<=200){pl.hp=Math.min(pl.maxHp,pl.hp+25);healed++;FT.add(pl.x+16,pl.y-12,'+25 HP','#00ff88',16,true);PS.shieldPulse(pl.x+16,pl.y+16);}
    });
    AU.collect();FT.add(p.x+16,p.y,'BLOOM HEAL!','#00ff88',22,true);
    SFX.fc='rgba(0,255,140,1)';SFX.fa=.2;
  },
  vineSnare:(p,sk)=>{
    snares.push({x:p.x-24,y:p.y+8,w:80,h:60,t:180});
    AU.freeze();FT.add(p.x+16,p.y,'VINE SNARE!','#00aa66',20,true);
    SFX.fc='rgba(0,200,100,1)';SFX.fa=.2;
  },
  skyLeap:(p,sk)=>{
    p.vy=-22;p.jumpsLeft=2;
    PS.dashBurst(p.x+16,p.y+16,0);
    AU.dblJump();FT.add(p.x+16,p.y,'SKY LEAP!','#88ff88',22,true);
  },

  // VOID
  phaseShift:(p,sk)=>{
    p.invincTimer=Math.max(p.invincTimer,90);
    p.phaseT=90;
    FT.add(p.x+16,p.y,'PHASE SHIFT!','#a100ff',22,true);
    SFX.fc='rgba(160,0,255,1)';SFX.fa=.25;
  },
  voidBomb:(p,sk)=>{
    const cx=p.x+16,cy=p.y+16;
    for(let i=obstacles.length-1;i>=0;i--){
      const ob=obstacles[i];
      if(playerCount === 2 && ob.owner !== undefined && ob.owner !== p.pid) continue;
      const d=Math.hypot((ob.x+ob.width/2)-cx,(ob.y+ob.height/2)-cy);
      if(d<=200){
        ob.hp-=4;
        if(ob.hp<=0)killEnemy(ob,i);
        else PS.bulletHit(ob.x+ob.width/2,ob.y+ob.height/2,'#a100ff');
      }
    }
    PS.shieldPulse(cx,cy);
    AU.shield();FT.add(p.x+16,p.y,'VOID BOMB!','#a100ff',24,true);
    SFX.fc='rgba(160,0,255,1)';SFX.fa=.3;
  },
  singularity:(p,sk)=>{
    singularities.push({x:p.x+16,y:p.y+16,t:120});
    FT.add(p.x+16,p.y,'SINGULARITY!','#ff00d4',22,true);
    SFX.fc='rgba(255,0,212,1)';SFX.fa=.25;
  },

  // AEGIS
  bulwark:(p,sk)=>{
    p.shieldedBy=Math.max(p.shieldedBy,180);
    PS.shieldPulse(p.x+16,p.y+16);
    AU.shield();FT.add(p.x+16,p.y,'BULWARK!','#00ffaa',20,true);
    SFX.fc='rgba(0,255,170,1)';SFX.fa=.2;
  },
  reflectWave:(p,sk)=>{
    p.reflectT=90;
    PS.shieldPulse(p.x+16,p.y+16);
    FT.add(p.x+16,p.y,'REFLECT!','#ffcc00',20,true);
    SFX.fc='rgba(255,200,0,1)';SFX.fa=.2;
  },
  groupAegis:(p,sk)=>{
    players.forEach(pl=>{pl.shieldedBy=Math.max(pl.shieldedBy,90);PS.shieldPulse(pl.x+16,pl.y+16);});
    AU.shield();FT.add(p.x+16,p.y,'GROUP AEGIS!','#00ffaa',26,true);
    SFX.fc='rgba(0,255,170,1)';SFX.fa=.3;
  },

  // LIFTER
  updraft:(p,sk)=>{
    players.forEach(pl=>{
      const d=Math.hypot((pl.x+16)-(p.x+16),(pl.y+16)-(p.y+16));
      if(d<=100){pl.vy=-18;pl.jumpsLeft=2;PS.dashBurst(pl.x+16,pl.y+16,0);}
    });
    AU.jump();FT.add(p.x+16,p.y,'UPDRAFT!','#ffaa00',22,true);
    SFX.fc='rgba(255,170,0,1)';SFX.fa=.22;
  },
  stomp:(p,sk)=>{
    p.vy=20;p.stompPending=true;
    FT.add(p.x+16,p.y,'STOMP!','#ff5500',22,true);
    SFX.fc='rgba(255,100,0,1)';SFX.fa=.22;
  },
  catapultPulse:(p,sk)=>{
    const cx=p.x+16,cy=p.y+16;
    obstacles.forEach(ob=>{
      const d=Math.hypot((ob.x+ob.width/2)-cx,(ob.y+ob.height/2)-cy);
      if(d<=250){ob.vy=-25;ob.vx*=.5;}
    });
    PS.shieldPulse(cx,cy);
    AU.dash();FT.add(p.x+16,p.y,'CATAPULT!','#ff5500',24,true);
    SFX.fc='rgba(255,100,0,1)';SFX.fa=.3;
  },
};

// SKILL_DEFS — per-id metadata (name, icon, default maxCd). Each character's `skills` entry
// is a thin reference {id, ...overrides}; the rest is filled from this table.
const SKILL_DEFS={
  shieldPulse:  {name:'Shield Pulse',  icon:'🛡', maxCd:480},
  timeBomb:     {name:'Time Bomb',     icon:'💣', maxCd:720},
  overdrive:    {name:'Overdrive',     icon:'⚡', maxCd:900},
  bladeBurst:   {name:'Blade Burst',   icon:'🗡', maxCd:540},
  flameTrail:   {name:'Flame Trail',   icon:'🔥', maxCd:600},
  adrenaline:   {name:'Adrenaline',    icon:'💢', maxCd:900},
  bloomHeal:    {name:'Bloom Heal',    icon:'🌿', maxCd:720},
  vineSnare:    {name:'Vine Snare',    icon:'🌱', maxCd:540},
  skyLeap:      {name:'Sky Leap',      icon:'🦅', maxCd:480},
  phaseShift:   {name:'Phase Shift',   icon:'👻', maxCd:600},
  voidBomb:     {name:'Void Bomb',     icon:'💥', maxCd:720},
  singularity:  {name:'Singularity',   icon:'🌀', maxCd:900},
  bulwark:      {name:'Bulwark',       icon:'🛡', maxCd:420},
  reflectWave:  {name:'Reflect Wave',  icon:'↩', maxCd:720},
  groupAegis:   {name:'Group Aegis',   icon:'⚜', maxCd:1080},
  updraft:      {name:'Updraft',       icon:'⤴', maxCd:540},
  stomp:        {name:'Stomp',         icon:'⤵', maxCd:600},
  catapultPulse:{name:'Catapult Pulse',icon:'🚀', maxCd:900},
};
// Builds a fresh `{id, name, icon, cd:0, maxCd}` from an id. Used when cloning a character's
// skill kit onto a player.
function makeSkill(id){
  const d=SKILL_DEFS[id]||{name:id,icon:'?',maxCd:600};
  return {id, name:d.name, icon:d.icon, maxCd:d.maxCd, cd:0};
}

// ──────────────────────────────────────────────
// WEAPONS
// ──────────────────────────────────────────────
const GUNS=[
  // The first 3 are FREE (always owned + default-equipped to slots 0/1/2). The rest are
  // store-only — see Inventory. `cost`=0 means free; missing implies non-buyable.
  // Optional fields used by tryShoot / bullet physics:
  //   • pellets, spread — shotgun-style multi-bullet spawn (radians)
  //   • range            — bullet self-destructs after this many world units traveled
  //   • explode          — AOE radius applied to all obstacles on bullet hit
  {id:'pistol',      icon:'🔫', name:'Pistol',      color:'#ffcc00', speed:14, dmg:1,   ammo:Infinity,maxAmmo:Infinity, pierce:false, freeze:false, rof:18, lastShot:0, sz:5, cost:0},
  {id:'plasma',      icon:'⚡', name:'Plasma',      color:'#00f5ff', speed:20, dmg:2,   ammo:0,       maxAmmo:60,       pierce:true,  freeze:false, rof:8,  lastShot:0, sz:4, cost:0},
  {id:'timegun',     icon:'❄',  name:'TimeGun',     color:'#a100ff', speed:11, dmg:1,   ammo:0,       maxAmmo:40,       pierce:false, freeze:true,  rof:24, lastShot:0, sz:7, cost:0},
  {id:'shotgun',     icon:'💥', name:'Shotgun',     color:'#ff8844', speed:13, dmg:0.7, ammo:0,       maxAmmo:30,       pierce:false, freeze:false, rof:32, lastShot:0, sz:4, cost:600,  pellets:5, spread:0.35, range:520},
  {id:'sniper',      icon:'🎯', name:'Sniper',      color:'#33ff99', speed:28, dmg:5,   ammo:0,       maxAmmo:12,       pierce:true,  freeze:false, rof:55, lastShot:0, sz:3, cost:900},
  {id:'railgun',     icon:'⚙',  name:'Rail Gun',    color:'#88e0ff', speed:22, dmg:3,   ammo:0,       maxAmmo:24,       pierce:true,  freeze:false, rof:20, lastShot:0, sz:5, cost:1200},
  {id:'flamethrower',icon:'🔥', name:'Flame',       color:'#ff0000', speed:9,  dmg:0.4, ammo:Infinity,maxAmmo:Infinity, pierce:false, freeze:false, rof:1,  lastShot:0, sz:6, cost:800,  range:380, pellets:3, spread:0.22},
  {id:'rocket',      icon:'🚀', name:'Rocket',      color:'#ff3366', speed:11, dmg:4,   ammo:0,       maxAmmo:8,        pierce:false, freeze:false, rof:60, lastShot:0, sz:7, cost:1500, explode:80},
];
const GUNS_BY_ID = GUNS.reduce((m,g)=>{m[g.id]=g;return m;},{});

// ──────────────────────────────────────────────
// WEAPON SKINS
//
// Per-gun cosmetic variants. Each gun has a 'default' (always owned, free) plus 2-4 unlockable
// skins. `src` values:
//   shop — purchasable with coins
//   loot — only obtainable from loot boxes (rare prestige variant)
//   milestone — unlocked when a per-gun stat threshold is hit (e.g., 100 kills with the gun)
// A skin's `color` overrides the gun's bullet color and HUD tint. `trail` picks a per-frame
// particle pattern from PARTICLE_TRAILS below (null = no extra trail beyond the gun default).
// ──────────────────────────────────────────────
const SKINS={
  pistol:[
    {id:'default',  name:'Standard',   color:'#ffcc00', trail:null,      cost:0,   src:'free'},
    {id:'venom',    name:'Venom',      color:'#00ff88', trail:'poison',  cost:300, src:'shop'},
    {id:'royal',    name:'Royal',      color:'#aa66ff', trail:'sparkle', cost:600, src:'shop'},
  ],
  plasma:[
    {id:'default',  name:'Standard',   color:'#00f5ff', trail:null,      cost:0,   src:'free'},
    {id:'crimson',  name:'Crimson',    color:'#ff3366', trail:null,      cost:400, src:'shop'},
    {id:'spectre',  name:'Spectre',    color:'#aaffff', trail:'sparkle', cost:null,src:'loot'},
  ],
  timegun:[
    {id:'default',  name:'Standard',   color:'#a100ff', trail:null,      cost:0,   src:'free'},
    {id:'glacier',  name:'Glacier',    color:'#66ddff', trail:'ice',     cost:400, src:'shop'},
    {id:'voidchill',name:'Void Chill', color:'#ff00d4', trail:'ice',     cost:null,src:'loot'},
  ],
  shotgun:[
    {id:'default',  name:'Standard',   color:'#ff8844', trail:null,      cost:0,   src:'free'},
    {id:'overkill', name:'Overkill',   color:'#ff0066', trail:'ember',   cost:500, src:'shop'},
    {id:'frost',    name:'Frostlash',  color:'#88ddff', trail:'ice',     cost:null,src:'loot'},
  ],
  sniper:[
    {id:'default',  name:'Standard',   color:'#33ff99', trail:null,      cost:0,   src:'free'},
    {id:'phantom',  name:'Phantom',    color:'#aa66ff', trail:'sparkle', cost:600, src:'shop'},
    {id:'goldeye',  name:'Gold Eye',   color:'#ffcc00', trail:'sparkle', cost:null,src:'loot'},
  ],
  railgun:[
    {id:'default',  name:'Standard',   color:'#88e0ff', trail:null,      cost:0,   src:'free'},
    {id:'fusion',   name:'Fusion',     color:'#ff8800', trail:'ember',   cost:700, src:'shop'},
    {id:'arcane',   name:'Arcane',     color:'#ff00d4', trail:'sparkle', cost:null,src:'loot'},
  ],
  flamethrower:[
    {id:'default',  name:'Standard',   color:'#ff0000', trail:null,      cost:0,   src:'free'},
    {id:'azure',    name:'Azure Flame',color:'#00aaff', trail:null,      cost:500, src:'shop'},
    {id:'hellfire', name:'Hellfire',   color:'#ff00aa', trail:'ember',   cost:null,src:'loot'},
  ],
  rocket:[
    {id:'default',  name:'Standard',   color:'#ff3366', trail:null,      cost:0,   src:'free'},
    {id:'plasma',   name:'Plasma Warhead', color:'#00f5ff', trail:'sparkle', cost:800, src:'shop'},
    {id:'antimatter',name:'Antimatter',color:'#aa00ff', trail:'sparkle', cost:null,src:'loot'},
  ],
};
// Index for quick "skin def by (gun id, skin id)".
function findSkin(gunId, skinId){
  const list=SKINS[gunId]; if(!list) return null;
  return list.find(s=>s.id===skinId) || list[0];
}
// All loot-only skin defs across all guns, used by LootBox to pick rare drops.
function allLootSkins(){
  const out=[];
  for(const k in SKINS) SKINS[k].forEach(s=>{if(s.src==='loot') out.push({gunId:k, skin:s});});
  return out;
}
// All shop-tier skins (used by LootBox as the common skin drop pool).
function allShopSkins(){
  const out=[];
  for(const k in SKINS) SKINS[k].forEach(s=>{if(s.src==='shop') out.push({gunId:k, skin:s});});
  return out;
}


// ──────────────────────────────────────────────
// CHARACTERS
//
// Each character has its OWN 3-skill kit (referenced by skill id from SKILL_DEFS).
// The last two characters (AEGIS, LIFTER) are co-op specialists. Their `coop` ability on the
// G/L key is SEPARATE from their 3 skills.
// Character is locked at lobby select — there is no in-game character cycle.
// `art` field picks the per-character visual in drawPlayer().
// ──────────────────────────────────────────────
const CHARACTERS=[
  {name:'NEON',    c1:'#00f5ff', c2:'#a100ff', glow:'#00f5ff', speedM:1.0,  jumpM:1.0, coop:null,
    art:'neon',    skillIds:['shieldPulse','timeBomb','overdrive']},
  {name:'CRIMSON', c1:'#ff3366', c2:'#ff8800', glow:'#ff5577', speedM:1.18, jumpM:0.95,coop:null,
    art:'crimson', skillIds:['bladeBurst','flameTrail','adrenaline']},
  {name:'EMERALD', c1:'#00ff88', c2:'#00aa66', glow:'#00ff99', speedM:0.92, jumpM:1.18,coop:null,
    art:'emerald', skillIds:['bloomHeal','vineSnare','skyLeap']},
  {name:'VOID',    c1:'#ffcc00', c2:'#ff00d4', glow:'#ffaa00', speedM:1.05, jumpM:1.05,coop:null,
    art:'void',    skillIds:['phaseShift','voidBomb','singularity']},
  {name:'AEGIS',   c1:'#00ffaa', c2:'#0066ff', glow:'#00ffaa', speedM:0.95, jumpM:1.0,
    coop:{kind:'shield', cd:540, range:220, dur:120, label:'SHIELD'},
    art:'aegis',   skillIds:['bulwark','reflectWave','groupAegis']},
  {name:'LIFTER',  c1:'#ffaa00', c2:'#ff5500', glow:'#ffcc00', speedM:1.0,  jumpM:0.9,
    coop:{kind:'boost',  cd:360, range:90,  power:22,  label:'BOOST'},
    art:'lifter',  skillIds:['updraft','stomp','catapultPulse']},
];
function applyCharacter(p){
  if(!p)return;
  const ch=CHARACTERS[p.char];
  p.speed=5.2*ch.speedM;
  p.jump=13.5*ch.jumpM;
  // Skills are owned by the character now. Clone so each player has their own cooldowns.
  p.skills=(ch.skillIds||[]).map(makeSkill);
}

// ──────────────────────────────────────────────
// BOSSES
//
// One boss per backdrop theme. Spawned by initLevel when `level % 5 === 0` instead of
// (in addition to) the regular enemy wave. Bosses live inside `obstacles` with `type:'boss'`
// so all existing collision / freeze / explode logic applies; their dedicated state lives on
// `obs.boss`. Attack patterns dispatch on `pattern`; HP scales with difficulty + level tier.
// ──────────────────────────────────────────────
const BOSSES={
  neon:    {id:'neonOverlord',    name:'NEON OVERLORD',    icon:'👁', color:'#00f5ff', c2:'#a100ff', hp:25, w:80,  h:80, speedMul:0.45, pattern:'volley'},
  spire:   {id:'temporalTitan',   name:'TEMPORAL TITAN',   icon:'⏳', color:'#a100ff', c2:'#0066ff', hp:30, w:84,  h:84, speedMul:0.55, pattern:'volley'},
  foundry: {id:'foundryBehemoth', name:'FOUNDRY BEHEMOTH', icon:'🔥', color:'#ff5500', c2:'#880000', hp:35, w:100, h:80, speedMul:0.85, pattern:'charge'},
  alien:   {id:'voidHarbinger',   name:'VOID HARBINGER',   icon:'🌀', color:'#ff00d4', c2:'#ffcc00', hp:30, w:80,  h:80, speedMul:0.40, pattern:'volley'},
};
// Bosses every Nth level. Set to a function of level if you want progressive escalation.
const BOSS_LEVEL_INTERVAL=5;
// Track the active boss reference for the HUD's top-screen HP bar. Set in initLevel when a
// boss is spawned, cleared on level transition or death.
let activeBoss=null;

// ──────────────────────────────────────────────
// PERSISTENT UPGRADES + COIN BALANCE
//
// One global coin balance shared across all characters; upgrades are per-character (keyed by
// character name so reordering CHARACTERS doesn't break saves). All five tracks cap at tier 5.
// PRICES[i] is the cost to BUY the (i+1)th tier — index 0 buys tier 1, index 4 buys tier 5.
// Persisted to localStorage on every change.
// ──────────────────────────────────────────────
const Upgrades={
  data:{coins:0,chars:{}},
  TRACKS:[
    {id:'hp',    name:'Max HP',    icon:'❤',  per:15,   maxTier:5},
    {id:'speed', name:'Speed',     icon:'💨', per:0.05, maxTier:5},
    {id:'jump',  name:'Jump',      icon:'⤴',  per:0.04, maxTier:5},
    {id:'dmg',   name:'Damage',    icon:'💥', per:0.5,  maxTier:5},
    {id:'dash',  name:'Dash',      icon:'⚡', per:1,    maxTier:5},
  ],
  PRICES:[100,250,500,1000,2000],
  load(){
    try{
      const raw=localStorage.getItem(userKey('csUpgrades'));
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&typeof parsed==='object'){
          this.data={coins:parsed.coins|0, chars:parsed.chars||{}};
        }
      }
    }catch(e){this.data={coins:0,chars:{}};}
  },
  save(){try{localStorage.setItem(userKey('csUpgrades'),JSON.stringify(this.data));}catch(e){}},
  forChar(charName){
    if(!this.data.chars[charName])this.data.chars[charName]={hp:0,speed:0,jump:0,dmg:0,dash:0};
    return this.data.chars[charName];
  },
  addCoins(n){this.data.coins=Math.max(0,this.data.coins+n);this.save();},
  // Deduct coins atomically. Returns true on success, false if insufficient balance.
  spend(n){if(n<=0)return true; if(this.data.coins<n)return false; this.data.coins-=n; this.save(); return true;},
  buy(charName,trackId){
    const t=this.TRACKS.find(x=>x.id===trackId); if(!t)return false;
    const u=this.forChar(charName);
    if((u[trackId]|0)>=t.maxTier)return false;
    const cost=this.PRICES[u[trackId]];
    if(this.data.coins<cost)return false;
    this.data.coins-=cost;
    u[trackId]=(u[trackId]|0)+1;
    this.save();
    return true;
  },
};
Upgrades.load();

// ──────────────────────────────────────────────
// ACHIEVEMENTS
//
// Lightweight milestone tracker. Each achievement has an `is()` predicate run on demand
// (level complete, enemy kill, run end). Unlocks persist in localStorage and award a coin
// bonus the first time they trip. The Home Base panel renders the full list.
// ──────────────────────────────────────────────
const Achievements={
  defs:[
    {id:'climb1k',  name:'First Kilometer',    desc:'Reach 1,000m in Endless',          reward:200, is:()=>endlessMeters>=1000},
    {id:'climb5k',  name:'Sky Pilgrim',        desc:'Reach 5,000m in Endless',          reward:1000,is:()=>endlessMeters>=5000},
    {id:'kills50',  name:'Trigger Discipline', desc:'Defeat 50 enemies in one run',     reward:200, is:()=>totalKills>=50},
    {id:'kills200', name:'Annihilator',        desc:'Defeat 200 enemies in one run',    reward:800, is:()=>totalKills>=200},
    {id:'lvl10',    name:'Climb Veteran',      desc:'Clear level 10',                   reward:300, is:()=>level>=10},
    {id:'score10k', name:'High Scorer',        desc:'Score 10,000 in one run',          reward:400, is:()=>score>=10000},
  ],
  data:{unlocked:{}},
  load(){
    try{
      const raw=localStorage.getItem(userKey('csAchievements'));
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&parsed.unlocked)this.data.unlocked=parsed.unlocked;
      }
    }catch(e){this.data={unlocked:{}};}
  },
  save(){try{localStorage.setItem(userKey('csAchievements'),JSON.stringify(this.data));}catch(e){}},
  isUnlocked(id){return !!this.data.unlocked[id];},
  // Run every achievement predicate; award coins + toast for any newly satisfied.
  check(){
    this.defs.forEach(a=>{
      if(this.data.unlocked[a.id])return;
      try{
        if(a.is()){
          this.data.unlocked[a.id]=Date.now();
          Upgrades.addCoins(a.reward);
          // Float a banner near the top of the canvas if we have one — else just SFX.
          if(typeof FT!=='undefined'&&typeof canvas!=='undefined'){
            FT.add(canvas.width/2,80,'🏆 '+a.name+' +'+a.reward+'🪙','#ffcc00',22,true);
          }
          if(typeof AU!=='undefined'&&AU.buy)AU.buy();
        }
      }catch(e){}
    });
    this.save();
  },
};
Achievements.load();

// ──────────────────────────────────────────────
// DAILY MISSIONS
//
// Three missions per day, rotated at local midnight. The rotation is deterministic per date
// (seeded RNG keyed off the YYYY-MM-DD string) so all players on the same day share the same
// mission set and reloading the page can't reroll. Progress + claim state persists to
// localStorage. Each mission has a `metric` that the game-event hooks increment.
// ──────────────────────────────────────────────
const Daily={
  data:{date:null, missions:[]},
  TEMPLATES:[
    {id:'killAny30',   name:'Defeat 30 enemies',         cat:'kill', metric:'killAny',       target:30,   reward:100},
    {id:'killAny60',   name:'Defeat 60 enemies',         cat:'kill', metric:'killAny',       target:60,   reward:200},
    {id:'killBasic25', name:'Defeat 25 basics',          cat:'kill', metric:'killBasic',     target:25,   reward:90},
    {id:'killChaser15',name:'Defeat 15 chasers',         cat:'kill', metric:'killChaser',    target:15,   reward:150},
    {id:'killSpinner12',name:'Defeat 12 spinners',       cat:'kill', metric:'killSpinner',   target:12,   reward:140},
    {id:'killTank5',   name:'Defeat 5 tanks',            cat:'kill', metric:'killTank',      target:5,    reward:200},
    {id:'killBoss',    name:'Defeat a boss',             cat:'boss', metric:'killBoss',      target:1,    reward:300},
    {id:'clearLv5',    name:'Clear 5 levels in a run',   cat:'level',metric:'levelClear',    target:5,    reward:200},
    {id:'clearLv8',    name:'Clear 8 levels in a run',   cat:'level',metric:'levelClear',    target:8,    reward:400},
    {id:'endless2k',   name:'Reach 2,000m in Endless',   cat:'endless',metric:'endlessMeters',target:2000,reward:250},
    {id:'endless5k',   name:'Reach 5,000m in Endless',   cat:'endless',metric:'endlessMeters',target:5000,reward:500},
    {id:'score10k',    name:'Score 10,000 in a run',     cat:'score',metric:'scoreRun',      target:10000,reward:300},
    {id:'score25k',    name:'Score 25,000 in a run',     cat:'score',metric:'scoreRun',      target:25000,reward:500},
    {id:'useSkill20',  name:'Use 20 skills',             cat:'skill',metric:'skillUse',      target:20,   reward:150},
  ],
  load(){
    try{
      const raw=localStorage.getItem(userKey('csDailyMissions'));
      if(raw){
        const p=JSON.parse(raw);
        if(p&&p.date&&Array.isArray(p.missions)) this.data=p;
      }
    }catch(e){this.data={date:null,missions:[]};}
    this.checkRoll();
  },
  save(){try{localStorage.setItem(userKey('csDailyMissions'),JSON.stringify(this.data));}catch(e){}},
  todayKey(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  checkRoll(){
    const today=this.todayKey();
    if(this.data.date===today) return;
    this.rollNewMissions(today);
  },
  rollNewMissions(today){
    // Convert YYYY-MM-DD to a deterministic 32-bit seed so the day's pick is reproducible.
    const seed=today.split('-').reduce((a,c)=>(a*31+parseInt(c,10))>>>0, 7);
    const rng=this._seededRng(seed);
    const pool=this.TEMPLATES.slice();
    for(let i=pool.length-1;i>0;i--){
      const j=Math.floor(rng()*(i+1));
      [pool[i],pool[j]]=[pool[j],pool[i]];
    }
    this.data={
      date:today,
      missions:pool.slice(0,3).map(t=>({
        id:t.id, name:t.name, cat:t.cat, metric:t.metric, target:t.target,
        progress:0, reward:t.reward, claimed:false,
      })),
    };
    this.save();
  },
  _seededRng(seed){
    let s=seed>>>0;
    return ()=>{ s=(Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; };
  },
  // Increment-style metric. Used for events that fire repeatedly (kills, skill uses).
  bumpMetric(metric, by=1){
    let any=false;
    this.data.missions.forEach(m=>{
      if(m.claimed||m.metric!==metric) return;
      m.progress=Math.min(m.target, m.progress+by);
      if(m.progress>=m.target){any=this._claim(m)||any;}
    });
    this.save();
  },
  // Snapshot-style metric. Used for cumulative values (score this run, endless meters).
  setMetric(metric, value){
    this.data.missions.forEach(m=>{
      if(m.claimed||m.metric!==metric) return;
      if(value>m.progress) m.progress=Math.min(m.target, value);
      if(m.progress>=m.target){this._claim(m);}
    });
    this.save();
  },
  _claim(m){
    if(m.claimed) return false;
    m.claimed=true;
    Upgrades.addCoins(m.reward);
    if(typeof FT!=='undefined'&&typeof canvas!=='undefined'){
      FT.add(canvas.width/2, 200, '✓ DAILY: '+m.name+' +'+m.reward+'🪙', '#00ff88', 22, true);
    }
    if(typeof AU!=='undefined'&&AU.buy) AU.buy();
    // 25% chance per claim to also drop a loot box.
    if(typeof LootBox!=='undefined' && Math.random()<0.25){
      LootBox.add(1, 'DAILY BONUS');
    }
    return true;
  },
  // Convenience hooks called from game events.
  onKill(type){
    this.checkRoll();
    this.bumpMetric('killAny');
    if(type==='basic')   this.bumpMetric('killBasic');
    if(type==='chaser')  this.bumpMetric('killChaser');
    if(type==='tank')    this.bumpMetric('killTank');
    if(type==='spinner') this.bumpMetric('killSpinner');
  },
  onBossKill(){this.checkRoll(); this.bumpMetric('killBoss');},
  onLevelClear(){this.checkRoll(); this.bumpMetric('levelClear');},
  onScoreChange(s){this.checkRoll(); this.setMetric('scoreRun', s);},
  onEndlessMeters(m){this.checkRoll(); this.setMetric('endlessMeters', m);},
  onSkillUse(){this.checkRoll(); this.bumpMetric('skillUse');},
  msUntilTomorrow(){
    const now=new Date();
    const tom=new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
    return tom-now;
  },
};
Daily.load();

// ──────────────────────────────────────────────
// LOOT BOXES
//
// Mystery boxes earned from boss kills (guaranteed), level clears (8% chance), and daily
// mission completion (25% bonus chance). Also purchasable from Home Base for 300 coins.
// Opening a box rolls a single reward from a weighted table — see rollReward().
// Storage: localStorage['csLootBoxes'].
// ──────────────────────────────────────────────
const LootBox={
  data:{unopened:0, totalOpened:0},
  BUY_COST:300,
  load(){
    try{
      const raw=localStorage.getItem(userKey('csLootBoxes'));
      if(raw){
        const p=JSON.parse(raw);
        if(p&&typeof p==='object') this.data=Object.assign(this.data, p);
      }
    }catch(e){this.data={unopened:0, totalOpened:0};}
  },
  save(){try{localStorage.setItem(userKey('csLootBoxes'),JSON.stringify(this.data));}catch(e){}},
  count(){return this.data.unopened|0;},
  add(n=1, source=''){
    this.data.unopened=(this.data.unopened|0)+n;
    this.save();
    // Floating notification while in-game.
    if(typeof FT!=='undefined'&&typeof canvas!=='undefined'){
      FT.add(canvas.width/2, 240, '📦 +'+n+' LOOT BOX'+(source?' ('+source+')':'')+'!', '#ff66cc', 22, true);
    }
  },
  // Open one box. Returns the reward (see rollReward) or null if there's nothing to open.
  open(){
    if(this.data.unopened<=0) return null;
    this.data.unopened--;
    this.data.totalOpened++;
    const reward=this.rollReward();
    this.save();
    return reward;
  },
  // Reward weights:
  //   55%  coins (50-500, biased low)
  //   30%  random shop-tier skin you don't own (fallback: coins)
  //   10%  random gun you don't own (fallback: coins)
  //   5%   random loot-tier skin you don't own (fallback: coins x2)
  rollReward(){
    const r=Math.random();
    if(r<0.55){
      // Coins. Triangular distribution skewed to ~150.
      const v=Math.floor(50 + Math.random()*Math.random()*450);
      Upgrades.addCoins(v);
      return {kind:'coins', amount:v, label:v+'🪙', detail:'Coin pile'};
    }
    if(r<0.85){
      const pool=Inventory.unownedSkinsByTier('shop');
      if(pool.length>0){
        const pick=pool[Math.floor(Math.random()*pool.length)];
        Inventory.addSkin(pick.gunId, pick.skin.id);
        const gunName=(GUNS_BY_ID[pick.gunId]||{name:'Gun'}).name;
        return {kind:'skin', gunId:pick.gunId, skinId:pick.skin.id, label:pick.skin.name+' Skin', detail:gunName+' · cosmetic'};
      }
      // Fallback to coins if all shop skins owned.
      const v=200; Upgrades.addCoins(v);
      return {kind:'coins', amount:v, label:v+'🪙', detail:'Coin pile (all shop skins owned)'};
    }
    if(r<0.95){
      const unowned=GUNS.filter(g=>g.cost && !Inventory.isOwned(g.id));
      if(unowned.length>0){
        const pick=unowned[Math.floor(Math.random()*unowned.length)];
        Inventory.data.owned[pick.id]=true; Inventory.save();
        return {kind:'gun', gunId:pick.id, label:pick.name+' '+pick.icon, detail:'Weapon unlocked!'};
      }
      const v=400; Upgrades.addCoins(v);
      return {kind:'coins', amount:v, label:v+'🪙', detail:'Coin pile (all guns owned)'};
    }
    // Loot-only rare skin.
    const pool=Inventory.unownedSkinsByTier('loot');
    if(pool.length>0){
      const pick=pool[Math.floor(Math.random()*pool.length)];
      Inventory.addSkin(pick.gunId, pick.skin.id);
      const gunName=(GUNS_BY_ID[pick.gunId]||{name:'Gun'}).name;
      return {kind:'lootskin', gunId:pick.gunId, skinId:pick.skin.id, label:'★ '+pick.skin.name+' ★', detail:gunName+' · prestige skin'};
    }
    // Fallback (all loot skins owned): big coin pile.
    const v=600; Upgrades.addCoins(v);
    return {kind:'coins', amount:v, label:v+'🪙', detail:'Coin jackpot (all loot skins owned)'};
  },
  buyBox(){
    if(!Upgrades.spend(this.BUY_COST)) return {ok:false, msg:'Not enough coins'};
    this.data.unopened++;
    this.save();
    if(typeof AU!=='undefined'&&AU.buy) AU.buy();
    return {ok:true};
  },
};
LootBox.load();

// ──────────────────────────────────────────────
// INVENTORY (gun ownership + equipped loadout)
//
// Persists which guns the player has bought and which 3 they have equipped to in-game slots
// 0/1/2. The free guns (pistol/plasma/timegun) are force-owned on every load so corrupt or
// missing saves can never strand the player. `getEquippedGunSpecs()` is what createPlayer
// reads to build each player's `p.guns` array.
// ──────────────────────────────────────────────
const FREE_GUN_IDS=['pistol','plasma','timegun'];
// AMMO_TIER_PRICES: cost to buy each successive ammo-capacity tier on a gun. Index = tiers
// already owned (0 → buys tier 1, 1 → buys tier 2, 2 → buys tier 3). Each tier adds +50% to
// the gun's maxAmmo. Skipped for guns with infinite ammo.
const AMMO_TIER_PRICES=[200,500,1200];
const AMMO_TIER_MAX=AMMO_TIER_PRICES.length;
const Inventory={
  // ownedSkins keyed by gunId → {skinId:true}. equippedSkin keyed by gunId → skinId (or 'default').
  data:{owned:{}, equipped:[...FREE_GUN_IDS], ammoTiers:{}, ownedSkins:{}, equippedSkin:{}},
  load(){
    try{
      const raw=localStorage.getItem(userKey('csInventory'));
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&typeof parsed==='object'){
          this.data.owned=parsed.owned||{};
          this.data.equipped=Array.isArray(parsed.equipped)?parsed.equipped.slice(0,3):[...FREE_GUN_IDS];
          this.data.ammoTiers=parsed.ammoTiers||{};
          this.data.ownedSkins=parsed.ownedSkins||{};
          this.data.equippedSkin=parsed.equippedSkin||{};
        }
      }
    }catch(e){this.data={owned:{},equipped:[...FREE_GUN_IDS],ammoTiers:{},ownedSkins:{},equippedSkin:{}};}
    // Force-own the free guns no matter what was saved.
    FREE_GUN_IDS.forEach(id=>{this.data.owned[id]=true;});
    // Repair equipped slots: drop unknown ids, pad to length 3 with free guns.
    this.data.equipped=this.data.equipped.filter(id=>GUNS_BY_ID[id]&&this.data.owned[id]);
    let i=0;
    while(this.data.equipped.length<3){
      const fb=FREE_GUN_IDS[i++%FREE_GUN_IDS.length];
      if(!this.data.equipped.includes(fb))this.data.equipped.push(fb);
      else if(this.data.equipped.length<3)this.data.equipped.push(fb);
    }
    this.data.equipped=this.data.equipped.slice(0,3);
    this.save();
  },
  save(){try{localStorage.setItem(userKey('csInventory'),JSON.stringify(this.data));}catch(e){}},
  isOwned(id){return !!this.data.owned[id];},
  isEquipped(id){return this.data.equipped.includes(id);},
  equippedSlot(id){return this.data.equipped.indexOf(id);},
  // Buy a gun by id. Refuses on unknown id, already-owned, or insufficient coins.
  buy(id){
    const g=GUNS_BY_ID[id]; if(!g||!g.cost) return {ok:false,msg:'Not for sale'};
    if(this.isOwned(id)) return {ok:false,msg:'Already owned'};
    if(!Upgrades.spend(g.cost)) return {ok:false,msg:'Not enough coins'};
    this.data.owned[id]=true; this.save();
    return {ok:true,msg:'Purchased '+g.name};
  },
  // Equip an owned gun into a specific slot (0/1/2). If it's already equipped elsewhere,
  // swap the previous occupant of `slot` into that other position so all 3 slots stay filled.
  equip(id, slot){
    if(!this.isOwned(id)) return {ok:false,msg:'Not owned'};
    if(slot<0||slot>2) return {ok:false,msg:'Bad slot'};
    const existingSlot=this.equippedSlot(id);
    const displaced=this.data.equipped[slot];
    this.data.equipped[slot]=id;
    if(existingSlot>=0 && existingSlot!==slot){
      this.data.equipped[existingSlot]=displaced;
    }
    this.save();
    return {ok:true};
  },
  // Returns the 3 GUNS entries in slot order. Used by createPlayer. Applies the per-gun ammo
  // capacity tier (+50% per tier) by patching `maxAmmo` on a shallow copy. Skips infinite-ammo
  // guns so we don't try to multiply Infinity.
  getEquippedGunSpecs(){
    return this.data.equipped.map(id=>{
      const base=GUNS_BY_ID[id]||GUNS_BY_ID.pistol;
      const tier=this.getAmmoTier(base.id);
      if(tier<=0 || base.maxAmmo===Infinity) return base;
      return {...base, maxAmmo: Math.floor(base.maxAmmo * (1 + 0.5*tier))};
    });
  },
  getAmmoTier(id){ return (this.data.ammoTiers&&this.data.ammoTiers[id])|0; },
  canBuyAmmoTier(id){
    const g=GUNS_BY_ID[id]; if(!g) return false;
    if(g.maxAmmo===Infinity) return false;
    return this.getAmmoTier(id) < AMMO_TIER_MAX;
  },
  ammoTierPrice(id){
    const t=this.getAmmoTier(id);
    if(t>=AMMO_TIER_MAX) return null;
    return AMMO_TIER_PRICES[t];
  },
  buyAmmoTier(id){
    if(!this.isOwned(id)) return {ok:false,msg:'Not owned'};
    if(!this.canBuyAmmoTier(id)) return {ok:false,msg:'Maxed or infinite'};
    const price=this.ammoTierPrice(id);
    if(!Upgrades.spend(price)) return {ok:false,msg:'Not enough coins'};
    if(!this.data.ammoTiers) this.data.ammoTiers={};
    this.data.ammoTiers[id]=this.getAmmoTier(id)+1;
    this.save();
    return {ok:true,msg:'Ammo +'+(50*this.data.ammoTiers[id])+'%'};
  },
  // ── Skin helpers ───────────────────────────────────────
  // Defaults are always owned (free). isSkinOwned returns true for any 'default' skin even if
  // ownedSkins doesn't list it (avoids needing to seed defaults on first load).
  isSkinOwned(gunId, skinId){
    if(skinId==='default') return true;
    const o=this.data.ownedSkins||{};
    return !!(o[gunId] && o[gunId][skinId]);
  },
  ownedSkinIds(gunId){
    const list=SKINS[gunId]||[];
    return list.filter(s=>this.isSkinOwned(gunId, s.id)).map(s=>s.id);
  },
  equippedSkinId(gunId){
    const e=(this.data.equippedSkin||{})[gunId];
    if(e && this.isSkinOwned(gunId, e)) return e;
    return 'default';
  },
  equippedSkinDef(gunId){
    return findSkin(gunId, this.equippedSkinId(gunId));
  },
  equipSkin(gunId, skinId){
    if(!this.isSkinOwned(gunId, skinId)) return {ok:false, msg:'Not owned'};
    if(!this.data.equippedSkin) this.data.equippedSkin={};
    this.data.equippedSkin[gunId]=skinId;
    this.save();
    return {ok:true};
  },
  buySkin(gunId, skinId){
    const def=findSkin(gunId, skinId);
    if(!def||def.src!=='shop'||!def.cost) return {ok:false, msg:'Not for sale'};
    if(this.isSkinOwned(gunId, skinId)) return {ok:false, msg:'Already owned'};
    if(!this.isOwned(gunId)) return {ok:false, msg:'Buy the gun first'};
    if(!Upgrades.spend(def.cost)) return {ok:false, msg:'Not enough coins'};
    this.addSkin(gunId, skinId);
    return {ok:true, msg:'Got '+def.name};
  },
  // Used by LootBox / milestone unlocks to grant a skin without payment.
  addSkin(gunId, skinId){
    if(!this.data.ownedSkins) this.data.ownedSkins={};
    if(!this.data.ownedSkins[gunId]) this.data.ownedSkins[gunId]={};
    this.data.ownedSkins[gunId][skinId]=true;
    this.save();
  },
  // Used by LootBox to pick a random skin you don't already own. tier='shop' or 'loot'.
  unownedSkinsByTier(tier){
    const out=[];
    for(const k in SKINS){
      SKINS[k].forEach(s=>{
        if(s.src===tier && !this.isSkinOwned(k, s.id)) out.push({gunId:k, skin:s});
      });
    }
    return out;
  },
};
Inventory.load();

// ──────────────────────────────────────────────
// COUPONS
//
// Code-redemption system. `kammmran` grants 1,000,000 coins, one-shot per browser
// (redemption recorded in localStorage so a page reload can't re-trigger).
// ──────────────────────────────────────────────
const Coupons={
  defs:{
    kammmran:{coins:1000000, label:'KAMMMRAN'},
  },
  data:{redeemed:{}},
  load(){
    try{
      const raw=localStorage.getItem(userKey('csCoupons'));
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&parsed.redeemed)this.data.redeemed=parsed.redeemed;
      }
    }catch(e){this.data={redeemed:{}};}
  },
  save(){try{localStorage.setItem(userKey('csCoupons'),JSON.stringify(this.data));}catch(e){}},
  apply(codeRaw){
    const code=(codeRaw||'').trim().toLowerCase();
    if(!code) return {ok:false,msg:'Enter a code'};
    const def=this.defs[code];
    if(!def) return {ok:false,msg:'Invalid code'};
    if(this.data.redeemed[code]) return {ok:false,msg:'Already redeemed'};
    if(def.coins) Upgrades.addCoins(def.coins);
    this.data.redeemed[code]=Date.now();
    this.save();
    // Best-effort celebratory banner — silently no-ops if no canvas yet.
    try{
      if(typeof FT!=='undefined'&&typeof canvas!=='undefined'){
        FT.add(canvas.width/2,90,'🎟 '+def.label+' +'+def.coins+'🪙','#ffcc00',24,true);
      }
      if(typeof AU!=='undefined'&&AU.buy)AU.buy();
    }catch(e){}
    return {ok:true,msg:def.label+' redeemed · +'+def.coins.toLocaleString()+'🪙'};
  },
};
Coupons.load();

// Applied right after applyCharacter() so the character's base speed/jump are already set.
// Stacks the per-character upgrade tiers on top: max HP raises, speed/jump multiply, dash gets
// extra charges, dmgBonus is added to every bullet in tryShoot.
function applyUpgrades(p){
  if(!p)return;
  const ch=CHARACTERS[p.char];
  const u=Upgrades.forChar(ch.name);
  p.maxHp     = 100 + (u.hp|0)*15;
  p.hp        = p.maxHp;
  p.speed     = p.speed * (1 + (u.speed|0)*0.05);
  p.jump      = p.jump  * (1 + (u.jump|0)*0.04);
  if(p.dash){
    p.dash.maxCh   = 3 + (u.dash|0);
    p.dash.charges = p.dash.maxCh;
  }
  p.dmgBonus  = (u.dmg|0)*0.5;
}

// ──────────────────────────────────────────────
// STORAGE / UPGRADES
// ──────────────────────────────────────────────
const Storage={
  items:[
    {name:'HP Boost',     desc:'+20 max HP',     cost:200, icon:'❤️', character: 'NEON', apply:()=>{players[0].maxHp+=20; players[0].hp+=20;}},
    {name:'Plasma Ammo',  desc:'+30 plasma rounds',  cost:150, icon:'⚡', character: 'NEON', apply:()=>{players[0].guns[1].ammo=Math.min(players[0].guns[1].maxAmmo,players[0].guns[1].ammo+30);}},
    {name:'Time Ammo',    desc:'+20 time gun rounds', cost:150, icon:'❄', character: 'NEON', apply:()=>{players[0].guns[2].ammo=Math.min(players[0].guns[2].maxAmmo,players[0].guns[2].ammo+20);}},
    {name:'Extra Rewind', desc:'+1 rewind',           cost:300, icon:'↩', character: 'CRIMSON', apply:()=>{rewinds=Math.min(8,rewinds+1);}},
    {name:'Speed Up',     desc:'Speed +0.5 (all players)',  cost:250, icon:'💨', character: 'CRIMSON', apply:()=>{players.forEach(p=>{p.speed=Math.min(9,p.speed+.5);});}},
    {name:'Skill Reset',  desc:'All skill cooldowns reset',cost:350,icon:'🔄', character: 'CRIMSON', apply:()=>{players[1].skills.forEach(s=>{s.cd=0;});}},
    {name:'NEON Skill', desc:'NEON-only skill', cost:400, icon:'🔵', character: 'NEON', apply:()=>{}},
    {name:'CRIMSON Skill', desc:'CRIMSON-only skill', cost:400, icon:'🔴', character: 'CRIMSON', apply:()=>{}},
  ]
};

// ──────────────────────────────────────────────
// HIGH SCORE
// ──────────────────────────────────────────────
let highScore=parseInt(localStorage.getItem(userKey('csBest2'))||'0');
function saveBest(){
  if(score>highScore){
    highScore=score;
    localStorage.setItem(userKey('csBest2'),highScore);
    // Cloud high-water-mark sync — bypass the debounce since this only happens at game-end.
    if(typeof Cloud!=='undefined' && Cloud.isSignedIn()){
      Cloud.syncStatsNow({bestScore:highScore, totalCoins:Upgrades.data.coins, totalKills:totalKills, levelsCleared:level});
    }
    return true;
  }
  // Even if no new best, push a debounced periodic sync so other stats stay in sync.
  if(typeof Cloud!=='undefined' && Cloud.isSignedIn()){
    Cloud.syncStats({totalCoins:Upgrades.data.coins, totalKills:totalKills, levelsCleared:level});
  }
  return false;
}
function refreshBest(){
  const mb=document.getElementById('menuBest');if(mb)mb.textContent='BEST: '+highScore;
  const hb=document.getElementById('hBs');if(hb)hb.textContent=Math.max(highScore,score);
}

// ──────────────────────────────────────────────
// BG CANVAS
// ──────────────────────────────────────────────
const bgC=document.getElementById('bg'),bgX=bgC.getContext('2d');
bgC.width=window.innerWidth;bgC.height=window.innerHeight;
// Active background theme — set in initLevel from the picked LAYOUT (or per-level for MIX).
// Defaults to 'neon' for the main menu.
let currentBgTheme='neon';
// Long-lived theme decoration state. Lazily-initialized so the menu doesn't pay the cost.
const BG_DECO={
  // CHRONO SPIRE: drifting nebula blobs
  nebula:null,
  shootingStar:{x:-1,y:0,vx:0,vy:0,life:0,cooldown:120},
  // VOID FOUNDRY: distant rotating gears
  gears:null,
  // ALIEN ENDLESS: mountain silhouette layers + moons
  mountains:null,
  clouds:null,
};
function _bgInitNebula(){
  if(BG_DECO.nebula) return;
  BG_DECO.nebula=Array.from({length:14},()=>({
    x:Math.random()*bgC.width, y:Math.random()*bgC.height,
    r:120+Math.random()*220,
    hue:[260,290,200,320,180][0|Math.random()*5],
    a:0.05+Math.random()*0.08,
    dx:(Math.random()-0.5)*0.08, dy:(Math.random()-0.5)*0.06,
  }));
}
function _bgInitGears(){
  if(BG_DECO.gears) return;
  BG_DECO.gears=Array.from({length:5},()=>({
    x:Math.random()*bgC.width, y:Math.random()*bgC.height,
    r:80+Math.random()*160,
    teeth:8+Math.floor(Math.random()*8),
    spd:(Math.random()<0.5?-1:1)*(0.0015+Math.random()*0.0035),
    rot:Math.random()*Math.PI*2,
    a:0.05+Math.random()*0.06,
  }));
}
function _bgInitAlien(){
  if(BG_DECO.mountains) return;
  // Two parallax mountain layers — back layer darker, front layer brighter, each made of jagged peaks.
  const mk=(count,baseY,amp,hue)=>Array.from({length:count},(_,i)=>({
    px:i/(count-1), y:baseY+(Math.random()-0.5)*amp, hue,
  }));
  BG_DECO.mountains=[
    {layer:mk(22, bgC.height*0.78, 70, 'rgba(60,30,90,'),  speed:0.03},
    {layer:mk(28, bgC.height*0.86, 90, 'rgba(120,40,120,'),speed:0.08},
  ];
  BG_DECO.clouds=Array.from({length:6},()=>({
    x:Math.random()*bgC.width, y:50+Math.random()*bgC.height*0.4,
    w:140+Math.random()*180, spd:0.06+Math.random()*0.12,
  }));
}
let bgT=0;
const stars=Array.from({length:160},()=>({x:Math.random()*bgC.width,y:Math.random()*bgC.height,r:.3+Math.random()*1.5,tw:Math.random()*Math.PI*2,spd:.005+Math.random()*.015,col:['rgba(161,0,255,','rgba(0,245,255,','rgba(255,0,212,'][0|Math.random()*3]}));
// Single bg loop that dispatches to the active theme. Each theme function is responsible for
// clearing the canvas (or fading it for a trail effect) and drawing its decorations.
function drawBg(){
  bgT+=.007;
  switch(currentBgTheme){
    case 'spire':   drawBgSpire();   break;
    case 'foundry': drawBgFoundry(); break;
    case 'alien':   drawBgAlien();   break;
    case 'neon':
    default:        drawBgNeon();    break;
  }
  bgX.globalAlpha=1;
  requestAnimationFrame(drawBg);
}
// Default theme: cyberpunk grid + drifting starfield. Matches the original game look.
function drawBgNeon(){
  bgX.fillStyle='rgba(5,5,15,.14)';bgX.fillRect(0,0,bgC.width,bgC.height);
  bgX.strokeStyle='rgba(161,0,255,.035)';bgX.lineWidth=1;
  const gs=60,off=(bgT*7)%gs;
  for(let x=off%gs;x<bgC.width;x+=gs){bgX.beginPath();bgX.moveTo(x,0);bgX.lineTo(x,bgC.height);bgX.stroke();}
  for(let y=off%gs;y<bgC.height;y+=gs){bgX.beginPath();bgX.moveTo(0,y);bgX.lineTo(bgC.width,y);bgX.stroke();}
  stars.forEach(s=>{s.tw+=s.spd;const a=.15+Math.sin(s.tw)*.3;bgX.globalAlpha=a;bgX.fillStyle=s.col+a+')';bgX.beginPath();bgX.arc(s.x,s.y,s.r,0,Math.PI*2);bgX.fill();});
}
// Galactic deep-space: rotating tinted nebula blobs, dense starfield, occasional shooting star.
function drawBgSpire(){
  _bgInitNebula();
  // Hard clear with a near-black blue-purple wash so nebula colors pop.
  bgX.fillStyle='rgba(2,2,18,.35)';bgX.fillRect(0,0,bgC.width,bgC.height);
  // Nebula blobs — large soft radial gradients, drifting slowly. Use additive-ish via 'lighter'.
  bgX.save();
  bgX.globalCompositeOperation='lighter';
  BG_DECO.nebula.forEach(n=>{
    n.x+=n.dx; n.y+=n.dy;
    if(n.x<-n.r)n.x=bgC.width+n.r; else if(n.x>bgC.width+n.r)n.x=-n.r;
    if(n.y<-n.r)n.y=bgC.height+n.r; else if(n.y>bgC.height+n.r)n.y=-n.r;
    const g=bgX.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);
    g.addColorStop(0, `hsla(${n.hue}, 80%, 55%, ${n.a})`);
    g.addColorStop(1, `hsla(${n.hue}, 80%, 30%, 0)`);
    bgX.fillStyle=g;
    bgX.beginPath();bgX.arc(n.x,n.y,n.r,0,Math.PI*2);bgX.fill();
  });
  bgX.restore();
  // Denser, brighter star pulses.
  stars.forEach(s=>{
    s.tw+=s.spd*1.4;
    const a=.25+Math.sin(s.tw)*.45;
    bgX.globalAlpha=a;
    bgX.fillStyle=s.col+a+')';
    bgX.beginPath();bgX.arc(s.x,s.y,s.r*1.4,0,Math.PI*2);bgX.fill();
  });
  // Shooting star — fires occasionally, streaks across, leaves a fading tail.
  const ss=BG_DECO.shootingStar;
  if(ss.life<=0){
    ss.cooldown--;
    if(ss.cooldown<=0){
      ss.cooldown=180+Math.floor(Math.random()*240);
      ss.x=Math.random()*bgC.width*0.6;
      ss.y=Math.random()*bgC.height*0.4;
      const ang=Math.PI*0.18+Math.random()*0.18;
      ss.vx=Math.cos(ang)*14; ss.vy=Math.sin(ang)*14;
      ss.life=60;
    }
  } else {
    ss.x+=ss.vx; ss.y+=ss.vy; ss.life--;
    bgX.save();bgX.globalAlpha=Math.min(1,ss.life/40);bgX.strokeStyle='rgba(220,220,255,0.9)';bgX.lineWidth=2;bgX.shadowColor='#ccccff';bgX.shadowBlur=12;
    bgX.beginPath();bgX.moveTo(ss.x,ss.y);bgX.lineTo(ss.x-ss.vx*4, ss.y-ss.vy*4);bgX.stroke();
    bgX.restore();
  }
}
// Alien industrial: deep crimson wash, distant rotating gear silhouettes, lava-orange embers.
function drawBgFoundry(){
  _bgInitGears();
  // Dark crimson clear with a vertical lava-glow gradient from the bottom.
  const grad=bgX.createLinearGradient(0,0,0,bgC.height);
  grad.addColorStop(0,'rgba(20,6,10,0.35)');
  grad.addColorStop(0.7,'rgba(50,12,5,0.22)');
  grad.addColorStop(1,'rgba(120,30,0,0.30)');
  bgX.fillStyle=grad;bgX.fillRect(0,0,bgC.width,bgC.height);
  // Rotating gear silhouettes — thin outlines, very dark, soft red shadow.
  BG_DECO.gears.forEach(g=>{
    g.rot+=g.spd;
    bgX.save();bgX.translate(g.x,g.y);bgX.rotate(g.rot);
    bgX.strokeStyle=`rgba(255,80,30,${g.a})`;
    bgX.lineWidth=2;bgX.shadowColor='rgba(255,60,0,0.5)';bgX.shadowBlur=10;
    // Outer toothed ring
    bgX.beginPath();
    for(let i=0;i<g.teeth;i++){
      const a=(i/g.teeth)*Math.PI*2;
      const r1=g.r, r2=g.r*1.13;
      const a2=a+Math.PI/g.teeth;
      bgX.lineTo(Math.cos(a)*r1, Math.sin(a)*r1);
      bgX.lineTo(Math.cos(a)*r2, Math.sin(a)*r2);
      bgX.lineTo(Math.cos(a2)*r2, Math.sin(a2)*r2);
      bgX.lineTo(Math.cos(a2)*r1, Math.sin(a2)*r1);
    }
    bgX.closePath();bgX.stroke();
    // Inner ring + hub
    bgX.beginPath();bgX.arc(0,0,g.r*0.55,0,Math.PI*2);bgX.stroke();
    bgX.beginPath();bgX.arc(0,0,g.r*0.18,0,Math.PI*2);bgX.stroke();
    bgX.restore();
  });
  // Lava ember drift — tiny rising orange particles using the starfield as seed positions.
  stars.forEach(s=>{
    s.tw+=s.spd;
    // Reuse star y as a rising-ember offset; wrap when off-screen at top.
    const ey=( (s.y - bgT*40*s.spd*30) % bgC.height + bgC.height) % bgC.height;
    const a=.3+Math.sin(s.tw)*.4;
    bgX.globalAlpha=a;
    bgX.fillStyle=`rgba(255,${120+Math.floor(Math.sin(s.tw)*40)},0,${a})`;
    bgX.beginPath();bgX.arc(s.x, ey, s.r*1.2, 0, Math.PI*2);bgX.fill();
  });
}
// Alien world (used by ENDLESS): horizon mountains, dual moons, drifting clouds, deep teal sky.
function drawBgAlien(){
  _bgInitAlien();
  // Sky gradient — teal top, peachy near the horizon.
  const sky=bgX.createLinearGradient(0,0,0,bgC.height);
  sky.addColorStop(0,'rgba(6,18,40,0.30)');
  sky.addColorStop(0.55,'rgba(30,12,60,0.28)');
  sky.addColorStop(0.85,'rgba(120,40,80,0.25)');
  sky.addColorStop(1,'rgba(255,140,70,0.22)');
  bgX.fillStyle=sky;bgX.fillRect(0,0,bgC.width,bgC.height);
  // Dual moons — one large pale, one small blood-orange. Offset horizontally; gentle bob.
  const moonY=bgC.height*0.22 + Math.sin(bgT*0.5)*6;
  bgX.save();bgX.globalAlpha=0.9;
  bgX.shadowColor='rgba(200,200,255,0.6)';bgX.shadowBlur=24;
  bgX.fillStyle='rgba(220,220,235,0.9)';bgX.beginPath();bgX.arc(bgC.width*0.72, moonY, 60, 0, Math.PI*2);bgX.fill();
  bgX.shadowColor='rgba(255,120,40,0.6)';bgX.shadowBlur=18;
  bgX.fillStyle='rgba(255,150,80,0.85)';bgX.beginPath();bgX.arc(bgC.width*0.86, moonY+50, 32, 0, Math.PI*2);bgX.fill();
  bgX.restore();
  // Stars (sparse, since the sky is brighter).
  stars.forEach((s,i)=>{
    if(i%3!==0) return;
    s.tw+=s.spd;const a=.15+Math.sin(s.tw)*.25;
    bgX.globalAlpha=a;bgX.fillStyle=`rgba(255,255,255,${a})`;
    bgX.beginPath();bgX.arc(s.x,s.y*0.45,s.r*0.9,0,Math.PI*2);bgX.fill();
  });
  // Clouds — soft elongated ellipses drifting slowly across the upper-middle band.
  BG_DECO.clouds.forEach(c=>{
    c.x+=c.spd;
    if(c.x-c.w>bgC.width) c.x=-c.w;
    bgX.save();bgX.globalAlpha=0.15;
    bgX.fillStyle='#ffccaa';
    bgX.beginPath();bgX.ellipse(c.x, c.y, c.w*0.5, c.w*0.12, 0, 0, Math.PI*2);bgX.fill();
    bgX.restore();
  });
  // Mountain silhouettes — two parallax layers. Build a jagged polygon path for each.
  BG_DECO.mountains.forEach((m,li)=>{
    bgX.save();
    bgX.fillStyle = m.layer[0].hue + (li===0 ? '0.85)' : '0.95)');
    bgX.beginPath();
    bgX.moveTo(0, bgC.height);
    m.layer.forEach(pt=>{ bgX.lineTo(pt.px*bgC.width, pt.y); });
    bgX.lineTo(bgC.width, bgC.height);
    bgX.closePath();bgX.fill();
    bgX.restore();
  });
}
drawBg();

// Vertical climb world. WORLD_W matches the canvas width — no horizontal scrolling.
// WORLD_H is much taller than the canvas so the camera scrolls upward as you climb.
// Declared up here so LAYOUTS below can reference them in trap coordinates. Mutable so the
// Battle Royale arena can override to a larger horizontal world (BR_WORLD_W/H).
let WORLD_W=1200;
let WORLD_H=3200;

// ──────────────────────────────────────────────
// LEVEL LAYOUTS — three themed climbs, an endless mode, and a mixer.
//
// Each entry carries a `build(level)` generator returning {platforms, traps}. Platforms and
// hazards are re-rolled every level so the same theme never plays out the same way twice —
// NEON stays beginner-friendly, SPIRE stays crumble-heavy, FOUNDRY stays lava + saws.
//
// Coordinates: y=0 is the top of the world, y=WORLD_H (3200) is the bottom. Player spawns at
// the bottom and climbs up to the portal at y≈170.
// ──────────────────────────────────────────────
const LAYOUTS=[
  {
    name:'NEON ASCENT',
    desc:'Beginner climb. Wide platforms, few hazards. Layout shuffles each level.',
    theme:'neon',
    build: buildNeonAscent,
  },
  {
    name:'CHRONO SPIRE',
    desc:'Twisting spire. Crumbling platforms required. Layout shuffles each level.',
    theme:'spire',
    build: buildChronoSpire,
  },
  {
    name:'VOID FOUNDRY',
    desc:'Lava floor, dense saws, big gaps. Layout shuffles each level.',
    theme:'foundry',
    build: buildVoidFoundry,
  },
  // ENDLESS — see buildEndlessChunk. The chunk is rebuilt every level by initLevel().
  {
    name:'ENDLESS',
    desc:'Procedural climb that never ends. Difficulty ramps every 1000m.',
    isEndless:true,
    theme:'alien',
    build: buildEndlessChunk,
  },
  // MIX — randomly picks one of the 3 themes each level. The picked theme name is included in
  // the result so initLevel can flash it on screen.
  {
    name:'MIX',
    desc:'Random theme each level — surprise climb.',
    theme:'mix',
    build: buildMixChunk,
  },
];

// ──────────────────────────────────────────────
// ENDLESS MODE
//
// Total meters climbed across chunks. Each chunk is one WORLD_H tall (320m at 10 units/m).
// On level-complete in endless mode we accumulate the chunk height and bump difficulty per
// 1000m. The HUD reads endlessMeters when isEndlessRun() is true.
// ──────────────────────────────────────────────
let endlessMeters=0;
function isEndlessRun(){
  const l=LAYOUTS[selectedMap];
  return !!(l&&l.isEndless);
}
function endlessDifficultyTier(){
  return Math.floor(endlessMeters/1000);
}

// ──────────────────────────────────────────────
// THEMED CHUNK GENERATORS
//
// Each themed map calls buildChunk() with a different opts bag so the climb feels distinct
// but stays in-character. The platform/trap positions are re-rolled every level: same theme,
// different layout. The portal pad at y≈170 and a full-width spawn floor at y=WORLD_H-60
// are constants so spawn/exit behaviour matches every map.
// ──────────────────────────────────────────────
function buildChunk(opts){
  const o = opts || {};
  const step           = o.step           || 130;
  const minW           = o.minW           || 200;
  const maxW           = o.maxW           || 300;
  const crumbleChance  = o.crumbleChance  || 0;
  const spikeChance    = o.spikeChance    || 0;
  const sawCount       = o.sawCount       || 0;
  const sawSpeed       = o.sawSpeed       || 2.6;
  const lavaFloor      = !!o.lavaFloor;
  const skipChance     = o.skipChance     || 0; // bigger gaps when >0 (foundry-style)
  const pairChance     = o.pairChance     || 0; // sometimes spawn 2 platforms at same y

  const platforms=[
    // Spawn floor — full width unless lava overrides it.
    {x:0,y:WORLD_H-60,w:WORLD_W,h:60},
  ];
  const traps=[];
  if(lavaFloor){
    traps.push({type:'lava',x:0,y:WORLD_H-30,w:WORLD_W,h:30});
  }

  let side=0;
  for(let y=WORLD_H-200; y>240; y-=step){
    // Occasionally skip a row entirely so the player has to clear a bigger gap.
    if(skipChance && Math.random()<skipChance) continue;
    side^=1;
    const w=minW+Math.floor(Math.random()*(maxW-minW));
    const x=side
      ? 80 + Math.floor(Math.random()*220)
      : WORLD_W - 80 - w - Math.floor(Math.random()*220);
    const type = Math.random()<crumbleChance ? 'crumble' : 'solid';
    platforms.push({x,y,w,h:18,type});
    // Optional partner platform on the opposite side at the same height.
    if(pairChance && Math.random()<pairChance){
      const w2=minW+Math.floor(Math.random()*(maxW-minW));
      const x2 = side
        ? WORLD_W - 80 - w2 - Math.floor(Math.random()*200)
        : 80 + Math.floor(Math.random()*200);
      platforms.push({x:x2,y,w:w2,h:18,type:Math.random()<crumbleChance?'crumble':'solid'});
    }
    // Sit a spike bed on the platform's surface sometimes.
    if(Math.random() < spikeChance){
      const spikeW=80+Math.floor(Math.random()*120);
      const sx=Math.max(60, Math.min(WORLD_W-spikeW-60, x+Math.random()*Math.max(40,w-spikeW)));
      traps.push({type:'spike',x:sx,y:y-14,w:spikeW,h:14});
    }
  }
  // Portal landing pad at the top.
  platforms.push({x:480,y:170,w:240,h:18});
  // Horizontal saws sweeping across the climb. Spread evenly.
  for(let i=0;i<sawCount;i++){
    const sy=300 + i*((WORLD_H-500)/Math.max(1,sawCount));
    traps.push({
      type:'saw', x:600, y:sy, w:36, h:36, pathAxis:'x',
      p1:160, p2:1040,
      spd: sawSpeed + Math.random()*0.8,
      phase: Math.random()*6.28,
    });
  }
  return {platforms, traps};
}

function buildNeonAscent(lvl){
  return buildChunk({
    step: 135, minW: 240, maxW: 320,
    crumbleChance: 0,
    spikeChance: 0.10,
    sawCount: 2,
    sawSpeed: 2.4,
  });
}
function buildChronoSpire(lvl){
  return buildChunk({
    step: 110, minW: 200, maxW: 260,
    crumbleChance: 0.50,
    spikeChance: 0.12,
    sawCount: 3,
    sawSpeed: 2.9,
    pairChance: 0.25,
  });
}
function buildVoidFoundry(lvl){
  return buildChunk({
    step: 120, minW: 160, maxW: 220,
    crumbleChance: 0.35,
    spikeChance: 0.18,
    sawCount: 6,
    sawSpeed: 3.4,
    lavaFloor: true,
    skipChance: 0.18,
  });
}
// MIX — picks one of the three themed builders per level. The picked theme name is stitched
// onto the returned chunk so initLevel can flash it on screen.
function buildMixChunk(lvl){
  const choices = [
    {name:'NEON ASCENT',  theme:'neon',    fn: buildNeonAscent},
    {name:'CHRONO SPIRE', theme:'spire',   fn: buildChronoSpire},
    {name:'VOID FOUNDRY', theme:'foundry', fn: buildVoidFoundry},
  ];
  const pick = choices[Math.floor(Math.random()*choices.length)];
  const result = pick.fn(lvl);
  result.name = pick.name;
  result.theme = pick.theme;
  return result;
}

// Procedural climb generator. Seeded loosely by the level number so each chunk feels different
// but routes stay reachable. Bottom floor + zig-zag platforms + scaling hazards.
function buildEndlessChunk(lvl){
  const tier=endlessDifficultyTier();
  const platforms=[
    // Spawn floor
    {x:0,y:WORLD_H-60,w:1200,h:60},
  ];
  const traps=[];
  // Lay zig-zag platforms from bottom to top. Step size shrinks slightly as the tier rises so
  // the climb gets denser AND harder to read.
  const step=Math.max(110,140-tier*4);
  let side=0;
  for(let y=WORLD_H-200; y>200; y-=step){
    side^=1;
    const w=220+Math.floor(Math.random()*120) - Math.min(80, tier*8);
    const x=side ? 80+Math.floor(Math.random()*220)
                 : WORLD_W-80-w-Math.floor(Math.random()*220);
    const crumbleChance=Math.min(0.45, 0.08 + tier*0.05);
    const type=Math.random()<crumbleChance ? 'crumble' : 'solid';
    platforms.push({x,y,w:Math.max(120,w),h:18,type});
    // Sprinkle hazards — chance scales with tier.
    if(Math.random() < Math.min(0.55, 0.15 + tier*0.06)){
      const spikeW=80+Math.floor(Math.random()*120);
      const sx=Math.max(60, Math.min(WORLD_W-spikeW-60, x+Math.random()*Math.max(40,w-spikeW)));
      traps.push({type:'spike',x:sx,y:y-14,w:spikeW,h:14});
    }
  }
  // Portal landing pad at the top — same layout convention as the hand-designed maps.
  platforms.push({x:480,y:170,w:240,h:18});
  // Wide-sweeping saws every few hundred units, density scales with tier.
  const sawCount=2+Math.min(6,tier);
  for(let i=0;i<sawCount;i++){
    const sy=300 + i*((WORLD_H-500)/sawCount);
    const spd=2.4 + tier*0.4 + Math.random()*0.8;
    traps.push({type:'saw',x:600,y:sy,w:36,h:36,pathAxis:'x',p1:160,p2:1040,spd,phase:Math.random()*6.28});
  }
  return {platforms,traps};
}

// ──────────────────────────────────────────────
// GAME STATE
// ──────────────────────────────────────────────
const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const PS=new Particles(),FT=new FloatText();
// WORLD_W / WORLD_H were hoisted above LAYOUTS so the layout traps can reference them.

// Player count (1 or 2). gameMode kept as 0 or 1 to drive selModeIdx but represents player count - 1.
let state='menu',gameMode=0,diffIdx=1,playerCount=1;
let level=1,score=0,rewinds=3;
let totalKills=0,levelKills=0;
let timeShift=false,history=[],animId=null,gTime=0;
let portalLocked=false,enemiesLeft=0;
let lcTimer=null;
// Picked from the map-select screen; 0..2 indexes LAYOUTS.
let selectedMap=0;

// Per-player keymaps. Character is locked at lobby select — there is no in-game cycle.
// 1P  : full keyboard. WASD/arrows move, ↑/W/Space jump, Shift dash, X / click shoot,
//       Q E R fire skills, 1/2/3 swap weapons, G co-op, B rewind.
// 2PA : left half. WASD move, LShift dash, F shoot, 1/2/3 skills, Q cycles weapon, G co-op.
// 2PB : right half. Arrows move, RShift dash, / shoot, 7/8/9 skills, P cycles weapon, L co-op.
const KEYMAP_1P={
  left:['ArrowLeft','a','A'], right:['ArrowRight','d','D'],
  jump:['ArrowUp','w','W',' '], dashKeys:[], dashCodes:['ShiftLeft','ShiftRight'],
  shoot:['x','X'], useMouse:true,
  skill1:['q','Q'], skill2:['e','E'], skill3:['r','R'],
  wpn1:['1'], wpn2:['2'], wpn3:['3'],
  rewind:['b','B'], cycleWeapon:[],
  coop:['g','G'],
};
const KEYMAP_2P_P1={
  left:['a','A'], right:['d','D'], jump:['w','W'],
  dashKeys:[], dashCodes:['ShiftLeft'],
  shoot:['f','F'], useMouse:false,
  skill1:['1'], skill2:['2'], skill3:['3'],
  wpn1:[], wpn2:[], wpn3:[],
  cycleWeapon:['q','Q'],
  rewind:[],
  coop:['g','G'],
};
const KEYMAP_2P_P2={
  left:['ArrowLeft'], right:['ArrowRight'], jump:['ArrowUp'],
  dashKeys:[], dashCodes:['ShiftRight'],
  shoot:['/'], useMouse:false,
  skill1:['7'], skill2:['8'], skill3:['9'],
  wpn1:[], wpn2:[], wpn3:[],
  cycleWeapon:['p','P'],
  rewind:[],
  coop:['l','L'],
};

// Dash uses a 2D direction vector now so the player can dash up/down too. dx/dy is a unit vec.
function makeDash(){return{charges:3,maxCh:3,cd:0,maxCd:55,active:false,timer:0,dur:12,dx:1,dy:0,spd:13};}
function createPlayer(idx,keymap){
  return{
    pid:idx,
    // Spawn near the bottom of the vertical world. Each player offset slightly so they don't overlap.
    x:WORLD_W/2-60+idx*60,y:WORLD_H-160,width:32,height:32,vx:0,vy:0,
    speed:5.2,jump:13.5,onGround:false,wasOnGround:false,jumpsLeft:2,trail:[],
    hp:100, maxHp:100,
    invincTimer:0,facing:1,
    char:idx%CHARACTERS.length,
    // Vertical world → camera tracks y. (cameraX kept at 0 for compatibility with overlay code.)
    cameraX:0,cameraY:0,
    dash:makeDash(),
    skills: [],   // filled by applyCharacter() once p.char is locked in startGame()
    guns: Inventory.getEquippedGunSpecs().map(g => ({...g})),
    curGun: 0,
    coopCd:0,
    shieldedBy:0,
    // Per-character skill state. Timers are decremented in updatePhysics; stompPending fires on
    // ground touch. dmgBonus is added to bullet dmg in tryShoot (set by applyUpgrades).
    flameTrailT:0, adrenalineT:0, phaseT:0, reflectT:0, stompPending:false, dmgBonus:0,
    sniperCharged:false,
    keymap,
    jumpHeld:false,dashHeld:false,fireHeld:false,fireTimer:0,
    coopHeld:false,
    qHeld:false,rHeld:false,
    mouseX:WORLD_W/2,mouseY:WORLD_H-200,
  };
}
let players=[];
// `player` is an alias to players[0] kept for legacy code paths and skill effects (P1 origin).
let player=null;

// Mouse (P1 only); pointer-shoot also fires P1 in 1P mode.
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();if(players[0]){players[0].mouseX=e.clientX-r.left;players[0].mouseY=e.clientY-r.top;}});
canvas.addEventListener('mousedown',e=>{if(e.button===0&&players[0]){players[0].fireHeld=true;tryShoot(players[0]);}});
canvas.addEventListener('mouseup',e=>{if(e.button===0&&players[0])players[0].fireHeld=false;});

let platforms=[],obstacles=[],collectibles=[],bullets=[],enemyBullets=[],traps=[];
// Skill-driven world-space objects. snares = Emerald's Vine Snare zones, singularities = VOID's
// pull anchors. Reset in initLevel alongside bullets/traps.
let snares=[],singularities=[];
let shieldTimer=0,freezeTimer=0,overdriveTmr=0;
let keys={},keyCodes={},touch={l:false,r:false,jp:false,sh:false,ds:false,fi:false,fr:false};
let portal=null;

// ──────────────────────────────────────────────
// UI
// ──────────────────────────────────────────────
function showPanel(id){hideAllPanels();const e=document.getElementById(id);if(e)e.style.display='block';}
function hidePanel(id){const e=document.getElementById(id);if(e)e.style.display='none';}
function hideAllPanels(){['menuPanel','modePanel','mapPanel','charPanel','upgradePanel','homePanel','howPanel','settingsPanel','readmePanel','shopPanel','lcPanel','goPanel','pausePanel'].forEach(i=>{const e=document.getElementById(i);if(e)e.style.display='none';});}

let selModeIdx=0,selDiffIdx=1,selMapIdx=0;
// Character lobby picks. P1 defaults to NEON (idx 0), P2 defaults to CRIMSON (idx 1) so the
// two players don't share a colour at the start. Updated by selChar(side, idx) from the panel.
let selP1CharIdx=0,selP2CharIdx=1;
function selMode(i){
  selModeIdx=i;
  ['mc0','mc1','mc2','mc3'].forEach((id,j)=>{
    const el=document.getElementById(id);
    if(el) el.className='mode-card'+(j===i?' sel':'');
  });
}
function selDiff(i){
  selDiffIdx=i;
  ['dc0','dc1','dc2','dc3'].forEach((id,j)=>{
    const el=document.getElementById(id);
    const cls=['easy','normal','hard','pro'][j];
    el.className='dc '+cls+(j===i?' sel':'');
  });
}
function selMap(i){
  selMapIdx=i;
  ['mp0','mp1','mp2','mp3','mp4'].forEach((id,j)=>{
    const el=document.getElementById(id);
    if(el) el.className='mode-card'+(j===i?' sel':'');
  });
}
// Character lobby selection. side=0 → P1, side=1 → P2. Updates the .sel highlight.
function selChar(side,idx){
  if(side===0)selP1CharIdx=idx;else selP2CharIdx=idx;
  const prefix='p'+(side+1)+'c';
  for(let i=0;i<6;i++){
    const el=document.getElementById(prefix+i);
    if(!el)continue;
    el.classList.toggle('sel',i===idx);
  }
}

// Called from the map panel's NEXT → CHARACTER button. Shows the lobby and adapts the layout
// to the chosen mode (1P / online-2P → P1 only; local 2P → P1 + P2 rows).
function openCharPanel(){
  showPanel('charPanel');
  const p2sec=document.getElementById('p2CharSection');
  const hint=document.getElementById('charHint');
  if(p2sec)p2sec.style.display=(selModeIdx===1)?'block':'none';
  if(hint){
    if(selModeIdx===0)hint.textContent='Pick your hero. Co-op specialists (AEGIS, LIFTER) only help in 2-player.';
    else if(selModeIdx===1)hint.textContent='Pick your heroes. AEGIS + LIFTER can boost / shield each other — try one of them on at least one player.';
    else hint.textContent='Pick YOUR hero. Your friend picks theirs on their own browser.';
  }
  refreshCharCoinPill();
  // Live leaderboard on the side. Subscribe lazily; Cloud collapses duplicate subscribes.
  if(typeof Cloud!=='undefined' && Cloud.isReady()){
    Cloud.subscribeLeaderboard(50);
  }
  buildCharLeaderboard();
}

// Side-panel leaderboard on the CHOOSE CHARACTER screen. Mirrors buildHomeLeaderboard but
// targets the compact #charLbBody slot. Kept as a sibling so the two views can evolve
// independently (e.g. friends-only filter later).
function buildCharLeaderboard(){
  const wrap=document.getElementById('charLbBody'); if(!wrap) return;
  if(typeof Cloud==='undefined' || !Cloud.isReady()){
    wrap.innerHTML=`<div class="hb-cloud-empty">Cloud disabled.<br>See <code>js/firebase-config.example.js</code>.</div>`;
    return;
  }
  if(!Cloud.isSignedIn()){
    wrap.innerHTML=`<div class="hb-cloud-empty">
      <p style="margin:0 0 8px 0">Sign in to see the global top 50.</p>
      <button class="btn" onclick="cloudPillClick()">SIGN IN</button>
    </div>`;
    return;
  }
  const rows=Cloud.leaderboard||[];
  const myUid=Cloud.uid();
  if(rows.length===0){
    wrap.innerHTML=`<div class="hb-cloud-empty">Loading top 50…</div>`;
    return;
  }
  const rowHtml=rows.map(r=>`
    <div class="hb-lb-row${r.uid===myUid?' me':''}">
      <div class="hb-lb-rank">#${r.rank}</div>
      ${r.photoURL?`<img class="hb-lb-avatar" src="${r.photoURL}" alt="">`:`<div class="hb-lb-avatar default"></div>`}
      <div class="hb-lb-name">${escapeHtml(r.displayName)}</div>
      <div class="hb-lb-score">${(r.bestScore|0).toLocaleString()}</div>
    </div>
  `).join('');
  let footer='';
  const mine=rows.find(r=>r.uid===myUid);
  if(!mine && Cloud.profile){
    footer=`<div class="hb-lb-divider">…</div>
      <div class="hb-lb-row me">
        <div class="hb-lb-rank">—</div>
        <div class="hb-lb-avatar default"></div>
        <div class="hb-lb-name">${escapeHtml(Cloud.profile.displayName||'You')}</div>
        <div class="hb-lb-score">${(Cloud.profile.bestScore|0).toLocaleString()}</div>
      </div>`;
  }
  wrap.innerHTML=rowHtml+footer;
}

// Updates the floating 🪙 pill in the corner of the character lobby. Called when the panel
// opens and after returning from an upgrade purchase.
function refreshCharCoinPill(){
  const el=document.getElementById('charCoinTotal');
  if(el)el.textContent=Upgrades.data.coins;
}

// Opens the per-character upgrade panel. Stores the active char index on the panel element so
// buyUpgrade can re-render the same character after a purchase.
function openUpgrades(charIdx){
  buildUpgradePanel(charIdx);
  showPanel('upgradePanel');
  const p=document.getElementById('upgradePanel'); if(p) p.dataset.char=charIdx;
}

// ──────────────────────────────────────────────
// HOME BASE
//
// Central hub. Renders the roster (with an UPGRADE button per character — the char-select
// panel no longer owns this entrypoint) and the achievement grid.
// ──────────────────────────────────────────────
function openHomeBase(){
  // Pre-populate every modal's content so the data is fresh whenever the user clicks a tile.
  // Cheap on a static localStorage game; cleaner UX than lazy-loading on click.
  buildHomeRoster();
  buildHomeStore();
  buildHomeAchievements();
  buildHomeEquippedStrip();
  buildHomeDaily();
  buildHomeSkins();
  buildHomeLoot();
  if(typeof Cloud!=='undefined' && Cloud.isReady()){
    Cloud.subscribeLeaderboard(50);
  }
  refreshCloudUI();
  refreshHomeCoinPill();
  refreshHomeStats();
  buildHomeTiles();          // dashboard grid with badge counts
  closeHbModal();            // make sure no modal is lingering from a prior open
  const inp=document.getElementById('hbCouponInput'); if(inp) inp.value='';
  const msg=document.getElementById('hbCouponMsg'); if(msg){msg.textContent=''; msg.className='hb-coupon-msg';}
  showPanel('homePanel');
}
// Tile dashboard — 9 shortcuts, each with a live badge. Click → openHbModal(key).
function buildHomeTiles(){
  const grid=document.getElementById('hbTileGrid'); if(!grid) return;
  // Compute badge values from current state.
  const achvTotal=(typeof Achievements!=='undefined')?Achievements.defs.length:0;
  const achvGot=(typeof Achievements!=='undefined')?Achievements.defs.filter(a=>Achievements.isUnlocked(a.id)).length:0;
  const gunsTotal=(typeof GUNS!=='undefined')?GUNS.length:0;
  const gunsOwned=(typeof GUNS!=='undefined')?GUNS.filter(g=>Inventory.isOwned(g.id)).length:0;
  const skinsOwned=(typeof SKINS!=='undefined')?Object.keys(SKINS).reduce((n,k)=>n+SKINS[k].filter(s=>Inventory.isSkinOwned(k,s.id)).length,0):0;
  const skinsTotal=(typeof SKINS!=='undefined')?Object.keys(SKINS).reduce((n,k)=>n+SKINS[k].length,0):0;
  const dailyTotal=(typeof Daily!=='undefined')?Daily.data.missions.length:0;
  const dailyDone=(typeof Daily!=='undefined')?Daily.data.missions.filter(m=>m.claimed).length:0;
  const lootCount=(typeof LootBox!=='undefined')?LootBox.count():0;
  const friendCount=(typeof Cloud!=='undefined'&&Cloud.friends)?Cloud.friends.length:0;
  const cloudReady=(typeof Cloud!=='undefined')&&Cloud.isReady();
  const signedIn=cloudReady&&Cloud.isSignedIn();

  const tiles=[
    {key:'roster',      icon:'★',  name:'Roster',      badge:CHARACTERS.length+' heroes',            cls:''},
    {key:'store',       icon:'🔫', name:'Gun Store',   badge:gunsOwned+' / '+gunsTotal+' owned',    cls:gunsOwned===gunsTotal?'ok':''},
    {key:'skins',       icon:'🎨', name:'Skins',       badge:skinsOwned+' / '+skinsTotal,           cls:''},
    {key:'daily',       icon:'📅', name:'Daily',       badge:dailyDone+' / '+dailyTotal+' done',    cls:dailyDone===dailyTotal&&dailyTotal>0?'ok':''},
    {key:'achv',        icon:'🏆', name:'Achievements',badge:achvGot+' / '+achvTotal,               cls:achvGot===achvTotal?'ok':''},
    {key:'loot',        icon:'📦', name:'Loot Boxes',  badge:lootCount>0?lootCount+' unopened':'0 boxes', cls:lootCount>0?'alert':'muted'},
    {key:'leaderboard', icon:'🌐', name:'Leaderboard', badge:signedIn?'Top 50':cloudReady?'Sign in':'Disabled', cls:signedIn?'':'muted'},
    {key:'friends',     icon:'👥', name:'Friends',     badge:signedIn?(friendCount+(friendCount===1?' friend':' friends')):cloudReady?'Sign in':'Disabled', cls:signedIn?'':'muted'},
    {key:'coupon',      icon:'🎟', name:'Coupon',      badge:'Enter code',                          cls:'muted'},
  ];
  grid.innerHTML=tiles.map(t=>`
    <button class="hb-tile" onclick="openHbModal('${t.key}')">
      <div class="hb-tile-icon">${t.icon}</div>
      <div class="hb-tile-name">${t.name}</div>
      <div class="hb-tile-badge ${t.cls}">${t.badge}</div>
    </button>
  `).join('');
}
// Open / close a specific Home Base modal by key (matches the suffix of #hbModal_<key>).
function openHbModal(key){
  // If a modal is already open, close it first.
  closeHbModal();
  const el=document.getElementById('hbModal_'+key);
  if(!el) return;
  // Re-render fresh content for the section being opened (data may have changed since last open).
  switch(key){
    case 'roster':      buildHomeRoster(); break;
    case 'store':       buildHomeStore(); break;
    case 'skins':       buildHomeSkins(); break;
    case 'daily':       buildHomeDaily(); break;
    case 'achv':        buildHomeAchievements(); break;
    case 'loot':        buildHomeLoot(); break;
    case 'leaderboard': buildHomeLeaderboard(); break;
    case 'friends':     buildHomeFriends(); break;
    case 'coupon':      { const i=document.getElementById('hbCouponInput'); if(i){i.value=''; setTimeout(()=>i.focus(),50);} break; }
  }
  el.classList.add('on');
}
function closeHbModal(){
  document.querySelectorAll('.hb-modal-bg.on').forEach(el=>el.classList.remove('on'));
}
function refreshHomeCoinPill(){
  const c=document.getElementById('hbCoinTotal');
  if(c) c.textContent=Upgrades.data.coins.toLocaleString();
}
// Populate the top-of-page stats strip (coins / best / achievements / guns).
function refreshHomeStats(){
  const sc=document.getElementById('hbStatCoins');
  if(sc) sc.textContent=Upgrades.data.coins.toLocaleString();
  const sb=document.getElementById('hbStatBest');
  if(sb) sb.textContent=(parseInt(localStorage.getItem(userKey('csBest2'))||'0',10)).toLocaleString();
  const sa=document.getElementById('hbStatAchv');
  if(sa){
    const total=Achievements.defs.length;
    const got=Achievements.defs.filter(a=>Achievements.isUnlocked(a.id)).length;
    sa.textContent=got+'/'+total;
  }
  const sg=document.getElementById('hbStatGuns');
  if(sg){
    const total=GUNS.length;
    const got=GUNS.filter(g=>Inventory.isOwned(g.id)).length;
    sg.textContent=got+'/'+total;
  }
}
// Render the WEAPON SKINS section. One collapsible block per gun the player owns. Each block
// shows the gun's full skin lineup with EQUIP / BUY / LOCKED status. Loot-only skins display a
// 📦 LOOT badge instead of a price.
function buildHomeSkins(){
  const wrap=document.getElementById('hbSkinsGrid'); if(!wrap) return;
  wrap.innerHTML=GUNS.map(g=>{
    const skinList=SKINS[g.id]||[];
    if(skinList.length<=1 || !Inventory.isOwned(g.id)) return ''; // skip if gun isn't owned (default skin only)
    const equippedId=Inventory.equippedSkinId(g.id);
    const tiles=skinList.map(s=>{
      const owned=Inventory.isSkinOwned(g.id, s.id);
      const equipped=s.id===equippedId;
      const swatch=`<div class="hb-skin-swatch" style="background:${s.color};box-shadow:0 0 10px ${s.color}"></div>`;
      let action='';
      if(equipped){
        action=`<div class="hb-skin-status equipped">EQUIPPED</div>`;
      }else if(owned){
        action=`<button class="hb-skin-btn equip" onclick="equipSkin('${g.id}','${s.id}')">EQUIP</button>`;
      }else if(s.src==='shop'){
        const canAfford=Upgrades.data.coins>=s.cost;
        action=`<button class="hb-skin-btn buy" ${canAfford?'':'disabled'} onclick="buySkin('${g.id}','${s.id}')">${s.cost}🪙</button>`;
      }else if(s.src==='loot'){
        action=`<div class="hb-skin-status loot">📦 LOOT</div>`;
      }
      return `<div class="hb-skin-tile${equipped?' equipped':owned?' owned':' locked'}">
        ${swatch}
        <div class="hb-skin-name">${s.name}</div>
        ${action}
      </div>`;
    }).join('');
    return `<div class="hb-skin-block">
      <div class="hb-skin-block-head">
        <span class="hb-skin-block-ico">${g.icon||'•'}</span>
        <span class="hb-skin-block-name">${g.name.toUpperCase()}</span>
      </div>
      <div class="hb-skin-tiles">${tiles}</div>
    </div>`;
  }).join('');
}
function buySkin(gunId, skinId){
  const r=Inventory.buySkin(gunId, skinId);
  if(r.ok){
    if(typeof AU!=='undefined'&&AU.buy)AU.buy();
    Inventory.equipSkin(gunId, skinId);
  }
  buildHomeSkins();
  refreshHomeCoinPill();
}
function equipSkin(gunId, skinId){
  Inventory.equipSkin(gunId, skinId);
  if(typeof AU!=='undefined'&&AU.jump)AU.jump();
  buildHomeSkins();
}
// LOOT BOX UI: render the Home Base stack widget showing unopened count + buy/open buttons.
function buildHomeLoot(){
  const wrap=document.getElementById('hbLootRow'); if(!wrap) return;
  const n=LootBox.count();
  const canAffordBox=Upgrades.data.coins>=LootBox.BUY_COST;
  wrap.innerHTML=`
    <div class="hb-loot-stack">
      <div class="hb-loot-icon">📦</div>
      <div class="hb-loot-count">UNOPENED<b>${n}</b></div>
      <button class="hb-loot-btn" ${n>0?'':'disabled'} onclick="openLootBox()">OPEN BOX</button>
      <button class="hb-loot-btn buy" ${canAffordBox?'':'disabled'} onclick="buyLootBox()">BUY · ${LootBox.BUY_COST}🪙</button>
    </div>
    <div class="page-section-sub" style="margin:0">Opened: ${LootBox.data.totalOpened|0} · 100% chance from boss kills, 8% per level clear, 25% per daily mission claim.</div>
  `;
}
function buyLootBox(){
  const r=LootBox.buyBox();
  if(r.ok) openLootBox();
  buildHomeLoot();
  refreshHomeCoinPill();
}
// ── Cloud (Firebase) UI handlers ───────────────────────────────────────────
// Sign-in pill on the main menu. Hidden unless Cloud.isReady() (i.e., firebase-config.js is set).
function cloudPillClick(){
  if(typeof Cloud==='undefined' || !Cloud.isReady()){
    alert('Cloud features need Firebase setup.\n\nSee js/firebase-config.example.js for instructions.');
    return;
  }
  if(Cloud.isSignedIn()) Cloud.signOut();
  else Cloud.signIn().catch(e=>alert('Sign-in failed: '+e.message));
}
// Re-render the viewport-anchored cloud card and any cloud-aware Home Base sections. The card
// has two visual states: signed-out (Google CTA button) and signed-in (user chip with popover).
// Hidden entirely when Firebase isn't configured. Invoked on auth changes + screen entries.
function refreshCloudUI(){
  const ready = (typeof Cloud!=='undefined') && Cloud.isReady();
  const card=document.getElementById('cloudCard');
  // Hide during active gameplay so it doesn't overlap the HUD; show on menu / Home Base /
  // character select / settings / etc.
  const hideDuringPlay = (typeof state!=='undefined' && state==='playing');
  if(card) card.style.display = (ready && !hideDuringPlay) ? 'block' : 'none';
  if(ready){
    const signed=Cloud.isSignedIn();
    const signinBtn=document.getElementById('cloudSignInBtn');
    const chip=document.getElementById('cloudUserChip');
    if(signinBtn) signinBtn.style.display = signed ? 'none' : 'flex';
    if(chip)      chip.style.display      = signed ? 'flex' : 'none';
    if(signed){
      const nameEl=document.getElementById('cloudName');
      if(nameEl) nameEl.textContent = Cloud.displayName() || 'Player';
      const av=document.getElementById('cloudAvatar');
      if(av){
        const url = Cloud.photoURL();
        if(url){ av.src=url; av.style.display='block'; }
        else av.style.display='none';
      }
      const codeEl=document.getElementById('cloudMyCode');
      if(codeEl) codeEl.textContent = (Cloud.profile && Cloud.profile.shortCode) || '— — —';
    } else {
      // Make sure any open popover is cleared on sign-out.
      const chipNode=document.getElementById('cloudUserChip');
      if(chipNode) chipNode.classList.remove('open');
    }
  }
  buildHomeLeaderboard();
  buildHomeFriends();
  if(typeof buildCharLeaderboard==='function') buildCharLeaderboard();
  if(typeof buildHomeTiles==='function') buildHomeTiles();
}
// Toggle the signed-in chip's popover. Stops propagation so the document-level click handler
// below doesn't immediately re-close it.
function toggleCloudMenu(e){
  if(e) e.stopPropagation();
  const chip=document.getElementById('cloudUserChip');
  if(chip) chip.classList.toggle('open');
}
function closeCloudMenu(){
  const chip=document.getElementById('cloudUserChip');
  if(chip) chip.classList.remove('open');
}
// Click-outside dismissal for the popover. Re-armed every refreshCloudUI but the listener
// itself is idempotent (only checks the .open class).
document.addEventListener('click', e=>{
  const chip=document.getElementById('cloudUserChip');
  if(chip && chip.classList.contains('open') && !chip.contains(e.target)){
    chip.classList.remove('open');
  }
});
// Leaderboard panel (Home Base). Top 50 by bestScore via Firestore onSnapshot. While not
// signed in, shows a teaser with a SIGN IN button.
function buildHomeLeaderboard(){
  const wrap=document.getElementById('hbLeaderboard'); if(!wrap) return;
  if(typeof Cloud==='undefined' || !Cloud.isReady()){
    wrap.innerHTML=`<div class="hb-cloud-empty">Cloud features disabled. See <code>js/firebase-config.example.js</code>.</div>`;
    return;
  }
  if(!Cloud.isSignedIn()){
    wrap.innerHTML=`<div class="hb-cloud-empty">
      <p>Sign in with Google to compete on the global leaderboard.</p>
      <button class="btn" style="max-width:220px;margin:8px auto" onclick="cloudPillClick()">SIGN IN WITH GOOGLE</button>
    </div>`;
    return;
  }
  const rows=Cloud.leaderboard||[];
  const myUid=Cloud.uid();
  if(rows.length===0){
    wrap.innerHTML=`<div class="hb-cloud-empty">Loading leaderboard…</div>`;
    return;
  }
  const rowHtml=rows.map(r=>`
    <div class="hb-lb-row${r.uid===myUid?' me':''}">
      <div class="hb-lb-rank">#${r.rank}</div>
      ${r.photoURL?`<img class="hb-lb-avatar" src="${r.photoURL}" alt="">`:`<div class="hb-lb-avatar default"></div>`}
      <div class="hb-lb-name">${escapeHtml(r.displayName)}</div>
      <div class="hb-lb-score">${(r.bestScore|0).toLocaleString()}</div>
    </div>
  `).join('');
  // If the local player isn't in top-50, show a divider + their rank from the profile doc.
  let footer='';
  const mine=rows.find(r=>r.uid===myUid);
  if(!mine && Cloud.profile){
    footer=`<div class="hb-lb-divider">…</div>
      <div class="hb-lb-row me">
        <div class="hb-lb-rank">—</div>
        <div class="hb-lb-avatar default"></div>
        <div class="hb-lb-name">${escapeHtml(Cloud.profile.displayName||'You')}</div>
        <div class="hb-lb-score">${(Cloud.profile.bestScore|0).toLocaleString()}</div>
      </div>`;
  }
  wrap.innerHTML=rowHtml+footer;
}
// Friends panel — list current friends + add-by-code input.
function buildHomeFriends(){
  const wrap=document.getElementById('hbFriends'); if(!wrap) return;
  if(typeof Cloud==='undefined' || !Cloud.isReady()){
    wrap.innerHTML=`<div class="hb-cloud-empty">Cloud features disabled.</div>`;
    return;
  }
  if(!Cloud.isSignedIn()){
    wrap.innerHTML=`<div class="hb-cloud-empty">Sign in to add friends and compare scores.</div>`;
    return;
  }
  const myCode=(Cloud.profile&&Cloud.profile.shortCode)||'—';
  const friendRows=Cloud.friends.length===0
    ? `<div class="hb-cloud-empty">No friends yet — share your code or add one below.</div>`
    : Cloud.friends.map(f=>`
        <div class="hb-fr-row">
          ${f.photoURL?`<img class="hb-fr-avatar" src="${f.photoURL}" alt="">`:`<div class="hb-fr-avatar default"></div>`}
          <div class="hb-fr-name">${escapeHtml(f.displayName)}</div>
          <div class="hb-fr-score">${(f.bestScore|0).toLocaleString()}🏆</div>
          <button class="hb-fr-remove" onclick="removeFriend('${f.uid}')">×</button>
        </div>`).join('');
  wrap.innerHTML=`
    <div class="hb-fr-mycode">YOUR CODE: <b>${escapeHtml(myCode)}</b> <span style="opacity:.6">(share so friends can add you)</span></div>
    <div class="hb-fr-list">${friendRows}</div>
    <div class="hb-fr-add">
      <input type="text" id="hbFriendInput" placeholder="Enter friend code" maxlength="6" autocomplete="off" style="text-transform:uppercase">
      <button class="btn" style="max-width:140px;margin:0;padding:8px 16px;font-size:11px" onclick="addFriendByCode()">ADD</button>
    </div>
    <div id="hbFriendMsg" class="hb-coupon-msg"></div>
  `;
}
async function addFriendByCode(){
  const inp=document.getElementById('hbFriendInput');
  const msg=document.getElementById('hbFriendMsg');
  if(!inp||!msg||typeof Cloud==='undefined') return;
  const r=await Cloud.addFriendByCode(inp.value);
  msg.textContent=r.msg;
  msg.className='hb-coupon-msg '+(r.ok?'ok':'err');
  if(r.ok) inp.value='';
}
async function removeFriend(uid){
  if(typeof Cloud==='undefined') return;
  await Cloud.removeFriend(uid);
}
// Plain HTML escape so user-supplied display names can't inject markup.
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function openLootBox(){
  const reward=LootBox.open();
  if(!reward){ buildHomeLoot(); return; }
  // Show reveal modal.
  const bg=document.getElementById('lootModalBg');
  const prize=document.getElementById('lootModalPrize');
  const detail=document.getElementById('lootModalDetail');
  if(bg && prize && detail){
    prize.textContent=reward.label;
    detail.textContent=reward.detail;
    bg.classList.add('on');
  }
  if(typeof AU!=='undefined'){
    if(reward.kind==='lootskin' || reward.kind==='gun') AU.levelOK();
    else AU.buy();
  }
  buildHomeLoot();
  buildHomeSkins();   // skin rewards: refresh skin tiles
  buildHomeStore();   // gun rewards: refresh store
  refreshHomeCoinPill();
  refreshHomeStats();
}
function closeLootModal(){
  const bg=document.getElementById('lootModalBg');
  if(bg) bg.classList.remove('on');
}

// Render the daily missions section in Home Base. Three cards, progress bars, claim badges.
// Re-checks the rotation date on open so a player who left the game open across midnight gets
// the new day's missions next time they look.
function buildHomeDaily(){
  if(typeof Daily==='undefined') return;
  Daily.checkRoll();
  const grid=document.getElementById('hbDailyGrid'); if(!grid) return;
  const iconFor=cat=>cat==='boss'?'👹':cat==='kill'?'💀':cat==='level'?'⬆':cat==='endless'?'🌌':cat==='score'?'⭐':cat==='skill'?'⚡':'•';
  grid.innerHTML=Daily.data.missions.map(m=>{
    const pct=Math.min(100, Math.round((m.progress/m.target)*100));
    const status = m.claimed
      ? `<div class="hb-daily-status done">✓ CLAIMED</div>`
      : (m.progress>=m.target
          ? `<div class="hb-daily-status ready">✓ COMPLETE</div>`
          : `<div class="hb-daily-status">${m.progress}/${m.target}</div>`);
    return `
      <div class="hb-daily-card${m.claimed?' claimed':m.progress>=m.target?' ready':''}">
        <div class="hb-daily-head">
          <div class="hb-daily-icon">${iconFor(m.cat)}</div>
          <div class="hb-daily-name">${m.name}</div>
          <div class="hb-daily-reward">+${m.reward}🪙</div>
        </div>
        <div class="hb-daily-bar"><div class="hb-daily-bar-fill" style="width:${pct}%"></div></div>
        ${status}
      </div>`;
  }).join('');
  // Refresh-in countdown.
  const t=document.getElementById('hbDailyTimer');
  if(t){
    const ms=Daily.msUntilTomorrow();
    const h=Math.floor(ms/3600000), mins=Math.floor((ms%3600000)/60000);
    t.textContent='RESETS IN '+h+'H '+mins+'M';
  }
}

// Render the currently-equipped 3-slot loadout strip.
function buildHomeEquippedStrip(){
  const strip=document.getElementById('hbEqStrip'); if(!strip) return;
  const specs=Inventory.getEquippedGunSpecs();
  strip.innerHTML=specs.map((g,i)=>`
    <div class="eq-slot">
      <div class="ico">${g.icon||'•'}</div>
      <div class="meta">
        <div class="slot-num">SLOT ${i+1}</div>
        <div class="nm">${g.name.toUpperCase()}</div>
      </div>
    </div>
  `).join('');
}

// Manual page tab switcher. Drives the .tab-btn + .tab-pane classes by suffixing the id.
function switchManualTab(key){
  const map={controls:'tabControls',characters:'tabCharacters',weapons:'tabWeapons',hazards:'tabHazards',objective:'tabObjective'};
  const targetId=map[key]||map.controls;
  document.querySelectorAll('#howPanel .tab-pane').forEach(el=>el.classList.toggle('on', el.id===targetId));
  document.querySelectorAll('#howPanel .tab-btn').forEach(btn=>{
    const isActive=btn.getAttribute('onclick')&&btn.getAttribute('onclick').includes("'"+key+"'");
    btn.classList.toggle('on', !!isActive);
  });
}

// Settings → wipe THIS user's save data after a single confirm. Only the current account's
// keys are removed; other accounts on the same browser stay intact. Reloads so in-memory state
// matches the freshly empty localStorage.
function resetAllProgress(){
  if(!confirm('Reset ALL progress for this account?\n\nThis wipes coins, upgrades, owned guns, equipped loadout, skins, achievements, daily missions, loot boxes, redeemed coupons, and best score. Other accounts on this browser are not affected. This cannot be undone.')){
    return;
  }
  ['csBest2','csUpgrades','csAchievements','csInventory','csCoupons','csDailyMissions','csLootBoxes'].forEach(k=>{
    try{localStorage.removeItem(userKey(k));}catch(e){}
  });
  const msg=document.getElementById('resetMsg');
  if(msg){msg.textContent='Progress wiped — reloading…'; msg.className='hb-coupon-msg ok';}
  setTimeout(()=>{location.reload();}, 600);
}
function buildHomeRoster(){
  const grid=document.getElementById('hbCharGrid'); if(!grid) return;
  grid.innerHTML=CHARACTERS.map((ch,i)=>{
    const isCoop=!!ch.coop;
    return `<div class="char-card${isCoop?' coop':''}" data-c="${ch.c1}" style="cursor:default">
      <div class="cc-swatch" style="background:linear-gradient(135deg,${ch.c1},${ch.c2})"></div>
      <div class="cc-name">${ch.name}</div>
      <div class="cc-tag">${isCoop?'co-op specialist':'fighter'}</div>
      <button class="cc-upg-btn" onclick="openUpgrades(${i})">⬆ UPGRADE</button>
    </div>`;
  }).join('');
}
function buildHomeAchievements(){
  const grid=document.getElementById('hbAchvGrid'); if(!grid) return;
  grid.innerHTML=Achievements.defs.map(a=>{
    const unlocked=Achievements.isUnlocked(a.id);
    return `<div class="hb-achv${unlocked?' on':''}">
      <div class="hb-achv-icon">${unlocked?'🏆':'🔒'}</div>
      <div class="hb-achv-body">
        <div class="hb-achv-name">${a.name}</div>
        <div class="hb-achv-desc">${a.desc}</div>
      </div>
      <div class="hb-achv-reward">+${a.reward}🪙</div>
    </div>`;
  }).join('');
}

// Renders one card per GUN. Each card shows: icon + name + tag (LOCKED / OWNED / EQUIPPED N),
// a short stats line, and either a BUY button (locked guns) or three EQUIP-SLOT buttons.
function buildHomeStore(){
  const grid=document.getElementById('hbStoreGrid'); if(!grid) return;
  grid.innerHTML=GUNS.map(g=>{
    const owned=Inventory.isOwned(g.id);
    const slot=Inventory.equippedSlot(g.id);
    const equipped=slot>=0;
    const tag = equipped ? `<span class="hb-store-tag">EQUIPPED ${slot+1}</span>`
              : owned    ? `<span class="hb-store-tag" style="background:rgba(0,245,255,.18);color:var(--c)">OWNED</span>`
              :            `<span class="hb-store-tag locked">${g.cost}🪙</span>`;
    const stats = [
      `<b>DMG</b> ${g.dmg}`,
      `<b>RoF</b> ${g.rof}`,
      g.maxAmmo===Infinity?`<b>AMMO</b> ∞`:`<b>AMMO</b> ${g.maxAmmo}`,
      g.pierce?'<b>PIERCE</b>':'',
      g.freeze?'<b>FREEZE</b>':'',
      g.pellets?`<b>x${g.pellets}</b>`:'',
      g.explode?`<b>AOE</b>`:'',
    ].filter(Boolean).join('');
    let actions;
    if(!owned){
      const canAfford=Upgrades.data.coins>=g.cost;
      actions=`<button class="hb-store-buy" ${canAfford?'':'disabled'} onclick="buyGun('${g.id}')">BUY · ${g.cost}🪙</button>`;
    }else{
      actions=`<div class="hb-store-equip-row">
        <button class="hb-store-slot${slot===0?' on':''}" onclick="equipGun('${g.id}',0)">SLOT 1</button>
        <button class="hb-store-slot${slot===1?' on':''}" onclick="equipGun('${g.id}',1)">SLOT 2</button>
        <button class="hb-store-slot${slot===2?' on':''}" onclick="equipGun('${g.id}',2)">SLOT 3</button>
      </div>`;
    }
    // Ammo capacity tier row — visible on owned, non-infinite guns. Shows ★ filled per tier and
    // a BUY button at the next price (or MAX when tier 3 is reached).
    let ammoTierRow='';
    if(owned && g.maxAmmo!==Infinity){
      const tier=Inventory.getAmmoTier(g.id);
      const stars=Array.from({length:AMMO_TIER_MAX}, (_,i)=>i<tier?'★':'☆').join('');
      const price=Inventory.ammoTierPrice(g.id);
      const canBuy=price!==null && Upgrades.data.coins>=price;
      const effMax=Math.floor(g.maxAmmo*(1+0.5*tier));
      const btn=price===null
        ? `<button class="hb-store-ammo-btn" disabled>MAX · ${effMax}</button>`
        : `<button class="hb-store-ammo-btn" ${canBuy?'':'disabled'} onclick="buyAmmoTier('${g.id}')">AMMO+ · ${price}🪙</button>`;
      ammoTierRow=`<div class="hb-store-ammo"><span class="hb-store-ammo-stars">${stars}</span><span class="hb-store-ammo-cap">CAP ${effMax}</span>${btn}</div>`;
    }
    return `<div class="hb-store-card${equipped?' equipped':owned?' owned':''}">
      <div class="hb-store-head">
        <div class="hb-store-icon">${g.icon||'•'}</div>
        <div class="hb-store-name">${g.name.toUpperCase()}</div>
        ${tag}
      </div>
      <div class="hb-store-stats">${stats}</div>
      <div class="hb-store-actions">${actions}</div>
      ${ammoTierRow}
    </div>`;
  }).join('');
}
function buyGun(id){
  const r=Inventory.buy(id);
  if(r.ok&&typeof AU!=='undefined'&&AU.buy)AU.buy();
  buildHomeStore();
  refreshHomeCoinPill();
}
function equipGun(id, slot){
  Inventory.equip(id, slot);
  if(typeof AU!=='undefined'&&AU.jump)AU.jump();
  buildHomeStore();
}
function buyAmmoTier(id){
  const r=Inventory.buyAmmoTier(id);
  if(r.ok){
    if(typeof AU!=='undefined'&&AU.buy)AU.buy();
  }
  buildHomeStore();
  refreshHomeCoinPill();
}
function applyCoupon(){
  const inp=document.getElementById('hbCouponInput');
  const msg=document.getElementById('hbCouponMsg');
  if(!inp||!msg) return;
  const r=Coupons.apply(inp.value);
  msg.textContent=r.msg;
  msg.className='hb-coupon-msg '+(r.ok?'ok':'err');
  if(r.ok) inp.value='';
  refreshHomeCoinPill();
  // A successful redemption boosts the balance — refresh store BUY-affordability too.
  if(r.ok) buildHomeStore();
}

// Renders the 5-track upgrade list for the given character. Each row shows the track name,
// tier dots (filled gold up to the current tier), and a BUY button for the next tier's price.
// At max tier the BUY button is replaced with "MAX".
function buildUpgradePanel(charIdx){
  const ch=CHARACTERS[charIdx]; if(!ch) return;
  const u=Upgrades.forChar(ch.name);
  const titleEl=document.getElementById('upgTitle'); if(titleEl) titleEl.textContent='UPGRADES — '+ch.name;
  const coinEl=document.getElementById('upgCoins'); if(coinEl) coinEl.textContent=Upgrades.data.coins;
  const list=document.getElementById('upgList'); if(!list) return;
  list.innerHTML=Upgrades.TRACKS.map(t=>{
    const tier=u[t.id]|0;
    const dots=Array.from({length:t.maxTier},(_,i)=>`<span class="upg-dot${i<tier?' on':''}"></span>`).join('');
    let action;
    if(tier>=t.maxTier){
      action=`<span class="upg-max">MAX</span>`;
    }else{
      const cost=Upgrades.PRICES[tier];
      const dis=Upgrades.data.coins<cost?'disabled':'';
      action=`<button class="upg-buy" ${dis} onclick="buyUpgrade(${charIdx},'${t.id}')">BUY · ${cost}🪙</button>`;
    }
    return `<div class="upg-row"><span class="upg-name">${t.icon} ${t.name}</span><span class="upg-dots">${dots}</span>${action}</div>`;
  }).join('');
}

// Buy handler. Re-renders the panel after a successful purchase so the new tier dot lights up
// and the next price replaces the BUY button.
function buyUpgrade(charIdx, trackId){
  const ch=CHARACTERS[charIdx]; if(!ch) return;
  if(Upgrades.buy(ch.name, trackId)){
    if(typeof AU!=='undefined'&&AU.buy)AU.buy();
    buildUpgradePanel(charIdx);
  }
}

// Called from the character lobby's LAUNCH button. Redirects to the chosen module page with
// difficulty, map, AND character indices in the URL so the bootstrap can hydrate everything.
function launchGame(){
  const target = selModeIdx===3?'battle-royale.html'
               : selModeIdx===2?'online-2p.html'
               : selModeIdx===1?'2-person.html'
               : '1-person.html';
  window.location.href = 'modules/' + target +
    '?diff=' + selDiffIdx +
    '&map='  + selMapIdx +
    '&p1='   + selP1CharIdx +
    '&p2='   + selP2CharIdx;
}

function updateHUD(){
  // In online 2P the local avatar is players[1] on the guest. Map self → P1 so the primary
  // HUD always reflects the local player; the secondary (P2) HUD reflects the partner.
  const selfIdx = (Net.role==='guest'?1:0);
  const p1 = players[selfIdx];
  const p2 = players[1-selfIdx];

  let p1Pct = p1 ? (p1.hp / p1.maxHp)*100 : 0;
  const f1=document.getElementById('hpF1');
  if(f1) { f1.style.width=Math.max(0,p1Pct)+'%'; f1.className='hp-f'+(p1Pct<25?' crit':''); }
  
  if (p2) {
    let p2Pct = (p2.hp / p2.maxHp)*100;
    const f2=document.getElementById('hpF2');
    if(f2) { f2.style.width=Math.max(0,p2Pct)+'%'; f2.className='hp-f'+(p2Pct<25?' crit':''); }
  }

  document.getElementById('hSc').textContent=score;
  document.getElementById('hBs').textContent=Math.max(highScore,score);
  document.getElementById('hLv').textContent=level;
  document.getElementById('hKl').textContent=levelKills+'/'+enemiesLeft+' left';
  // Coin balance from persistent Upgrades storage.
  const coinEl=document.getElementById('hCoins');
  if(coinEl)coinEl.textContent=Upgrades.data.coins;
  // Altitude — show how far up the player has climbed (0m at the bottom, max at the portal).
  // In endless mode it's the cumulative total across all completed chunks plus current climb.
  const hEl=document.getElementById('hHeight');
  if(hEl&&p1){
    const climbed=Math.max(0,Math.round((WORLD_H-(p1.y+p1.height))/10));
    if(isEndlessRun()){
      hEl.textContent=(endlessMeters+climbed)+'m';
    }else{
      const total=Math.round((WORLD_H-portal.y-portal.height)/10);
      hEl.textContent=climbed+'/'+total+'m';
    }
  }
  SFX.danger(p1Pct);
  // weapons
  if (p1) {
    document.getElementById('wa1').textContent=p1.guns[1].ammo===Infinity?'∞':p1.guns[1].ammo+'/'+p1.guns[1].maxAmmo;
    document.getElementById('wa2').textContent=p1.guns[2].ammo===Infinity?'∞':p1.guns[2].ammo+'/'+p1.guns[2].maxAmmo;
    ['wp0','wp1','wp2'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.className='wp'+(p1.curGun===i?' active':'');});
    p1.skills.forEach((sk,i)=>{
      const el=document.getElementById('sk'+i),cd=document.getElementById('scd'+i);
      if(el && cd) {
        el.className='sk'+(sk.cd>0?' cd':'');
        cd.style.width=(sk.cd>0?(sk.cd/sk.maxCd*100):0)+'%';
      }
    });
  }
  
  if (p2) {
    const p2wa1=document.getElementById('p2wa1');
    if(p2wa1)p2wa1.textContent=p2.guns[1].ammo===Infinity?'∞':p2.guns[1].ammo+'/'+p2.guns[1].maxAmmo;
    const p2wa2=document.getElementById('p2wa2');
    if(p2wa2)p2wa2.textContent=p2.guns[2].ammo===Infinity?'∞':p2.guns[2].ammo+'/'+p2.guns[2].maxAmmo;
    p2.skills.forEach((sk,i)=>{
      const el=document.getElementById('p2sk'+i),cd=document.getElementById('p2scd'+i);
      if(el && cd) {
        el.className='sk'+(sk.cd>0?' cd':'');
        cd.style.width=(sk.cd>0?(sk.cd/sk.maxCd*100):0)+'%';
      }
    });
  }
  // portal lock indicator handled in render
}

function updateModeBar(){
  document.getElementById('bMode').textContent=playerCount===2?'2 PLAYERS':'1 PLAYER';
  document.getElementById('bDiff').textContent=DIFFS[diffIdx].name;
}

// Rewrites the .sk-icon, .sk-key, and `title` on each skill slot to match the player's
// CURRENT character's kit. Called once at game start from startGame() — character is locked
// for the run so we don't need to refresh every frame.
function refreshSkillHUD(){
  const self = players[0]; if (!self) return;
  const selfKeys = playerCount===1 ? ['Q','E','R'] : ['1','2','3'];
  _refreshOneSkillHUD(self, ['sk0','sk1','sk2'], selfKeys);
  if (players[1]) _refreshOneSkillHUD(players[1], ['p2sk0','p2sk1','p2sk2'], ['7','8','9']);
}
function _refreshOneSkillHUD(p, slotIds, keyLabels){
  p.skills.forEach((sk,i)=>{
    const el=document.getElementById(slotIds[i]); if(!el) return;
    el.title = sk.name;
    const ic = el.querySelector('.sk-icon'); if (ic) ic.textContent = sk.icon;
    const kl = el.querySelector('.sk-key');  if (kl) kl.textContent = keyLabels[i];
  });
}

// Rewrites the wp0/wp1/wp2 (and p2 mirror) `.wp-name` and `.wp-ammo` so the bar reflects the
// CURRENTLY EQUIPPED loadout chosen in Home Base. Called once at game start; ammo numbers are
// kept fresh by updateHUD's per-frame pass.
function refreshWeaponHUD(){
  const p1=players[0]; if(!p1) return;
  _refreshOneWeaponHUD(p1, ['wp0','wp1','wp2'], ['wa0','wa1','wa2'], ['1','2','3']);
  const p2=players[1];
  if(p2) _refreshOneWeaponHUD(p2, ['p2wp0','p2wp1','p2wp2'], ['p2wa0','p2wa1','p2wa2'], ['7','8','9']);
}
function _refreshOneWeaponHUD(p, slotIds, ammoIds, keyLabels){
  p.guns.forEach((g,i)=>{
    const el=document.getElementById(slotIds[i]); if(!el) return;
    const nm=el.querySelector('.wp-name');
    if(nm) nm.innerHTML = (g.icon||'•')+' '+g.name.toUpperCase()+' <span class="kbd">['+keyLabels[i]+']</span>';
    const am=document.getElementById(ammoIds[i]);
    if(am) am.textContent = g.ammo===Infinity?'∞':(g.ammo+'/'+g.maxAmmo);
  });
}

// ──────────────────────────────────────────────
// LEVEL INIT
// ──────────────────────────────────────────────
function initLevel(){
  // Platforms are hand-designed per map; flag for re-send to the guest.
  if(typeof Net!=='undefined'&&Net.invalidatePlatforms)Net.invalidatePlatforms();
  const D=DIFFS[diffIdx];
  // Reset every player's per-frame state. Spawn at the bottom of the vertical world.
  players.forEach((p,i)=>{
    p.x=WORLD_W/2-60+i*60;p.y=WORLD_H-220;p.vx=0;p.vy=0;p.trail=[];
    p.onGround=false;p.jumpsLeft=2;p.wasOnGround=false;
    p.jumpHeld=false;p.dashHeld=false;p.fireHeld=false;p.fireTimer=0;p.coopHeld=false;
    p.dash=makeDash();
    if(p.dash){p.dash.maxCh=3+(Upgrades.forChar(CHARACTERS[p.char].name).dash||0);p.dash.charges=p.dash.maxCh;}
    p.invincTimer=0;p.cameraX=0;p.cameraY=WORLD_H-canvas.height;
    p.coopCd=0;p.shieldedBy=0;
    p.flameTrailT=0;p.adrenalineT=0;p.phaseT=0;p.reflectT=0;p.stompPending=false;
    p.skills.forEach(sk=>{sk.cd=0;});
    // Bug fix: reset every gun's lastShot to 0 so a stale value from a previous level / rewind
    // doesn't block the first shot until gTime catches up.
    p.guns.forEach(g=>{g.lastShot=0;});
  });
  shieldTimer=0;freezeTimer=0;overdriveTmr=0;
  history=[];
  levelKills=0;bullets=[];enemyBullets=[];snares=[];singularities=[];
  Combo.reset();

  // Load the climb for this level. Each map's build(level) re-rolls platform + trap positions
  // every level so the same chosen map never plays out twice. selectedMap stays fixed across a
  // run — what varies is the layout inside that theme.
  const pickedLayout=LAYOUTS[selectedMap]||LAYOUTS[0];
  const source = pickedLayout.build
    ? pickedLayout.build(level)
    : pickedLayout; // defensive fallback (no static layouts ship anymore)
  // Only MIX mode announces the picked theme — for other maps the name doesn't change so the
  // banner would just be noise. ENDLESS already has its own per-chunk feedback.
  if(typeof FT!=='undefined'&&typeof canvas!=='undefined'
     && pickedLayout.name==='MIX' && source.name){
    FT.add(canvas.width/2, 110, '★ '+source.name, '#a100ff', 28, true);
  }
  // Pick the backdrop theme. MIX uses the per-level pick (source.theme); other layouts use
  // the static theme on the layout. Fallback to neon for safety.
  currentBgTheme = (source && source.theme) || pickedLayout.theme || 'neon';
  platforms=source.platforms.map(p=>({
    x:p.x,y:p.y,width:p.w,height:p.h,
    type:p.type||'solid',
    crumbleT:0,crumbleRespawn:0,disabled:false,
  }));
  traps=source.traps.map(t=>({...t}));
  // Saw movement is driven by phase. Cache the initial center so range math is stable.
  traps.forEach(t=>{
    if(t.type==='saw'){
      t.t=t.phase||0;
      t.dir=1;
    }
  });

  // Enemies — count scales with level. Spawn on platforms scattered through the climb so they
  // aren't stuck in mid-air. Endless mode adds a tier bonus (per 1000m) on top of base scaling.
  const eTier=isEndlessRun()?endlessDifficultyTier():0;
  const baseSpeed=1.0+(level-1)*.15+eTier*0.35;
  const speed=baseSpeed*D.speedM;
  const cnt=4+Math.floor((level-1)*1.4)+Math.floor(D.speedM*1.5)+eTier*2;
  const types=['basic','basic','chaser','spinner','tank'];

  obstacles=[];
  const climbPlats=platforms.filter(p=>p.y>200&&p.y<WORLD_H-200&&p.width>=160);
  
  if(playerCount === 2) {
    climbPlats.forEach((p, i) => {
      if(i % 3 === 0) {
        platforms.push({
          x: p.x + p.width/2 - 6, y: p.y - 140, width: 12, height: 140,
          type: 'door', owner: i % 2, disabled: false, crumbleT: 0
        });
      }
    });
  }

  for(let i=0;i<cnt;i++){
    const base=climbPlats[(i*7+3)%climbPlats.length]||climbPlats[0];
    if(!base)break;
    const ox=base.x+10+Math.random()*Math.max(20,base.width-50);
    const oy=base.y-44;
    const tIdx=Math.min(types.length-1,0|Math.random()*(Math.min(types.length,level)));
    const tp=types[tIdx];
    const hp=(tp==='tank'?4:tp==='chaser'?2:1)*D.hpM;
    const w=tp==='tank'?50:34+Math.random()*14,h=tp==='tank'?50:34+Math.random()*14;
    const owner = playerCount === 2 ? i % 2 : undefined;
    obstacles.push({x:ox,y:oy,width:w,height:h, owner,
      vx:(Math.random()<.5?1:-1)*speed*(0.7+Math.random()*.6),
      vy:(Math.random()<.5?1:-1)*speed*(0.5+Math.random()*.5),
      glow:Math.random()*Math.PI*2,rot:0,type:tp,hp,maxHp:hp,
      frozenT:0,burnT:0,shootTimer:0|Math.random()*180,
      color:tp==='tank'?'#880000':tp==='chaser'?'#ff6600':tp==='spinner'?'#cc00ff':'#ff0055'});
  }

  // BOSS — every BOSS_LEVEL_INTERVAL levels, spawn one boss matching the current backdrop
  // theme. Endless mode skips it (the climb is meant to be uninterrupted). Boss HP scales with
  // difficulty (D.hpM) and the boss tier (one tier added per BOSS_LEVEL_INTERVAL).
  activeBoss=null;
  if(!isEndlessRun() && level>0 && level%BOSS_LEVEL_INTERVAL===0){
    const bossDef=BOSSES[currentBgTheme]||BOSSES.neon;
    const bossTier=Math.floor(level/BOSS_LEVEL_INTERVAL);
    const bossHp=(bossDef.hp + bossTier*5) * D.hpM;
    const bx=WORLD_W/2 - bossDef.w/2;
    // Spawn mid-air around the top third of the world so the player has to climb to engage.
    const by=Math.max(180, WORLD_H*0.28);
    const boss={
      x:bx, y:by, width:bossDef.w, height:bossDef.h,
      vx:0, vy:0,
      glow:0, rot:0, type:'boss',
      hp:bossHp, maxHp:bossHp,
      frozenT:0, burnT:0, shootTimer:120,
      color:bossDef.color,
      boss:{
        def:bossDef, tier:bossTier,
        phase:1, attackCd:120,
        chargeT:0, chargeDir:1,
      },
    };
    obstacles.push(boss);
    activeBoss=boss;
    // Bosses don't increment the regular enemy count — they're tracked via activeBoss for the
    // HUD and portal-lock logic.
    AU.enemyDie(true); // dramatic intro hit-bass; placeholder until a dedicated bossIntro sfx exists
    if(typeof FT!=='undefined'&&typeof canvas!=='undefined'){
      FT.add(canvas.width/2, 140, '⚠ '+bossDef.name+' ⚠', bossDef.color, 30, true);
    }
  }

  enemiesLeft=cnt;

  // Portal — at the TOP of the vertical world. Locked on HARD/PRO until enemies cleared.
  // If the level spawned with no enemies (rare), unlock immediately so we don't fire a stray
  // "PORTAL UNLOCKED!" splash on frame 1.
  // Endless mode has NO portal: the climb is uninterrupted. Reaching the top transparently
  // regenerates the chunk via endlessAdvanceChunk() and the run ends only on death.
  if(isEndlessRun()){
    portal=null;
    portalLocked=false;
  }else{
    // Lock portal if there are enemies (subject to difficulty's portalFree flag) OR a boss is
    // active. A boss alone with 0 minions still gates the level.
    portalLocked=(!D.portalFree && cnt>0) || !!activeBoss;
    portal={x:WORLD_W/2-35,y:80,width:70,height:110,rot:0,pt:0,locked:portalLocked};
  }

  // Collectibles (orbs) — scattered along the climb so picking them up is part of the route.
  collectibles=[];
  const orbCnt=8+level*2;
  for(let i=0;i<orbCnt;i++){
    const base=climbPlats[(i*5+1)%climbPlats.length]||{x:WORLD_W/2,y:WORLD_H/2,width:0};
    const cx=base.x+20+Math.random()*Math.max(20,base.width-40);
    const cy=base.y-26-Math.random()*30;
    collectibles.push({x:cx,y:cy,r:10,collected:false,pulse:Math.random()*Math.PI*2,
      type:Math.random()<.15?'plasma':Math.random()<.12?'timeammo':(Math.random()<.15?'heal':'score')});
  }

  // Starting ammo: even on PRO (D.ammoBonus=0) give the player a usable base loadout so the
  // limited weapons aren't dead at level start. Skip infinite-ammo guns so the bonus doesn't
  // accidentally clobber Infinity if anything upstream set ammo to a finite number.
  players.forEach(p => {
    const plasGain=Math.max(D.ammoBonus,15);
    const timeGain=Math.max(Math.floor(D.ammoBonus*.67),10);
    if(p.guns[1].maxAmmo!==Infinity) p.guns[1].ammo=Math.min(p.guns[1].maxAmmo,p.guns[1].ammo+plasGain);
    if(p.guns[2].maxAmmo!==Infinity) p.guns[2].ammo=Math.min(p.guns[2].maxAmmo,p.guns[2].ammo+timeGain);
  });
}

// ──────────────────────────────────────────────
// WEAPONS
// ──────────────────────────────────────────────
function switchWeapon(i, pIndex=0){
  const p = players[pIndex];
  if(!p)return;
  p.curGun=i;
  if(pIndex===0){
    ['wp0','wp1','wp2'].forEach((id,j)=>{
      const el=document.getElementById(id);
      if(el) el.className='wp'+(j===i?' active':'');
    });
  } else {
    ['p2wp0','p2wp1','p2wp2'].forEach((id,j)=>{
      const el=document.getElementById(id);
      if(el) el.className='wp'+(j===i?' active':'');
    });
  }
}

function tryShoot(p){
  if(!p)return;
  const gun=p.guns[p.curGun];
  // Rate-of-fire gate. gun.lastShot is reset in initLevel() so a stale value from a previous
  // level / rewind can't lock out the first shot. Adrenaline (CRIMSON skill) cuts the
  // effective rof to 66% so the player fires 50% faster. Flamethrower bypasses the gate so it
  // fires every frame as a true continuous stream.
  if(gun.id!=='flamethrower'){
    const effRof = p.adrenalineT>0 ? Math.max(2, Math.floor(gun.rof*0.66)) : gun.rof;
    if(gTime-gun.lastShot<effRof)return;
  }
  if(gun.ammo!==Infinity&&gun.ammo<=0){
    FT.add(p.x+16,p.y,'NO AMMO!','#ff0055',16);return;
  }
  gun.lastShot=gTime;
  if(gun.ammo!==Infinity)gun.ammo--;

  const px=p.x+p.width/2,py=p.y+p.height/2;
  // Auto-aim: lock onto nearest in-range enemy. Fall back to mouse (P1 only) or facing.
  // In a vertical world, prefer shooting UP (toward the portal) when there's no target.
  const tgt=findAimTarget(px,py);
  let dx,dy;
  if(tgt){dx=tgt.x-px;dy=tgt.y-py;}
  else if(p.keymap.useMouse){dx=(p.mouseX+p.cameraX)-px;dy=(p.mouseY+(p.cameraY||0))-py;}
  else{dx=p.facing*0.3;dy=-1;}
  const d=Math.hypot(dx,dy)||1;
  // dmgBonus comes from the per-character Damage upgrade applied by applyUpgrades().
  // Scoped sniper shots (held ≥30 frames before release) get a 1.5× damage bonus + telegraph.
  const sniperScoped = p.sniperCharged && gun.id==='sniper';
  const bulletDmg = (gun.dmg + (p.dmgBonus||0)) * (sniperScoped ? 1.5 : 1);
  if(sniperScoped){
    FT.add(p.x+16,p.y-12,'SCOPED!','#33ff99',18,true);
    SFX.shake=Math.max(SFX.shake,6);
  }
  // Shotgun knockback: nudge the player backwards along their facing axis for a satisfying kick.
  if(gun.id==='shotgun'){
    p.vx -= (p.facing||1)*2.2;
  }
  // Active skin overrides bullet color and adds an extra particle-trail tag (poison/sparkle/
  // ember/ice). Falls back to the gun's base color when no skin is equipped.
  const skinDef = Inventory.equippedSkinDef(gun.id);
  const bulletColor = (skinDef && skinDef.color) || gun.color;
  const skinTrail = skinDef && skinDef.trail;
  // Multi-pellet (shotgun) — fire `pellets` bullets in a spread cone. Single-shot guns just
  // loop once with no jitter. Each pellet inherits the gun's pierce/freeze/explode/range tags.
  const pellets=gun.pellets|0||1;
  const spread=gun.spread||0;
  const baseAng=Math.atan2(dy,dx);
  for(let i=0;i<pellets;i++){
    const ang = pellets===1 ? baseAng : baseAng + (Math.random()*2-1)*spread;
    const vx=Math.cos(ang)*gun.speed, vy=Math.sin(ang)*gun.speed;
    bullets.push({
      x:px,y:py,vx,vy,
      dmg:bulletDmg, color:bulletColor, sz: gun.sz * (gun.id==='flamethrower' ? 1.6 : 1),
      pierce:gun.pierce, freeze:gun.freeze,
      explode:gun.explode||0, range:gun.range||0, traveled:0,
      life:1, gun:p.curGun, gunId:gun.id, pIndex:p.pid,
      scoped: sniperScoped,
      burn: gun.id==='flamethrower' ? 60 : 0,
      skinTrail,
    });
  }
  // SFX dispatch by id so newly equipped guns still play a sound. Default to pistol's pop.
  if(gun.id==='plasma'||gun.id==='railgun') AU.plasmaShoot();
  else if(gun.id==='timegun') AU.timeShoot();
  else AU.shoot();
}

// Auto-aim filter: only target enemies within MAX_LOCK_DIST. Without this the bullet flies
// toward an enemy 2000px away and dies of old age before hitting anything useful.
const MAX_LOCK_DIST=900;
function findAimTarget(px,py){
  let best=null,bestD=MAX_LOCK_DIST;
  for(const ob of obstacles){
    const cx=ob.x+ob.width/2,cy=ob.y+ob.height/2;
    const dd=Math.hypot(cx-px,cy-py);
    if(dd<bestD){bestD=dd;best={x:cx,y:cy};}
  }
  return best;
}

// ──────────────────────────────────────────────
// SKILLS
// ──────────────────────────────────────────────
// Dispatch a skill use to its effect handler in SKILL_EFFECTS, keyed by `sk.id`.
// Each character's skill array carries the id; the effect table lives near CHARACTERS for
// readability and so new skills are easy to add without touching this function.
function useSkill(i, pIndex=0){
  const p=players[pIndex];
  if(!p)return;
  const sk=p.skills[i];
  if(!sk||sk.cd>0)return;
  const eff=SKILL_EFFECTS[sk.id];
  if(!eff)return;
  sk.cd=sk.maxCd;
  eff(p,sk);
  if(typeof Daily!=='undefined' && Daily.onSkillUse) Daily.onSkillUse();
}

// ──────────────────────────────────────────────
// HISTORY
// ──────────────────────────────────────────────
function saveState(){
  if(history.length>300)history.shift();
  history.push({
    pls:players.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,jl:p.jumpsLeft,trail:p.trail.map(t=>({...t}))})),
    obs:obstacles.map(o=>({...o})),col:collectibles.map(c=>({...c})),
    tp:players.map(p=>p.hp),sc:score,sht:shieldTimer,fzt:freezeTimer,bl:bullets.map(b=>({...b})),
  });
}
function rewindTime(){
  if(rewinds>0&&history.length>30){
    rewinds--;AU.rewind();SFX.fc='rgba(100,200,255,1)';SFX.fa=.3;
    const st=history[Math.max(0,history.length-30)];
    st.pls.forEach((s,i)=>{const p=players[i];if(!p)return;p.x=s.x;p.y=s.y;p.vx=s.vx;p.vy=s.vy;p.jumpsLeft=s.jl;p.trail=s.trail.map(t=>({...t}));});
    obstacles=st.obs.map(o=>({...o}));
    collectibles=st.col.map(c=>({...c})); st.tp.forEach((h,i)=>{if(players[i])players[i].hp=h;}); score=st.sc;
    shieldTimer=st.sht;freezeTimer=st.fzt;bullets=st.bl.map(b=>({...b}));
    history=history.slice(0,Math.max(0,history.length-30));
    if(players[0])FT.add(players[0].x+16,players[0].y,'REWIND','#00aaff',22,true);
    updateHUD();
  }
}

// ──────────────────────────────────────────────
// INPUT
// ──────────────────────────────────────────────
function anyKey(list){if(!list)return false;for(const k of list)if(keys[k])return true;return false;}
function anyCode(list){if(!list)return false;for(const c of list)if(keyCodes[c])return true;return false;}
// Edge-detected helper: returns true once per press for the given key list. Keyed by the joined
// list so each binding has its own held-flag. Used for skill / weapon / char-switch hotkeys.
const _edgeFlags={};
function isKey(list){
  if(!list||!list.length)return false;
  const id=list.join('|');
  const down=anyKey(list);
  if(down){if(_edgeFlags[id])return false;_edgeFlags[id]=true;return true;}
  _edgeFlags[id]=false;return false;
}

function updatePlayerInput(p){
  // Skip input entirely for dead BR players and bots — bots get AI handling in brBotTick,
  // dead players stay frozen until the round ends.
  if(brMode && (p.bot || !p.alive)) return;
  const km=p.keymap;
  // P1 in single-player mode also accepts touch buttons.
  const allowTouch=p.pid===0&&playerCount===1;
  const left=anyKey(km.left)||(allowTouch&&touch.l);
  const right=anyKey(km.right)||(allowTouch&&touch.r);
  const jumpKey=anyKey(km.jump)||(allowTouch&&touch.jp);
  const dashKey=anyKey(km.dashKeys)||anyCode(km.dashCodes)||(allowTouch&&touch.ds);
  const shootKey=anyKey(km.shoot)||(allowTouch&&touch.fi)||p.fireHeld;

  const spd=overdriveTmr>0?p.speed*2:p.speed;
  if(!p.dash.active){
    if(left){p.vx=-spd;p.facing=-1;}
    else if(right){p.vx=spd;p.facing=1;}
    else{p.vx*=.82;if(Math.abs(p.vx)<.2)p.vx=0;}
  }
  if(jumpKey&&!p.jumpHeld&&p.jumpsLeft>0){
    p.vy=-(overdriveTmr>0?p.jump*1.2:p.jump);
    p.jumpsLeft--;p.jumpHeld=true;
    if(p.jumpsLeft===1)AU.jump();else AU.dblJump();
    if(!p.onGround)FT.add(p.x+16,p.y,'DOUBLE!','#a100ff',13);
  }
  if(!jumpKey)p.jumpHeld=false;
  // Dash direction is now 2D. If jump is held, dash upward; else dash in movement direction
  // (or last facing if no movement). This makes vertical traversal much more responsive.
  let ddx=left?-1:right?1:p.facing;
  let ddy=0;
  if(jumpKey){ddy=-1;ddx*=0.4;}
  const dmag=Math.hypot(ddx,ddy)||1;
  ddx/=dmag;ddy/=dmag;
  if(dashKey&&!p.dashHeld){
    if(p.dash.charges>0&&!p.dash.active){
      p.dash.charges--;p.dash.active=true;p.dash.timer=p.dash.dur;
      p.dash.dx=ddx;p.dash.dy=ddy;
      AU.dash();PS.dashBurst(p.x+16,p.y+16,ddx>=0?1:-1);FT.add(p.x+16,p.y,'DASH!','#00f5ff',14);
    }
    p.dashHeld=true;
  }
  if(!dashKey)p.dashHeld=false;
  const curGun=p.guns[p.curGun];
  const isSniper=curGun&&curGun.id==='sniper';
  const isFlame=curGun&&curGun.id==='flamethrower';
  if(shootKey){
    p.fireTimer++;
    if(isSniper){
      // Sniper charges while held; fires on release. Spam-fire fallback at full RoF so DPS-only
      // players aren't forced to release-press for every shot.
      if(p.fireTimer===curGun.rof){
        p.sniperCharged=true;tryShoot(p);p.sniperCharged=false;p.fireTimer=0;
      }
    } else if(isFlame){
      // Flamethrower is a true continuous stream — fire every frame while held. The rate gate
      // inside tryShoot is already bypassed for flame, and ammo is Infinity so it never stops.
      tryShoot(p);
    } else if(p.fireTimer%curGun.rof===1){
      tryShoot(p);
    }
  } else {
    if(isSniper && p.fireTimer>=1){
      p.sniperCharged=p.fireTimer>=30;
      tryShoot(p);
      p.sniperCharged=false;
    }
    p.fireTimer=0;
  }
}

// Co-op move dispatch. Called from handleInput on edge-trigger. Falls through silently for
// characters with no `coop` ability so any player can press G without spam.
function tryCoop(p){
  const ch=CHARACTERS[p.char];
  if(!ch.coop)return;
  if(p.coopCd>0)return;
  const partner=players.find(o=>o!==p);
  if(!partner){FT.add(p.x+16,p.y,'NEED PARTNER!','#ff6600',14,true);return;}
  const dist=Math.hypot((partner.x+partner.width/2)-(p.x+p.width/2),(partner.y+partner.height/2)-(p.y+p.height/2));
  if(dist>ch.coop.range){FT.add(p.x+16,p.y,'TOO FAR!','#ff6600',14,true);return;}
  p.coopCd=ch.coop.cd;
  if(ch.coop.kind==='shield'){
    partner.shieldedBy=Math.max(partner.shieldedBy,ch.coop.dur);
    PS.shieldPulse(partner.x+16,partner.y+16);
    AU.shield();
    FT.add(partner.x+16,partner.y,'SHIELDED!',ch.c1,18,true);
  }else if(ch.coop.kind==='boost'){
    partner.vy=-ch.coop.power;
    partner.jumpsLeft=2;  // give them their double-jumps back so they can chain after the boost
    PS.dashBurst(partner.x+16,partner.y+16,0);
    AU.dblJump();
    FT.add(partner.x+16,partner.y,'BOOSTED!',ch.c1,18,true);
  }
}

function handleInput(){
  // Per-player movement / dash / shoot
  players.forEach(updatePlayerInput);
  // Time shift removed as per request
  timeShift = false;

  players.forEach((p, idx)=>{
    const km=p.keymap;
    if(isKey(km.skill1))useSkill(0, idx);
    if(isKey(km.skill2))useSkill(1, idx);
    if(isKey(km.skill3))useSkill(2, idx);
    if(isKey(km.wpn1))switchWeapon(0, idx);
    if(isKey(km.wpn2))switchWeapon(1, idx);
    if(isKey(km.wpn3))switchWeapon(2, idx);
    if(isKey(km.cycleWeapon))switchWeapon((p.curGun+1)%3, idx);
    if(isKey(km.rewind))rewindTime();
    if(isKey(km.coop))tryCoop(p);
  });

  // Touch rewind for P1 in 1P mode
  if(playerCount===1&&touch.fr&&!keys['_rw']){rewindTime();keys['_rw']=true;}
  if(!touch.fr)keys['_rw']=false;
}

// ──────────────────────────────────────────────
// PHYSICS / COLLISION
// ──────────────────────────────────────────────
function aabb(ax,ay,aw,ah,bx,by,bw,bh){return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;}
function resolvePlat(pl,plat){
  if(plat.disabled)return;
  if(plat.type === 'door' && playerCount === 2 && plat.owner === pl.pid) return; // authorized owner passes thru
  if(!aabb(pl.x,pl.y,pl.width,pl.height,plat.x,plat.y,plat.width,plat.height))return;
  const oL=(pl.x+pl.width)-plat.x,oR=(plat.x+plat.width)-pl.x,oT=(pl.y+pl.height)-plat.y,oB=(plat.y+plat.height)-pl.y;
  const mx=Math.min(oL,oR),my=Math.min(oT,oB);
  if(my<mx){
    if(oT<oB){
      pl.y=plat.y-pl.height;
      if(pl.vy>0){pl.vy=0;pl.onGround=true;pl.jumpsLeft=2;}
      // Crumbling platforms start their collapse countdown the first time a player lands on them.
      if(plat.type==='crumble'&&plat.crumbleT===0&&!plat.disabled){plat.crumbleT=45;}
    }else{pl.y=plat.y+plat.height;if(pl.vy<0)pl.vy=0;}
  }
  else{if(oL<oR)pl.x=plat.x-pl.width;else pl.x=plat.x+plat.width;pl.vx=0;}
}

function killEnemy(obs,idx){
  // BOSS KILL — dedicated reward + cleanup path. Bosses don't decrement enemiesLeft (they
  // weren't counted in the spawn loop) but their death must still unlock the portal.
  if(obs.type==='boss'){
    const def=obs.boss&&obs.boss.def;
    const cx=obs.x+obs.width/2, cy=obs.y+obs.height/2;
    // Massive death VFX — multi-burst of particles, screen shake, flash, sfx.
    for(let i=0;i<3;i++){
      PS.enemyDie(cx + (Math.random()-0.5)*60, cy + (Math.random()-0.5)*60, def?def.color:'#ff0055');
      PS.orbBurst(cx + (Math.random()-0.5)*40, cy + (Math.random()-0.5)*40);
    }
    PS.portalVortex(cx, cy);
    AU.enemyDie(true); AU.levelOK();
    SFX.shake=24; SFX.clear();
    // Score + coin reward.
    const bossPts=Combo.score(2000);
    score+=bossPts;
    const bossCoins=500 + (obs.boss?obs.boss.tier:0)*100;
    Upgrades.addCoins(bossCoins);
    FT.add(cx, cy-40, '★ BOSS DOWN ★', def?def.color:'#ffcc00', 32, true);
    FT.add(cx, cy-12, '+'+bossPts, '#ffcc00', 26, true);
    FT.add(cx, cy+18, '+'+bossCoins+'🪙', '#ffd700', 22, true);
    // Drop a heal + ammo to soften the next push.
    collectibles.push({x:cx-20, y:cy, r:10, collected:false, pulse:0, type:'heal'});
    collectibles.push({x:cx+20, y:cy, r:10, collected:false, pulse:0, type:'plasma'});
    obstacles.splice(idx,1);
    activeBoss=null;
    // Notify daily missions that a boss fell — completes any "defeat boss" mission.
    if(typeof Daily!=='undefined' && Daily.onBossKill) Daily.onBossKill(def);
    // Guaranteed loot box from every boss kill.
    if(typeof LootBox!=='undefined') LootBox.add(1, 'BOSS');
    // Cloud: bump bossesDown counter (debounced).
    if(typeof Cloud!=='undefined' && Cloud.isSignedIn()){
      const cur=(Cloud.profile&&Cloud.profile.bossesDown)|0;
      Cloud.syncStats({bossesDown:cur+1});
    }
    Achievements.check();
    // Boss death always unlocks the portal regardless of enemiesLeft count.
    if(portal && portal.locked){
      portal.locked=false;
      const p0=players[0];
      const tx=p0?p0.x+16:WORLD_W/2, ty=p0?p0.y-30:WORLD_H/2;
      FT.add(tx,ty,'PORTAL UNLOCKED!','#00f5ff',32,true);
    }
    return;
  }
  const big=obs.type==='tank';
  PS.enemyDie(obs.x+obs.width/2,obs.y+obs.height/2,obs.color);
  AU.enemyDie(big);
  const pts=Combo.score(big?400:obs.type==='chaser'?250:150);
  score+=pts;levelKills++;totalKills++;
  enemiesLeft=Math.max(0,enemiesLeft-1);
  FT.add(obs.x+obs.width/2,obs.y,'+'+ pts,big?'#ffcc00':obs.type==='chaser'?'#ff8800':'#ff0055',big?28:22,big);
  const m=Combo.add();if(m>1){FT.add(obs.x+obs.width/2,obs.y-30,'x'+m+' COMBO!','#ff6600',18,true);AU.combo(m);}
  // Coins: tanks > chasers > basics, with a small per-level kicker.
  const coinReward=(big?25:obs.type==='chaser'?15:10)+level*2;
  Upgrades.addCoins(coinReward);
  FT.add(obs.x+obs.width/2,obs.y+14,'+'+coinReward+'🪙','#ffd700',16,true);
  obstacles.splice(idx,1);
  SFX.good();
  Achievements.check();
  // Notify daily missions of the kill so per-type counters can tick.
  if(typeof Daily!=='undefined' && Daily.onKill) Daily.onKill(obs.type);
  // Drop ammo and heals
  if(Math.random()<.45){
    const tp=Math.random()<.4?'plasma':Math.random()<.5?'timeammo':'heal';
    collectibles.push({x:obs.x+obs.width/2,y:obs.y,r:10,collected:false,pulse:0,type:tp});
  }
  // Portal unlocks when all regular enemies are killed AND the boss (if any) is down.
  // Skipped in endless mode where there is no portal.
  if(portal&&portal.locked&&enemiesLeft===0&&!activeBoss){
    portal.locked=false;
    const p0=players[0];
    const tx=p0?p0.x+16:WORLD_W/2, ty=p0?p0.y-30:WORLD_H/2;
    SFX.clear();FT.add(tx,ty,'PORTAL UNLOCKED!','#00f5ff',32,true);
  }
}

function updatePhysics(){
  gTime++;
  const D=DIFFS[diffIdx];
  const ts=timeShift?.28:1.0;
  const grav=.50;

  // Vertical climb: split-screen splits HORIZONTALLY (top half = P1, bottom half = P2) so
  // each player gets a tall slice of the world. Online 2P still uses a full viewport per peer.
  const isSplit=(playerCount===2&&!Net.role);
  const viewH=isSplit?canvas.height/2:canvas.height;
  players.forEach(p=>{
    if(p.dash.active){p.vx=p.dash.dx*p.dash.spd;p.vy=p.dash.dy*p.dash.spd;}
    if(!p.dash.active)p.vy+=grav*ts;
    p.x+=p.vx*ts;p.y+=p.vy*ts;
    // dash timer/refresh
    if(p.dash.active){p.dash.timer--;if(p.dash.timer<=0)p.dash.active=false;}
    if(!p.dash.active&&p.dash.charges<p.dash.maxCh){p.dash.cd++;if(p.dash.cd>=p.dash.maxCd){p.dash.cd=0;p.dash.charges=Math.min(p.dash.maxCh,p.dash.charges+1);}}

    p.trail.push({x:p.x,y:p.y,a:1,dash:p.dash.active});
    if(p.trail.length>14)p.trail.shift();
    p.trail.forEach(t=>{t.a-=p.dash.active?.06:.08;});

    if(overdriveTmr>0)PS.overdriveAura(p.x+16,p.y+16);

    p.wasOnGround=p.onGround;p.onGround=false;
    platforms.forEach(plat=>resolvePlat(p,plat));
    if(p.onGround&&!p.wasOnGround)PS.landDust(p.x+p.width/2,p.y+p.height);
    // LIFTER's Stomp: fire the AoE on the landing frame, then clear the flag.
    if(p.onGround&&!p.wasOnGround&&p.stompPending){
      const cx=p.x+16,cy=p.y+16;
      for(let i=obstacles.length-1;i>=0;i--){
        const ob=obstacles[i];
        if(playerCount === 2 && ob.owner !== undefined && ob.owner !== p.pid) continue;
        const d=Math.hypot((ob.x+ob.width/2)-cx,(ob.y+ob.height/2)-cy);
        if(d<=200){
          ob.hp-=3;
          const kx=(ob.x+ob.width/2)-cx,ky=(ob.y+ob.height/2)-cy,kd=Math.hypot(kx,ky)||1;
          ob.vx+=(kx/kd)*8;ob.vy+=(ky/kd)*4-3;
          if(ob.hp<=0)killEnemy(ob,i);
          else PS.bulletHit(ob.x+ob.width/2,ob.y+ob.height/2,'#ff5500');
        }
      }
      PS.landDust(cx,cy+12);AU.hit();
      FT.add(p.x+16,p.y+24,'STOMP!','#ff5500',22,true);
      p.stompPending=false;
    }
    if(p.x<0){p.x=0;p.vx=0;}
    if(p.x+p.width>WORLD_W){p.x=WORLD_W-p.width;p.vx=0;}
    // Falling past the bottom of the world is handled by the lava trap (Foundry map) or by
    // a respawn — no flat -18 anymore. On maps without lava, we clamp + respawn so the player
    // can never just disappear.
    if(p.y>WORLD_H+40){
      SFX.hit();AU.hit();p.hp-=18;
      p.x=WORLD_W/2-16;p.y=WORLD_H-220;p.vy=0;p.vx=0;p.jumpsLeft=2;
      FT.add(p.x+16,p.y,'-18 FALL!','#ff0055',20,true);
    }

    if(p.invincTimer>0)p.invincTimer--;
    if(p.shieldedBy>0)p.shieldedBy--;
    if(p.coopCd>0)p.coopCd--;
    // Per-character skill timers
    if(p.flameTrailT>0)p.flameTrailT--;
    if(p.adrenalineT>0)p.adrenalineT--;
    if(p.phaseT>0)p.phaseT--;
    if(p.reflectT>0)p.reflectT--;

    // Per-player camera (vertical). Clamp so we don't scroll past the top or bottom of the world.
    const tcy=Math.max(0,Math.min(WORLD_H-viewH,p.y+p.height/2-viewH/2));
    p.cameraY+=(tcy-p.cameraY)*0.14;
    p.cameraX=0;
  });

  if(overdriveTmr>0)overdriveTmr--;
  if(shieldTimer>0)shieldTimer--;
  if(freezeTimer>0)freezeTimer--;

  // Skills cooldown. Adrenaline halves dash recharge time while it's active.
  players.forEach(p => {
    p.skills.forEach(sk=>{if(sk.cd>0)sk.cd--;});
    if(p.adrenalineT>0 && !p.dash.active && p.dash.charges<p.dash.maxCh){
      // Extra dash recharge tick — net 2× recharge speed (the base loop also tick'd it once).
      p.dash.cd++;
      if(p.dash.cd>=p.dash.maxCd){p.dash.cd=0;p.dash.charges=Math.min(p.dash.maxCh,p.dash.charges+1);}
    }
  });

  // Snares (Emerald) — enemies inside the zone lose horizontal momentum and can't move down.
  snares=snares.filter(s=>{
    s.t--;
    if(s.t<=0)return false;
    obstacles.forEach(ob=>{
      if(aabb(ob.x,ob.y,ob.width,ob.height,s.x,s.y,s.w,s.h)){
        ob.vx*=0.3;
        if(ob.vy>0)ob.vy=Math.min(ob.vy,0);
      }
    });
    return true;
  });

  // Singularities (VOID) — enemies within 300px get pulled toward the anchor each frame.
  singularities=singularities.filter(sg=>{
    sg.t--;
    if(sg.t<=0)return false;
    obstacles.forEach(ob=>{
      const dx=sg.x-(ob.x+ob.width/2), dy=sg.y-(ob.y+ob.height/2);
      const d=Math.hypot(dx,dy)||1;
      if(d<=300){
        ob.vx+=(dx/d)*0.45;
        ob.vy+=(dy/d)*0.45;
      }
    });
    return true;
  });

  // Flame trail (Crimson) — damage any enemy overlapping the player's recent path.
  players.forEach(p=>{
    if(p.flameTrailT<=0)return;
    const trailRect={x:p.x-2,y:p.y-2,w:p.width+4,h:p.height+4};
    for(let i=obstacles.length-1;i>=0;i--){
      const ob=obstacles[i];
      if(playerCount === 2 && ob.owner !== undefined && ob.owner !== p.pid) continue;
      if(aabb(ob.x,ob.y,ob.width,ob.height,trailRect.x,trailRect.y,trailRect.w,trailRect.h)){
        ob.hp-=0.5;  // 0.5 dmg/frame = ~30 dmg over the 4s duration if continuous contact
        if(ob.hp<=0)killEnemy(ob,i);
      }
    }
  });

  // Platforms: tick crumble timers and respawns.
  platforms.forEach(plat=>{
    if(plat.type!=='crumble')return;
    if(plat.crumbleT>0){
      plat.crumbleT--;
      if(plat.crumbleT===0&&!plat.disabled){
        plat.disabled=true;plat.crumbleRespawn=240;
        PS.landDust(plat.x+plat.width/2,plat.y+plat.height/2);
      }
    }
    if(plat.disabled&&plat.crumbleRespawn>0){
      plat.crumbleRespawn--;
      if(plat.crumbleRespawn===0){plat.disabled=false;plat.crumbleT=0;}
    }
  });

  // Saws advance their path; spikes/lava are static.
  traps.forEach(t=>{
    if(t.type!=='saw')return;
    const range=(t.p2-t.p1);
    t.t+=t.spd*ts*t.dir/Math.max(1,range);
    if(t.t>1){t.t=1;t.dir=-1;}
    if(t.t<0){t.t=0;t.dir=1;}
    if(t.pathAxis==='x')t.x=t.p1+range*t.t;
    else t.y=t.p1+range*t.t;
    t.rot=(t.rot||0)+0.25;
  });

  // Trap → player collisions. Shielded/dashing/invincible players take no damage.
  traps.forEach(t=>{
    players.forEach(pl=>{
      if(brMode && !pl.alive) return;
      if(pl.invincTimer>0||shieldTimer>0||overdriveTmr>0||pl.shieldedBy>0)return;
      if(!aabb(pl.x,pl.y,pl.width,pl.height,t.x,t.y,t.w,t.h))return;
      if(t.type==='lava'){
        pl.hp=0;FT.add(pl.x+16,pl.y,'KILLED BY LAVA!','#ff5500',22,true);
        SFX.hit(true);AU.hit();PS.hitBlast(pl.x+16,pl.y+16,true);
      }else if(t.type==='spike'){
        pl.hp-=15*D.drainM;pl.invincTimer=32;
        FT.add(pl.x+16,pl.y,'−15 SPIKE!','#ff0055',18,true);
        SFX.hit(true);AU.hit();PS.hitBlast(pl.x+16,pl.y+16,false);
        // Pop the player up off the spikes so they don't keep retaking damage.
        pl.vy=-8;pl.y-=4;
        Combo.reset();
      }else if(t.type==='saw'){
        pl.hp-=20*D.drainM;pl.invincTimer=36;
        const kx=(pl.x+pl.width/2)-(t.x+t.w/2),ky=(pl.y+pl.height/2)-(t.y+t.h/2);
        const kd=Math.hypot(kx,ky)||1;
        pl.vx+=(kx/kd)*9;pl.vy+=(ky/kd)*6-3;
        FT.add(pl.x+16,pl.y,'−20 SAW!','#ff5555',20,true);
        SFX.hit(true);AU.hit();PS.hitBlast(pl.x+16,pl.y+16,true);
        Combo.reset();
      }
    });
  });

  const fts=freezeTimer>0?0:ts;

  // BULLETS (player). Lifespan decay reduced (.012 → .008) so bullets reach distant enemies
  // on the tall vertical world. World bounds use WORLD_H now, not canvas.height.
  bullets=bullets.filter(b=>{
    b.x+=b.vx;b.y+=b.vy;
    
    if(b.gunId==='rocket'){
      b.vx*=1.03;b.vy*=1.03;
      PS.exhaust(b.x-b.vx*0.5,b.y-b.vy*0.5);
      PS.emit(b.x-b.vx*0.6, b.y-b.vy*0.6, 2, {speed:0.8, color:['#ff8800','#ff3300','#999'], size:3.5, decay:0.05, grav:-0.04, glow:true});
    } else if(b.gunId==='flamethrower'){
      // Flame stream: balloon size, heavy jitter, heat-rise drift, sparse-but-bright particle trail.
      // Trail emit cut to 1/frame since we now spawn 3 pellet-bullets per frame; net density is up.
      b.sz+=0.28;
      b.vx+=(Math.random()-0.5)*2.2;
      b.vy+=(Math.random()-0.5)*1.6 - 0.18; // upward drift = rising heat
      b.life-=0.012; // burns out quicker than a normal bullet
      PS.emit(b.x, b.y, 1, {speed:1.4, spread:Math.PI, color:['#ffcc00','#ff6600','#ff2200','#661100'], size:5, decay:0.05, glow:true, grav:-0.06});
    } else if(b.gunId==='sniper'){
      // Bright tracer line + extra-thick trail for scoped shots.
      const tSz = b.scoped ? 2.4 : 1.2;
      PS.emit(b.x,b.y,b.scoped?3:1,{speed:0,color:['#33ff99','#aaffcc','#fff'],size:tSz,decay:0.035,glow:true});
    } else if(b.gunId==='railgun'){
      PS.emit(b.x,b.y,2,{speed:0,color:['#88e0ff','#fff'],size:2,decay:0.08,glow:true});
    } else if(b.gunId==='plasma'){
      PS.emit(b.x,b.y,1,{speed:0.6,spread:Math.PI*2,color:['#00f5ff','#aaffff'],size:2.2,decay:0.08,glow:true});
    } else if(b.gunId==='timegun'){
      // Snowflake trail — small frozen specks drifting in the bullet's wake.
      PS.emit(b.x-b.vx*0.3, b.y-b.vy*0.3, 1, {speed:0.8, spread:Math.PI*2, color:['#cceeff','#88aaff','#fff'], size:2.5, decay:0.06, glow:true, grav:0.04});
    }
    // Skin overlay trail — extra particles on top of the gun's base trail to make skins distinct.
    if(b.skinTrail){
      const t=b.skinTrail;
      if(t==='poison'){
        PS.emit(b.x, b.y, 1, {speed:0.6, spread:Math.PI*2, color:['#88ff00','#00ff88','#aaff44'], size:2.5, decay:0.05, glow:true, grav:0.06});
      } else if(t==='sparkle'){
        PS.emit(b.x, b.y, 1, {speed:1.2, spread:Math.PI*2, color:['#ffffff','#ffeecc','#ccffff'], size:2.2, decay:0.06, glow:true});
      } else if(t==='ember'){
        PS.emit(b.x, b.y, 1, {speed:0.9, spread:Math.PI, color:['#ff8800','#ff3300','#ffcc00'], size:3, decay:0.05, glow:true, grav:-0.04});
      } else if(t==='ice'){
        PS.emit(b.x, b.y, 1, {speed:0.5, spread:Math.PI*2, color:['#aaffff','#88aaff','#fff'], size:2.4, decay:0.05, glow:true, grav:0.03});
      }
    }

    b.life-=.008;
    // Short-range guns (flamethrower) self-destruct after `range` world-units of travel.
    if(b.range){
      b.traveled=(b.traveled||0)+Math.hypot(b.vx,b.vy);
      if(b.traveled>=b.range)return false;
    }
    if(b.x<0||b.x>WORLD_W||b.y<0||b.y>WORLD_H||b.life<=0)return false;
    let hit=false;
    for(let i=obstacles.length-1;i>=0;i--){
      const ob=obstacles[i];
      if(playerCount === 2 && ob.owner !== undefined && ob.owner !== b.pIndex) continue;
      if(aabb(b.x-b.sz,b.y-b.sz,b.sz*2,b.sz*2,ob.x,ob.y,ob.width,ob.height)){
        ob.hp-=b.dmg;
        PS.bulletHit(b.x,b.y,b.color);
        // Bug fix: re-freezing a frozen enemy used to be a no-op. Refresh the timer instead.
        if(b.freeze){ob.frozenT=Math.max(ob.frozenT,180);FT.add(ob.x+ob.width/2,ob.y,'FROZEN!','#66aaff',14);}
        // Flamethrower DOT — stamp a burn timer on the enemy; obstacle update drains HP per frame.
        if(b.burn){ob.burnT=Math.max(ob.burnT||0, b.burn);}
        // Rocket / AOE: damage every other obstacle within `explode` radius of impact point.
        // Damage-only here; we splice killed obstacles in a single sweep below to avoid
        // shifting indices mid-loop.
        if(b.explode){
          const ex=b.x, ey=b.y, R=b.explode;
          PS.orbBurst(ex,ey);
          PS.bulletHit(ex,ey,b.color);
          for(let j=0;j<obstacles.length;j++){
            if(j===i)continue;
            const o2=obstacles[j];
            const cx=o2.x+o2.width/2, cy=o2.y+o2.height/2;
            if(Math.hypot(cx-ex,cy-ey)<=R) o2.hp-=b.dmg*0.6;
          }
        }
        if(ob.hp<=0)killEnemy(ob,i);
        else{SFX.fa=.05;SFX.fc='rgba(255,150,0,1)';}
        // Sweep any obstacles brought to 0 HP by the AOE. Walk back-to-front so splices in
        // killEnemy don't disturb the iteration.
        if(b.explode){
          for(let j=obstacles.length-1;j>=0;j--){
            if(obstacles[j].hp<=0) killEnemy(obstacles[j], j);
          }
        }
        if(!b.pierce){hit=true;break;}
      }
    }
    return !hit;
  });

  // ENEMY BULLETS — enemies aim at the closest player
  if(D.enemyShoot){
    obstacles.forEach(ob=>{
      ob.shootTimer--;
      if(ob.shootTimer<=0){
        ob.shootTimer=180+Math.random()*120;
        let target=players[0],bestD=Infinity;
        if(playerCount === 2 && ob.owner !== undefined && players[ob.owner]) {
          target = players[ob.owner];
        } else {
          players.forEach(pl=>{const dd=Math.hypot((pl.x+16)-(ob.x+ob.width/2),(pl.y+16)-(ob.y+ob.height/2));if(dd<bestD){bestD=dd;target=pl;}});
        }
        const dx=(target.x+16)-(ob.x+ob.width/2),dy=(target.y+16)-(ob.y+ob.height/2),d=Math.hypot(dx,dy)||1;
        enemyBullets.push({x:ob.x+ob.width/2,y:ob.y+ob.height/2,vx:dx/d*5,vy:dy/d*5,life:1, owner: ob.owner});
      }
    });
  }
  enemyBullets=enemyBullets.filter(b=>{
    b.x+=b.vx;b.y+=b.vy;b.life-=.005;
    if(b.x<0||b.x>WORLD_W||b.y<0||b.y>WORLD_H||b.life<=0)return false;
    // AEGIS Reflect Wave: if any player has reflectT>0 and the bullet overlaps them, convert
    // it into a friendly bullet aimed back the way it came.
    for(const pl of players){
      if (playerCount === 2 && b.owner !== undefined && b.owner !== pl.pid) continue;
      if(pl.reflectT>0 && aabb(b.x-5,b.y-5,10,10,pl.x,pl.y,pl.width,pl.height)){
        const ch=CHARACTERS[pl.char];
        bullets.push({x:b.x,y:b.y,vx:-b.vx*1.2,vy:-b.vy*1.2,dmg:2,color:ch.c1,sz:5,pierce:false,freeze:false,life:1,gun:0,pIndex:pl.pid});
        PS.bulletHit(b.x,b.y,ch.c1);
        return false;
      }
    }
    // Check hit against any player. Per-player shieldedBy (from co-op AEGIS) also blocks.
    for(const pl of players){
      if (playerCount === 2 && b.owner !== undefined && b.owner !== pl.pid) continue;
      if(pl.invincTimer>0||shieldTimer>0||overdriveTmr>0||pl.shieldedBy>0)continue;
      if(aabb(b.x-5,b.y-5,10,10,pl.x,pl.y,pl.width,pl.height)){
        pl.hp-=6;pl.invincTimer=30;SFX.hit(false);AU.hit();PS.hitBlast(pl.x+16,pl.y+16,false);FT.add(pl.x+16,pl.y,'−6','#ff0055',20,true);Combo.reset();return false;
      }
    }
    return true;
  });

  // OBSTACLES movement + multi-player collision
  obstacles.forEach((obs,i)=>{
    // Flamethrower DOT: tick down burnT and drain HP per frame while it's positive.
    if(obs.burnT>0){
      obs.burnT--;
      obs.hp-=0.06;
      if(Math.random()<0.35){
        PS.emit(obs.x+Math.random()*obs.width, obs.y+Math.random()*obs.height, 1,
          {speed:1.5, angle:-Math.PI/2, spread:0.6, color:['#ff8800','#ff4400','#ffcc00'], size:3, decay:0.04, glow:true, grav:-0.05});
      }
      if(obs.hp<=0){killEnemy(obs,i);return;}
    }
    if(obs.frozenT>0){obs.frozenT--;return;}
    // BOSS update — homing flight + state-machine attack pattern. Phase escalates at 66% / 33%
    // HP. Bosses ignore the standard wall-bounce / random-walk physics below.
    if(obs.type==='boss' && obs.boss){
      const b=obs.boss, def=b.def;
      // Phase transition.
      const pct=obs.hp/obs.maxHp;
      const newPhase = pct<=0.34 ? 3 : pct<=0.67 ? 2 : 1;
      if(newPhase!==b.phase){
        b.phase=newPhase;
        FT.add(obs.x+obs.width/2, obs.y, 'PHASE '+newPhase, def.color, 22, true);
        SFX.shake=Math.max(SFX.shake, 10);
      }
      // Movement: homing toward nearest player. Foundry behemoth charges horizontally.
      let homeTarget=null, bestD=Infinity;
      players.forEach(pl=>{const dd=Math.hypot((pl.x+16)-(obs.x+obs.width/2),(pl.y+16)-(obs.y+obs.height/2));if(dd<bestD){bestD=dd;homeTarget=pl;}});
      if(homeTarget){
        if(def.pattern==='charge'){
          // Charge: slide horizontally toward player at high speed, leave lava-ember trail.
          const tx=(homeTarget.x+16)-(obs.x+obs.width/2);
          obs.vx += Math.sign(tx) * 0.18 * def.speedMul;
          obs.vy += ((homeTarget.y-obs.y)*0.0025);
          if(Math.random()<0.6){
            PS.emit(obs.x+Math.random()*obs.width, obs.y+obs.height, 1,
              {speed:1.4, angle:Math.PI/2, spread:1, color:['#ff8800','#ff3300','#660000'], size:5, decay:0.04, glow:true, grav:-0.05});
          }
        } else {
          // Default: drift slowly toward the player.
          const dx=(homeTarget.x+16)-(obs.x+obs.width/2), dy=(homeTarget.y+16)-(obs.y+obs.height/2);
          const dd=Math.hypot(dx,dy)||1;
          obs.vx += (dx/dd) * 0.10 * def.speedMul;
          obs.vy += (dy/dd) * 0.08 * def.speedMul;
        }
      }
      // Damping + speed cap.
      obs.vx *= 0.92; obs.vy *= 0.92;
      const cap=6*def.speedMul;
      obs.vx=Math.max(-cap, Math.min(cap, obs.vx));
      obs.vy=Math.max(-cap, Math.min(cap, obs.vy));
      obs.x+=obs.vx*fts; obs.y+=obs.vy*fts;
      // Soft world bounds — bosses bounce off so they don't fly off the map.
      if(obs.x<20){obs.x=20; obs.vx*=-0.6;}
      if(obs.x+obs.width>WORLD_W-20){obs.x=WORLD_W-20-obs.width; obs.vx*=-0.6;}
      if(obs.y<100){obs.y=100; obs.vy*=-0.6;}
      if(obs.y+obs.height>WORLD_H-80){obs.y=WORLD_H-80-obs.height; obs.vy*=-0.6;}
      obs.glow=(obs.glow+.12)%(Math.PI*2);

      // Attack cooldown — fires depend on phase. Phase 1: single shot. Phase 2: triple volley.
      // Phase 3: triple volley + faster cadence.
      const baseCd = def.pattern==='charge' ? 110 : 90;
      const cd = b.phase===1 ? baseCd : b.phase===2 ? Math.floor(baseCd*0.75) : Math.floor(baseCd*0.55);
      b.attackCd--;
      if(b.attackCd<=0 && homeTarget){
        b.attackCd=cd;
        const shots = b.phase===1 ? 1 : 3;
        const spread = 0.3;
        const baseAng = Math.atan2((homeTarget.y+16)-(obs.y+obs.height/2), (homeTarget.x+16)-(obs.x+obs.width/2));
        for(let s=0;s<shots;s++){
          const off = shots===1 ? 0 : (s-1)*spread;
          const ang = baseAng + off;
          enemyBullets.push({
            x:obs.x+obs.width/2, y:obs.y+obs.height/2,
            vx:Math.cos(ang)*6, vy:Math.sin(ang)*6,
            life:1.4, owner: undefined, fromBoss:true, color:def.color,
          });
        }
        PS.emit(obs.x+obs.width/2, obs.y+obs.height/2, 12, {speed:3.5, color:[def.color,'#fff'], size:5, decay:0.05, glow:true});
        AU.plasmaShoot();
      }

      // Touch damage on any player (heavier than regular enemies).
      players.forEach(pl=>{
        if(pl.invincTimer>0||shieldTimer>0||overdriveTmr>0||pl.shieldedBy>0)return;
        if(aabb(pl.x,pl.y,pl.width,pl.height,obs.x,obs.y,obs.width,obs.height)){
          pl.hp-=6*D.drainM;
          pl.invincTimer=30;
          SFX.hit(true); AU.hit(); PS.hitBlast(pl.x+16,pl.y+16,true);
          FT.add(pl.x+16, pl.y, '-6 BOSS!', '#ff0055', 24, true);
          Combo.reset();
        }
      });
      return; // skip the regular enemy AI path below
    }
    
    // Chase target
    let target = null;
    if(playerCount === 2 && obs.owner !== undefined && players[obs.owner]) {
      target = players[obs.owner];
    } else {
      let bestD = Infinity;
      players.forEach(pl => {
        const dd = Math.hypot(pl.x - obs.x, pl.y - obs.y);
        if(dd < bestD) { bestD = dd; target = pl; }
      });
    }
    
    if(target) {
      const dx=target.x-obs.x, dy=target.y-obs.y, d=Math.hypot(dx,dy)||1;
      obs.vx += (dx/d)*.07*ts;
      obs.vy += (dy/d)*.05*ts;
    }
    obs.vx=Math.max(-7,Math.min(7,obs.vx));obs.vy=Math.max(-6,Math.min(6,obs.vy));
    
    if(obs.type==='spinner')obs.rot+=(fts*.09);
    obs.x+=obs.vx*fts;obs.y+=obs.vy*fts;
    obs.glow=(obs.glow+.07)%(Math.PI*2);
    if(obs.x<0||obs.x+obs.width>WORLD_W)obs.vx*=-1;
    if(obs.y<40||obs.y+obs.height>WORLD_H-40)obs.vy*=-1;
    // Touch damage on any player. Per-player shieldedBy (from co-op AEGIS) also blocks.
    players.forEach(pl=>{
      if(playerCount === 2 && obs.owner !== undefined && obs.owner !== pl.pid) return; // matched color only
      if(pl.invincTimer>0||shieldTimer>0||overdriveTmr>0||pl.shieldedBy>0)return;
      if(aabb(pl.x,pl.y,pl.width,pl.height,obs.x,obs.y,obs.width,obs.height)){
        const big=obs.type==='tank';
        pl.hp-=(big?3.5:2)*D.drainM;
        pl.invincTimer=24;SFX.hit(big);AU.hit();
        PS.hitBlast(pl.x+16,pl.y+16,big);
        FT.add(pl.x+16,pl.y,big?'−4':'−2','#ff0055',big?26:20,big);
        Combo.reset();
      }
    });
  });

  // COLLECTIBLES — any player can pick up
  collectibles.forEach(col=>{
    if(col.collected)return;
    col.pulse=(col.pulse+.07)%(Math.PI*2);
    let picker=null;
    for(const pl of players){
      if(Math.hypot(pl.x+16-col.x,pl.y+16-col.y)<pl.width/2+col.r+4){picker=pl;break;}
    }
    if(picker){
      col.collected=true;PS.orbBurst(col.x,col.y);AU.collect();
      if(col.type==='plasma'){picker.guns[1].ammo=Math.min(picker.guns[1].maxAmmo,picker.guns[1].ammo+10);FT.add(col.x,col.y,'PLASMA +10','#00f5ff',16);}
      else if(col.type==='timeammo'){picker.guns[2].ammo=Math.min(picker.guns[2].maxAmmo,picker.guns[2].ammo+8);FT.add(col.x,col.y,'TIME +8','#a100ff',16);}
      else if(col.type==='heal'){picker.hp=Math.min(picker.maxHp,picker.hp+25);FT.add(col.x,col.y,'HEAL +25','#ff00d4',16);}
      else{
        const m=Combo.add(),pts=Combo.score(100);score+=pts;
        Upgrades.addCoins(5);
        FT.add(col.x,col.y,'+'+pts,m>2?'#ffcc00':m>1?'#a100ff':'#00f5ff',m>2?26:20,m>2);
        if(m>1){FT.add(col.x,col.y-28,'x'+m+' COMBO!','#ff6600',18,true);AU.combo(m);}
        SFX.good();
      }
    }
  });

  if(portal){
    // Portal — any player reaching it triggers level complete (non-endless modes only).
    portal.rot+=.025;portal.pt=(portal.pt+.05)%(Math.PI*2);
    if(!portal.locked){
      for(const pl of players){
        if(aabb(pl.x,pl.y,pl.width,pl.height,portal.x,portal.y,portal.width,portal.height)){triggerLevelComplete();return;}
      }
    }
  }else if(isEndlessRun()){
    // Endless: top of world = next chunk, no portal, no level break.
    for(const pl of players){
      if(pl.y<120){endlessAdvanceChunk();return;}
    }
  }

  // Time shift drain removed
  // Health doesn't regen anymore automatically, handled by collectibles.
  if(players.length === 1) {
    if(players[0].hp<=0){triggerGameOver();return;}
    if((players[0].hp/players[0].maxHp)<0.2&&gTime%22===0){FT.add(players[0].x+16,players[0].y-30,'⚠ CRITICAL!','#ff0055',18,true);}
  } else {
    // 2 player
    if(players.some(p => p.hp <= 0)){triggerGameOver();return;}
    players.forEach(p => {
      if((p.hp/p.maxHp)<0.2&&gTime%22===0){FT.add(p.x,p.y-40,'⚠ CRITICAL!','#ff0055',14,true);}
    });
  }

  PS.update(ts);FT.update();Combo.update();
  if(typeof QuickChat!=='undefined') QuickChat.update();
  saveState();updateHUD();
}

// ──────────────────────────────────────────────
// RENDER
// ──────────────────────────────────────────────
function render(){
  const off=SFX.getOff();
  ctx.save();ctx.translate(off.x,off.y);
  ctx.fillStyle='#080818';ctx.fillRect(0,0,canvas.width,canvas.height);

  if(timeShift){
    ctx.fillStyle='rgba(161,0,255,.06)';ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<canvas.height;y+=5){ctx.fillStyle='rgba(0,0,0,.05)';ctx.fillRect(0,y,canvas.width,2);}
  }
  if(overdriveTmr>0){ctx.fillStyle='rgba(255,200,0,.04)';ctx.fillRect(0,0,canvas.width,canvas.height);}

  // Render viewport(s). 1P: full canvas. Local 2P: split horizontally (top=P1, bottom=P2).
  // Online 2P: full canvas centred on the local player. Vertical world → camera Y, not X.
  const isSplit=(playerCount===2&&!Net.role);
  if(Net.role){
    const localIdx=Net.role==='host'?0:1;
    const p=players[localIdx];
    if(p){
      // Make sure guest's camera tracks its own avatar even though physics is skipped.
      if(Net.role==='guest'){
        const tcy=Math.max(0,Math.min(WORLD_H-canvas.height,p.y+p.height/2-canvas.height/2));
        p.cameraY+=(tcy-p.cameraY)*.14;
      }
      ctx.save();ctx.translate(0,-p.cameraY);drawWorld(p);ctx.restore();
      // Tag for the local player at the top
      ctx.save();ctx.font='bold 12px Segoe UI';
      const ch=CHARACTERS[p.char];
      ctx.fillStyle=ch.c1;ctx.shadowColor=ch.glow;ctx.shadowBlur=8;
      ctx.fillText((Net.role==='host'?'YOU (HOST) · ':'YOU (GUEST) · ')+ch.name,12,20);
      ctx.restore();
    }
  }else{
    const viewH=isSplit?canvas.height/2:canvas.height;
    players.forEach((p,idx)=>{
      const vy=idx*viewH;
      ctx.save();
      ctx.beginPath();ctx.rect(0,vy,canvas.width,viewH);ctx.clip();
      ctx.translate(0,vy-p.cameraY);
      drawWorld(p);
      ctx.restore();
    });
    if(isSplit){
      ctx.save();ctx.fillStyle='rgba(161,0,255,.85)';ctx.shadowColor='#a100ff';ctx.shadowBlur=12;
      ctx.fillRect(0,canvas.height/2-1,canvas.width,2);ctx.restore();
      ctx.save();ctx.font='bold 11px Segoe UI';
      const c1=CHARACTERS[players[0].char],c2=CHARACTERS[players[1].char];
      ctx.fillStyle=c1.c1;ctx.shadowColor=c1.glow;ctx.shadowBlur=8;ctx.fillText('P1 · '+c1.name,10,18);
      ctx.fillStyle=c2.c1;ctx.shadowColor=c2.glow;ctx.shadowBlur=8;ctx.fillText('P2 · '+c2.name,10,canvas.height/2+18);
      ctx.restore();
    }
  }

  SFX.drawFlash(ctx,canvas.width,canvas.height);

  // Status labels (screen-fixed)
  if(timeShift){ctx.save();ctx.shadowColor='#a100ff';ctx.shadowBlur=14;ctx.fillStyle='rgba(200,100,255,.95)';ctx.font='bold 12px Segoe UI';ctx.textAlign='center';ctx.fillText('⏱ TIME SHIFT',canvas.width/2,26);ctx.restore();}
  if(overdriveTmr>0){ctx.save();ctx.shadowColor='#ffcc00';ctx.shadowBlur=14;ctx.fillStyle='rgba(255,200,0,.95)';ctx.font='bold 12px Segoe UI';ctx.textAlign='center';ctx.fillText('⚡ OVERDRIVE '+Math.ceil(overdriveTmr/60)+'s',canvas.width/2,42);ctx.restore();}
  if(enemiesLeft>0){ctx.fillStyle='rgba(255,0,85,.85)';ctx.font='bold 13px Segoe UI';ctx.textAlign='center';ctx.fillText('ENEMIES LEFT: '+enemiesLeft,canvas.width/2,canvas.height-8);ctx.textAlign='left';}

  // BOSS HP BAR — screen-fixed strip at the top center while a boss is active. Pulses red when
  // the boss is in its final (<33% HP) phase.
  if(activeBoss && activeBoss.hp>0){
    const b=activeBoss, def=b.boss&&b.boss.def;
    const pct=Math.max(0, Math.min(1, b.hp/b.maxHp));
    const barW=Math.min(580, canvas.width*0.6), barH=18;
    const barX=(canvas.width-barW)/2, barY=14;
    ctx.save();
    // Name label
    ctx.font='bold 14px Segoe UI'; ctx.textAlign='center';
    ctx.shadowColor=def?def.color:'#ff0055'; ctx.shadowBlur=12;
    ctx.fillStyle=def?def.color:'#ff0055';
    ctx.fillText('⚠ '+(def?def.name:'BOSS')+(b.boss?' · PHASE '+b.boss.phase:''), canvas.width/2, barY-2);
    // Frame
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(0,0,0,.65)';
    ctx.fillRect(barX, barY+6, barW, barH);
    // Fill — color shifts from red→orange→yellow as HP drops; pulses in phase 3.
    const phaseBoost = b.boss && b.boss.phase===3 ? (0.6 + 0.4*Math.sin(gTime*0.25)) : 1;
    const fillColor = pct>0.66 ? '#ff3344' : pct>0.33 ? '#ff8822' : '#ffcc00';
    ctx.fillStyle=fillColor;
    ctx.globalAlpha=phaseBoost;
    ctx.fillRect(barX+2, barY+8, (barW-4)*pct, barH-4);
    ctx.globalAlpha=1;
    // Frame stroke
    ctx.strokeStyle=def?def.color:'#ff0055'; ctx.lineWidth=2;
    ctx.strokeRect(barX, barY+6, barW, barH);
    // HP numbers
    ctx.font='bold 11px Segoe UI';
    ctx.fillStyle='#fff';
    ctx.fillText(Math.ceil(b.hp)+' / '+Math.ceil(b.maxHp), canvas.width/2, barY+19);
    ctx.restore();
    ctx.textAlign='left';
  }

  // Mini-map (single, screen-right-side, vertical). Shows both players' altitude. Top of the
  // bar = top of the world (portal), bottom = ground.
  const mmW=10,mmH=240,mmX=canvas.width-22,mmY=(canvas.height-mmH)/2;
  ctx.save();ctx.fillStyle='rgba(10,10,30,.75)';ctx.fillRect(mmX,mmY,mmW,mmH);
  ctx.strokeStyle='rgba(161,0,255,.45)';ctx.lineWidth=1;ctx.strokeRect(mmX,mmY,mmW,mmH);
  obstacles.forEach(ob=>{const mpy=mmY+(ob.y/WORLD_H)*mmH;ctx.fillStyle=ob.color;ctx.fillRect(mmX+1,mpy-1,mmW-2,2);});
  if(portal){
    ctx.fillStyle=portal.locked?'#ff0055':'#00f5ff';
    ctx.fillRect(mmX-1,mmY+(portal.y/WORLD_H)*mmH-2,mmW+2,4);
  }
  players.forEach(p=>{const ch=CHARACTERS[p.char];ctx.fillStyle=ch.c1;ctx.fillRect(mmX-2,mmY+(p.y/WORLD_H)*mmH-2,mmW+4,4);});
  ctx.restore();

  ctx.restore();
}

// Draws the entire world from the perspective of `viewer` — used per viewport in split-screen.
function drawWorld(viewer){
  // Platforms
  platforms.forEach(p=>{
    if(p.disabled){
      // Crumbled — draw a faint outline showing it'll respawn.
      ctx.save();ctx.strokeStyle='rgba(161,0,255,.18)';ctx.setLineDash([6,6]);ctx.lineWidth=1;
      ctx.strokeRect(p.x,p.y,p.width,p.height);ctx.setLineDash([]);ctx.restore();
      return;
    }
    if (p.type === 'door' && playerCount === 2) {
      const ownerChar = CHARACTERS[players[p.owner]?.char || p.owner];
      const doorColor = ownerChar ? ownerChar.c1 : '#fff';
      ctx.save();
      ctx.fillStyle = doorColor;
      ctx.globalAlpha = 0.35 + Math.sin(gTime * 0.05) * 0.15;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = doorColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = doorColor;
      ctx.shadowBlur = 10;
      ctx.strokeRect(p.x, p.y, p.width, p.height);
      ctx.restore();
      return;
    }
    const isCrumble=p.type==='crumble';
    const isCrumbling=isCrumble&&p.crumbleT>0;
    const shake=isCrumbling?(Math.sin(gTime*1.2)*2):0;
    const g=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.height);
    if(isCrumble){g.addColorStop(0,'#3a1a0a');g.addColorStop(1,'#1a0808');}
    else{g.addColorStop(0,'#1e0f3a');g.addColorStop(1,'#0c061e');}
    ctx.fillStyle=g;ctx.fillRect(p.x+shake,p.y,p.width,p.height);
    ctx.save();
    const top=isCrumble?'rgba(255,120,40,.6)':'rgba(161,0,255,.5)';
    ctx.shadowColor=top;ctx.shadowBlur=5;
    ctx.strokeStyle=isCrumble?'rgba(255,140,60,.7)':'rgba(161,0,255,.4)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(p.x+shake,p.y);ctx.lineTo(p.x+p.width+shake,p.y);ctx.stroke();
    ctx.strokeStyle=isCrumble?'rgba(255,100,40,.2)':'rgba(0,245,255,.12)';ctx.lineWidth=1;
    ctx.strokeRect(p.x+shake,p.y,p.width,p.height);
    if(isCrumble){
      // Cracks along the surface so it reads as "this will fall"
      ctx.strokeStyle='rgba(255,80,20,.5)';ctx.lineWidth=1;
      for(let i=0;i<3;i++){
        const cx=p.x+shake+(p.width*(i+1)/4);
        ctx.beginPath();ctx.moveTo(cx,p.y);ctx.lineTo(cx-3,p.y+p.height);ctx.stroke();
      }
    }
    ctx.restore();
  });

  // Traps
  traps.forEach(t=>{
    if(t.type==='spike'){
      ctx.save();
      ctx.fillStyle='#220404';ctx.fillRect(t.x,t.y+t.h-4,t.w,4);
      ctx.shadowColor='#ff0055';ctx.shadowBlur=8;
      ctx.fillStyle='#ff2255';
      const sw=10;
      for(let sx=t.x;sx<t.x+t.w-2;sx+=sw){
        ctx.beginPath();
        ctx.moveTo(sx,t.y+t.h);
        ctx.lineTo(sx+sw/2,t.y);
        ctx.lineTo(sx+sw,t.y+t.h);
        ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }else if(t.type==='saw'){
      ctx.save();
      ctx.translate(t.x+t.w/2,t.y+t.h/2);
      ctx.rotate(t.rot||0);
      ctx.shadowColor='#ff5555';ctx.shadowBlur=14;
      ctx.fillStyle='#cccccc';
      const r=t.w/2;
      ctx.beginPath();
      const teeth=10;
      for(let i=0;i<teeth*2;i++){
        const ang=(i/(teeth*2))*Math.PI*2;
        const rr=(i%2===0)?r:r*0.72;
        ctx.lineTo(Math.cos(ang)*rr,Math.sin(ang)*rr);
      }
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#330000';ctx.beginPath();ctx.arc(0,0,r*0.35,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff5555';ctx.beginPath();ctx.arc(0,0,r*0.18,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }else if(t.type==='lava'){
      ctx.save();
      const lg=ctx.createLinearGradient(0,t.y,0,t.y+t.h);
      lg.addColorStop(0,'#ffaa00');lg.addColorStop(0.5,'#ff5500');lg.addColorStop(1,'#771100');
      ctx.fillStyle=lg;ctx.fillRect(t.x,t.y,t.w,t.h);
      ctx.shadowColor='#ff6600';ctx.shadowBlur=20;
      ctx.strokeStyle=`rgba(255,200,80,${0.6+Math.sin(gTime*0.12)*0.3})`;
      ctx.lineWidth=2;
      ctx.beginPath();
      const wave=Math.sin(gTime*0.08)*4;
      ctx.moveTo(t.x,t.y+wave);
      for(let lx=t.x;lx<=t.x+t.w;lx+=40){
        ctx.lineTo(lx,t.y+Math.sin((lx+gTime*4)*0.02)*3);
      }
      ctx.stroke();
      ctx.restore();
    }
  });

  // Portal (skipped entirely in endless mode — portal is null there)
  if(portal){
    ctx.save();
    const pg=Math.sin(portal.pt)*.5+.5;
    const lockCol=portal.locked?'rgba(255,0,85,':'rgba(0,245,255,';
    ctx.translate(portal.x+portal.width/2,portal.y+portal.height/2);
    ctx.shadowColor=portal.locked?'#ff0055':'#00f5ff';ctx.shadowBlur=35*pg;
    ctx.strokeStyle=`${lockCol}${.6+pg*.4})`;ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,0,portal.width/2+7*pg,portal.height/2+7*pg,portal.rot,0,Math.PI*2);ctx.stroke();
    const pGr=ctx.createRadialGradient(0,0,5,0,0,portal.width*.55);
    if(portal.locked){pGr.addColorStop(0,'rgba(255,0,85,.7)');pGr.addColorStop(1,'rgba(255,0,85,0)');}
    else{pGr.addColorStop(0,`rgba(0,245,255,${.85*pg})`);pGr.addColorStop(.5,`rgba(161,0,255,${.55*pg})`);pGr.addColorStop(1,'rgba(161,0,255,0)');}
    ctx.fillStyle=pGr;ctx.beginPath();ctx.ellipse(0,0,portal.width/2,portal.height/2,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.rotate(portal.rot*2);ctx.strokeStyle=`rgba(255,255,255,${.25*pg})`;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(0,0,portal.width*.35,portal.height*.35,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    ctx.restore();
    ctx.fillStyle=portal.locked?'rgba(255,0,85,.85)':'rgba(0,245,255,.7)';ctx.font='11px Segoe UI';ctx.textAlign='center';
    ctx.fillText(portal.locked?'🔒 KILL ALL!':'PORTAL',portal.x+portal.width/2,portal.y-10);ctx.textAlign='left';
  }
  // Battle Royale teleporter — pulsing magenta gateway. Touching it = instant win.
  if(brMode && brTeleporter){
    const t=brTeleporter;
    ctx.save();
    ctx.translate(t.x+t.w/2, t.y+t.h/2);
    const pulse=0.5+0.5*Math.sin(gTime*0.12);
    ctx.shadowColor='#ff00d4'; ctx.shadowBlur=30+pulse*20;
    ctx.strokeStyle=`rgba(255,0,212,${0.7+pulse*0.3})`;
    ctx.lineWidth=3;
    ctx.beginPath(); ctx.ellipse(0,0,t.w/2+8*pulse,t.h/2+8*pulse,t.rot,0,Math.PI*2); ctx.stroke();
    const g=ctx.createRadialGradient(0,0,4,0,0,t.w*.6);
    g.addColorStop(0,`rgba(255,200,255,${0.9*pulse})`);
    g.addColorStop(0.5,`rgba(255,0,212,${0.6*pulse})`);
    g.addColorStop(1,'rgba(160,0,255,0)');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.ellipse(0,0,t.w/2,t.h/2,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle='#ff00d4'; ctx.font='bold 12px Segoe UI'; ctx.textAlign='center';
    ctx.fillText('★ TELEPORTER · INSTANT WIN ★', t.x+t.w/2, t.y-12);
    ctx.textAlign='left';
  }

  // Snares (Emerald skill) — drawn as a pulsing green grid zone
  snares.forEach(s=>{
    const a=Math.min(1,s.t/60)*(0.4+Math.sin(gTime*.12)*.15);
    ctx.save();ctx.shadowColor='#00ff88';ctx.shadowBlur=14;
    ctx.fillStyle=`rgba(0,200,100,${a*0.35})`;ctx.fillRect(s.x,s.y,s.w,s.h);
    ctx.strokeStyle=`rgba(0,255,140,${a})`;ctx.lineWidth=1.5;ctx.strokeRect(s.x,s.y,s.w,s.h);
    // Vine criss-cross pattern
    ctx.strokeStyle=`rgba(0,255,140,${a*0.7})`;ctx.lineWidth=1;
    for(let vx=s.x+10;vx<s.x+s.w;vx+=15){
      ctx.beginPath();ctx.moveTo(vx,s.y);ctx.lineTo(vx-6,s.y+s.h);ctx.stroke();
    }
    ctx.restore();
  });

  // Singularities (VOID skill) — pulsing purple anchor with a swirl ring
  singularities.forEach(sg=>{
    const r=20+Math.sin(gTime*.2)*8;
    ctx.save();ctx.shadowColor='#ff00d4';ctx.shadowBlur=22;
    const grad=ctx.createRadialGradient(sg.x,sg.y,2,sg.x,sg.y,r*2.5);
    grad.addColorStop(0,'rgba(255,0,212,.6)');grad.addColorStop(1,'rgba(160,0,255,0)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.arc(sg.x,sg.y,r*2.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=`rgba(255,0,212,${.6+Math.sin(gTime*.3)*.3})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(sg.x,sg.y,r,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  });

  // Flame trail (Crimson skill) — orange wisps along recent player positions
  players.forEach(p=>{
    if(p.flameTrailT<=0)return;
    p.trail.forEach((t,idx)=>{
      const a=t.a*Math.min(1,p.flameTrailT/60);
      if(a<=0)return;
      ctx.save();ctx.shadowColor='#ff5500';ctx.shadowBlur=12;
      ctx.fillStyle=`rgba(255,140,0,${a*0.65})`;
      const r=3+(14-idx)*0.5;
      ctx.beginPath();ctx.arc(t.x+16,t.y+16,r,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });
  });

  // Collectibles
  collectibles.forEach(c=>{
    if(c.collected)return;
    if(c.type==='score'){
      // Classic yellow coin. Spins on the y-axis via a cos squeeze; rim and shine give it
      // the chunky platformer look. Pulse drives the spin so it stays in sync with the orb bob.
      const spin=Math.cos(c.pulse);
      const rW=Math.max(2.4, c.r*Math.abs(spin)); // half-width oscillates
      const rH=c.r;
      const bob=Math.sin(c.pulse*1.7)*2;
      const cx=c.x, cy=c.y+bob;
      ctx.save();
      ctx.shadowColor='#ffcc00'; ctx.shadowBlur=18;
      // Outer rim (orange)
      ctx.fillStyle='#c87a00';
      ctx.beginPath(); ctx.ellipse(cx,cy,rW,rH,0,0,Math.PI*2); ctx.fill();
      // Inner face — bright gold gradient
      const g=ctx.createRadialGradient(cx-rW*0.35,cy-rH*0.4,1,cx,cy,Math.max(rW,rH));
      g.addColorStop(0,'#fff5b0');
      g.addColorStop(0.45,'#ffd24a');
      g.addColorStop(1,'#e09500');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.ellipse(cx,cy,rW*0.78,rH*0.82,0,0,Math.PI*2); ctx.fill();
      // Inscription — $ when facing the camera, fades as it spins edge-on
      const faceA=Math.abs(spin);
      if(faceA>0.35){
        ctx.shadowBlur=0;
        ctx.globalAlpha=faceA;
        ctx.fillStyle='#a05a00';
        ctx.font='bold 11px Segoe UI';
        ctx.textAlign='center';
        ctx.fillText('$', cx, cy+4);
        ctx.textAlign='left';
        ctx.globalAlpha=1;
      }
      // Specular highlight
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.ellipse(cx-rW*0.35, cy-rH*0.45, rW*0.22, rH*0.12, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }else{
      const r=c.r+Math.sin(c.pulse)*3;
      const col=c.type==='plasma'?'#00f5ff':c.type==='timeammo'?'#a100ff':c.type==='heal'?'#ff00d4':'#ff0055';
      ctx.save();ctx.shadowColor=col;ctx.shadowBlur=16;
      const cg=ctx.createRadialGradient(c.x,c.y,2,c.x,c.y,r);cg.addColorStop(0,'#fff');cg.addColorStop(1,col+'88');
      ctx.fillStyle=cg;ctx.beginPath();ctx.arc(c.x,c.y,r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=col;ctx.font='bold 10px Segoe UI';ctx.textAlign='center';ctx.fillText(c.type==='plasma'?'P':c.type==='heal'?'H':'T',c.x,c.y+3);ctx.textAlign='left';
      ctx.restore();
    }
  });

  // Enemy bullets
  enemyBullets.forEach(b=>{
    ctx.save();ctx.globalAlpha=b.life;ctx.shadowColor='#ff0055';ctx.shadowBlur=12;
    ctx.fillStyle='#ff0055';ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();ctx.restore();
  });

  // Player bullets — most guns draw as glowing orbs; flame/railgun/sniper have bespoke looks.
  bullets.forEach(b=>{
    const gun=GUNS_BY_ID[b.gunId] || GUNS[b.gun];
    if(b.gunId==='flamethrower'){
      // Layered radial gradient — outer dark red, mid bright orange, hot yellow core.
      ctx.save();ctx.globalAlpha=b.life;
      const r=b.sz;
      const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,r);
      g.addColorStop(0,'rgba(255,255,200,'+(0.9*b.life)+')');
      g.addColorStop(0.35,'rgba(255,180,0,'+(0.8*b.life)+')');
      g.addColorStop(0.7,'rgba(255,60,0,'+(0.5*b.life)+')');
      g.addColorStop(1,'rgba(102,17,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,r,0,Math.PI*2);ctx.fill();
      ctx.restore();
      return;
    }
    if(b.gunId==='railgun'){
      // Render as a bright line segment along the velocity vector for a beam-rifle feel.
      ctx.save();ctx.globalAlpha=b.life;
      ctx.strokeStyle=gun.color;ctx.shadowColor=gun.color;ctx.shadowBlur=18;ctx.lineWidth=gun.sz*1.1;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(b.x-b.vx*1.4,b.y-b.vy*1.4);ctx.lineTo(b.x+b.vx*0.4,b.y+b.vy*0.4);ctx.stroke();
      ctx.restore();
      return;
    }
    const drawSz = b.scoped ? gun.sz*1.6 : gun.sz;
    ctx.save();ctx.globalAlpha=b.life;ctx.shadowColor=gun.color;ctx.shadowBlur=b.scoped?22:14;
    ctx.fillStyle=gun.color;ctx.beginPath();ctx.arc(b.x,b.y,drawSz,0,Math.PI*2);ctx.fill();
    // Longer tracer for scoped sniper shots.
    const trailLen = b.scoped ? 4 : 2;
    ctx.globalAlpha=b.life*.35;ctx.fillStyle=gun.color;ctx.beginPath();ctx.arc(b.x-b.vx*trailLen,b.y-b.vy*trailLen,drawSz*.7,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });

  // Obstacles
  obstacles.forEach(obs=>{
    const gl=Math.sin(obs.glow)*.5+.5;
    ctx.save();ctx.translate(obs.x+obs.width/2,obs.y+obs.height/2);
    
    // Draw owner aura for 2-player mode
    if(playerCount === 2 && obs.owner !== undefined) {
      const ownerChar = CHARACTERS[players[obs.owner]?.char || obs.owner];
      if (ownerChar) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(obs.width, obs.height) * 0.8 + Math.sin(gTime * 0.1) * 3, 0, Math.PI * 2);
        ctx.strokeStyle = ownerChar.c1;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(gTime * 0.1) * 0.3;
        ctx.stroke();
        ctx.restore();
      }
    }
    
    if(obs.type==='spinner')ctx.rotate(obs.rot);
    if(obs.frozenT>0){ctx.shadowColor='#66aaff';ctx.shadowBlur=20;}else{ctx.shadowColor=obs.color;ctx.shadowBlur=22*gl;}
    const og=ctx.createLinearGradient(-obs.width/2,-obs.height/2,obs.width/2,obs.height/2);
    const c0=obs.frozenT>0?'#4488cc':obs.color;const c1=obs.frozenT>0?'#224466':obs.type==='tank'?'#550000':obs.type==='chaser'?'#cc4400':obs.type==='spinner'?'#8800cc':obs.type==='boss'?(obs.boss&&obs.boss.def.c2)||'#000':'#aa0033';
    og.addColorStop(0,c0);og.addColorStop(1,c1);ctx.fillStyle=og;
    if(obs.type==='spinner'){ctx.beginPath();ctx.moveTo(0,-obs.height/2);ctx.lineTo(obs.width/2,0);ctx.lineTo(0,obs.height/2);ctx.lineTo(-obs.width/2,0);ctx.closePath();ctx.fill();}
    else if(obs.type==='chaser'){const dir=(viewer.x>obs.x)?1:-1;ctx.beginPath();ctx.moveTo(obs.width/2*dir,0);ctx.lineTo(-obs.width/2*dir,-obs.height/2);ctx.lineTo(-obs.width/2*dir,obs.height/2);ctx.closePath();ctx.fill();}
    else if(obs.type==='boss'){
      // Boss: larger gradient body with halo ring + center icon. Phase 3 pulses red.
      const b=obs.boss, def=b&&b.def;
      const phaseGlow = b ? (b.phase===3 ? 0.9 : b.phase===2 ? 0.6 : 0.3) : 0.3;
      ctx.shadowBlur=30 + phaseGlow*15;
      // Hexagon-ish body for a more menacing silhouette than a plain rectangle.
      ctx.beginPath();
      const hw=obs.width/2, hh=obs.height/2;
      ctx.moveTo(-hw*0.6, -hh);
      ctx.lineTo(hw*0.6, -hh);
      ctx.lineTo(hw, 0);
      ctx.lineTo(hw*0.6, hh);
      ctx.lineTo(-hw*0.6, hh);
      ctx.lineTo(-hw, 0);
      ctx.closePath();
      ctx.fill();
      // Halo ring — pulsing.
      if(def){
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(gTime*0.1) * 0.3;
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(hw, hh)*1.15 + Math.sin(gTime*0.08)*4, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
        // Icon glyph at center.
        ctx.save();
        ctx.shadowBlur=0;
        ctx.font='bold 36px "Segoe UI Emoji", sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle='#fff';
        ctx.fillText(def.icon, 0, 2);
        ctx.restore();
      }
    }
    else{ctx.fillRect(-obs.width/2,-obs.height/2,obs.width,obs.height);}
    if(obs.maxHp>1){
      const bw=obs.width,bh=5,bx=-bw/2,by=-obs.height/2-10;
      ctx.shadowBlur=0;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=obs.hp/obs.maxHp>.5?'#00ff88':'#ff8800';ctx.fillRect(bx,by,bw*(obs.hp/obs.maxHp),bh);
    }
    ctx.restore();
  });

  // Draw all players (so each viewport shows the other player too)
  players.forEach(pl=>drawPlayer(pl));

  PS.draw(ctx);FT.draw(ctx);
  if(typeof QuickChat!=='undefined') QuickChat.drawBubbles(ctx);
}

function drawPlayer(pl){
  // Dead BR players: render a faint translucent tombstone marker at last position, no trail.
  if(brMode && !pl.alive){
    ctx.save();
    ctx.globalAlpha=0.25;
    ctx.fillStyle='#555';
    ctx.fillRect(pl.x, pl.y, pl.width, pl.height);
    ctx.font='bold 14px Segoe UI'; ctx.textAlign='center'; ctx.fillStyle='#888';
    ctx.fillText('💀', pl.x+pl.width/2, pl.y+pl.height/2+5);
    ctx.restore();
    return;
  }
  const ch=CHARACTERS[pl.char];
  // Trail
  pl.trail.forEach(t=>{
    if(t.a<=0)return;
    const a=t.a*(t.dash?.65:.35);
    ctx.fillStyle=t.dash?`rgba(0,245,255,${a})`:overdriveTmr>0?`rgba(255,200,0,${a})`:`rgba(${parseInt(ch.c1.slice(1,3),16)},${parseInt(ch.c1.slice(3,5),16)},${parseInt(ch.c1.slice(5,7),16)},${a})`;
    ctx.fillRect(t.x,t.y,pl.width,pl.height);
  });

  // Sniper laser sight: a dotted red line from the player muzzle toward the aim target. Brighter
  // and thicker once the player has charged the shot (≥30 held frames).
  const _curGun = pl.guns && pl.guns[pl.curGun];
  if(_curGun && _curGun.id==='sniper'){
    const px=pl.x+pl.width/2, py=pl.y+pl.height/2;
    let dx,dy;
    const tgt=findAimTarget(px,py);
    if(tgt){dx=tgt.x-px;dy=tgt.y-py;}
    else if(pl.keymap.useMouse){dx=(pl.mouseX+pl.cameraX)-px;dy=(pl.mouseY+(pl.cameraY||0))-py;}
    else{dx=(pl.facing||1)*0.3;dy=-1;}
    const d=Math.hypot(dx,dy)||1;
    const len=600;
    const ex=px+dx/d*len, ey=py+dy/d*len;
    const charged=pl.fireTimer>=30;
    ctx.save();
    ctx.globalAlpha=charged?0.85:0.45;
    ctx.strokeStyle=charged?'#ff3344':'#ff6677';
    ctx.lineWidth=charged?1.8:1;
    ctx.setLineDash(charged?[6,4]:[3,5]);
    ctx.shadowColor='#ff3344';ctx.shadowBlur=charged?10:0;
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.setLineDash([]);
    if(charged){
      ctx.globalAlpha=0.9;ctx.fillStyle='#33ff99';ctx.shadowColor='#33ff99';ctx.shadowBlur=14;
      ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  const invBlink=pl.invincTimer>0&&Math.floor(gTime/4)%2===0;
  if(!invBlink){
    // VOID's Phase Shift translucency: drop alpha while phaseT is active.
    if(pl.phaseT>0)ctx.globalAlpha=0.55;
    ctx.shadowColor=overdriveTmr>0?'#ffcc00':shieldTimer>0?'#00f5ff':pl.dash.active?'#fff':ch.glow;
    ctx.shadowBlur=pl.dash.active?32:20;
    const pg2=ctx.createLinearGradient(pl.x,pl.y,pl.x+pl.width,pl.y+pl.height);
    if(overdriveTmr>0){pg2.addColorStop(0,'#ffcc00');pg2.addColorStop(1,'#ff8800');}
    else if(shieldTimer>0){pg2.addColorStop(0,'#00ddff');pg2.addColorStop(1,'#0088cc');}
    else if(pl.dash.active){pg2.addColorStop(0,'#fff');pg2.addColorStop(1,ch.c1);}
    else if(timeShift){pg2.addColorStop(0,'#cc00ff');pg2.addColorStop(1,'#6600cc');}
    else{pg2.addColorStop(0,ch.c1);pg2.addColorStop(1,ch.c2);}
    ctx.fillStyle=pg2;ctx.fillRect(pl.x,pl.y,pl.width,pl.height);
    ctx.shadowBlur=0;ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(pl.x+3,pl.y+3,pl.width-6,pl.height/3);
    ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.5;ctx.strokeRect(pl.x,pl.y,pl.width,pl.height);
    // Character-specific art (eyes, accessories, silhouette). Each art id renders on top of
    // the base body rect.
    drawCharArt(pl, ch);
    // Adrenaline aura (CRIMSON): pulsing orange ring around the body.
    if(pl.adrenalineT>0){
      const ar=0.4+Math.sin(gTime*.25)*.25;
      ctx.save();ctx.shadowColor='#ff8800';ctx.shadowBlur=14;
      ctx.strokeStyle=`rgba(255,140,0,${ar})`;ctx.lineWidth=2.5;
      ctx.beginPath();ctx.ellipse(pl.x+16,pl.y+16,pl.width/2+8,pl.height/2+8,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // Reflect Wave (AEGIS): gold halo while active.
    if(pl.reflectT>0){
      ctx.save();ctx.shadowColor='#ffcc00';ctx.shadowBlur=16;
      ctx.strokeStyle=`rgba(255,200,0,${.5+Math.sin(gTime*.2)*.3})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(pl.x+16,pl.y+16,pl.width/2+6,pl.height/2+6,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // Auto-aim crosshair line + lock-on reticle
    const tgt=findAimTarget(pl.x+16,pl.y+16);
    if(tgt){
      const col=pl.guns[pl.curGun].color;
      ctx.strokeStyle=`rgba(${col.slice(1).match(/../g).map(h=>parseInt(h,16)).join(',')}, 0.55)`;
      ctx.lineWidth=1.2;ctx.setLineDash([5,5]);
      ctx.beginPath();ctx.moveTo(pl.x+16,pl.y+16);ctx.lineTo(tgt.x,tgt.y);ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();ctx.strokeStyle=col;ctx.shadowColor=col;ctx.shadowBlur=10;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(tgt.x,tgt.y,14+Math.sin(gTime*.18)*2,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(tgt.x-18,tgt.y);ctx.lineTo(tgt.x-8,tgt.y);
      ctx.moveTo(tgt.x+8,tgt.y);ctx.lineTo(tgt.x+18,tgt.y);
      ctx.moveTo(tgt.x,tgt.y-18);ctx.lineTo(tgt.x,tgt.y-8);
      ctx.moveTo(tgt.x,tgt.y+8);ctx.lineTo(tgt.x,tgt.y+18);ctx.stroke();ctx.restore();
    }
    if(shieldTimer>0||pl.shieldedBy>0){ctx.shadowColor='#00f5ff';ctx.shadowBlur=18;ctx.strokeStyle=`rgba(0,245,255,${.4+Math.sin(gTime*.15)*.3})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(pl.x+16,pl.y+16,pl.width/2+10,pl.height/2+10,0,0,Math.PI*2);ctx.stroke();}
    // Player tag (P1/P2) hovering above each player in 2P mode
    if(playerCount===2){
      ctx.font='bold 10px Segoe UI';ctx.textAlign='center';ctx.fillStyle=ch.c1;ctx.shadowColor=ch.glow;ctx.shadowBlur=6;
      ctx.fillText('P'+(pl.pid+1),pl.x+16,pl.y-14);ctx.textAlign='left';
    }
  }
  ctx.restore();
  // Jump dots
  if(!pl.onGround){for(let j=0;j<pl.jumpsLeft;j++){ctx.save();ctx.shadowColor=ch.glow;ctx.shadowBlur=8;ctx.fillStyle=ch.c1;ctx.beginPath();ctx.arc(pl.x+8+j*14,pl.y-9,4,0,Math.PI*2);ctx.fill();ctx.restore();}}
}

// Per-character visual overlay. Hitbox stays at 32x32 (pl.width/pl.height); art may extend
// a few pixels outside for crowns / flames / etc. Called from drawPlayer after the body rect
// is filled and stroked.
function drawCharArt(pl, ch){
  const x=pl.x, y=pl.y, w=pl.width, h=pl.height;
  switch(ch.art){
    case 'neon': {
      // Round white-with-cyan eyes
      ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.arc(x+10,y+12,3.5,0,Math.PI*2);ctx.arc(x+w-10,y+12,3.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#00f5ff';ctx.beginPath();ctx.arc(x+10,y+12,2,0,Math.PI*2);ctx.arc(x+w-10,y+12,2,0,Math.PI*2);ctx.fill();
      // Antenna with glowing tip
      ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(x+w/2-1,y-5,2,5);
      ctx.shadowColor='#00f5ff';ctx.shadowBlur=8;
      ctx.fillStyle='#00f5ff';ctx.beginPath();ctx.arc(x+w/2,y-7,2.5,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
      break;
    }
    case 'crimson': {
      // Triangular helmet spike
      ctx.shadowColor='#ff3366';ctx.shadowBlur=10;
      ctx.fillStyle='#ff3366';ctx.beginPath();
      ctx.moveTo(x+8,y);ctx.lineTo(x+w/2,y-10);ctx.lineTo(x+w-8,y);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;
      // Narrow red slit eyes
      ctx.fillStyle='#ff5577';ctx.fillRect(x+5,y+12,8,2);ctx.fillRect(x+w-13,y+12,8,2);
      // Chevron on chest
      ctx.strokeStyle='rgba(255,200,100,.7)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(x+10,y+24);ctx.lineTo(x+w/2,y+20);ctx.lineTo(x+w-10,y+24);ctx.stroke();
      break;
    }
    case 'emerald': {
      // Leaf crown — three triangles on top
      ctx.shadowColor='#00ff88';ctx.shadowBlur=10;
      ctx.fillStyle='#00ff88';
      for(let i=0;i<3;i++){
        const cx=x+8+i*8;
        ctx.beginPath();ctx.moveTo(cx-3,y);ctx.lineTo(cx,y-7);ctx.lineTo(cx+3,y);ctx.closePath();ctx.fill();
      }
      ctx.shadowBlur=0;
      // Round white eyes with green pupils
      ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.arc(x+10,y+13,4,0,Math.PI*2);ctx.arc(x+w-10,y+13,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#00aa66';ctx.beginPath();ctx.arc(x+10,y+13,2,0,Math.PI*2);ctx.arc(x+w-10,y+13,2,0,Math.PI*2);ctx.fill();
      break;
    }
    case 'void': {
      // Dark hood arc covering upper third
      ctx.save();
      ctx.fillStyle='rgba(20,0,40,.85)';
      ctx.beginPath();ctx.moveTo(x,y+11);ctx.quadraticCurveTo(x+w/2,y-4,x+w,y+11);ctx.lineTo(x+w,y);ctx.lineTo(x,y);ctx.closePath();ctx.fill();
      ctx.restore();
      // Glowing yellow eyes peering from shadow
      ctx.shadowColor='#ffcc00';ctx.shadowBlur=8;
      ctx.fillStyle='#ffcc00';ctx.beginPath();ctx.arc(x+11,y+10,1.8,0,Math.PI*2);ctx.arc(x+w-11,y+10,1.8,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
      break;
    }
    case 'aegis': {
      // Shoulder bumps (extra width at top corners)
      ctx.fillStyle=ch.c2;
      ctx.fillRect(x-3,y+3,4,8);ctx.fillRect(x+w-1,y+3,4,8);
      // Cyan visor bar across eye area instead of separate eyes
      ctx.shadowColor='#00f5ff';ctx.shadowBlur=10;
      ctx.fillStyle='#00f5ff';ctx.fillRect(x+4,y+11,w-8,4);
      ctx.shadowBlur=0;
      // Shield emblem on chest: small white circle with a + cross
      ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(x+w/2,y+22,4.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#00ffaa';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(x+w/2-3,y+22);ctx.lineTo(x+w/2+3,y+22);ctx.moveTo(x+w/2,y+19);ctx.lineTo(x+w/2,y+25);ctx.stroke();
      break;
    }
    case 'lifter': {
      // Orange goggles — two larger circles
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.arc(x+10,y+12,5,0,Math.PI*2);ctx.arc(x+w-10,y+12,5,0,Math.PI*2);ctx.fill();
      ctx.shadowColor='#ff8800';ctx.shadowBlur=8;
      ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(x+10,y+12,3.5,0,Math.PI*2);ctx.arc(x+w-10,y+12,3.5,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
      // Jetpack flames below body when airborne
      if(!pl.onGround){
        ctx.shadowColor='#ff5500';ctx.shadowBlur=10;
        const fl=4+Math.sin(gTime*.4)*2;
        ctx.fillStyle='#ffaa00';
        ctx.beginPath();ctx.moveTo(x+6,y+h);ctx.lineTo(x+10,y+h+fl);ctx.lineTo(x+14,y+h);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.moveTo(x+w-14,y+h);ctx.lineTo(x+w-10,y+h+fl);ctx.lineTo(x+w-6,y+h);ctx.closePath();ctx.fill();
        ctx.shadowBlur=0;
      }
      break;
    }
    default: {
      // Fallback to the original generic face (so any new character without `art` still renders)
      ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(x+6,y+8,7,6);ctx.fillRect(x+w-13,y+8,7,6);
      ctx.fillStyle='#000814';ctx.fillRect(x+8,y+9,4,4);ctx.fillRect(x+w-11,y+9,4,4);
    }
  }
}

// ──────────────────────────────────────────────
// NETWORKING (online 2P)
//
// Roles:
//   'host'  — owns the authoritative simulation. P1 is its keyboard. P2 is driven by remote
//             inputs received over the data channel. Sends the world state to the guest at
//             ~30Hz.
//   'guest' — does not simulate. Receives world state and renders it. Sends its keyboard
//             input as P2's input over the data channel at ~30Hz.
//
// The KEYMAP_ONLINE_REMOTE keymap below uses synthetic key names (prefixed with __net) so
// the existing input pipeline (anyKey/isKey) works unchanged — Net.applyRemoteToKeys()
// stamps them into the keys[] map each frame on the host.
// ──────────────────────────────────────────────
const KEYMAP_ONLINE_REMOTE={
  left:['__netL'], right:['__netR'], jump:['__netJ'],
  dashKeys:['__netSH'], dashCodes:[],
  shoot:['__netF'], useMouse:false,
  skill1:['__netSK1'], skill2:['__netSK2'], skill3:['__netSK3'],
  wpn1:[], wpn2:[], wpn3:[],
  cycleWeapon:['__netWP'],
  rewind:[],
  coop:['__netCO'],
};
const Net={
  role:null,             // null | 'host' | 'guest'
  conn:null,             // PeerJS DataConnection
  remoteInput:{},        // host: latest input from guest. guest: unused.
  lastState:null,        // guest: latest state from host. host: unused.
  _stateCounter:0,
  _lastSentLevel:null,    // host: tracks which level's platforms the guest has already
  isOn(){return this.role==='host'||this.role==='guest';},
  // Capture the local keyboard state into a compact input packet (sent by guest each frame).
  captureLocalInput(){
    return{
      l:anyKey(['ArrowLeft','a','A']),
      r:anyKey(['ArrowRight','d','D']),
      j:anyKey(['ArrowUp','w','W',' ']),
      sh:anyCode(['ShiftLeft','ShiftRight']),
      f:anyKey(['x','X']),
      sk1:anyKey(['q','Q']),sk2:anyKey(['e','E']),sk3:anyKey(['r','R']),
      wp:anyKey(['1','2','3']),  // any weapon swap key cycles weapons remotely
      co:anyKey(['g','G']),
    };
  },
  sendInput(){if(this.conn&&this.conn.open)this.conn.send({t:'i',d:this.captureLocalInput()});},
  // Stamp Net.remoteInput onto the synthetic key names so isKey/anyKey see them.
  applyRemoteToKeys(){
    const ri=this.remoteInput;
    keys['__netL']=!!ri.l; keys['__netR']=!!ri.r; keys['__netJ']=!!ri.j;
    keys['__netSH']=!!ri.sh; keys['__netF']=!!ri.f;
    keys['__netSK1']=!!ri.sk1; keys['__netSK2']=!!ri.sk2; keys['__netSK3']=!!ri.sk3;
    keys['__netWP']=!!ri.wp; keys['__netCO']=!!ri.co;
  },
  // Compact world snapshot. Trails and float-text are skipped — they regenerate visually.
  // Platforms are only included when the level changes (or on the first packet of a session)
  // since they're static within a level.
  packState(){
    const includePlatforms=(this._lastSentLevel!==level);
    if(includePlatforms)this._lastSentLevel=level;
    const pkt={t:'s',
      pl:players.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,hp:p.hp,maxHp:p.maxHp,facing:p.facing,
        char:p.char,curGun:p.curGun,onGround:p.onGround,jumpsLeft:p.jumpsLeft,
        invincTimer:p.invincTimer,
        dashActive:p.dash.active,dashCharges:p.dash.charges,
        skCd:p.skills.map(s=>s.cd),
        gunsAmmo:p.guns.map(g=>g.ammo),
        shieldedBy:p.shieldedBy,coopCd:p.coopCd,
      })),
      tr:traps.map(t=>({type:t.type,x:t.x,y:t.y,w:t.w,h:t.h,rot:t.rot,t:t.t})),
      ob:obstacles.map(o=>({x:o.x,y:o.y,width:o.width,height:o.height,type:o.type,color:o.color,hp:o.hp,maxHp:o.maxHp,frozenT:o.frozenT,rot:o.rot,glow:o.glow})),
      bl:bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,sz:b.sz,color:b.color,gun:b.gun,life:b.life})),
      eb:enemyBullets.map(b=>({x:b.x,y:b.y,life:b.life})),
      cl:collectibles.map(c=>({x:c.x,y:c.y,r:c.r,collected:c.collected,type:c.type,pulse:c.pulse})),
      pt:portal,
      sc:score,lv:level,kl:levelKills,lf:enemiesLeft,
      sht:shieldTimer,fzt:freezeTimer,ovd:overdriveTmr,
      gT:gTime,st:state,
    };
    if(includePlatforms)pkt.pl_t=platforms;
    return pkt;
  },
  // Force the next packet to re-send platforms (called by host when triggering a transition).
  invalidatePlatforms(){this._lastSentLevel=null;},
  applyState(s){
    if(!s||!s.pl)return;
    s.pl.forEach((sp,i)=>{
      if(!players[i])return;
      const p=players[i];
      p.x=sp.x;p.y=sp.y;p.vx=sp.vx;p.vy=sp.vy;p.hp=sp.hp;p.maxHp=sp.maxHp;
      p.facing=sp.facing;p.char=sp.char;p.curGun=sp.curGun;
      p.onGround=sp.onGround;p.jumpsLeft=sp.jumpsLeft;p.invincTimer=sp.invincTimer;
      p.dash.active=sp.dashActive;p.dash.charges=sp.dashCharges;
      sp.skCd.forEach((cd,j)=>{if(p.skills[j])p.skills[j].cd=cd;});
      sp.gunsAmmo.forEach((a,j)=>{if(p.guns[j])p.guns[j].ammo=a;});
      p.shieldedBy=sp.shieldedBy||0;p.coopCd=sp.coopCd||0;
      // Maintain a short trail locally so guest visuals stay smooth.
      p.trail.push({x:p.x,y:p.y,a:1,dash:p.dash.active});
      if(p.trail.length>14)p.trail.shift();
      p.trail.forEach(t=>{t.a-=p.dash.active?.06:.08;});
      applyCharacter(p);
    });
    obstacles=s.ob;bullets=s.bl;enemyBullets=s.eb;collectibles=s.cl;
    if(s.tr)traps=s.tr;
    if(s.pl_t)platforms=s.pl_t;
    portal=s.pt;
    score=s.sc;level=s.lv;levelKills=s.kl;enemiesLeft=s.lf;
    shieldTimer=s.sht;freezeTimer=s.fzt;overdriveTmr=s.ovd;
    gTime=s.gT;
    if(s.st && s.st!==state){
      state=s.st;
      // Mirror host-side panel transitions on the guest. Hide panels when the host
      // continues into a new level so the guest follows.
      if(state==='gameover'){const el=document.getElementById('goSc');if(el)el.textContent=score;showPanel('goPanel');this._lockGuestButtons();}
      else if(state==='levelcomplete'){const el=document.getElementById('lcScore');if(el)el.textContent=score;showPanel('lcPanel');this._lockGuestButtons();}
      else if(state==='playing'){hideAllPanels();}
    }
    updateHUD();
  },
};

// ──────────────────────────────────────────────
// BATTLE ROYALE
//
// MVP scope: arena map (horizontal, lava floor), bot AI, friendly fire, last-alive OR
// teleporter wins, 3-min timer fallback. Mesh netcode reuses the existing star topology
// (host runs sim, guests forward input + render snapshots). Wired from modules/battle-royale.js
// which calls brStart(opts) once the lobby resolves a player count.
// ──────────────────────────────────────────────
let brMode=false;
let brTimeLeft=0;
let brAlive=0;
let brHumanCount=0;
let brBotCount=0;
let brPlacement=[];        // pids in elimination order; last alive prepended at end
let brKills=Array(8).fill(0);
let brMatchOver=false;
let brTeleporter=null;
const BR_WORLD_W=2400, BR_WORLD_H=1600;
// Hand-crafted symmetric arena spawn pillars (one per pid 0..5). The arena layout is mirrored
// around x=BR_WORLD_W/2 so no pillar has a positional advantage.
const BR_SPAWN_PILLARS=[
  {x:200,  y:1300, w:120, h:24},
  {x:600,  y:1300, w:120, h:24},
  {x:1000, y:1300, w:120, h:24},
  {x:1400, y:1300, w:120, h:24},
  {x:1800, y:1300, w:120, h:24},
  {x:2200, y:1300, w:120, h:24},
];

function brStart(opts){
  opts=opts||{};
  brMode=true;
  brMatchOver=false;
  brTimeLeft=60*60*3;          // 3 min
  brHumanCount=Math.max(1, opts.humans|0);
  brBotCount=Math.max(0, opts.bots|0);
  brKills=Array(8).fill(0);
  brPlacement=[];
  // Pull diff + char into the engine. Override per-mode globals.
  diffIdx=Math.max(0,Math.min(3,opts.diff|0));
  selP1CharIdx=Math.max(0,Math.min(CHARACTERS.length-1,opts.charIdx|0));
  playerCount=brHumanCount+brBotCount;
  // Override world bounds for the arena. The engine's WORLD_W/WORLD_H are `let`-declared so we
  // can swap them; backup originals so leaving BR doesn't strand the regular layouts.
  WORLD_W=BR_WORLD_W; WORLD_H=BR_WORLD_H;
  currentBgTheme='foundry'; // arena uses the foundry backdrop for the lava theme
  // Build players (humans first, then bots).
  players=[];
  for(let i=0;i<playerCount;i++){
    const km=(i===0)?KEYMAP_1P:{left:[],right:[],jump:[],dashKeys:[],dashCodes:[],shoot:[],useMouse:false};
    const p=createPlayer(i, km);
    p.char = (i===0) ? selP1CharIdx : (i % CHARACTERS.length);
    p.bot = (i>=brHumanCount);
    p.botAi = p.bot ? {wanderT:0, shootT:60+Math.random()*120, jumpT:0, targetX:0, targetY:0} : null;
    p.alive = true;
    p.brKills = 0;
    applyCharacter(p); applyUpgrades(p);
    // Fair start: all players force-loaded with pistol + plasma + timegun, fresh ammo.
    p.guns = [GUNS_BY_ID.pistol, GUNS_BY_ID.plasma, GUNS_BY_ID.timegun].map(g=>({...g, ammo: g.maxAmmo===Infinity ? Infinity : Math.floor(g.maxAmmo*0.75), lastShot:0}));
    p.curGun = 0;
    players.push(p);
  }
  player = players[0];
  // Build the arena layout (overrides initLevel's normal layout pick).
  brBuildArena();
  brAlive = players.length;
  level=1; score=0; rewinds=0; totalKills=0; levelKills=0;
  gTime=0;
  state='playing';
  // Teleporter pinned directly above the center peak platform (y=360, w=300) so it's the same
  // place every round — players can learn the ascent path. Hand-crafted arena, not random.
  brTeleporter={x:BR_WORLD_W*0.5-30, y:280, w:60, h:80, rot:0};
  // Camera centered on local player.
  players.forEach(p=>{ p.cameraY = Math.max(0, Math.min(BR_WORLD_H-canvas.height, p.y - canvas.height*0.4)); });
  switchWeapon(0,0);
  refreshSkillHUD();
  refreshWeaponHUD();
  loop();
}

// Build the hand-crafted symmetric BR arena: 6 spawn pillars over a lava floor, 3-tier
// platform layout (low / mid / center peak), teleporter pinned on the center peak.
// Layout is mirrored around x=BR_WORLD_W/2 so no pillar / lane gives a positional edge.
function brBuildArena(){
  platforms=[]; obstacles=[]; collectibles=[]; bullets=[]; enemyBullets=[]; traps=[]; snares=[]; singularities=[];

  // Lava death floor — single full-width trap. brTick() turns contact into elimination.
  traps.push({type:'spike', x:0, y:BR_WORLD_H-20, w:BR_WORLD_W, h:20});

  // Side walls — keep players inside the arena horizontally.
  platforms.push({x:0,             y:0, width:20, height:BR_WORLD_H, type:'solid', crumbleT:0, disabled:false});
  platforms.push({x:BR_WORLD_W-20, y:0, width:20, height:BR_WORLD_H, type:'solid', crumbleT:0, disabled:false});

  // Bottom tier: 6 spawn pillars over the lava (also the starting positions).
  BR_SPAWN_PILLARS.forEach(p=>{
    platforms.push({x:p.x, y:p.y, width:p.w, height:p.h, type:'solid', crumbleT:0, disabled:false});
  });

  // Low tier: 3 platforms — flanks mirrored, center wider for vertical staging.
  platforms.push({x:300,  y:900, width:220, height:20, type:'solid', crumbleT:0, disabled:false});
  platforms.push({x:940,  y:750, width:320, height:20, type:'solid', crumbleT:0, disabled:false});
  platforms.push({x:1880, y:900, width:220, height:20, type:'solid', crumbleT:0, disabled:false});

  // Mid tier: 3 platforms — center is highest, encourages climbing the middle to contest peak.
  platforms.push({x:380,  y:650, width:240, height:20, type:'solid', crumbleT:0, disabled:false});
  platforms.push({x:960,  y:550, width:280, height:20, type:'solid', crumbleT:0, disabled:false});
  platforms.push({x:1780, y:650, width:240, height:20, type:'solid', crumbleT:0, disabled:false});

  // Center peak: high ground that holds the teleporter (placed by brStart).
  platforms.push({x:1050, y:360, width:300, height:24, type:'solid', crumbleT:0, disabled:false});

  // Deterministic spawn assignment by pid. Pillars 0..N-1 used for N players; remaining
  // pillars stay as walkable platforms (cover / traversal options).
  players.forEach((p,i)=>{
    const slot=BR_SPAWN_PILLARS[i % BR_SPAWN_PILLARS.length];
    p.x = slot.x + slot.w/2 - 16;
    p.y = slot.y - 40;
    p.vx=0; p.vy=0;
    p.hp = p.maxHp;
    p.alive = true;
    p.invincTimer = 60; // brief spawn protection
  });

  portal = null;        // no level-end portal — teleporter handled separately
  portalLocked = false;
  enemiesLeft = 0;
}

// Bot AI tick. Very simple: pick a target (nearest alive opponent), move horizontally toward
// them, jump randomly, fire at intervals. Doesn't use the wheel/skill system to keep it
// predictable.
function brBotTick(p){
  if(!p.bot || !p.alive) return;
  const ai = p.botAi;
  // Pick nearest alive opponent.
  let target=null, bestD=Infinity;
  players.forEach(q=>{
    if(q===p || !q.alive) return;
    const d=Math.hypot((q.x+16)-(p.x+16), (q.y+16)-(p.y+16));
    if(d<bestD){bestD=d; target=q;}
  });
  if(!target){ p.vx*=0.9; return; }
  // Movement toward target horizontally.
  const dx = (target.x+16) - (p.x+16);
  const dy = (target.y+16) - (p.y+16);
  if(Math.abs(dx)>40){
    p.vx = Math.sign(dx) * p.speed * 0.85;
    p.facing = Math.sign(dx) || 1;
  } else {
    p.vx *= 0.7;
  }
  // Random jump if blocked or target is above.
  ai.jumpT--;
  if((dy<-30 || Math.random()<0.02) && ai.jumpT<=0 && p.jumpsLeft>0){
    p.vy = -(p.jump*0.9);
    p.jumpsLeft--;
    ai.jumpT = 30+Math.floor(Math.random()*30);
    if(p.jumpsLeft===1)AU.jump();
  }
  // Pseudo-mouse aim toward target so tryShoot's findAimTarget can lock.
  p.mouseX = target.x+16 - (p.cameraX||0);
  p.mouseY = target.y+16 - (p.cameraY||0);
  // Fire periodically. Slower than a human to keep bots beatable.
  ai.shootT--;
  if(ai.shootT<=0 && bestD<700){
    p.sniperCharged=false;
    tryShoot(p);
    ai.shootT = 30 + Math.floor(Math.random()*40);
  }
}

// Called from the loop each frame (BR mode only). Runs bot AI, decrements the round timer,
// checks win conditions, applies bullet-vs-player damage (friendly fire).
function brTick(){
  if(!brMode || brMatchOver) return;
  // Bot AI for every bot.
  players.forEach(p=>brBotTick(p));
  // Friendly-fire / player-vs-player bullet collisions. Run on the bullet array.
  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    let hit=false;
    for(const pl of players){
      if(!pl.alive) continue;
      if(pl.pid===b.pIndex) continue;
      if(pl.invincTimer>0||shieldTimer>0||pl.shieldedBy>0) continue;
      if(aabb(b.x-b.sz, b.y-b.sz, b.sz*2, b.sz*2, pl.x, pl.y, pl.width, pl.height)){
        pl.hp -= b.dmg * 6;
        pl.invincTimer = 20;
        PS.bulletHit(b.x, b.y, b.color);
        FT.add(pl.x+16, pl.y, '-'+(b.dmg*6).toFixed(0), '#ff5577', 16, true);
        AU.hit();
        if(pl.hp<=0){
          brEliminate(pl, b.pIndex);
        }
        if(!b.pierce){hit=true; break;}
      }
    }
    if(hit) bullets.splice(i,1);
  }
  // Lava floor check.
  players.forEach(pl=>{
    if(!pl.alive) return;
    if(pl.y > BR_WORLD_H - 30){
      pl.hp = 0;
      brEliminate(pl, -1);
    }
  });
  // Teleporter contact = instant win.
  if(brTeleporter){
    brTeleporter.rot += 0.04;
    players.forEach(pl=>{
      if(!pl.alive) return;
      if(aabb(pl.x, pl.y, pl.width, pl.height, brTeleporter.x, brTeleporter.y, brTeleporter.w, brTeleporter.h)){
        // Mark all others as eliminated, then end with this player as winner.
        players.forEach(other=>{ if(other!==pl && other.alive){brEliminate(other, pl.pid);} });
        brEndMatch(pl);
      }
    });
  }
  // Timer countdown.
  brTimeLeft = Math.max(0, brTimeLeft - 1);
  if(brTimeLeft===0){
    // Timer expired: winner = alive player with most kills.
    let best=null, bestK=-1;
    players.forEach(pl=>{
      if(!pl.alive) return;
      if(pl.brKills>bestK){bestK=pl.brKills; best=pl;}
    });
    if(best) brEndMatch(best);
  }
  // Last-alive check.
  brAlive = players.filter(p=>p.alive).length;
  if(brAlive<=1){
    const survivor = players.find(p=>p.alive);
    if(survivor) brEndMatch(survivor);
  }
}

function brEliminate(pl, killerPid){
  if(!pl.alive) return;
  pl.alive = false;
  pl.invincTimer = 0;
  PS.enemyDie(pl.x+pl.width/2, pl.y+pl.height/2, '#ff5577');
  AU.enemyDie(true);
  SFX.shake = Math.max(SFX.shake, 8);
  const killer = (killerPid>=0) ? players[killerPid] : null;
  const killerName = killer ? (killer.bot ? 'BOT '+killerPid : 'P'+(killerPid+1)) : 'LAVA';
  const victimName = pl.bot ? 'BOT '+pl.pid : 'P'+(pl.pid+1);
  FT.add(canvas.width/2, 280, victimName+' eliminated by '+killerName, '#ff5577', 22, true);
  if(killer){
    killer.brKills = (killer.brKills|0)+1;
    brKills[killerPid] = killer.brKills;
  }
  // Push to placement (early eliminations end up first, winner last).
  brPlacement.unshift(pl.pid);
}

function brEndMatch(winner){
  if(brMatchOver) return;
  brMatchOver = true;
  // Final placement order: winner at position 1, then by reverse-elimination order.
  if(winner && brPlacement[0]!==winner.pid){
    // Winner wasn't in the placement list (still alive) — prepend.
    brPlacement = [winner.pid, ...brPlacement.filter(p=>p!==winner.pid)];
  }
  // Local player's placement (1 = winner, 2 = runner-up, etc).
  const myPid = 0;
  let myPlacement = brPlacement.indexOf(myPid)+1;
  if(myPlacement<=0) myPlacement = players.length;
  const myKills = (players[myPid] && players[myPid].brKills) || 0;
  const coins = (myPlacement===1?500 : myPlacement===2?300 : myPlacement===3?150 : 50) + myKills*50;
  Upgrades.addCoins(coins);
  // Build final board.
  const board = brPlacement.map(pid=>{
    const p=players[pid]; if(!p) return null;
    const ch=CHARACTERS[p.char]||{name:'?'};
    return {name: (p.bot?'BOT ':'')+ch.name+' (P'+(pid+1)+')', kills: p.brKills|0, pid};
  }).filter(Boolean);
  const winnerName = winner ? (winner.bot?'BOT ':'')+(CHARACTERS[winner.char]||{name:'?'}).name : '—';
  const results = {placement:myPlacement, winner:winnerName, kills:myKills, coinsEarned:coins, board};
  state='gameover';
  if(typeof refreshCloudUI==='function') refreshCloudUI();
  if(typeof brOnMatchEnd==='function') brOnMatchEnd(results);
}

// ──────────────────────────────────────────────
// GAME LOOP
// ──────────────────────────────────────────────
function loop(){
  if(state!=='playing'&&Net.role!=='guest'){return;}
  if(Net.role==='guest'){
    // Guest: render whatever state we have, send our input. No local physics.
    if(Net.lastState)Net.applyState(Net.lastState);
    Net._inputCounter=(Net._inputCounter||0)+1;
    if(Net._inputCounter%2===0)Net.sendInput();
    if(state==='playing')render();
  }else{
    if(Net.role==='host')Net.applyRemoteToKeys();
    handleInput();updatePhysics();
    if(brMode) brTick();
    render();
    if(Net.role==='host'&&Net.conn&&Net.conn.open){
      Net._stateCounter++;
      if(Net._stateCounter%2===0)Net.conn.send(Net.packState());
    }
  }
  // BR HUD updates (alive count + timer).
  if(brMode){
    const el = document.getElementById('brAlive');     if(el) el.textContent = brAlive;
    const ek = document.getElementById('brKills');     if(ek && players[0]) ek.textContent = players[0].brKills|0;
    const et = document.getElementById('brTimer');
    if(et){const s=Math.ceil(brTimeLeft/60); et.textContent = Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  }
  animId=requestAnimationFrame(loop);
}

// ──────────────────────────────────────────────
// TRANSITIONS
// ──────────────────────────────────────────────
function triggerLevelComplete(){
  AU.levelOK();SFX.clear();
  level++;score+=500;rewinds=Math.min(8,rewinds+1);
  const lvlBonus = 50 + level*15 + levelKills*5;
  Upgrades.addCoins(lvlBonus);
  Achievements.check();
  if(typeof Daily!=='undefined'){
    Daily.onLevelClear();
    Daily.onScoreChange(score);
  }
  // 8% chance to drop a loot box on level clear. Boss levels already give a guaranteed box
  // via killEnemy, so this only fires for normal level clears.
  if(typeof LootBox!=='undefined' && Math.random()<0.08){
    LootBox.add(1, 'LEVEL CLEAR');
  }
  continueLevel();
}

// Endless equivalent of a level break: no portal, no fanfare, no shop interstitial. Just
// rebuild the next procedural chunk, respawn at the bottom, and keep the run going. Difficulty
// internal (level) still ticks up to feed enemy scaling; user only sees more enemies + the
// HEIGHT counter climbing past the next 1000m bracket.
function endlessAdvanceChunk(){
  const chunkM=Math.round(WORLD_H/10);
  endlessMeters+=chunkM;
  const tier=endlessDifficultyTier();
  const bonus=120+tier*40;
  Upgrades.addCoins(bonus);
  score+=200;
  rewinds=Math.min(8,rewinds+1);
  level++;
  Achievements.check();
  if(typeof Daily!=='undefined'){
    Daily.onEndlessMeters(endlessMeters);
    Daily.onScoreChange(score);
  }
  FT.add(WORLD_W/2,140,'+'+chunkM+'m','#00f5ff',24,true);
  FT.add(WORLD_W/2,170,'+'+bonus+'🪙','#ffcc00',18,true);
  AU.jump();
  continueLevel();
}

function continueLevel(){
  hideAllPanels();
  const wasPlaying = (state === 'playing');
  state='playing';
  initLevel();
  AU.jump();
  if(!wasPlaying) loop();
}

function triggerGameOver(){
  state='gameover';AU.gameOver();SFX.hit(true);
  if(typeof refreshCloudUI==='function') refreshCloudUI();
  Achievements.check();
  const isNew=saveBest();
  document.getElementById('goSc').textContent=score;
  document.getElementById('goLv').textContent=level;
  document.getElementById('goKl').textContent=totalKills;
  document.getElementById('goRec').style.display=isNew?'block':'none';
  showPanel('goPanel');refreshBest();
}

function restartGame(){
  clearInterval(lcTimer);hideAllPanels();
  level=1;score=0;rewinds=DIFFS[diffIdx].rewinds;totalKills=0;
  endlessMeters=0;
  gTime=0;
  players.forEach(p=>{
    // Only zero ammo on guns with finite max ammo — flame / pistol stay at Infinity.
    if(p.guns[1].maxAmmo!==Infinity) p.guns[1].ammo=0;
    if(p.guns[2].maxAmmo!==Infinity) p.guns[2].ammo=0;
    p.guns.forEach(g=>{g.lastShot=0;});
    p.coopCd=0;p.shieldedBy=0;
    p.flameTrailT=0;p.adrenalineT=0;p.phaseT=0;p.reflectT=0;p.stompPending=false;
    applyCharacter(p);
    applyUpgrades(p);
  });
  refreshSkillHUD();
  refreshWeaponHUD();
  state='playing';initLevel();AU.jump();loop();
}

function toMenu(){
  clearInterval(lcTimer);cancelAnimationFrame(animId);
  saveBest();level=1;score=0;rewinds=3;totalKills=0;state='menu';
  currentBgTheme='neon';
  if(typeof refreshCloudUI==='function') refreshCloudUI();
  // Tear down any active peer connection cleanly so we don't leak data channels.
  if(Net.conn){try{Net.conn.close();}catch(e){}Net.conn=null;}
  Net.role=null;Net.lastState=null;Net.remoteInput={};
  if(window.location.href.includes('modules')) {
    window.location.href = '../game.html';
    return;
  }
  canvas.style.display='none';
  ['hud','leaveBtn','skillBar','skillBar2','weapBar','weapBar2','ctrlHint','touch','modeBadge','hKillBox'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  showPanel('menuPanel');refreshBest();
}

function startGame(directMode=null, directDiff=null){
  if (directMode !== null) selModeIdx = directMode;
  if (directDiff !== null) selDiffIdx = directDiff;
  if (!window.location.href.includes('modules')) {
    // Menu picks: 0 → solo, 1 → local split-screen 2P, 2 → online 2P. From the menu we now
    // always go through the map-select panel via launchGame(), but keep this branch as a
    // safety net for any direct startGame() callers.
    const target = selModeIdx===2?'online-2p.html'
                 : selModeIdx===1?'2-person.html'
                 : '1-person.html';
    window.location.href = 'modules/' + target + '?diff=' + selDiffIdx + '&map=' + selMapIdx;
    return;
  }
  gameMode=selModeIdx;diffIdx=selDiffIdx;
  const D=DIFFS[diffIdx];

  players=[];
  // Clamp lobby-selected character indices to the valid range so a stale URL param can't OOB.
  const p1Char=Math.max(0,Math.min(CHARACTERS.length-1,selP1CharIdx|0));
  const p2Char=Math.max(0,Math.min(CHARACTERS.length-1,selP2CharIdx|0));
  if(playerCount===1){
    players.push(createPlayer(0,KEYMAP_1P));
    players[0].char=p1Char;
  }else if(Net.role){
    // Online 2P. Host's P2 reads remote input via the synthetic keymap; the guest doesn't
    // simulate so its keymaps are placeholders. Each browser only knows its OWN p1 selection
    // (the friend's choice arrives on their own browser); the partner defaults to CRIMSON.
    if(Net.role==='host'){
      players.push(createPlayer(0,KEYMAP_1P));
      players.push(createPlayer(1,KEYMAP_ONLINE_REMOTE));
      players[0].char=p1Char;
      players[1].char=1%CHARACTERS.length;
    }else{
      players.push(createPlayer(0,KEYMAP_1P));
      players.push(createPlayer(1,KEYMAP_1P));
      // On the guest, "your" character (the lobby pick) belongs to players[1].
      players[1].char=p1Char;
      players[0].char=0;
    }
  }else{
    players.push(createPlayer(0,KEYMAP_2P_P1));
    players.push(createPlayer(1,KEYMAP_2P_P2));
    players[0].char=p1Char;
    players[1].char=p2Char;
  }
  player=players[0];
  players.forEach(applyCharacter);
  // Persistent per-character upgrades stack on top of the character base stats. Must run AFTER
  // applyCharacter (which sets base speed/jump) and BEFORE the gun-reset block below — the
  // dash maxCh is bumped here.
  players.forEach(applyUpgrades);

  hideAllPanels();canvas.style.display='block';
  document.getElementById('hud').style.display='flex';
  document.getElementById('leaveBtn').style.display='block';
  document.getElementById('skillBar').style.display='flex';
  document.getElementById('weapBar').style.display='flex';
  const hp2 = document.getElementById('hpWrap2'); if (hp2) hp2.style.display=playerCount===2?'block':'none';
  const sk2 = document.getElementById('skillBar2'); if (sk2) sk2.style.display=playerCount===2?'flex':'none';
  const wb2 = document.getElementById('weapBar2'); if (wb2) wb2.style.display=playerCount===2?'flex':'none';
  const ch = document.getElementById('ctrlHint'); if(ch) ch.style.display='flex';
  const mb = document.getElementById('modeBadge'); if(mb) mb.style.display='flex';
  if(gameMode===1){const hk = document.getElementById('hKillBox'); if(hk) hk.style.display='block';}
  const th = document.getElementById('touch');
  if(th && ('ontouchstart'in window||navigator.maxTouchPoints>0)) th.style.display='flex';
  updateModeBar();
  level=1;score=0;rewinds=D.rewinds;totalKills=0;
  // Reset gun ammo / lastShot so the first level has a clean firing state. lastShot in
  // particular must be zero or the player can't fire until gTime catches up.
  // NOTE: do NOT overwrite p.speed here — applyCharacter+applyUpgrades already set it.
  players.forEach(p => {
    // Reset ammo on non-infinite guns only — clobbering Infinity → 0 makes infinite-ammo
    // guns (flame) start at 0/∞ and then pick up the +15 plasma bonus, showing "15/∞".
    if(p.guns[1].maxAmmo!==Infinity) p.guns[1].ammo=0;
    if(p.guns[2].maxAmmo!==Infinity) p.guns[2].ammo=0;
    p.guns.forEach(g=>{g.lastShot=0;});
  });
  gTime=0;
  state='playing';
  if(typeof refreshCloudUI==='function') refreshCloudUI();
  switchWeapon(0, 0);
  if (playerCount === 2) switchWeapon(0, 1);
  refreshSkillHUD();
  refreshWeaponHUD();
  initLevel();loop();
}

// ──────────────────────────────────────────────
// QUICK CHAT — emoji wheel + floating bubbles
//
// Press V (or the on-screen button if added later) to open the radial wheel. Click an emoji
// (or press 1-9 for the first nine) to send. The pick spawns a local bubble above the player
// for ~3s and, in online mode, broadcasts a `{t:'e',emoji,pid}` packet so the peer also
// sees it. Per-player cooldown prevents spam.
// ──────────────────────────────────────────────
const QuickChat={
  EMOJIS:['👋','👍','😬','🔥','💀','🎯','❤️','⚠️','🆘','🤝','😂','👀'],
  bubbles:[],          // {pid, emoji, t, age}
  cooldown:0,          // frames remaining before local player can send again
  COOLDOWN:300,        // 5s at 60fps
  BUBBLE_LIFE:180,     // 3s
  wheelOpen:false,
  // Open the wheel as a DOM overlay (created lazily). No-op while on cooldown.
  open(){
    if(this.cooldown>0){
      FT.add(canvas.width/2, 240, 'CHAT COOLDOWN '+Math.ceil(this.cooldown/60)+'s', '#ff8800', 16, true);
      return;
    }
    if(this.wheelOpen) return;
    this.wheelOpen=true;
    this._ensureWheel();
    const wheel=document.getElementById('qcWheel');
    if(wheel) wheel.classList.add('on');
  },
  close(){
    this.wheelOpen=false;
    const wheel=document.getElementById('qcWheel');
    if(wheel) wheel.classList.remove('on');
  },
  pick(idx){
    const emoji=this.EMOJIS[idx];
    if(!emoji) return;
    this.close();
    this.send(emoji);
  },
  // Local pick → spawn bubble, set cooldown, broadcast over network if connected.
  send(emoji){
    const localPid=(typeof Net!=='undefined' && Net.role==='guest') ? 1 : 0;
    this.spawnBubble(localPid, emoji);
    this.cooldown=this.COOLDOWN;
    if(typeof Net!=='undefined' && Net.conn && Net.conn.open){
      try{ Net.conn.send({t:'e', emoji, pid:localPid}); }catch(e){}
    }
  },
  // Remote packet handler — called from modules/online-2p.js connection data handlers.
  onReceive(d){
    if(!d || typeof d.emoji!=='string') return;
    const pid=(d.pid|0);
    this.spawnBubble(pid, d.emoji);
  },
  spawnBubble(pid, emoji){
    // One bubble per player at a time — latest replaces any prior.
    this.bubbles=this.bubbles.filter(b=>b.pid!==pid);
    this.bubbles.push({pid, emoji, t:this.BUBBLE_LIFE, age:0});
    if(typeof AU!=='undefined' && AU.collect) AU.collect();
  },
  update(){
    if(this.cooldown>0) this.cooldown--;
    this.bubbles.forEach(b=>{b.t--; b.age++;});
    this.bubbles=this.bubbles.filter(b=>b.t>0);
  },
  // Render bubbles above their respective players in world space. Called from drawWorld.
  drawBubbles(ctx){
    this.bubbles.forEach(b=>{
      const pl=players[b.pid];
      if(!pl) return;
      const fade=b.t<30 ? b.t/30 : 1;
      const rise=Math.min(28, b.age*0.18);
      const cx=pl.x+pl.width/2, cy=pl.y-22-rise;
      ctx.save();
      ctx.globalAlpha=fade;
      // Speech-bubble background.
      ctx.fillStyle='rgba(10,10,30,.88)';
      ctx.strokeStyle='rgba(0,245,255,.7)';
      ctx.lineWidth=1.5;
      ctx.shadowColor='rgba(0,245,255,.5)';
      ctx.shadowBlur=8;
      ctx.beginPath();
      const bw=44, bh=42;
      ctx.moveTo(cx-bw/2+8, cy-bh/2);
      ctx.lineTo(cx+bw/2-8, cy-bh/2);
      ctx.quadraticCurveTo(cx+bw/2, cy-bh/2, cx+bw/2, cy-bh/2+8);
      ctx.lineTo(cx+bw/2, cy+bh/2-8);
      ctx.quadraticCurveTo(cx+bw/2, cy+bh/2, cx+bw/2-8, cy+bh/2);
      ctx.lineTo(cx+6, cy+bh/2);
      ctx.lineTo(cx, cy+bh/2+8); // tail
      ctx.lineTo(cx-6, cy+bh/2);
      ctx.lineTo(cx-bw/2+8, cy+bh/2);
      ctx.quadraticCurveTo(cx-bw/2, cy+bh/2, cx-bw/2, cy+bh/2-8);
      ctx.lineTo(cx-bw/2, cy-bh/2+8);
      ctx.quadraticCurveTo(cx-bw/2, cy-bh/2, cx-bw/2+8, cy-bh/2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Emoji glyph.
      ctx.shadowBlur=0;
      ctx.font='28px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillStyle='#fff';
      ctx.fillText(b.emoji, cx, cy+2);
      ctx.restore();
    });
  },
  // Build the wheel overlay DOM lazily on first open. 12 emoji tiles arranged radially around
  // a central cancel button.
  _ensureWheel(){
    if(document.getElementById('qcWheel')) return;
    const wrap=document.createElement('div');
    wrap.id='qcWheel';
    wrap.className='qc-wheel';
    wrap.onclick=(e)=>{ if(e.target===wrap) this.close(); };
    const inner=document.createElement('div');
    inner.className='qc-wheel-inner';
    const radius=120;
    this.EMOJIS.forEach((em,i)=>{
      const ang=(i/this.EMOJIS.length)*Math.PI*2 - Math.PI/2; // start at top
      const x=Math.cos(ang)*radius, y=Math.sin(ang)*radius;
      const btn=document.createElement('button');
      btn.className='qc-tile';
      btn.style.transform=`translate(${x}px,${y}px)`;
      btn.textContent=em;
      btn.title=(i<9?(i+1)+' · ':'')+em;
      btn.onclick=(ev)=>{ ev.stopPropagation(); this.pick(i); };
      inner.appendChild(btn);
    });
    const center=document.createElement('button');
    center.className='qc-cancel';
    center.textContent='ESC';
    center.title='Cancel (Esc)';
    center.onclick=(ev)=>{ ev.stopPropagation(); this.close(); };
    inner.appendChild(center);
    wrap.appendChild(inner);
    document.body.appendChild(wrap);
  },
};

// ──────────────────────────────────────────────
// KEYBOARD
// ──────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  // Quick-chat wheel handling takes priority over game key bindings while open.
  if(QuickChat.wheelOpen){
    if(e.key==='Escape'){QuickChat.close(); e.preventDefault(); return;}
    if(e.key>='1' && e.key<='9'){QuickChat.pick(parseInt(e.key,10)-1); e.preventDefault(); return;}
    if(e.key==='0'){QuickChat.pick(9); e.preventDefault(); return;}
  }
  // Esc closes any open Home Base modal (overlay UI, not gameplay-blocking).
  if(e.key==='Escape' && document.querySelector('.hb-modal-bg.on')){
    closeHbModal(); e.preventDefault(); return;
  }
  // V opens the wheel during play. Skip while typing in inputs (e.g., coupon field, room code).
  if((e.key==='v'||e.key==='V') && state==='playing'){
    const t=e.target;
    if(!t || (t.tagName!=='INPUT' && t.tagName!=='TEXTAREA')){
      QuickChat.open();
      e.preventDefault();
      return;
    }
  }
  keys[e.key]=true;keyCodes[e.code]=true;
  // Arrow keys / Space / `/` are still bound to game actions and should not scroll the page.
  if(state==='playing'&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','/'].includes(e.key))e.preventDefault();
});
document.addEventListener('keyup',e=>{keys[e.key]=false;keyCodes[e.code]=false;});

// Touch
function bindT(id,k){
  const el=document.getElementById(id);if(!el)return;
  const on=e=>{e.preventDefault();touch[k]=true;el.classList.add('on');};
  const off=e=>{e.preventDefault();touch[k]=false;el.classList.remove('on');};
  ['touchstart','mousedown'].forEach(ev=>el.addEventListener(ev,on,{passive:false}));
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev,off,{passive:false}));
}
bindT('tL','l');bindT('tR','r');bindT('tJp','jp');bindT('tSh','sh');bindT('tDs','ds');bindT('tFi','fi');bindT('tFr','fr');

window.addEventListener('resize',()=>{bgC.width=window.innerWidth;bgC.height=window.innerHeight;});

// ──────────────────────────────────────────────
// SETTINGS — volumes + music track. Persisted in localStorage.
// ──────────────────────────────────────────────
const Settings={
  load(){
    try{
      const raw=localStorage.getItem('csSettings');
      const s=raw?JSON.parse(raw):{};
      this.musicVol=s.musicVol??50;
      this.sfxVol=s.sfxVol??80;
      this.track=s.track??1;
      this.musicOn=s.musicOn??true;
    }catch(e){this.musicVol=50;this.sfxVol=80;this.track=1;this.musicOn=true;}
  },
  save(){localStorage.setItem('csSettings',JSON.stringify({musicVol:this.musicVol,sfxVol:this.sfxVol,track:this.track,musicOn:this.musicOn}));},
};
Settings.load();

// Tiny synth music: an arpeggio loop tied to the selected track. Volume comes from Settings.
const Music=(()=>{
  const TRACKS=[
    {name:'NEON DRIFT',  notes:[220,277,330,415,330,277], bpm:96,  wave:'triangle'},
    {name:'CHRONO PULSE',notes:[196,247,294,392,294,247,294,392], bpm:112, wave:'square'},
    {name:'VOID RUSH',   notes:[174,220,261,329,261,220,329,440], bpm:128, wave:'sawtooth'},
  ];
  let ac=null,gain=null,timer=null,step=0;
  function ensure(){
    if(ac)return;
    ac=new (window.AudioContext||window.webkitAudioContext)();
    gain=ac.createGain();gain.gain.value=Settings.musicVol/400;gain.connect(ac.destination);
  }
  function tick(){
    const t=TRACKS[Settings.track-1]||TRACKS[0];
    const f=t.notes[step%t.notes.length];step++;
    const o=ac.createOscillator(),g=ac.createGain();
    o.type=t.wave;o.frequency.value=f;
    g.gain.setValueAtTime(0,ac.currentTime);
    g.gain.linearRampToValueAtTime(.5,ac.currentTime+.04);
    g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+60/t.bpm-.02);
    o.connect(g);g.connect(gain);
    o.start();o.stop(ac.currentTime+60/t.bpm);
  }
  return{
    TRACKS,
    start(){if(!Settings.musicOn)return;ensure();if(ac.state==='suspended')ac.resume();
      if(timer)clearInterval(timer);step=0;
      const t=TRACKS[Settings.track-1]||TRACKS[0];
      timer=setInterval(tick,60000/t.bpm);},
    stop(){if(timer){clearInterval(timer);timer=null;}},
    refreshVol(){if(gain)gain.gain.value=Settings.musicVol/400;},
    apply(){if(Settings.musicOn)this.start();else this.stop();this.refreshVol();},
  };
})();

function applySettingsUI(){
  const vm=document.getElementById('volMusic');if(vm){vm.value=Settings.musicVol;vm.oninput=e=>{Settings.musicVol=+e.target.value;Music.refreshVol();Settings.save();};}
  const vs=document.getElementById('volSfx');if(vs){vs.value=Settings.sfxVol;vs.oninput=e=>{Settings.sfxVol=+e.target.value;Settings.save();};}
  const tk=document.getElementById('musicTrack');if(tk){tk.value=Settings.track;tk.onchange=e=>{Settings.track=+e.target.value;Music.apply();Settings.save();};}
  const mo=document.getElementById('musicOn');if(mo){mo.checked=Settings.musicOn;mo.onchange=e=>{Settings.musicOn=e.target.checked;Music.apply();Settings.save();};}
}
applySettingsUI();

// BOOT — only show the menu if we're on the menu page (index.html). Module pages have their
// own bootstrap that calls startGame() directly with the right player count. Music is
// armed on first user gesture so browsers don't block the AudioContext.
refreshBest();
if(typeof refreshCloudUI==='function') refreshCloudUI();
const _inModule=window.location.pathname.includes('/modules/');
if(!_inModule)showPanel('menuPanel');
let _musicArmed=false;
function _armMusic(){if(_musicArmed)return;_musicArmed=true;Music.apply();}
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,_armMusic,{once:true}));
