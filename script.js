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
const SKILLS=[
  {name:'Shield Pulse',icon:'🛡',key:'z',cd:0,maxCd:480,active:false,activeT:0,activeDur:60},
  {name:'Time Bomb',   icon:'💣',key:'e',cd:0,maxCd:720,active:false,activeT:0,activeDur:0},
  {name:'Overdrive',   icon:'⚡',key:'c',cd:0,maxCd:900,active:false,activeT:0,activeDur:180},
];

// ──────────────────────────────────────────────
// WEAPONS
// ──────────────────────────────────────────────
const GUNS=[
  {name:'Pistol', color:'#ffcc00',speed:14,dmg:1,  ammo:Infinity,maxAmmo:Infinity,  pierce:false,freeze:false,rof:18,lastShot:0,sz:5},
  {name:'Plasma', color:'#00f5ff',speed:20,dmg:2,  ammo:0,       maxAmmo:60,        pierce:true, freeze:false,rof:8, lastShot:0,sz:4},
  {name:'TimeGun',color:'#a100ff',speed:11,dmg:1,  ammo:0,       maxAmmo:40,        pierce:false,freeze:true, rof:24,lastShot:0,sz:7},
];


// ──────────────────────────────────────────────
// CHARACTERS (Q/R to cycle)
// ──────────────────────────────────────────────
const CHARACTERS=[
  {name:'NEON',    c1:'#00f5ff', c2:'#a100ff', glow:'#00f5ff', speedM:1.0,  jumpM:1.0},
  {name:'CRIMSON', c1:'#ff3366', c2:'#ff8800', glow:'#ff5577', speedM:1.18, jumpM:0.95},
  {name:'EMERALD', c1:'#00ff88', c2:'#00aa66', glow:'#00ff99', speedM:0.92, jumpM:1.18},
  {name:'VOID',    c1:'#ffcc00', c2:'#ff00d4', glow:'#ffaa00', speedM:1.05, jumpM:1.05},
];
function applyCharacter(p){
  if(!p)return;
  const ch=CHARACTERS[p.char];
  p.speed=5.2*ch.speedM;
  p.jump=13.5*ch.jumpM;
}
function switchCharacter(p,dir){
  if(!p)return;
  p.char=(p.char+dir+CHARACTERS.length)%CHARACTERS.length;
  applyCharacter(p);
  const ch=CHARACTERS[p.char];
  AU.buy();
  PS.shieldPulse(p.x+16,p.y+16);
  FT.add(p.x+16,p.y,'P'+(p.pid+1)+': '+ch.name,ch.c1,18,true);
  SFX.fc=ch.c1;SFX.fa=.18;
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

function buildShop(){
  const g=document.getElementById('shopGrid');g.innerHTML='';
  const p1Char = players[0] ? CHARACTERS[players[0].char].name : null;
  const p2Char = players[1] ? CHARACTERS[players[1].char].name : null;

  Storage.items.forEach((it,i)=>{
    const canAfford=score>=it.cost;
    let enabled = canAfford;
    if (it.character) {
      if (playerCount === 1 && p1Char !== it.character) {
        enabled = false;
      } else if (playerCount === 2 && p1Char !== it.character && p2Char !== it.character) {
        enabled = false;
      }
    }

    g.innerHTML+=`<div class="si${enabled?'':' disabled'}" onclick="buyItem(${i})">
      <div class="si-name">${it.icon} ${it.name}</div>
      <div class="si-desc">${it.desc}</div>
      <div class="si-cost">💰 ${it.cost} pts</div>
    </div>`;
  });
}

function buyItem(i){
  const it=Storage.items[i];
  if(score<it.cost)return;
  score-=it.cost;it.apply();AU.buy();
  buildShop();updateHUD();
  document.getElementById('shopScore').textContent=score;
}

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

// ──────────────────────────────────────────────
// LEVEL LAYOUTS
// ──────────────────────────────────────────────
const LAYOUTS=[
  [{x:0,y:650,w:1200,h:50},{x:180,y:560,w:220,h:18},{x:500,y:460,w:260,h:18},{x:850,y:350,w:210,h:18}],
  [{x:0,y:650,w:1200,h:50},{x:900,y:570,w:200,h:18},{x:600,y:490,w:200,h:18},{x:300,y:400,w:200,h:18},{x:50,y:310,w:180,h:18}],
  [{x:0,y:650,w:300,h:50},{x:900,y:650,w:300,h:50},{x:380,y:580,w:440,h:18},{x:140,y:460,w:250,h:18},{x:810,y:460,w:250,h:18},{x:450,y:340,w:300,h:18}],
  [{x:0,y:650,w:400,h:50},{x:800,y:650,w:400,h:50},{x:100,y:500,w:180,h:18},{x:350,y:390,w:500,h:18},{x:900,y:500,w:200,h:18},{x:530,y:270,w:140,h:18}],
  [{x:0,y:650,w:1200,h:50},{x:50,y:530,w:200,h:18},{x:350,y:430,w:200,h:18},{x:650,y:530,w:200,h:18},{x:950,y:430,w:200,h:18},{x:600,y:310,w:200,h:18}],
];

// ──────────────────────────────────────────────
// GAME STATE
// ──────────────────────────────────────────────
const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const PS=new Particles(),FT=new FloatText();
const WORLD_W=3600;

// Player count (1 or 2). gameMode kept as 0 or 1 to drive selModeIdx but represents player count - 1.
let state='menu',gameMode=0,diffIdx=1,playerCount=1;
let level=1,score=0,rewinds=3;
let totalKills=0,levelKills=0;
let timeShift=false,history=[],animId=null,gTime=0;
let portalLocked=false,enemiesLeft=0;
let lcTimer=null;

// Per-player keymaps. Designed so the 1P and 2P bindings never overlap with each other
// or with their own jump/shoot keys. Z used to be both jump AND skill1 in 1P — that's gone.
// 1P  : full keyboard. WASD/arrows move, ↑/W/Space jump, Shift dash, X / click shoot,
//       Q E R fire skills, 1/2/3 swap weapons, Z/V cycle character, B rewinds.
// 2PA : left half of the keyboard. WASD move, LShift dash, F shoot, 1/2/3 skills,
//       Q cycles weapon, Tab cycles character.
// 2PB : right half. Arrows move, RShift dash, / shoot, 7/8/9 skills, P cycles weapon,
//       ' cycles character.
const KEYMAP_1P={
  left:['ArrowLeft','a','A'], right:['ArrowRight','d','D'],
  jump:['ArrowUp','w','W',' '], dashKeys:[], dashCodes:['ShiftLeft','ShiftRight'],
  shoot:['x','X'], useMouse:true,
  skill1:['q','Q'], skill2:['e','E'], skill3:['r','R'],
  wpn1:['1'], wpn2:['2'], wpn3:['3'],
  charPrev:['z','Z'], charNext:['v','V'],
  rewind:['b','B'], cycleWeapon:[],
};
const KEYMAP_2P_P1={
  left:['a','A'], right:['d','D'], jump:['w','W'],
  dashKeys:[], dashCodes:['ShiftLeft'],
  shoot:['f','F'], useMouse:false,
  skill1:['1'], skill2:['2'], skill3:['3'],
  wpn1:[], wpn2:[], wpn3:[],
  cycleWeapon:['q','Q'],
  charPrev:['Tab'], charNext:['`'],
  rewind:[],
};
const KEYMAP_2P_P2={
  left:['ArrowLeft'], right:['ArrowRight'], jump:['ArrowUp'],
  dashKeys:[], dashCodes:['ShiftRight'],
  shoot:['/'], useMouse:false,
  skill1:['7'], skill2:['8'], skill3:['9'],
  wpn1:[], wpn2:[], wpn3:[],
  cycleWeapon:['p','P'],
  charPrev:["'"], charNext:['Enter'],
  rewind:[],
};

function makeDash(){return{charges:3,maxCh:3,cd:0,maxCd:55,active:false,timer:0,dur:12,dir:1,spd:13};}
function createPlayer(idx,keymap){
  return{
    pid:idx,
    x:80+idx*60,y:520,width:32,height:32,vx:0,vy:0,
    speed:5.2,jump:13.5,onGround:false,wasOnGround:false,jumpsLeft:2,trail:[],
    hp:100, maxHp:100,
    invincTimer:0,facing:1,
    char:idx%CHARACTERS.length,
    cameraX:0,
    dash:makeDash(),
    skills: JSON.parse(JSON.stringify(SKILLS)),
    guns: JSON.parse(JSON.stringify(GUNS)),
    curGun: 0,
    keymap,
    jumpHeld:false,dashHeld:false,fireHeld:false,fireTimer:0,
    qHeld:false,rHeld:false,
    mouseX:600,mouseY:340,
  };
}
let players=[];
// `player` is an alias to players[0] kept for legacy code paths and skill effects (P1 origin).
let player=null;

// Mouse (P1 only); pointer-shoot also fires P1 in 1P mode.
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();if(players[0]){players[0].mouseX=e.clientX-r.left;players[0].mouseY=e.clientY-r.top;}});
canvas.addEventListener('mousedown',e=>{if(e.button===0&&players[0]){players[0].fireHeld=true;tryShoot(players[0]);}});
canvas.addEventListener('mouseup',e=>{if(e.button===0&&players[0])players[0].fireHeld=false;});

