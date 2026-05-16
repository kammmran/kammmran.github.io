# CHRONO SHIFT — Character Redesign + Coins & Upgrades

## Context

The current build has 6 characters (NEON, CRIMSON, EMERALD, VOID, AEGIS, LIFTER) but they all play the same — they share one global `SKILLS` array (Shield Pulse / Time Bomb / Overdrive) and all render as the same 32×32 colored rectangle with identical eyes. The only real difference is `speedM`, `jumpM`, and (for AEGIS/LIFTER) a co-op move on the G/L key. There's also no progression — every run starts from scratch.

The user wants character choice to actually matter, AND a meta-progression layer:

1. **Each character gets a fully unique 3-skill kit.** 18 skills total. AEGIS and LIFTER keep their existing G/L co-op move separate (so they have 4 abilities total — 3 skills + 1 co-op).
2. **Each character gets a visually distinct silhouette.** Shape + accessory + unique face/eyes. Hitbox stays 32×32 for physics consistency, but the rendered art can extend a few pixels beyond.
3. **Remove the in-game character-cycle keys.** The lobby (added in the previous task) is the only place a character is chosen. Z/V, Tab/\`, and '/\ stop swapping characters mid-run. The `switchCharacter()` function is deleted entirely.
4. **Coins + persistent per-character upgrades.** Players earn coins from kills, orbs, and level completes. Coins are shared across all characters but **upgrades are per-character** — upgrading NEON's speed does NOT upgrade CRIMSON's speed. 5 upgrade tracks per character (HP, Speed, Jump, Damage, Dash) × 5 tiers each. Prices scale per tier. Everything persists in `localStorage`.

Outcome: characters feel meaningfully different in solo and co-op play, the visual difference is readable at a glance, the lobby pick is a real commitment, and there's a real reason to come back between runs.

---

## Files to modify

- [script.js](script.js) — Most of the work lands here:
  - `CHARACTERS` array (extend with per-char `skills` + `art` fields).
  - `useSkill()` rewrite (dispatch by skill `id` not slot index).
  - `drawPlayer()` (per-character art block).
  - `createPlayer()` / `applyCharacter()` (clone skills from character).
  - Keymap entries (drop `charPrev`/`charNext`).
  - `handleInput()` (drop the `switchCharacter` dispatch lines).
  - Delete `switchCharacter()` and the global `SKILLS` array.
  - Add `refreshSkillHUD()` called at game start.
  - Drop `Tab` / `'` / `\` from the preventDefault key list.
  - NEW: `Upgrades` storage object (load/save coins + per-char upgrade tiers in localStorage).
  - NEW: `applyUpgrades(p)` runs after `applyCharacter` to bump maxHp/speed/jump/dash/dmgBonus.
  - NEW: `tryShoot` adds `p.dmgBonus` to bullet `dmg`.
  - NEW: coin awards in `killEnemy()` (per-kill coins), in score-orb pickup (per-orb coins), and in `triggerLevelComplete()` (per-level bonus).
  - NEW: `openUpgrades(charIdx)` / `buyUpgrade(charIdx, track)` and a `buildUpgradePanel()` populator.
- [game.html](game.html) — Manual section: drop the cycle-key rows; replace the existing CHARACTERS blurb with a per-character skill list; lobby character cards get an "UPGRADE" button; new `upgradePanel` panel HTML.
- [modules/1-person.html](modules/1-person.html), [modules/2-person.html](modules/2-person.html), [modules/online-2p.html](modules/online-2p.html) — Skill bar `sk-icon` / `sk-key` / `title` get updated by JS at game start; new HUD `COINS` chip; drop any `Z/V` controls-hint copy.
- [style.css](style.css) — Minor: button styling for the lobby "UPGRADE" button; styling for the upgrade panel's tier dots.

No new files.

---

## Part 1 — Per-character skill kits

### Data model

