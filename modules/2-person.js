// Bootstraps two-player split-screen mode. Reads ?diff=N from the URL, configures the engine
// for two players, and kicks off startGame().
(function(){
  const params=new URLSearchParams(window.location.search);
  const diff=Math.max(0,Math.min(3,parseInt(params.get('diff')||'1',10)));
  playerCount=2;
  selModeIdx=2;
  selDiffIdx=diff;
  Music.apply();
  startGame(2,diff);
})();
