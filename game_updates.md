Game Development To-Do (Vibe Coding Plan)
1. Maps & Environment
Create three main maps with different environments.
Add a dynamic map rotation system where the map changes during gameplay between the three maps.
Implement an Endless Map Mode where the map continues infinitely and difficulty increases every 1000 meters.
Add background images and environments such as:
Alien planets
Galactic space environments
Lava / volcanic worlds
Add visual environmental effects (space dust, glow, atmospheric lighting).
2. Characters & Abilities
Create a character system with different playable characters.
Remove character upgrade options from the “Choose Character” menu.
Implement character abilities / special skills (for example speed boost, shield, dash, energy attack).
Add character progression tied to achievements and missions.
3. Weapons System
Implement weapon inventory system.
Allow players to buy new guns in the Home section.
Generate new types of guns dynamically.
Allow players to select their most-used guns.
Add weapon skins and visual customization.
Add option to increase gun storage limit through upgrades.
4. Home Base (Main Menu System)

Add a Home Page where players can:

View their characters.
Upgrade characters.
Buy new guns.
Manage weapon inventory.
Increase gun capacity.
Access achievements and missions.
5. Economy & Rewards
Redesign coin visuals to look like yellow classic game coins.
Add loot boxes / mystery rewards.
Implement daily missions / quests that reward coins.
Add achievement system with badges and milestone rewards.

Examples of achievements:

Distance milestones
Enemy kills
Boss defeats
Weapon mastery
6. Enemies & Combat
Add multiple enemy types.
Implement boss enemies that appear:
At certain distances
During map transitions
Improve combat feedback and visual effects.
7. Multiplayer Mode

Create a Multiplayer Battle Mode:

Players spawn in the same map.
Characters search for teleport portals.
Teleports move players to combat arenas.
Players fight and eliminate each other.
Last surviving player wins.

Features:

Real-time player positions
Kill tracking
Multiplayer leaderboard
8. Social System
Create user accounts with login/signup.
Add player profiles.
Allow players to add friends.
Add global ranking leaderboard.
9. Communication
Add emoji chat system so players can communicate using emojis during gameplay.

Examples:

👍
🔥
😱
💀
🚀
10. UI Improvements
Improve game UI and menus.
Add Home button on main screen.
Improve coin visuals and reward animations.
Improve character and weapon selection interfaces.

---

## Status (2026-05-16)

Shipped this session:

- §1 Maps: ENDLESS map added — procedural climb, no portal, no level break, continues until you die. Difficulty ramps every 1000m.
- §3 Weapons: weapon inventory system added; buy guns in Home Base; 5 new gun types (Shotgun, Sniper, RailGun, Flame, Rocket); 3-slot equip UI for selecting most-used guns. Skins/customization still TODO.
- §4 Home Base: hub page added between menu and play. Roster, gun store, coupon entry, achievements. Per-character upgrades moved here from char-select.
- §5 Economy: coupon system added (kammmran code → 1,000,000 coins, one-shot per browser). Achievements scaffold with 6 milestones + coin rewards. Coin visuals redrawn as classic gold coin.

Still TODO from the original list:

- §1: dynamic map rotation mid-game, alien/space/lava environments, atmospheric effects.
- §2: character abilities/skills (kit exists per char), progression tied to missions.
- §3: weapon skins, gun storage upgrades.
- §5: loot boxes, daily missions/quests, expanded achievements.
- §6: more enemy types, boss enemies.
- §7: PvP multiplayer battle arena (separate from existing co-op online 2P).
- §8: accounts, friends, global leaderboard (needs backend).
- §9: emoji chat (needs backend for online).
- §10: more UI polish.
