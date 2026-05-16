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
  {id:'flamethrower',icon:'🔥', name:'Flame',       color:'#ff0000', speed:9,  dmg:0.4, ammo:Infinity,maxAmmo:Infinity, pierce:false, freeze:false, rof:4,  lastShot:0, sz:6, cost:800,  range:240},
  {id:'rocket',      icon:'🚀', name:'Rocket',      color:'#ff3366', speed:11, dmg:4,   ammo:0,       maxAmmo:8,        pierce:false, freeze:false, rof:60, lastShot:0, sz:7, cost:1500, explode:80},
];
const GUNS_BY_ID = GUNS.reduce((m,g)=>{m[g.id]=g;return m;},{});


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
      const raw=localStorage.getItem('csUpgrades');
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&typeof parsed==='object'){
          this.data={coins:parsed.coins|0, chars:parsed.chars||{}};
        }
      }
    }catch(e){this.data={coins:0,chars:{}};}
  },
  save(){try{localStorage.setItem('csUpgrades',JSON.stringify(this.data));}catch(e){}},
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
      const raw=localStorage.getItem('csAchievements');
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&parsed.unlocked)this.data.unlocked=parsed.unlocked;
      }
    }catch(e){this.data={unlocked:{}};}
  },
  save(){try{localStorage.setItem('csAchievements',JSON.stringify(this.data));}catch(e){}},
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
// INVENTORY (gun ownership + equipped loadout)
//
// Persists which guns the player has bought and which 3 they have equipped to in-game slots
// 0/1/2. The free guns (pistol/plasma/timegun) are force-owned on every load so corrupt or
// missing saves can never strand the player. `getEquippedGunSpecs()` is what createPlayer
// reads to build each player's `p.guns` array.
// ──────────────────────────────────────────────
const FREE_GUN_IDS=['pistol','plasma','timegun'];
const Inventory={
  data:{owned:{}, equipped:[...FREE_GUN_IDS]},
  load(){
    try{
      const raw=localStorage.getItem('csInventory');
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&typeof parsed==='object'){
          this.data.owned=parsed.owned||{};
          this.data.equipped=Array.isArray(parsed.equipped)?parsed.equipped.slice(0,3):[...FREE_GUN_IDS];
        }
      }
    }catch(e){this.data={owned:{},equipped:[...FREE_GUN_IDS]};}
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
  save(){try{localStorage.setItem('csInventory',JSON.stringify(this.data));}catch(e){}},
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
  // Returns the 3 GUNS entries in slot order. Used by createPlayer.
  getEquippedGunSpecs(){
    return this.data.equipped.map(id=>GUNS_BY_ID[id]||GUNS_BY_ID.pistol);
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
      const raw=localStorage.getItem('csCoupons');
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&parsed.redeemed)this.data.redeemed=parsed.redeemed;
      }
    }catch(e){this.data={redeemed:{}};}
  },
  save(){try{localStorage.setItem('csCoupons',JSON.stringify(this.data));}catch(e){}},
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
let highScore=parseInt(localStorage.getItem('csBest2')||'0');
function saveBest(){if(score>highScore){highScore=score;localStorage.setItem('csBest2',highScore);return true;}return false;}
function refreshBest(){
  const mb=document.getElementById('menuBest');if(mb)mb.textContent='BEST: '+highScore;
  const hb=document.getElementById('hBs');if(hb)hb.textContent=Math.max(highScore,score);
}

// ──────────────────────────────────────────────
// BG CANVAS
// ──────────────────────────────────────────────
const bgC=document.getElementById('bg'),bgX=bgC.getContext('2d');
bgC.width=window.innerWidth;bgC.height=window.innerHeight;
let bgT=0;
const stars=Array.from({length:160},()=>({x:Math.random()*bgC.width,y:Math.random()*bgC.height,r:.3+Math.random()*1.5,tw:Math.random()*Math.PI*2,spd:.005+Math.random()*.015,col:['rgba(161,0,255,','rgba(0,245,255,','rgba(255,0,212,'][0|Math.random()*3]}));
function drawBg(){bgX.fillStyle='rgba(5,5,15,.14)';bgX.fillRect(0,0,bgC.width,bgC.height);bgT+=.007;bgX.strokeStyle='rgba(161,0,255,.035)';bgX.lineWidth=1;const gs=60,off=(bgT*7)%gs;for(let x=off%gs;x<bgC.width;x+=gs){bgX.beginPath();bgX.moveTo(x,0);bgX.lineTo(x,bgC.height);bgX.stroke();}for(let y=off%gs;y<bgC.height;y+=gs){bgX.beginPath();bgX.moveTo(0,y);bgX.lineTo(bgC.width,y);bgX.stroke();}stars.forEach(s=>{s.tw+=s.spd;const a=.15+Math.sin(s.tw)*.3;bgX.globalAlpha=a;bgX.fillStyle=s.col+a+')';bgX.beginPath();bgX.arc(s.x,s.y,s.r,0,Math.PI*2);bgX.fill();});bgX.globalAlpha=1;requestAnimationFrame(drawBg);}
drawBg();