let platforms=[],obstacles=[],collectibles=[],bullets=[],enemyBullets=[];
let shieldTimer=0,freezeTimer=0,overdriveTmr=0;
let keys={},keyCodes={},touch={l:false,r:false,jp:false,sh:false,ds:false,fi:false,fr:false};
let portal=null;

// ──────────────────────────────────────────────
// UI
// ──────────────────────────────────────────────
function showPanel(id){hideAllPanels();const e=document.getElementById(id);if(e)e.style.display='block';}
function hidePanel(id){const e=document.getElementById(id);if(e)e.style.display='none';}
function hideAllPanels(){['menuPanel','modePanel','howPanel','settingsPanel','readmePanel','shopPanel','lcPanel','goPanel','pausePanel'].forEach(i=>{const e=document.getElementById(i);if(e)e.style.display='none';});}

let selModeIdx=0,selDiffIdx=1;
function selMode(i){
  selModeIdx=i;
  ['mc0','mc1'].forEach((id,j)=>document.getElementById(id).className='mode-card'+(j===i?' sel':''));
}
function selDiff(i){
  selDiffIdx=i;
  ['dc0','dc1','dc2','dc3'].forEach((id,j)=>{
    const el=document.getElementById(id);
    const cls=['easy','normal','hard','pro'][j];
    el.className='dc '+cls+(j===i?' sel':'');
  });
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

// ──────────────────────────────────────────────
// LEVEL INIT
// ──────────────────────────────────────────────
function initLevel(){
  // Platforms are regenerated procedurally each level; flag for re-send to the guest.
  if(typeof Net!=='undefined'&&Net.invalidatePlatforms)Net.invalidatePlatforms();
  const D=DIFFS[diffIdx];
  // Reset every player's per-frame state
  players.forEach((p,i)=>{
    p.x=80+i*60;p.y=520;p.vx=0;p.vy=0;p.trail=[];p.onGround=false;p.jumpsLeft=2;p.wasOnGround=false;
    p.jumpHeld=false;p.dashHeld=false;p.fireHeld=false;p.fireTimer=0;
    p.dash=makeDash();
    p.invincTimer=0;p.cameraX=0;
  });
  shieldTimer=0;freezeTimer=0;overdriveTmr=0;
  history=[];
  levelKills=0;bullets=[];enemyBullets=[];
  Combo.reset();

  const lo=LAYOUTS[(level-1)%LAYOUTS.length];
  platforms=lo.map(p=>({x:p.x,y:p.y,width:p.w,height:p.h}));
  // Extend ground across the full world so the wider map is traversable
  platforms.push({x:1200,y:650,width:WORLD_W-1200,height:50});
  // Procedurally scatter platforms in the extended region
  let px=1280;
  while(px<WORLD_W-260){
    const py=200+Math.floor(Math.random()*340);
    const pw=140+Math.floor(Math.random()*200);
    platforms.push({x:px,y:py,width:pw,height:18});
    px+=pw+90+Math.floor(Math.random()*180);
  }

  const baseSpeed=1.4+(level-1)*.2;
  const speed=baseSpeed*D.speedM;
  const cnt=4+Math.floor((level-1)*1.6)+Math.floor(D.speedM*2);
  const types=['basic','basic','chaser','spinner','tank'];

  obstacles=[];
  for(let i=0;i<cnt;i++){
    let ox,oy;
    do{ox=300+Math.random()*(WORLD_W-500);oy=140+Math.random()*380;}while(ox<260&&oy>480);
    const tIdx=Math.min(types.length-1,0|Math.random()*(Math.min(types.length,level)));
    const tp=types[tIdx];
    const hp=(tp==='tank'?4:tp==='chaser'?2:1)*D.hpM;
    const w=tp==='tank'?50:34+Math.random()*14,h=tp==='tank'?50:34+Math.random()*14;
    obstacles.push({x:ox,y:oy,width:w,height:h,
      vx:(Math.random()<.5?1:-1)*speed*(0.7+Math.random()*.6),
      vy:(Math.random()<.5?1:-1)*speed*(0.5+Math.random()*.5),
      glow:Math.random()*Math.PI*2,rot:0,type:tp,hp,maxHp:hp,
      frozenT:0,shootTimer:0|Math.random()*180,
      color:tp==='tank'?'#880000':tp==='chaser'?'#ff6600':tp==='spinner'?'#cc00ff':'#ff0055'});
  }

  enemiesLeft=cnt;

  // Portal — placed at the far right end of the wider world. Locked when difficulty has portalFree=false (HARD/PRO).
  portalLocked=!D.portalFree;
  portal={x:WORLD_W-130,y:535,width:70,height:110,rot:0,pt:0,locked:portalLocked};

  // Collectibles (orbs) — scattered across full world
  collectibles=[];
  const orbCnt=8+level*2;
  for(let i=0;i<orbCnt;i++){
    collectibles.push({x:120+Math.random()*(WORLD_W-240),y:100+Math.random()*490,r:10,collected:false,pulse:Math.random()*Math.PI*2,
      type:Math.random()<.15?'plasma':Math.random()<.12?'timeammo':(Math.random()<.15?'heal':'score')});
  }

  // Ammo bonus from difficulty
  players.forEach(p => {
    p.guns[1].ammo=Math.min(p.guns[1].maxAmmo,p.guns[1].ammo+D.ammoBonus);
    p.guns[2].ammo=Math.min(p.guns[2].maxAmmo,p.guns[2].ammo+Math.floor(D.ammoBonus*.67));
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
  if(gTime-gun.lastShot<gun.rof)return;
  if(gun.ammo!==Infinity&&gun.ammo<=0){
    FT.add(p.x+16,p.y,'NO AMMO!','#ff0055',16);return;
  }
  gun.lastShot=gTime;
  if(gun.ammo!==Infinity)gun.ammo--;

  const px=p.x+p.width/2,py=p.y+p.height/2;
  // Auto-aim: lock onto nearest enemy. Fall back to mouse (P1 only) or facing direction.
  const tgt=findAimTarget(px,py);
  let dx,dy;
  if(tgt){dx=tgt.x-px;dy=tgt.y-py;}
  else if(p.keymap.useMouse){dx=(p.mouseX+p.cameraX)-px;dy=p.mouseY-py;}
  else{dx=p.facing;dy=0;}
  const d=Math.hypot(dx,dy)||1;
  const vx=dx/d*gun.speed,vy=dy/d*gun.speed;
  bullets.push({x:px,y:py,vx,vy,dmg:gun.dmg,color:gun.color,sz:gun.sz,pierce:gun.pierce,freeze:gun.freeze,life:1,gun:p.curGun,pIndex:p.pid});
  if(p.curGun===0)AU.shoot();else if(p.curGun===1)AU.plasmaShoot();else AU.timeShoot();
}

function findAimTarget(px,py){
  let best=null,bestD=Infinity;
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
function useSkill(i, pIndex=0){
  const p=players[pIndex];
  if(!p)return;
  const sk=p.skills[i];
  if(sk.cd>0)return;
  sk.cd=sk.maxCd;
  if(i===0){ // Shield Pulse — emanates from P, push enemies away from BOTH players
    shieldTimer=sk.activeDur;
    PS.shieldPulse(p.x+16,p.y+16);
    obstacles.forEach(ob=>{
      let bestDx=0,bestDy=0,bestD=Infinity;
      players.forEach(pl=>{const dx=(ob.x+ob.width/2)-(pl.x+16),dy=(ob.y+ob.height/2)-(pl.y+16),d=Math.hypot(dx,dy)||1;if(d<bestD){bestD=d;bestDx=dx/d;bestDy=dy/d;}});
      const f=300/Math.max(1,bestD);
      ob.vx+=bestDx*f*.15;ob.vy+=bestDy*f*.1;
    });
    AU.shield();FT.add(p.x+16,p.y,'SHIELD PULSE!','#00f5ff',20,true);SFX.fc='rgba(0,245,255,1)';SFX.fa=.2;
  }else if(i===1){ // Time Bomb
    freezeTimer=240;
    PS.freezeArea(p.x+16,p.y+16);
    AU.freeze();FT.add(p.x+16,p.y,'FREEZE!','#66aaff',22,true);SFX.fc='rgba(100,150,255,1)';SFX.fa=.25;
  }else if(i===2){ // Overdrive
    overdriveTmr=sk.activeDur;
    AU.overdrive();FT.add(p.x+16,p.y,'OVERDRIVE!','#ffcc00',24,true);SFX.fc='rgba(255,200,0,1)';SFX.fa=.25;
  }
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
  const ddir=left?-1:right?1:(p.vx<0?-1:1);
  if(dashKey&&!p.dashHeld){
    if(p.dash.charges>0&&!p.dash.active){p.dash.charges--;p.dash.active=true;p.dash.timer=p.dash.dur;p.dash.dir=ddir;AU.dash();PS.dashBurst(p.x+16,p.y+16,ddir);FT.add(p.x+16,p.y,'DASH!','#00f5ff',14);}
    p.dashHeld=true;
  }
  if(!dashKey)p.dashHeld=false;
  if(shootKey){p.fireTimer++;if(p.fireTimer%p.guns[p.curGun].rof===1)tryShoot(p);}else{p.fireTimer=0;}
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
    if(isKey(km.charPrev))switchCharacter(p,-1);
    if(isKey(km.charNext))switchCharacter(p,1);
    if(isKey(km.rewind))rewindTime();
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
  if(!aabb(pl.x,pl.y,pl.width,pl.height,plat.x,plat.y,plat.width,plat.height))return;
  const oL=(pl.x+pl.width)-plat.x,oR=(plat.x+plat.width)-pl.x,oT=(pl.y+pl.height)-plat.y,oB=(plat.y+plat.height)-pl.y;
  const mx=Math.min(oL,oR),my=Math.min(oT,oB);
  if(my<mx){if(oT<oB){pl.y=plat.y-pl.height;if(pl.vy>0){pl.vy=0;pl.onGround=true;pl.jumpsLeft=2;}}else{pl.y=plat.y+plat.height;if(pl.vy<0)pl.vy=0;}}
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
  obstacles.splice(idx,1);
  SFX.good();
  // Drop ammo and heals
  if(Math.random()<.45){
    const tp=Math.random()<.4?'plasma':Math.random()<.5?'timeammo':'heal';
    collectibles.push({x:obs.x+obs.width/2,y:obs.y,r:10,collected:false,pulse:0,type:tp});
  }
  // Portal unlocks when all enemies are killed (combat-style behavior, always-on)
  if(portal.locked&&enemiesLeft===0){
    portal.locked=false;
    const cx=players[0]?players[0].cameraX:0;
    SFX.clear();FT.add(cx+canvas.width/2,canvas.height/2,'PORTAL UNLOCKED!','#00f5ff',32,true);
  }
}

function updatePhysics(){
  gTime++;
  const D=DIFFS[diffIdx];
  const ts=timeShift?.28:1.0;
  const grav=.56;

  // Per-player motion, trail, platforms, world bounds, fall, invincibility, camera.
  // Split-screen halves the viewport only when there are two local players. Online 2P uses
  // a single full-width viewport on each peer.
  const isSplit=(playerCount===2&&!Net.role);
  const viewW=isSplit?canvas.width/2:canvas.width;
  players.forEach(p=>{
    if(p.dash.active)p.vx=p.dash.dir*p.dash.spd;
    p.vy+=grav*ts;p.x+=p.vx*ts;p.y+=p.vy*ts;
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
    if(p.x<0){p.x=0;p.vx=0;}
    if(p.x+p.width>WORLD_W){p.x=WORLD_W-p.width;p.vx=0;}
    if(p.y>canvas.height+60){SFX.hit();AU.hit();p.hp-=18;p.x=80;p.y=400;p.vy=0;p.vx=0;p.jumpsLeft=2;FT.add(p.x+16,p.y,'-18 FALL!','#ff0055',20,true);}

    if(p.invincTimer>0)p.invincTimer--;

    // Per-player camera
    const tcx=Math.max(0,Math.min(WORLD_W-viewW,p.x+p.width/2-viewW/2));
    p.cameraX+=(tcx-p.cameraX)*0.14;
  });

  if(overdriveTmr>0)overdriveTmr--;
  if(shieldTimer>0)shieldTimer--;
  if(freezeTimer>0)freezeTimer--;

  // Skills cooldown
  players.forEach(p => {
    p.skills.forEach(sk=>{if(sk.cd>0)sk.cd--;});
  });

  const fts=freezeTimer>0?0:ts;

  // BULLETS (player)
  bullets=bullets.filter(b=>{
    b.x+=b.vx;b.y+=b.vy;b.life-=.012;
    if(b.x<0||b.x>WORLD_W||b.y<0||b.y>canvas.height||b.life<=0)return false;
    let hit=false;
    for(let i=obstacles.length-1;i>=0;i--){
      const ob=obstacles[i];
      if(aabb(b.x-b.sz,b.y-b.sz,b.sz*2,b.sz*2,ob.x,ob.y,ob.width,ob.height)){
        ob.hp-=b.dmg;
        PS.bulletHit(b.x,b.y,b.color);
        if(b.freeze&&ob.frozenT===0){ob.frozenT=180;FT.add(ob.x+ob.width/2,ob.y,'FROZEN!','#66aaff',14);}
        if(ob.hp<=0)killEnemy(ob,i);
        else{SFX.fa=.05;SFX.fc='rgba(255,150,0,1)';}
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
        players.forEach(pl=>{const dd=Math.hypot((pl.x+16)-(ob.x+ob.width/2),(pl.y+16)-(ob.y+ob.height/2));if(dd<bestD){bestD=dd;target=pl;}});
        const dx=(target.x+16)-(ob.x+ob.width/2),dy=(target.y+16)-(ob.y+ob.height/2),d=Math.hypot(dx,dy)||1;
        enemyBullets.push({x:ob.x+ob.width/2,y:ob.y+ob.height/2,vx:dx/d*5,vy:dy/d*5,life:1});
      }
    });
  }
  enemyBullets=enemyBullets.filter(b=>{
    b.x+=b.vx;b.y+=b.vy;b.life-=.008;
    if(b.x<0||b.x>WORLD_W||b.y<0||b.y>canvas.height||b.life<=0)return false;
    // Check hit against any player
    for(const pl of players){
      if(pl.invincTimer>0||shieldTimer>0||overdriveTmr>0)continue;
      if(aabb(b.x-5,b.y-5,10,10,pl.x,pl.y,pl.width,pl.height)){
        pl.hp-=6;pl.invincTimer=30;SFX.hit(false);AU.hit();PS.hitBlast(pl.x+16,pl.y+16,false);FT.add(pl.x+16,pl.y,'−6','#ff0055',20,true);Combo.reset();return false;
      }
    }
    return true;
  });

  // OBSTACLES movement + multi-player collision
  obstacles.forEach((obs,i)=>{
    if(obs.frozenT>0){obs.frozenT--;return;}
    if(obs.type==='chaser'){
      // Chase the closest player
      let target=players[0],bestD=Infinity;
      players.forEach(pl=>{const dd=Math.hypot(pl.x-obs.x,pl.y-obs.y);if(dd<bestD){bestD=dd;target=pl;}});
      const dx=target.x-obs.x,dy=target.y-obs.y,d=Math.hypot(dx,dy)||1;
      if(d<400){obs.vx+=(dx/d)*.07*ts;obs.vy+=(dy/d)*.05*ts;}
      obs.vx=Math.max(-7,Math.min(7,obs.vx));obs.vy=Math.max(-6,Math.min(6,obs.vy));
    }
    if(obs.type==='spinner')obs.rot+=(fts*.09);
    obs.x+=obs.vx*fts;obs.y+=obs.vy*fts;
    obs.glow=(obs.glow+.07)%(Math.PI*2);
    if(obs.x<0||obs.x+obs.width>WORLD_W)obs.vx*=-1;
    if(obs.y<40||obs.y+obs.height>640)obs.vy*=-1;
    // Touch damage on any player
    players.forEach(pl=>{
      if(pl.invincTimer>0||shieldTimer>0||overdriveTmr>0)return;
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
        FT.add(col.x,col.y,'+'+pts,m>2?'#ffcc00':m>1?'#a100ff':'#00f5ff',m>2?26:20,m>2);
        if(m>1){FT.add(col.x,col.y-28,'x'+m+' COMBO!','#ff6600',18,true);AU.combo(m);}
        SFX.good();
      }
    }
  });

  // Portal — any player reaching it triggers level complete
  portal.rot+=.025;portal.pt=(portal.pt+.05)%(Math.PI*2);
  if(!portal.locked){
    for(const pl of players){
      if(aabb(pl.x,pl.y,pl.width,pl.height,portal.x,portal.y,portal.width,portal.height)){triggerLevelComplete();return;}
    }
  }

  // Time shift drain removed
  // Health doesn't regen anymore automatically, handled by collectibles.
  if(players.length === 1) {
    if(players[0].hp<=0){triggerGameOver();return;}
    if((players[0].hp/players[0].maxHp)<0.2&&gTime%22===0){FT.add(players[0].cameraX+canvas.width/2,80,'⚠ CRITICAL!','#ff0055',18,true);}
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

  // Render viewport(s). 1P: full canvas. Local 2P: split. Online 2P: full canvas centred on
  // the local player.
  const isSplit=(playerCount===2&&!Net.role);
  if(Net.role){
    const localIdx=Net.role==='host'?0:1;
    const p=players[localIdx];
    if(p){
      // Make sure guest's camera tracks its own avatar even though physics is skipped.
      if(Net.role==='guest'){
        const tcx=Math.max(0,Math.min(WORLD_W-canvas.width,p.x+p.width/2-canvas.width/2));
        p.cameraX+=(tcx-p.cameraX)*.14;
      }
      ctx.save();ctx.translate(-p.cameraX,0);drawWorld(p);ctx.restore();
      // Tag for the local player at the top
      ctx.save();ctx.font='bold 12px Segoe UI';
      const ch=CHARACTERS[p.char];
      ctx.fillStyle=ch.c1;ctx.shadowColor=ch.glow;ctx.shadowBlur=8;
      ctx.fillText((Net.role==='host'?'YOU (HOST) · ':'YOU (GUEST) · ')+ch.name,12,20);
      ctx.restore();
    }
  }else{
    const viewW=isSplit?canvas.width/2:canvas.width;
    players.forEach((p,idx)=>{
      const vx=idx*viewW;
      ctx.save();
      ctx.beginPath();ctx.rect(vx,0,viewW,canvas.height);ctx.clip();
      ctx.translate(vx-p.cameraX,0);
      drawWorld(p);
      ctx.restore();
    });
    if(isSplit){
      ctx.save();ctx.fillStyle='rgba(161,0,255,.85)';ctx.shadowColor='#a100ff';ctx.shadowBlur=12;
      ctx.fillRect(canvas.width/2-1,0,2,canvas.height);ctx.restore();
      ctx.save();ctx.font='bold 11px Segoe UI';
      const c1=CHARACTERS[players[0].char],c2=CHARACTERS[players[1].char];
      ctx.fillStyle=c1.c1;ctx.shadowColor=c1.glow;ctx.shadowBlur=8;ctx.fillText('P1 · '+c1.name,10,18);
      ctx.fillStyle=c2.c1;ctx.shadowColor=c2.glow;ctx.shadowBlur=8;ctx.fillText('P2 · '+c2.name,canvas.width/2+10,18);
      ctx.restore();
    }
  }

  SFX.drawFlash(ctx,canvas.width,canvas.height);

  // Status labels (screen-fixed)
  if(timeShift){ctx.save();ctx.shadowColor='#a100ff';ctx.shadowBlur=14;ctx.fillStyle='rgba(200,100,255,.95)';ctx.font='bold 12px Segoe UI';ctx.textAlign='center';ctx.fillText('⏱ TIME SHIFT',canvas.width/2,26);ctx.restore();}
  if(overdriveTmr>0){ctx.save();ctx.shadowColor='#ffcc00';ctx.shadowBlur=14;ctx.fillStyle='rgba(255,200,0,.95)';ctx.font='bold 12px Segoe UI';ctx.textAlign='center';ctx.fillText('⚡ OVERDRIVE '+Math.ceil(overdriveTmr/60)+'s',canvas.width/2,42);ctx.restore();}
  if(enemiesLeft>0){ctx.fillStyle='rgba(255,0,85,.85)';ctx.font='bold 13px Segoe UI';ctx.textAlign='center';ctx.fillText('ENEMIES LEFT: '+enemiesLeft,canvas.width/2,canvas.height-8);ctx.textAlign='left';}

  // Mini-map (single, screen-bottom-center). Shows both players.
  const mmW=240,mmH=8,mmX=(canvas.width-mmW)/2,mmY=canvas.height-22;
  ctx.save();ctx.fillStyle='rgba(10,10,30,.75)';ctx.fillRect(mmX,mmY,mmW,mmH);
  ctx.strokeStyle='rgba(161,0,255,.45)';ctx.lineWidth=1;ctx.strokeRect(mmX,mmY,mmW,mmH);
  obstacles.forEach(ob=>{const mpx=mmX+(ob.x/WORLD_W)*mmW;ctx.fillStyle=ob.color;ctx.fillRect(mpx-1,mmY+1,2,mmH-2);});
  ctx.fillStyle=portal.locked?'#ff0055':'#00f5ff';
  ctx.fillRect(mmX+(portal.x/WORLD_W)*mmW-2,mmY-1,4,mmH+2);
  players.forEach(p=>{const ch=CHARACTERS[p.char];ctx.fillStyle=ch.c1;ctx.fillRect(mmX+(p.x/WORLD_W)*mmW-2,mmY-2,4,mmH+4);});
  ctx.restore();

  ctx.restore();
}

// Draws the entire world from the perspective of `viewer` — used per viewport in split-screen.
function drawWorld(viewer){
  // Platforms
  platforms.forEach(p=>{
    const g=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.height);
    g.addColorStop(0,'#1e0f3a');g.addColorStop(1,'#0c061e');
    ctx.fillStyle=g;ctx.fillRect(p.x,p.y,p.width,p.height);
    ctx.save();ctx.shadowColor='rgba(161,0,255,.5)';ctx.shadowBlur=5;
    ctx.strokeStyle='rgba(161,0,255,.4)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+p.width,p.y);ctx.stroke();
    ctx.strokeStyle='rgba(0,245,255,.12)';ctx.lineWidth=1;ctx.strokeRect(p.x,p.y,p.width,p.height);ctx.restore();
  });

  // Portal
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

  // Collectibles
  collectibles.forEach(c=>{
    if(c.collected)return;
    const r=c.r+Math.sin(c.pulse)*3;
    const col=c.type==='plasma'?'#00f5ff':c.type==='timeammo'?'#a100ff':c.type==='heal'?'#ff00d4':'#ff0055';
    ctx.save();ctx.shadowColor=col;ctx.shadowBlur=16;
    const cg=ctx.createRadialGradient(c.x,c.y,2,c.x,c.y,r);cg.addColorStop(0,'#fff');cg.addColorStop(1,col+'88');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(c.x,c.y,r,0,Math.PI*2);ctx.fill();
    if(c.type!=='score'){ctx.fillStyle=col;ctx.font='bold 10px Segoe UI';ctx.textAlign='center';ctx.fillText(c.type==='plasma'?'P':c.type==='heal'?'H':'T',c.x,c.y+3);ctx.textAlign='left';}
    ctx.restore();
  });

  // Enemy bullets
  enemyBullets.forEach(b=>{
    ctx.save();ctx.globalAlpha=b.life;ctx.shadowColor='#ff0055';ctx.shadowBlur=12;
    ctx.fillStyle='#ff0055';ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();ctx.restore();
  });

  // Player bullets
  bullets.forEach(b=>{
    const gun=GUNS[b.gun];
    ctx.save();ctx.globalAlpha=b.life;ctx.shadowColor=gun.color;ctx.shadowBlur=14;
    ctx.fillStyle=gun.color;ctx.beginPath();ctx.arc(b.x,b.y,gun.sz,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=b.life*.35;ctx.fillStyle=gun.color;ctx.beginPath();ctx.arc(b.x-b.vx*2,b.y-b.vy*2,gun.sz*.7,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });

  // Obstacles
  obstacles.forEach(obs=>{
    const gl=Math.sin(obs.glow)*.5+.5;
    ctx.save();ctx.translate(obs.x+obs.width/2,obs.y+obs.height/2);
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
    ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(pl.x+6,pl.y+8,7,6);ctx.fillRect(pl.x+pl.width-13,pl.y+8,7,6);
    ctx.fillStyle='#000814';ctx.fillRect(pl.x+8,pl.y+9,4,4);ctx.fillRect(pl.x+pl.width-11,pl.y+9,4,4);
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
    if(shieldTimer>0){ctx.shadowColor='#00f5ff';ctx.shadowBlur=18;ctx.strokeStyle=`rgba(0,245,255,${.4+Math.sin(gTime*.15)*.3})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(pl.x+16,pl.y+16,pl.width/2+10,pl.height/2+10,0,0,Math.PI*2);ctx.stroke();}
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
  cycleWeapon:['__netWP'], charPrev:[], charNext:['__netCH'],
  rewind:[],
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
      ch:anyKey(['z','Z','v','V']),
    };
  },
  sendInput(){if(this.conn&&this.conn.open)this.conn.send({t:'i',d:this.captureLocalInput()});},
  // Stamp Net.remoteInput onto the synthetic key names so isKey/anyKey see them.
  applyRemoteToKeys(){
    const ri=this.remoteInput;
    keys['__netL']=!!ri.l; keys['__netR']=!!ri.r; keys['__netJ']=!!ri.j;
    keys['__netSH']=!!ri.sh; keys['__netF']=!!ri.f;
    keys['__netSK1']=!!ri.sk1; keys['__netSK2']=!!ri.sk2; keys['__netSK3']=!!ri.sk3;
    keys['__netWP']=!!ri.wp; keys['__netCH']=!!ri.ch;
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
      })),
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
      // Maintain a short trail locally so guest visuals stay smooth.
      p.trail.push({x:p.x,y:p.y,a:1,dash:p.dash.active});
      if(p.trail.length>14)p.trail.shift();
      p.trail.forEach(t=>{t.a-=p.dash.active?.06:.08;});
      applyCharacter(p);
    });
    obstacles=s.ob;bullets=s.bl;enemyBullets=s.eb;collectibles=s.cl;
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
  state='levelcomplete';AU.levelOK();PS.portalVortex(portal.x+35,portal.y+55);SFX.clear();
  level++;score+=500;rewinds=Math.min(8,rewinds+1);
  const orbs=collectibles.filter(c=>c.collected).length;
  document.getElementById('lcScore').textContent=score;
  document.getElementById('lcDetail').textContent=orbs+' orbs · '+levelKills+' kills';
  showPanel('lcPanel');
}

function openShop(){
  document.getElementById('shopScore').textContent=score;
  document.getElementById('shopKills').textContent=totalKills;
  buildShop();showPanel('shopPanel');
}

function continueLevel(){
  hideAllPanels();state='playing';initLevel();AU.jump();loop();
}

function triggerGameOver(){
  state='gameover';AU.gameOver();SFX.hit(true);
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
  players.forEach(p=>{p.hp=p.maxHp;p.guns[1].ammo=0;p.guns[2].ammo=0;applyCharacter(p);});
  state='playing';initLevel();AU.jump();loop();
}

function toMenu(){
  clearInterval(lcTimer);cancelAnimationFrame(animId);
  saveBest();level=1;score=0;rewinds=3;totalKills=0;state='menu';
  // Tear down any active peer connection cleanly so we don't leak data channels.
  if(Net.conn){try{Net.conn.close();}catch(e){}Net.conn=null;}
  Net.role=null;Net.lastState=null;Net.remoteInput={};
  if(window.location.href.includes('modules')) {
    window.location.href = '../index.html';
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
    // Menu picks: 0 → solo, 1 → online 2P (per the current build's "2 PLAYERS" card). The
    // local split-screen page (2-person.html) is still reachable by direct URL.
    const target = selModeIdx===1?'online-2p.html':selModeIdx===2?'2-person.html':'1-person.html';
    window.location.href = 'modules/' + target + '?diff=' + selDiffIdx;
    return;
  }
  gameMode=selModeIdx;diffIdx=selDiffIdx;
  const D=DIFFS[diffIdx];

  players=[];
  if(playerCount===1){
    players.push(createPlayer(0,KEYMAP_1P));
  }else if(Net.role){
    // Online 2P. Host's P2 reads remote input via the synthetic keymap; the guest doesn't
    // simulate so its keymaps are placeholders.
    if(Net.role==='host'){
      players.push(createPlayer(0,KEYMAP_1P));
      players.push(createPlayer(1,KEYMAP_ONLINE_REMOTE));
    }else{
      players.push(createPlayer(0,KEYMAP_1P));
      players.push(createPlayer(1,KEYMAP_1P));
    }
    players[1].char=1%CHARACTERS.length;
  }else{
    players.push(createPlayer(0,KEYMAP_2P_P1));
    players.push(createPlayer(1,KEYMAP_2P_P2));
    players[1].char=1%CHARACTERS.length;
  }
  player=players[0];
  players.forEach(applyCharacter);

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
  players.forEach(p => { p.guns[1].ammo=0; p.guns[2].ammo=0; p.speed=5.2; });
  state='playing';
  switchWeapon(0, 0);
  if (playerCount === 2) switchWeapon(0, 1);
  initLevel();loop();
}

// ──────────────────────────────────────────────
// KEYBOARD
// ──────────────────────────────────────────────
document.addEventListener('keydown',e=>{
  keys[e.key]=true;keyCodes[e.code]=true;
  if(state==='playing'&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','/','Enter'].includes(e.key))e.preventDefault();
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
