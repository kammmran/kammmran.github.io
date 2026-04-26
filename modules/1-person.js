// Bootstraps single-player mode. Reads ?diff=N from the URL, configures the engine for one
// player, and kicks off startGame() once the DOM/engine globals are ready.
(function(){
  const params=new URLSearchParams(window.location.search);
  const diff=Math.max(0,Math.min(3,parseInt(params.get('diff')||'1',10)));
  // Engine globals declared in script.js.
  playerCount=1;
  selModeIdx=0;
  selDiffIdx=diff;
  Music.apply();
  startGame(0,diff);
})();