// Vertical climb world. WORLD_W matches the canvas width — no horizontal scrolling.
// WORLD_H is much taller than the canvas so the camera scrolls upward as you climb.
// Declared up here so LAYOUTS below can reference them in trap coordinates.
const WORLD_W=1200;
const WORLD_H=3200;

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
    build: buildNeonAscent,
  },
  {
    name:'CHRONO SPIRE',
    desc:'Twisting spire. Crumbling platforms required. Layout shuffles each level.',
    build: buildChronoSpire,
  },
  {
    name:'VOID FOUNDRY',
    desc:'Lava floor, dense saws, big gaps. Layout shuffles each level.',
    build: buildVoidFoundry,
  },
  // ENDLESS — see buildEndlessChunk. The chunk is rebuilt every level by initLevel().
  {
    name:'ENDLESS',
    desc:'Procedural climb that never ends. Difficulty ramps every 1000m.',
    isEndless:true,
    build: buildEndlessChunk,
  },
  // MIX — randomly picks one of the 3 themes each level. The picked theme name is included in
  // the result so initLevel can flash it on screen.
  {
    name:'MIX',
    desc:'Random theme each level — surprise climb.',
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
    {name:'NEON ASCENT',  fn: buildNeonAscent},
    {name:'CHRONO SPIRE', fn: buildChronoSpire},
    {name:'VOID FOUNDRY', fn: buildVoidFoundry},
  ];
  const pick = choices[Math.floor(Math.random()*choices.length)];
  const result = pick.fn(lvl);
  result.name = pick.name;
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
  ['mc0','mc1','mc2'].forEach((id,j)=>{
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
  buildHomeRoster();
  buildHomeStore();
  buildHomeAchievements();
  buildHomeEquippedStrip();
  refreshHomeCoinPill();
  refreshHomeStats();
  const inp=document.getElementById('hbCouponInput'); if(inp) inp.value='';
  const msg=document.getElementById('hbCouponMsg'); if(msg){msg.textContent=''; msg.className='hb-coupon-msg';}
  showPanel('homePanel');
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
  if(sb) sb.textContent=(parseInt(localStorage.getItem('csBest2')||'0',10)).toLocaleString();
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

// Settings → wipe all CHRONO SHIFT save data after a single confirm. Reloads the page to make
// sure in-memory state matches the freshly empty localStorage on every code path.
function resetAllProgress(){
  if(!confirm('Reset ALL progress?\n\nThis wipes coins, upgrades, owned guns, equipped loadout, achievements, redeemed coupons, and best score. This cannot be undone.')){
    return;
  }
  ['csBest2','csUpgrades','csAchievements','csInventory','csCoupons'].forEach(k=>{
    try{localStorage.removeItem(k);}catch(e){}
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
    return `<div class="hb-store-card${equipped?' equipped':owned?' owned':''}">
      <div class="hb-store-head">
        <div class="hb-store-icon">${g.icon||'•'}</div>
        <div class="hb-store-name">${g.name.toUpperCase()}</div>
        ${tag}
      </div>
      <div class="hb-store-stats">${stats}</div>
      <div class="hb-store-actions">${actions}</div>
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
  const target = selModeIdx===2?'online-2p.html'
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
      frozenT:0,shootTimer:0|Math.random()*180,
      color:tp==='tank'?'#880000':tp==='chaser'?'#ff6600':tp==='spinner'?'#cc00ff':'#ff0055'});
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
    portalLocked=!D.portalFree && cnt>0;
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
  // limited weapons aren't dead at level start.
  players.forEach(p => {
    const plasGain=Math.max(D.ammoBonus,15);
    const timeGain=Math.max(Math.floor(D.ammoBonus*.67),10);
    p.guns[1].ammo=Math.min(p.guns[1].maxAmmo,p.guns[1].ammo+plasGain);
    p.guns[2].ammo=Math.min(p.guns[2].maxAmmo,p.guns[2].ammo+timeGain);
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
  // effective rof to 66% so the player fires 50% faster.
  const effRof = p.adrenalineT>0 ? Math.max(2, Math.floor(gun.rof*0.66)) : gun.rof;
  if(gTime-gun.lastShot<effRof)return;
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
  const bulletDmg = gun.dmg + (p.dmgBonus||0);
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
      dmg:bulletDmg, color:gun.color, sz:gun.sz,
      pierce:gun.pierce, freeze:gun.freeze,
      explode:gun.explode||0, range:gun.range||0, traveled:0,
      life:1, gun:p.curGun, gunId:gun.id, pIndex:p.pid,
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
  if(shootKey){p.fireTimer++;if(p.fireTimer%p.guns[p.curGun].rof===1)tryShoot(p);}else{p.fireTimer=0;}
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
  // Drop ammo and heals
  if(Math.random()<.45){
    const tp=Math.random()<.4?'plasma':Math.random()<.5?'timeammo':'heal';
    collectibles.push({x:obs.x+obs.width/2,y:obs.y,r:10,collected:false,pulse:0,type:tp});
  }
  // Portal unlocks when all enemies are killed (combat-style behavior, always-on).
  // Skipped in endless mode where there is no portal.
  if(portal&&portal.locked&&enemiesLeft===0){
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
    } else if(b.gunId==='flamethrower'){
      b.sz+=0.15;
      b.vx+=(Math.random()-0.5)*1.5;
      b.vy+=(Math.random()-0.5)*1.5;
      b.life-=0.008; // extra decay
    } else if(b.gunId==='sniper'){
      PS.emit(b.x,b.y,1,{speed:0,color:['#33ff99'],size:1,decay:0.04,glow:true});
    } else if(b.gunId==='railgun'){
      PS.emit(b.x,b.y,1,{speed:0,color:['#88e0ff'],size:1.5,decay:0.1,glow:true});
    } else if(b.gunId==='plasma'){
      PS.emit(b.x,b.y,1,{speed:0,color:['#00f5ff'],size:2,decay:0.08,glow:true});
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
    if(obs.frozenT>0){obs.frozenT--;return;}
    
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

  // Player bullets
  bullets.forEach(b=>{
    const gun=GUNS_BY_ID[b.gunId] || GUNS[b.gun];
    ctx.save();ctx.globalAlpha=b.life;ctx.shadowColor=gun.color;ctx.shadowBlur=14;
    ctx.fillStyle=gun.color;ctx.beginPath();ctx.arc(b.x,b.y,gun.sz,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=b.life*.35;ctx.fillStyle=gun.color;ctx.beginPath();ctx.arc(b.x-b.vx*2,b.y-b.vy*2,gun.sz*.7,0,Math.PI*2);ctx.fill();
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
    const c0=obs.frozenT>0?'#4488cc':obs.color;const c1=obs.frozenT>0?'#224466':obs.type==='tank'?'#550000':obs.type==='chaser'?'#cc4400':obs.type==='spinner'?'#8800cc':'#aa0033';
    og.addColorStop(0,c0);og.addColorStop(1,c1);ctx.fillStyle=og;
    if(obs.type==='spinner'){ctx.beginPath();ctx.moveTo(0,-obs.height/2);ctx.lineTo(obs.width/2,0);ctx.lineTo(0,obs.height/2);ctx.lineTo(-obs.width/2,0);ctx.closePath();ctx.fill();}
    else if(obs.type==='chaser'){const dir=(viewer.x>obs.x)?1:-1;ctx.beginPath();ctx.moveTo(obs.width/2*dir,0);ctx.lineTo(-obs.width/2*dir,-obs.height/2);ctx.lineTo(-obs.width/2*dir,obs.height/2);ctx.closePath();ctx.fill();}
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
}

function drawPlayer(pl){
  const ch=CHARACTERS[pl.char];
  // Trail
  pl.trail.forEach(t=>{
    if(t.a<=0)return;
    const a=t.a*(t.dash?.65:.35);
    ctx.fillStyle=t.dash?`rgba(0,245,255,${a})`:overdriveTmr>0?`rgba(255,200,0,${a})`:`rgba(${parseInt(ch.c1.slice(1,3),16)},${parseInt(ch.c1.slice(3,5),16)},${parseInt(ch.c1.slice(5,7),16)},${a})`;
    ctx.fillRect(t.x,t.y,pl.width,pl.height);
  });

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
    handleInput();updatePhysics();render();
    if(Net.role==='host'&&Net.conn&&Net.conn.open){
      Net._stateCounter++;
      if(Net._stateCounter%2===0)Net.conn.send(Net.packState());
    }
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
    p.guns[1].ammo=0;p.guns[2].ammo=0;
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
    p.guns[1].ammo=0; p.guns[2].ammo=0;
    p.guns.forEach(g=>{g.lastShot=0;});
  });
  gTime=0;
  state='playing';
  switchWeapon(0, 0);
  if (playerCount === 2) switchWeapon(0, 1);
  refreshSkillHUD();
  refreshWeaponHUD();
  initLevel();loop();
}

// ──────────────────────────────────────────────
// KEYBOARD
// ──────────────────────────────────────────────
document.addEventListener('keydown',e=>{
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
const _inModule=window.location.pathname.includes('/modules/');
if(!_inModule)showPanel('menuPanel');
let _musicArmed=false;
function _armMusic(){if(_musicArmed)return;_musicArmed=true;Music.apply();}
['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,_armMusic,{once:true}));