Replace the shared `SKILLS` global ([script.js:128-132](script.js#L128-L132)) with a per-character `skills` field on each `CHARACTERS` entry. Each skill object:

```js
{ id: 'shieldPulse', name: 'Shield Pulse', icon: '🛡', maxCd: 480, cd: 0,
  /* skill-specific params: dur, radius, dmg, etc. */ }
```

`cd: 0` is the runtime cooldown counter; everything else is config. Player creation clones the whole array per player so each player has their own cooldowns.

### Skill kits (18 total)

**NEON — balanced "default" hero:**

| Slot | id | Name | Effect | Cooldown |
| --- | --- | --- | --- | --- |
| 1 | `shieldPulse` | Shield Pulse | Sets global `shieldTimer=60` + pushes obstacles away from all players (existing). | 480 |
| 2 | `timeBomb` | Time Bomb | Sets global `freezeTimer=240` — freezes all enemies for 4s (existing). | 720 |
| 3 | `overdrive` | Overdrive | Sets global `overdriveTmr=180` — 2× speed, 1.2× jump for 3s (existing). | 900 |

**CRIMSON — fast strike specialist:**

| Slot | id | Name | Effect | Cooldown |
| --- | --- | --- | --- | --- |
| 1 | `bladeBurst` | Blade Burst | Refill all 3 dash charges + 30f invuln on self. | 540 |
| 2 | `flameTrail` | Flame Trail | For 240f, leaves a damaging trail (1 dmg/frame to enemies touching it). | 600 |
| 3 | `adrenaline` | Adrenaline | For 240f, fire rate × 1.5 (each gun's effective `rof` × 0.66) AND dash recharge speed × 2. Distinct from Overdrive — combat tempo, not move speed. | 900 |

**EMERALD — nature / heal specialist:**

| Slot | id | Name | Effect | Cooldown |
| --- | --- | --- | --- | --- |
| 1 | `bloomHeal` | Bloom Heal | Heals self +25 hp and any player within 200px for +25 hp. | 720 |
| 2 | `vineSnare` | Vine Snare | Drops an 80×60 snare field at player feet for 180f. Enemies inside have `vx*=0.3`, `vy=Math.min(vy,0)`. | 540 |
| 3 | `skyLeap` | Sky Leap | Instant `vy=-22`, refill `jumpsLeft=2`. Mega-jump that ignores gravity for one frame. | 480 |

**VOID — mysterious / control specialist:**

| Slot | id | Name | Effect | Cooldown |
| --- | --- | --- | --- | --- |
| 1 | `phaseShift` | Phase Shift | For 90f, player gets `invincTimer=90`. Visually rendered as ghost/translucent. | 600 |
| 2 | `voidBomb` | Void Bomb | Radial damage: every enemy within 200px of player takes 4 dmg. Particle burst. | 720 |
| 3 | `singularity` | Singularity | For 120f, all enemies within 300px of an anchor point (player position at cast) get pulled in. | 900 |

**AEGIS — defensive co-op specialist (keeps G key co-op too):**

| Slot | id | Name | Effect | Cooldown |
| --- | --- | --- | --- | --- |
| 1 | `bulwark` | Bulwark | Sets `p.shieldedBy = max(p.shieldedBy, 180)` — long self-shield, no pushback. | 420 |
| 2 | `reflectWave` | Reflect Wave | For 90f, enemy bullets overlapping the player flip into friendly bullets (reverse `vx,vy`, recolor). | 720 |
| 3 | `groupAegis` | Group Aegis | Sets `shieldedBy = 90` on ALL players simultaneously — the team save button. | 1080 |

*+ G (co-op): unchanged — shields the nearest partner for 120f if within 220px range.*

**LIFTER — mobility co-op specialist (keeps G key co-op too):**

| Slot | id | Name | Effect | Cooldown |
| --- | --- | --- | --- | --- |
| 1 | `updraft` | Updraft | `vy = -18` on self AND on any player within 100px. Also refills double-jump for those affected. | 540 |
| 2 | `stomp` | Stomp | Launch self down (`vy = 20`). On next ground touch, all enemies within 200px take 3 dmg and get knocked back. Set `p.stompPending = true`; on `onGround && !wasOnGround && p.stompPending`, trigger the AoE and clear the flag. | 600 |
| 3 | `catapultPulse` | Catapult Pulse | All enemies within 250px of player get `vy = -25` (yeets them upward). | 900 |

*+ G (co-op): unchanged — boosts nearest partner upward if within 90px.*

### useSkill() rewrite

Replace the index-based branch in `useSkill(i, pIndex)` ([script.js:783-807](script.js#L783-L807)) with an id-based dispatch:

```js
function useSkill(i, pIndex=0){
  const p=players[pIndex]; if(!p)return;
  const sk=p.skills[i]; if(!sk||sk.cd>0)return;
  sk.cd=sk.maxCd;
  SKILL_EFFECTS[sk.id]?.(p,sk);
}

const SKILL_EFFECTS = {
  shieldPulse:  (p,sk) => { shieldTimer=60;  PS.shieldPulse(p.x+16,p.y+16); /* pushback loop */ },
  timeBomb:     (p,sk) => { freezeTimer=240; PS.freezeArea(p.x+16,p.y+16); },
  overdrive:    (p,sk) => { overdriveTmr=180; },
  bladeBurst:   (p,sk) => { p.dash.charges=p.dash.maxCh; p.invincTimer=Math.max(p.invincTimer,30); },
  flameTrail:   (p,sk) => { p.flameTrailT=240; },
  adrenaline:   (p,sk) => { p.adrenalineT=240; },
  bloomHeal:    (p,sk) => { /* heal self + nearby players */ },
  vineSnare:    (p,sk) => { snares.push({x:p.x-24,y:p.y+16,w:80,h:60,t:180}); },
  skyLeap:      (p,sk) => { p.vy=-22; p.jumpsLeft=2; },
  phaseShift:   (p,sk) => { p.invincTimer=Math.max(p.invincTimer,90); p.phaseT=90; },
  voidBomb:     (p,sk) => { /* iterate obstacles within 200px, deal 4 dmg */ },
  singularity:  (p,sk) => { singularities.push({x:p.x+16,y:p.y+16,t:120}); },
  bulwark:      (p,sk) => { p.shieldedBy=Math.max(p.shieldedBy,180); },
  reflectWave:  (p,sk) => { p.reflectT=90; },
  groupAegis:   (p,sk) => { players.forEach(pl=>pl.shieldedBy=Math.max(pl.shieldedBy,90)); },
  updraft:      (p,sk) => { /* lift self + partners within 100px */ },
  stomp:        (p,sk) => { p.vy=20; p.stompPending=true; },
  catapultPulse:(p,sk) => { /* iterate obstacles within 250px, set vy=-25 */ },
};
```

### New per-player state fields

Add to `createPlayer()`:

```js
flameTrailT: 0,
adrenalineT: 0,
phaseT: 0,
reflectT: 0,
stompPending: false,
dmgBonus: 0,        // set by applyUpgrades — added to every bullet's dmg in tryShoot
```

Reset all of these in `initLevel()` alongside the existing `coopCd` / `shieldedBy` resets.

### New global state arrays

Two new world-state arrays:

```js
let snares = [];          // [{x, y, w, h, t}]  — Vine Snare zones
let singularities = [];   // [{x, y, t}]        — VOID's singularity anchors
```

Reset in `initLevel()` alongside `bullets`/`enemyBullets`/`traps`.

### Per-frame physics ticks

In `updatePhysics()`, add tick blocks (between obstacle update and collectibles):

- **Flame Trail**: for each player with `flameTrailT > 0`, decrement and damage enemies in a 28×28 area at the player's recent trail positions.
- **Adrenaline**: while `p.adrenalineT > 0`, `tryShoot` reads an effective rof of `gun.rof * 0.66` and dash `maxCd` is treated as `maxCd * 0.5`.
- **Phase Shift**: tick `p.phaseT` down. Used only for visual translucency.
- **Reflect Wave**: in the enemy-bullet collision loop, if `p.reflectT > 0`, convert the bullet into a player bullet (negate `vx,vy`, push to `bullets[]` with `color = ch.c1`, `dmg = 1`).
- **Stomp**: on `onGround && !wasOnGround && p.stompPending`, deal 3 dmg to obstacles within 200px and knock them back; clear the flag.
- **Snares**: tick each, when `t<=0` remove. Each frame, enemies inside a snare have `vx *= 0.3` and `vy = Math.min(vy, 0)`.
- **Singularities**: tick each, enemies within 300px get a velocity nudge toward the anchor. Remove when `t<=0`.

### Cooldown tick

Already exists ([script.js:888-890](script.js#L888-L890)) — works unchanged.

---

## Part 2 — Distinct character visuals

### Data model

Add an `art` string to each character entry — the dispatch key in `drawPlayer()`:

```js
{ name:'NEON',    ..., art:'neon'    },
{ name:'CRIMSON', ..., art:'crimson' },
{ name:'EMERALD', ..., art:'emerald' },
{ name:'VOID',    ..., art:'void'    },
{ name:'AEGIS',   ..., art:'aegis'   },
{ name:'LIFTER',  ..., art:'lifter'  },
```

### drawPlayer() per-character block

After the existing body gradient + border at [script.js:1481-1484](script.js#L1481-L1484), branch on `ch.art` and render the character-specific overlay. Hitbox is unchanged; art can extend ±8px outside.

Replace the generic eye rendering at [script.js:1485-1486](script.js#L1485-L1486) with a switch on `ch.art`. Each character gets:

- **neon** — short antenna on top with a glowing tip. Eyes: round white dots with cyan pupils.
- **crimson** — sharp triangular helmet spike on top. Eyes: narrow red horizontal slits.
- **emerald** — leaf crown (three small triangles at top). Eyes: wide round white circles with green pupils.
- **void** — hooded silhouette (dark rounded arc covering upper third). Eyes: glowing yellow dots peering out. Translucent body if `p.phaseT > 0`.
- **aegis** — shoulder bumps + cyan visor bar across eye area (no separate eyes) + small shield emblem on chest.
- **lifter** — orange goggles (two larger circles with orange pupils) + jetpack flames below body when in air.

Wrap each art block in a small helper for readability:

```js
function drawCharArt(pl, ch) {
  switch (ch.art) {
    case 'neon':    drawNeon(pl, ch); break;
    case 'crimson': drawCrimson(pl, ch); break;
    // ...
  }
}
```

### Visual indicators for character state

Tied to the new skills:

- `p.flameTrailT > 0`: faint orange trail behind the player.
- `p.adrenalineT > 0`: pulsing orange aura ring.
- `p.reflectT > 0`: subtle gold ring overlay (AEGIS).
- `p.phaseT > 0`: 0.5 alpha on body fill (VOID).
- Snares + singularities render in world-space in `drawWorld()` near the traps block ([script.js:1311+](script.js#L1311)).

---

## Part 3 — Lock characters after lobby pick

### Remove in-game cycle keys

1. **Keymaps**: delete `charPrev` and `charNext` fields from all three keymaps:
   - `KEYMAP_1P` ([script.js:420](script.js#L420)).
   - `KEYMAP_2P_P1` ([script.js:433](script.js#L433)).
   - `KEYMAP_2P_P2` ([script.js:445](script.js#L445)).
   - `KEYMAP_ONLINE_REMOTE` (~line 1490): drop the `charNext:['__netCH']` field.
2. **Dispatch**: delete the two lines in `handleInput()` that call `switchCharacter`.
3. **Function**: delete `switchCharacter(p, dir)` entirely ([script.js:167-176](script.js#L167-L176)).
4. **Net captureLocalInput**: drop the `ch:` field ([script.js:1499](script.js#L1499)) and the `__netCH` line in `applyRemoteToKeys` ([script.js:1510](script.js#L1510)).
5. **preventDefault list** ([script.js:1742](script.js#L1742)): remove `'Tab'`, `"'"`, and `'\\'`. Keep arrow keys, space, and `/` (still used for game controls).

### Manual / HUD updates

In [game.html](game.html):

- Remove the `Z / V` row from the 1P manual ([game.html:113](game.html#L113)).
- Remove the `Tab / \`` ([game.html:127](game.html#L127)) and `' / \` ([game.html:135](game.html#L135)) rows from the 2P manual.
- Replace the existing CHARACTERS blurb ([game.html:140-148](game.html#L140-L148)) with a compact per-character skill summary.

If any modules have a controls hint mentioning Z/V or Tab character-cycle, drop it.

### Skill HUD: refresh on game start

The HUD's three skill slots have static icons + key labels in HTML. After `startGame()` sets up players, call `refreshSkillHUD()` to walk each player's `skills` array and update the icon, key label, and `title` of each `.sk` slot to match the now-locked character:

```js
function refreshSkillHUD(){
  refreshOneHUD(players[0], ['sk0','sk1','sk2'], playerCount===1 ? ['Q','E','R'] : ['1','2','3']);
  if(players[1]) refreshOneHUD(players[1], ['p2sk0','p2sk1','p2sk2'], ['7','8','9']);
}
function refreshOneHUD(p, slotIds, keyLabels){
  p.skills.forEach((sk,i)=>{
    const el=document.getElementById(slotIds[i]); if(!el) return;
    el.title = sk.name;
    const ic=el.querySelector('.sk-icon'); if(ic) ic.textContent = sk.icon;
    const kl=el.querySelector('.sk-key');  if(kl) kl.textContent = keyLabels[i];
  });
}
```

Called at the end of `startGame()`. Online 2P: only the local player's HUD slots get refreshed.

---

## Part 4 — applyCharacter() must clone skills

Modify `applyCharacter(p)` ([script.js:161-166](script.js#L161-L166)) to also seed the player's skill array from the character template:

```js
function applyCharacter(p){
  if(!p)return;
  const ch=CHARACTERS[p.char];
  p.speed=5.2*ch.speedM;
  p.jump=13.5*ch.jumpM;
  // Skills are owned by the character now. Clone so each player has their own cooldowns.
  p.skills = JSON.parse(JSON.stringify(ch.skills));
}
```

In `createPlayer()`, drop the existing `skills: JSON.parse(JSON.stringify(SKILLS))` line ([script.js:456](script.js#L456)) — set `skills: []` instead. The real assignment happens in `applyCharacter()` (called from `startGame()` after `p.char` is set, per [script.js:1763](script.js#L1763)).

The global `SKILLS` array becomes orphaned — delete it.

---

## Part 5 — Coins + persistent per-character upgrades

### Storage shape

Persist everything in one `localStorage` key (`csUpgrades`). One coin balance shared across all characters; an upgrade tier object PER character (keyed by character name so reordering CHARACTERS doesn't break saves):

```js
const Upgrades = {
  data: { coins: 0, chars: {} },  // chars[charName] = {hp,speed,jump,dmg,dash}, all 0-5
  TRACKS: [
    { id:'hp',    name:'Max HP',    icon:'❤',  per:15,   maxTier:5 },
    { id:'speed', name:'Speed',     icon:'💨', per:0.05, maxTier:5 },  // % multiplier
    { id:'jump',  name:'Jump',      icon:'⤴',  per:0.04, maxTier:5 },  // % multiplier
    { id:'dmg',   name:'Damage',    icon:'💥', per:0.5,  maxTier:5 },  // flat +dmg per shot
    { id:'dash',  name:'Dash',      icon:'⚡', per:1,    maxTier:5 },  // +1 max dash charge
  ],
  PRICES: [100, 250, 500, 1000, 2000],  // cost to BUY tier N (1-indexed; PRICES[N-1])
  load(){
    try{
      const raw=localStorage.getItem('csUpgrades');
      if(raw) this.data = JSON.parse(raw);
    }catch(e){ this.data = { coins: 0, chars: {} }; }
  },
  save(){ localStorage.setItem('csUpgrades', JSON.stringify(this.data)); },
  forChar(charName){
    if(!this.data.chars[charName]) this.data.chars[charName] = {hp:0,speed:0,jump:0,dmg:0,dash:0};
    return this.data.chars[charName];
  },
  addCoins(n){ this.data.coins = Math.max(0, this.data.coins + n); this.save(); },
  buy(charName, trackId){
    const t = this.TRACKS.find(x=>x.id===trackId); if(!t) return false;
    const u = this.forChar(charName);
    if(u[trackId] >= t.maxTier) return false;
    const cost = this.PRICES[u[trackId]];   // price for the NEXT tier
    if(this.data.coins < cost) return false;
    this.data.coins -= cost;
    u[trackId]++;
    this.save();
    return true;
  },
};
Upgrades.load();
```

### Apply upgrades at game start

New `applyUpgrades(p)` called from `startGame()` right after `applyCharacter(p)`:

```js
function applyUpgrades(p){
  const ch = CHARACTERS[p.char];
  const u  = Upgrades.forChar(ch.name);
  p.maxHp     = 100 + u.hp * 15;
  p.hp        = p.maxHp;
  p.speed     = p.speed * (1 + u.speed * 0.05);   // p.speed already set by applyCharacter
  p.jump      = p.jump  * (1 + u.jump  * 0.04);
  p.dash.maxCh   = 3 + u.dash;
  p.dash.charges = p.dash.maxCh;
  p.dmgBonus  = u.dmg * 0.5;
}
```

Call site in `startGame()`:

```js
players.forEach(applyCharacter);
players.forEach(applyUpgrades);   // NEW
```

### Damage bonus wired into tryShoot

In `tryShoot()` at the bullet creation site:

```js
bullets.push({..., dmg: gun.dmg + (p.dmgBonus||0), ...});
```

### Earning coins

Three sources, all small enough that grinding ~5 levels takes you through a couple of tiers:

1. **Per-kill coins** — in `killEnemy(obs, idx)`, after the score award, also:

   ```js
   const coinReward = (obs.type==='tank' ? 25 : obs.type==='chaser' ? 15 : 10) + level*2;
   Upgrades.addCoins(coinReward);
   FT.add(obs.x+obs.width/2, obs.y+12, '+'+coinReward+'🪙', '#ffd700', 16);
   ```

2. **Per-score-orb coins** — in the collectible pickup branch for `'score'` type:

   ```js
   Upgrades.addCoins(5);
   ```

3. **Level complete bonus** — in `triggerLevelComplete()`:

   ```js
   const lvlBonus = 50 + level*15 + levelKills*5;
   Upgrades.addCoins(lvlBonus);
   ```

   Show the bonus in the existing `lcDetail` element alongside the orb/kill totals.

### HUD coin counter

Add a `COINS` chip to all three module HUDs ([1-person.html](modules/1-person.html), [2-person.html](modules/2-person.html), [online-2p.html](modules/online-2p.html)) next to the existing SCORE chip:

```html
<div class="sp"><div class="sl">COINS</div><div class="sv" id="hCoins">0</div></div>
```

Update in `updateHUD()`:

```js
const cEl = document.getElementById('hCoins');
if (cEl) cEl.textContent = Upgrades.data.coins;
```

### Upgrade UI in the character lobby

Each character card in the existing `charPanel` ([game.html](game.html)) gets a small "UPGRADE" button below the name. Clicking it calls `openUpgrades(charIdx)`:

```html
<div class="char-card sel" id="p1c0" onclick="selChar(0,0)" data-c="#00f5ff">
  <div class="cc-swatch" style="background:linear-gradient(135deg,#00f5ff,#a100ff)"></div>
  <div class="cc-name">NEON</div><div class="cc-tag">balanced</div>
  <button class="cc-upg-btn" onclick="event.stopPropagation(); openUpgrades(0)">⬆ UPGRADE</button>
</div>
```

(`event.stopPropagation()` so clicking UPGRADE doesn't also trigger `selChar`.)

### Upgrade panel

New panel in [game.html](game.html), populated by `buildUpgradePanel(charIdx)`:

```html
<div class="panel" id="upgradePanel" style="min-width:520px;max-width:92vw">
  <div class="pt" id="upgTitle">UPGRADES — NEON</div>
  <div class="ps">Coins: <span id="upgCoins">0</span> 🪙</div>
  <div class="upg-list" id="upgList"><!-- 5 rows injected by buildUpgradePanel --></div>
  <button class="btn btn-g" onclick="showPanel('charPanel')">← BACK TO LOBBY</button>
</div>
```

`buildUpgradePanel(charIdx)`:

```js
function buildUpgradePanel(charIdx){
  const ch = CHARACTERS[charIdx];
  const u  = Upgrades.forChar(ch.name);
  document.getElementById('upgTitle').textContent = 'UPGRADES — ' + ch.name;
  document.getElementById('upgCoins').textContent = Upgrades.data.coins;
  const list = document.getElementById('upgList');
  list.innerHTML = Upgrades.TRACKS.map(t => {
    const tier = u[t.id];
    const dots = Array.from({length:t.maxTier}, (_,i) =>
      `<span class="upg-dot${i<tier?' on':''}"></span>`).join('');
    const cost = tier < t.maxTier ? Upgrades.PRICES[tier] : null;
    const btn = cost === null
      ? `<span class="upg-max">MAX</span>`
      : `<button class="upg-buy" ${Upgrades.data.coins<cost?'disabled':''}
            onclick="buyUpgrade(${charIdx},'${t.id}')">BUY · ${cost}🪙</button>`;
    return `<div class="upg-row">
      <span class="upg-name">${t.icon} ${t.name}</span>
      <span class="upg-dots">${dots}</span>
      ${btn}
    </div>`;
  }).join('');
}

function openUpgrades(charIdx){
  buildUpgradePanel(charIdx);
  showPanel('upgradePanel');
  document.getElementById('upgradePanel').dataset.char = charIdx;
}

function buyUpgrade(charIdx, trackId){
  const ch = CHARACTERS[charIdx];
  if(Upgrades.buy(ch.name, trackId)){
    AU && AU.buy && AU.buy();
    buildUpgradePanel(charIdx);  // re-render to update tier dots + new price
  }
}
```

### `hideAllPanels` and CSS

- Add `'upgradePanel'` to the panel list in `hideAllPanels()` ([script.js:351](script.js#L351)).
- Add CSS in [style.css](style.css) for `.cc-upg-btn`, `.upg-list`, `.upg-row`, `.upg-dot`, `.upg-buy`, `.upg-max`. Reuse the existing `.btn-g` color tokens — small accent buttons (~9px font, padded), and tier dots as a 5-segment horizontal row colored gold when filled, gray when empty.

### Coins persist across the full session

Because `Upgrades.addCoins` writes to localStorage on every increment, the coin counter stays accurate even if the page is closed mid-run. The game over screen can re-render the running total from `Upgrades.data.coins`.

### Edge cases

- **Two players on the same character (2P local with both picking NEON)**: they share the NEON upgrade tree. Both get the same boosted stats. This is fine — the user picked the same character knowingly.
- **Online 2P**: each browser reads its own localStorage, so the host's NEON tree might differ from the guest's NEON tree. Each player's stats reflect THEIR local upgrades — fair.
- **Negative coin balance**: `Upgrades.addCoins` clamps to 0. The buy code checks the price before deducting.
- **localStorage quota**: the saved blob is tiny (<1KB even maxed out). No quota concerns.

---

## Verification

End-to-end checklist:

1. **Lobby → game**: Pick CRIMSON in the lobby → launch → skill HUD shows CRIMSON's icons (e.g., 🗡 Blade Burst, 🔥 Flame Trail, ⚡ Adrenaline), not 🛡 💣 ⚡.
2. **Each character feels different**: In 1P, play one level each as NEON, CRIMSON, EMERALD, VOID, AEGIS, LIFTER. Confirm each kit's three skills behave per Part 1.
3. **Co-op separate**: AEGIS still shields teammate on G; LIFTER still boosts teammate on G. Neither consumes a skill slot.
4. **Character is locked**: Press Z, V, Tab, \`, ', \ during a run — nothing happens, no character change, no console error.
5. **Visual distinction**: Each of the 6 characters is identifiable on a still frame without reading text labels.
6. **HUD persists per character**: In 2P local with AEGIS (P1) and LIFTER (P2), P1's HUD shows AEGIS's skills (Bulwark / Reflect Wave / Group Aegis) and P2's HUD shows LIFTER's skills.
7. **No regressions**: vertical climb, traps, weapons, portal unlock, map selection, lobby selection, and online 2P all still work.
8. **Coins earn**: Kill an enemy → see `+10🪙` floater + HUD `COINS` counter increases. Pick up a score orb → +5 coins. Complete a level → +50 + level\*15 + kills\*5 coins.
9. **Coins persist**: Earn coins, close the tab, reopen → counter is still at the saved value.
10. **Upgrade panel**: From the lobby, click NEON's "UPGRADE" button → upgrade panel opens with 5 tracks at tier 0 each. Click BUY on HP → coin balance drops by 100, the first dot lights up, the next BUY costs 250.
11. **Upgrades take effect in-game**: Buy 5 tiers of Speed for NEON → launch a 1P game as NEON → confirm noticeably faster than CRIMSON-default speed.
12. **Per-character isolation**: Buy 5 tiers of HP for NEON → launch as CRIMSON → CRIMSON's max HP is still 100 (NEON's upgrades don't transfer).
13. **Tier cap**: After 5 buys on a track, BUY becomes "MAX" and is disabled.
14. **Insufficient coins**: BUY button is disabled and visibly grey when coins < price.

No automated tests exist. Verify in-browser: `python3 -m http.server` from project root, open `http://localhost:8000/game.html`, walk every character through at least one level and test the upgrade flow.
