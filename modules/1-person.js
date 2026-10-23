// Bootstraps single-player mode. Reads ?diff=N&map=M&p1=C from the URL, configures the engine
// for one player, and kicks off startGame() once the DOM/engine globals are ready.
(function(){
  const params=new URLSearchParams(window.location.search);
  const diff=Math.max(0,Math.min(3,parseInt(params.get('diff')||'1',10)));
  const map=Math.max(0,Math.min(LAYOUTS.length-1,parseInt(params.get('map')||'0',10)));
  const p1=Math.max(0,Math.min(CHARACTERS.length-1,parseInt(params.get('p1')||'0',10)));
  // Engine globals declared in script.js.
  playerCount=1;
  selModeIdx=0;
  selDiffIdx=diff;
  selMapIdx=map;
  selectedMap=map;
  selP1CharIdx=p1;
  Music.apply();
  startGame(0,diff);
})();
